import { Router, Request, Response } from 'express'
import { Webhook } from 'svix'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { APIResponse } from '../../shared/types.js'

const router = Router()

/**
 * Clerk Webhook Handler
 *
 * Handles webhooks from Clerk to sync user data to our database
 * Webhook events: user.created, user.updated, user.deleted
 *
 * Setup in Clerk Dashboard:
 * 1. Go to Webhooks section
 * 2. Add endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copy webhook secret to CLERK_WEBHOOK_SECRET env var
 */

// POST /api/webhooks/clerk - Handle Clerk webhooks
router.post('/clerk', async (req: Request, res: Response<APIResponse>) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ [Clerk Webhook] CLERK_WEBHOOK_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured',
        errorCode: 'WEBHOOK_SECRET_MISSING'
      } as any)
    }

    // Verify webhook signature using Svix
    const wh = new Webhook(webhookSecret)

    // Get headers for verification
    const svix_id = req.headers['svix-id'] as string
    const svix_timestamp = req.headers['svix-timestamp'] as string
    const svix_signature = req.headers['svix-signature'] as string

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ [Clerk Webhook] Missing svix headers')
      return res.status(400).json({
        success: false,
        error: 'Missing webhook headers',
        errorCode: 'MISSING_HEADERS'
      } as any)
    }

    // Verify the webhook
    let payload: any
    try {
      payload = wh.verify(JSON.stringify(req.body), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature
      })
    } catch (verifyError: any) {
      console.error('❌ [Clerk Webhook] Verification failed:', verifyError.message)
      return res.status(400).json({
        success: false,
        error: 'Webhook verification failed',
        errorCode: 'VERIFICATION_FAILED'
      } as any)
    }

    const { type, data } = payload

    console.log(`📨 [Clerk Webhook] Received event: ${type}`)

    // Handle different webhook events
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break

      case 'user.updated':
        await handleUserUpdated(data)
        break

      case 'user.deleted':
        await handleUserDeleted(data)
        break

      default:
        console.log(`⚠️ [Clerk Webhook] Unhandled event type: ${type}`)
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    })

  } catch (error: any) {
    console.error('❌ [Clerk Webhook] Error processing webhook:', error)
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      errorCode: 'WEBHOOK_ERROR',
      debugInfo: process.env.NODE_ENV === 'development' ? error.message : undefined
    } as any)
  }
})

/**
 * Handle user.created event from Clerk
 * Creates a new user in our database when they sign up
 */
async function handleUserCreated(data: any) {
  const {
    id: clerkUserId,
    email_addresses,
    first_name,
    last_name,
    primary_email_address_id
  } = data

  // Get primary email
  const primaryEmail = email_addresses.find(
    (e: any) => e.id === primary_email_address_id
  )

  if (!primaryEmail) {
    console.error('❌ [Clerk Webhook] No primary email found for user:', clerkUserId)
    return
  }

  const email = primaryEmail.email_address
  const emailVerified = primaryEmail.verification?.status === 'verified'

  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.firebaseUid, clerkUserId))
      .limit(1)

    if (existingUser.length > 0) {
      console.log('✓ [Clerk Webhook] User already exists:', clerkUserId)
      return
    }

    // Create new user
    const newUser = await db.insert(users)
      .values({
        email: email.toLowerCase(),
        firebaseUid: clerkUserId,
        firstName: first_name || '',
        lastName: last_name || '',
        emailVerified,
        subscriptionStatus: 'free',
        isPremium: false,
        freeCredits: 5,
        usedCredits: 0,
        safety: 'standard'
      })
      .returning()

    console.log('✅ [Clerk Webhook] User created successfully:', newUser[0].id)
  } catch (error: any) {
    console.error('❌ [Clerk Webhook] Failed to create user:', error.message)
    throw error
  }
}

/**
 * Handle user.updated event from Clerk
 * Updates user data in our database when their Clerk profile changes
 */
async function handleUserUpdated(data: any) {
  const {
    id: clerkUserId,
    email_addresses,
    first_name,
    last_name,
    primary_email_address_id
  } = data

  const primaryEmail = email_addresses.find(
    (e: any) => e.id === primary_email_address_id
  )

  if (!primaryEmail) {
    return
  }

  try {
    // Update user if they exist
    await db.update(users)
      .set({
        email: primaryEmail.email_address.toLowerCase(),
        firstName: first_name || '',
        lastName: last_name || '',
        emailVerified: primaryEmail.verification?.status === 'verified',
        updatedAt: new Date()
      })
      .where(eq(users.firebaseUid, clerkUserId))

    console.log('✅ [Clerk Webhook] User updated successfully:', clerkUserId)
  } catch (error: any) {
    console.error('❌ [Clerk Webhook] Failed to update user:', error.message)
    throw error
  }
}

/**
 * Handle user.deleted event from Clerk
 * Removes user from our database when they delete their Clerk account
 */
async function handleUserDeleted(data: any) {
  const { id: clerkUserId } = data

  try {
    await db.delete(users)
      .where(eq(users.firebaseUid, clerkUserId))

    console.log('✅ [Clerk Webhook] User deleted successfully:', clerkUserId)
  } catch (error: any) {
    console.error('❌ [Clerk Webhook] Failed to delete user:', error.message)
    throw error
  }
}

export default router
