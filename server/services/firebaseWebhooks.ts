import { Request, Response } from 'express'
import admin from 'firebase-admin'
import { FirebaseService } from './firebaseService.js'
import { UserService, PsychologicalProfileService } from './database.js'
import { logBusinessEvent, logSecurityEvent } from '../middleware/logging.js'
import { ValidationError } from '../middleware/errorHandler.js'

/**
 * Firebase Authentication Webhook Handler
 * Handles real-time user lifecycle events from Firebase
 */
export class FirebaseWebhookService {
  
  /**
   * Handle Firebase Authentication events
   */
  static async handleAuthEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, data } = req.body

      // Validate webhook payload
      if (!eventType || !data) {
        throw new ValidationError('Invalid webhook payload')
      }

      switch (eventType) {
        case 'providers/firebase.auth/eventTypes/user.create':
          await this.handleUserCreate(data)
          break
          
        case 'providers/firebase.auth/eventTypes/user.delete':
          await this.handleUserDelete(data)
          break
          
        case 'providers/firebase.auth/eventTypes/user.update':
          await this.handleUserUpdate(data)
          break
          
        default:
          console.warn(`Unhandled Firebase Auth event type: ${eventType}`)
      }

      res.status(200).json({ success: true, message: 'Webhook processed successfully' })
    } catch (error) {
      console.error('Firebase webhook error:', error)
      res.status(500).json({ success: false, error: 'Webhook processing failed' })
    }
  }

  /**
   * Handle user creation from Firebase
   */
  private static async handleUserCreate(userData: any): Promise<void> {
    try {
      const { uid, email, displayName, emailVerified } = userData

      if (!uid || !email) {
        throw new ValidationError('Invalid user data in webhook')
      }

      // Check if user already exists in our database
      const existingUser = await UserService.findByFirebaseUid(uid)
      if (existingUser) {
        console.log(`User ${uid} already exists in database, skipping creation`)
        return
      }

      // Parse display name
      const nameParts = displayName ? displayName.split(' ') : []
      const firstName = nameParts[0] || null
      const lastName = nameParts.slice(1).join(' ') || null

      // Create user in PostgreSQL
      const newUser = await UserService.create({
        email,
        firstName,
        lastName,
        firebaseUid: uid,
        emailVerified: emailVerified || false,
        safety: 'standard',
        freeCredits: 5,
        subscriptionStatus: 'free',
        isPremium: false
      })

      // Initialize psychological profile
      await PsychologicalProfileService.createOrUpdate(newUser.id, {
        riskTolerance: 'medium',
        creativityLevel: 'balanced',
        preferredCategories: [],
        contentStyle: 'mixed',
        urgencyPreference: 'moderate',
        profileCompleteness: 15 // Minimal profile from webhook
      })

      logBusinessEvent('user_created_via_webhook', {
        userId: newUser.id,
        firebaseUid: uid,
        email: email
      }, newUser.id)

      console.log(`✅ User ${uid} created via Firebase webhook`)
    } catch (error) {
      console.error('Error handling user creation webhook:', error)
      throw error
    }
  }

  /**
   * Handle user deletion from Firebase
   */
  private static async handleUserDelete(userData: any): Promise<void> {
    try {
      const { uid } = userData

      if (!uid) {
        throw new ValidationError('Invalid user data in webhook')
      }

      // Find user in our database
      const user = await UserService.findByFirebaseUid(uid)
      if (!user) {
        console.log(`User ${uid} not found in database, skipping deletion`)
        return
      }

      // Anonymize user data (GDPR compliance)
      await UserService.update(user.id, {
        email: `deleted-user-${user.id}@deleted.local`,
        firstName: null,
        lastName: null,
        company: null,
        industry: null,
        role: null,
        audience: null,
        firebaseUid: null
      })

      logBusinessEvent('user_deleted_via_webhook', {
        userId: user.id,
        originalFirebaseUid: uid,
        originalEmail: user.email
      }, user.id)

      console.log(`✅ User ${uid} anonymized via Firebase webhook`)
    } catch (error) {
      console.error('Error handling user deletion webhook:', error)
      throw error
    }
  }

  /**
   * Handle user update from Firebase
   */
  private static async handleUserUpdate(userData: any): Promise<void> {
    try {
      const { uid, email, displayName, emailVerified } = userData

      if (!uid) {
        throw new ValidationError('Invalid user data in webhook')
      }

      // Find user in our database
      const user = await UserService.findByFirebaseUid(uid)
      if (!user) {
        console.log(`User ${uid} not found in database, skipping update`)
        return
      }

      // Prepare update data
      const updateData: any = {}

      if (email && email !== user.email) {
        updateData.email = email
      }

      if (emailVerified !== undefined && emailVerified !== user.emailVerified) {
        updateData.emailVerified = emailVerified
      }

      if (displayName) {
        const nameParts = displayName.split(' ')
        const firstName = nameParts[0] || null
        const lastName = nameParts.slice(1).join(' ') || null

        if (firstName !== user.firstName) {
          updateData.firstName = firstName
        }

        if (lastName !== user.lastName) {
          updateData.lastName = lastName
        }
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await UserService.update(user.id, updateData)

        logBusinessEvent('user_updated_via_webhook', {
          userId: user.id,
          firebaseUid: uid,
          updatedFields: Object.keys(updateData)
        }, user.id)

        console.log(`✅ User ${uid} updated via Firebase webhook`)
      }
    } catch (error) {
      console.error('Error handling user update webhook:', error)
      throw error
    }
  }

  /**
   * Verify Firebase webhook signature (if configured)
   */
  static verifyWebhookSignature(req: Request): boolean {
    try {
      // In production, you should verify the webhook signature
      // This is a basic implementation - enhance based on your security requirements
      const signature = req.headers['x-firebase-signature'] as string
      const expectedSignature = process.env.FIREBASE_WEBHOOK_SECRET

      if (!expectedSignature) {
        console.warn('Firebase webhook secret not configured - skipping signature verification')
        return true
      }

      if (!signature) {
        logSecurityEvent('missing_webhook_signature', {
          endpoint: req.path,
          ipAddress: req.ip
        })
        return false
      }

      // Implement proper signature verification here
      // For now, we'll do a simple comparison
      return signature === expectedSignature
    } catch (error) {
      console.error('Webhook signature verification error:', error)
      return false
    }
  }

  /**
   * Bulk sync users from Firebase to PostgreSQL
   */
  static async bulkSyncUsers(maxResults: number = 1000): Promise<{
    synced: number
    errors: number
    details: string[]
  }> {
    const results = {
      synced: 0,
      errors: 0,
      details: []
    }

    try {
      // Get all Firebase users
      const listUsersResult = await FirebaseService.listUsers(maxResults)
      
      for (const firebaseUser of listUsersResult.users) {
        try {
          // Check if user exists in our database
          const existingUser = await UserService.findByFirebaseUid(firebaseUser.uid)
          
          if (!existingUser && firebaseUser.email) {
            // Create user in database
            const nameParts = firebaseUser.displayName ? firebaseUser.displayName.split(' ') : []
            
            await UserService.create({
              email: firebaseUser.email,
              firstName: nameParts[0] || null,
              lastName: nameParts.slice(1).join(' ') || null,
              firebaseUid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified || false,
              safety: 'standard',
              freeCredits: 5,
              subscriptionStatus: 'free',
              isPremium: false
            })

            results.synced++
            results.details.push(`Created user: ${firebaseUser.email}`)
          } else if (existingUser) {
            // Update existing user if needed
            const updateData: any = {}
            
            if (firebaseUser.email !== existingUser.email) {
              updateData.email = firebaseUser.email
            }
            
            if (firebaseUser.emailVerified !== existingUser.emailVerified) {
              updateData.emailVerified = firebaseUser.emailVerified
            }

            if (Object.keys(updateData).length > 0) {
              await UserService.update(existingUser.id, updateData)
              results.synced++
              results.details.push(`Updated user: ${firebaseUser.email}`)
            }
          }
        } catch (error) {
          results.errors++
          results.details.push(`Error syncing ${firebaseUser.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      logBusinessEvent('bulk_user_sync_completed', {
        totalProcessed: listUsersResult.users.length,
        synced: results.synced,
        errors: results.errors
      })

    } catch (error) {
      console.error('Bulk sync error:', error)
      results.errors++
      results.details.push(`Bulk sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return results
  }

  /**
   * Clean up orphaned users (exist in PostgreSQL but not in Firebase)
   */
  static async cleanupOrphanedUsers(): Promise<{
    cleaned: number
    errors: number
    details: string[]
  }> {
    const results = {
      cleaned: 0,
      errors: 0,
      details: []
    }

    try {
      // This would require implementing pagination for large user bases
      // For now, we'll skip this feature as it requires careful consideration
      results.details.push('Orphaned user cleanup not implemented - requires manual review')
      
      logBusinessEvent('orphaned_user_cleanup_requested', {
        note: 'Feature not implemented for safety'
      })
    } catch (error) {
      console.error('Cleanup error:', error)
      results.errors++
      results.details.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return results
  }
}

/**
 * Middleware to validate Firebase webhook requests
 */
export const validateFirebaseWebhook = (req: Request, res: Response, next: Function) => {
  try {
    // Verify webhook signature
    if (!FirebaseWebhookService.verifyWebhookSignature(req)) {
      logSecurityEvent('invalid_webhook_signature', {
        endpoint: req.path,
        ipAddress: req.ip
      })
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      })
    }

    // Check request content type
    if (req.headers['content-type'] !== 'application/json') {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type'
      })
    }

    next()
  } catch (error) {
    console.error('Webhook validation error:', error)
    res.status(500).json({
      success: false,
      error: 'Webhook validation failed'
    })
  }
}