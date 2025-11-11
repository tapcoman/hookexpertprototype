import { Router, Response } from 'express'
import { z } from 'zod'
import { hybridAuth } from '../middleware/hybridAuth.js'
import { AuthenticatedRequest } from '../middleware/simpleAuth.js'
import { validateRequest, validatePagination, validateIdParam } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js'
import { logBusinessEvent } from '../middleware/logging.js'
import { requireDatabase } from '../middleware/serviceAvailability.js'
import { db } from '../db/index.js'
import { projects } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { APIResponse } from '../../shared/types.js'

const router = Router()

// All routes require authentication and database
// Using hybrid auth to support both legacy JWT and Clerk tokens
router.use(hybridAuth)
router.use(requireDatabase)

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#6366f1'),
  emoji: z.string().max(4).optional().default('📁')
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  emoji: z.string().max(4).optional()
})

// GET /api/projects - List user's projects
router.get('/',
  validatePagination,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query as any
    const offset = (page - 1) * limit

    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt))
        .limit(limit)
        .offset(offset)

      const totalCount = await db
        .select({ count: projects.id })
        .from(projects)
        .where(eq(projects.userId, userId))
        .then(result => result.length)

      res.json({
        success: true,
        data: {
          data: userProjects,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: `Retrieved ${userProjects.length} projects`
      })
    } catch (error) {
      console.error('Error fetching projects:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      })
    }
  })
)

// GET /api/projects/:id - Get specific project
router.get('/:id',
  validateIdParam,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id

    try {
      const project = await db
        .select()
        .from(projects)
        .where(and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        ))
        .limit(1)

      if (!project.length) {
        throw new NotFoundError('Project not found')
      }

      res.json({
        success: true,
        data: project[0],
        message: 'Project retrieved successfully'
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        })
      } else {
        console.error('Error fetching project:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to fetch project'
        })
      }
    }
  })
)

// POST /api/projects - Create new project
router.post('/',
  validateRequest(createProjectSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const userId = req.user.id
    const { name, description, color, emoji } = req.body

    try {
      const projectId = uuidv4()
      const now = new Date()

      const newProject = {
        id: projectId,
        userId,
        name,
        description: description || null,
        color: color || '#6366f1',
        emoji: emoji || '📁',
        hookCount: 0,
        createdAt: now,
        updatedAt: now
      }

      await db.insert(projects).values(newProject)

      logBusinessEvent('project_created', {
        projectId,
        name,
        color,
        emoji
      }, userId)

      res.status(201).json({
        success: true,
        data: newProject,
        message: 'Project created successfully'
      })
    } catch (error) {
      console.error('Error creating project:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      })
    }
  })
)

// PUT /api/projects/:id - Update project
router.put('/:id',
  validateIdParam,
  validateRequest(updateProjectSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id
    const updates = req.body

    try {
      // Check if project exists and belongs to user
      const existingProject = await db
        .select()
        .from(projects)
        .where(and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        ))
        .limit(1)

      if (!existingProject.length) {
        throw new NotFoundError('Project not found')
      }

      // Update project
      const updatedProject = await db
        .update(projects)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        ))
        .returning()

      logBusinessEvent('project_updated', {
        projectId: id,
        updates: Object.keys(updates)
      }, userId)

      res.json({
        success: true,
        data: updatedProject[0],
        message: 'Project updated successfully'
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        })
      } else {
        console.error('Error updating project:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to update project'
        })
      }
    }
  })
)

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  validateIdParam,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<APIResponse>) => {
    const { id } = req.params
    const userId = req.user.id

    try {
      // Check if project exists and belongs to user
      const existingProject = await db
        .select()
        .from(projects)
        .where(and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        ))
        .limit(1)

      if (!existingProject.length) {
        throw new NotFoundError('Project not found')
      }

      // Delete project
      await db
        .delete(projects)
        .where(and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        ))

      logBusinessEvent('project_deleted', {
        projectId: id,
        name: existingProject[0].name
      }, userId)

      res.json({
        success: true,
        data: { id },
        message: 'Project deleted successfully'
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        })
      } else {
        console.error('Error deleting project:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to delete project'
        })
      }
    }
  })
)

export default router