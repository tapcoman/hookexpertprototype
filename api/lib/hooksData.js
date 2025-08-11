// Serverless-compatible hooks data service for favorites and history
import { db } from './db.js'
import { findUserById } from './auth.js'

// ==================== HOOK GENERATIONS (HISTORY) ====================

export async function getUserHookGenerations(userId, params = {}) {
  try {
    const { page = 1, limit = 10 } = params
    const offset = (page - 1) * limit

    console.log('Getting hook generations for user:', userId, { page, limit })

    // Get total count
    const countResult = await db.sql`
      SELECT COUNT(*) as total 
      FROM hook_generations 
      WHERE user_id = ${userId}
    `
    const total = parseInt(countResult[0]?.total || '0')

    // Get paginated results
    const generations = await db.sql`
      SELECT 
        id,
        platform,
        objective,
        topic,
        model_type as "modelType",
        hooks,
        top_three_variants as "topThreeVariants",
        psychological_strategy as "psychologicalStrategy",
        adaptation_level as "adaptationLevel",
        confidence_score as "confidenceScore",
        created_at as "createdAt"
      FROM hook_generations 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log(`Found ${generations.length} generations out of ${total} total`)

    return {
      data: generations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error getting hook generations:', error)
    throw error
  }
}

export async function getHookGenerationById(userId, generationId) {
  try {
    console.log('Getting hook generation:', generationId, 'for user:', userId)

    const result = await db.sql`
      SELECT 
        id,
        platform,
        objective,
        topic,
        model_type as "modelType",
        hooks,
        top_three_variants as "topThreeVariants",
        psychological_strategy as "psychologicalStrategy",
        adaptation_level as "adaptationLevel",
        confidence_score as "confidenceScore",
        created_at as "createdAt"
      FROM hook_generations 
      WHERE id = ${generationId} AND user_id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    console.log('Found hook generation:', result[0].id)
    return result[0]
  } catch (error) {
    console.error('Error getting hook generation by ID:', error)
    throw error
  }
}

export async function deleteHookGeneration(userId, generationId) {
  try {
    console.log('Deleting hook generation:', generationId, 'for user:', userId)

    const result = await db.sql`
      DELETE FROM hook_generations 
      WHERE id = ${generationId} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return false // Not found or not authorized
    }

    console.log('Deleted hook generation:', result[0].id)
    return true
  } catch (error) {
    console.error('Error deleting hook generation:', error)
    throw error
  }
}

export async function saveHookGeneration(userId, generationData) {
  try {
    console.log('Saving hook generation for user:', userId)

    const {
      id,
      platform,
      objective,
      topic,
      modelType,
      hooks,
      topThreeVariants,
      psychologicalStrategy,
      adaptationLevel,
      confidenceScore
    } = generationData

    const result = await db.sql`
      INSERT INTO hook_generations (
        id, user_id, platform, objective, topic, model_type,
        hooks, top_three_variants, psychological_strategy, 
        adaptation_level, confidence_score
      ) VALUES (
        ${id}, ${userId}, ${platform}, ${objective}, ${topic}, ${modelType || 'gpt-4o-mini'},
        ${JSON.stringify(hooks)}, ${JSON.stringify(topThreeVariants)}, 
        ${JSON.stringify(psychologicalStrategy)}, ${adaptationLevel || 0}, ${confidenceScore || 75}
      )
      RETURNING id, created_at as "createdAt"
    `

    console.log('Saved hook generation:', result[0].id)
    return result[0]
  } catch (error) {
    console.error('Error saving hook generation:', error)
    throw error
  }
}

// ==================== FAVORITE HOOKS ====================

export async function getUserFavoriteHooks(userId, params = {}) {
  try {
    const { page = 1, limit = 10 } = params
    const offset = (page - 1) * limit

    console.log('Getting favorite hooks for user:', userId, { page, limit })

    // Get total count
    const countResult = await db.sql`
      SELECT COUNT(*) as total 
      FROM favorite_hooks 
      WHERE user_id = ${userId}
    `
    const total = parseInt(countResult[0]?.total || '0')

    // Get paginated results
    const favorites = await db.sql`
      SELECT 
        id,
        generation_id as "generationId",
        hook_data as "hookData",
        framework,
        platform_notes as "platformNotes",
        topic,
        platform,
        created_at as "createdAt"
      FROM favorite_hooks 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log(`Found ${favorites.length} favorites out of ${total} total`)

    return {
      data: favorites,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error getting favorite hooks:', error)
    throw error
  }
}

export async function addToFavorites(userId, favoriteData) {
  try {
    console.log('Adding to favorites for user:', userId)

    const {
      generationId,
      hookData,
      framework,
      platformNotes,
      topic,
      platform
    } = favoriteData

    // Validate required fields
    if (!hookData || !framework || !platformNotes) {
      throw new Error('Missing required fields: hookData, framework, and platformNotes are required')
    }

    const favoriteId = `fav_${userId}_${Date.now()}`

    const result = await db.sql`
      INSERT INTO favorite_hooks (
        id, user_id, generation_id, hook_data, framework, platform_notes, topic, platform
      ) VALUES (
        ${favoriteId}, ${userId}, ${generationId || null}, ${JSON.stringify(hookData)}, 
        ${framework}, ${platformNotes}, ${topic || null}, ${platform || null}
      )
      RETURNING id, created_at as "createdAt"
    `

    console.log('Added to favorites:', result[0].id)
    return result[0]
  } catch (error) {
    console.error('Error adding to favorites:', error)
    throw error
  }
}

export async function removeFromFavorites(userId, favoriteId) {
  try {
    console.log('Removing from favorites:', favoriteId, 'for user:', userId)

    const result = await db.sql`
      DELETE FROM favorite_hooks 
      WHERE id = ${favoriteId} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return false // Not found or not authorized
    }

    console.log('Removed from favorites:', result[0].id)
    return true
  } catch (error) {
    console.error('Error removing from favorites:', error)
    throw error
  }
}

export async function getFavoriteById(userId, favoriteId) {
  try {
    console.log('Getting favorite by ID:', favoriteId, 'for user:', userId)

    const result = await db.sql`
      SELECT 
        id,
        generation_id as "generationId",
        hook_data as "hookData",
        framework,
        platform_notes as "platformNotes",
        topic,
        platform,
        created_at as "createdAt"
      FROM favorite_hooks 
      WHERE id = ${favoriteId} AND user_id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error('Error getting favorite by ID:', error)
    throw error
  }
}