# Hook Line Studio - Database Infrastructure

## Overview

This document outlines the complete database infrastructure for Hook Line Studio, including the enhanced psychological framework integration that supports advanced AI-powered hook generation.

## Architecture

- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript
- **Connection Management**: Custom connection pooling with monitoring
- **Migration System**: Drizzle Kit
- **Seeding**: Automated with 24+ psychological hook formulas

## Core Tables

### 1. Users (`users`)
Enhanced user profiles with psychological preferences:

```sql
- id (UUID, Primary Key)
- email (Unique)
- firebase_uid (Unique, for authentication)
- first_name, last_name
- email_verified (Boolean)

-- Profile Information
- company, industry, role, audience, voice
- banned_terms (JSONB array)
- safety (family-friendly/standard/edgy)

-- Enhanced Psychological Preferences
- preferred_hook_categories (JSONB array)
- psychological_risk_tolerance (low/medium/high)
- creativity_preference (conservative/balanced/experimental)
- urgency_preference (low/moderate/high)
- personality_insights (JSONB object)

-- Credit System
- pro_generations_used, draft_generations_used
- weekly_draft_reset, free_credits, used_credits
- is_premium

-- Subscription Data
- stripe_customer_id, stripe_subscription_id
- subscription_status, subscription_plan
- current_period_end, cancel_at_period_end

- created_at, updated_at
```

### 2. Hook Formulas (`hook_formulas`)
24+ proven psychological hook formulas:

```sql
- id (UUID, Primary Key)
- code (Unique, e.g., 'QH-01', 'ST-02')
- name (e.g., 'Direct Question', 'Startling Fact')
- category (question-based/statement-based/narrative/urgency-exclusivity/efficiency)
- description (Detailed explanation)
- structural_template (Template for AI generation)
- psychological_triggers (JSONB array of triggers)
- primary_driver (Main psychological driver)
- effectiveness_rating (0-100)
- risk_factor (low/medium/high)
- optimal_niches (JSONB array of use cases)
- example_variations (JSONB array of examples)
- usage_guidelines, cautionary_notes

-- Performance Metrics
- avg_engagement_rate, avg_conversion_rate
- fatigue_resistance (0-100)

- is_active, created_at, updated_at
```

### 3. Hook Generations (`hook_generations`)
Enhanced with psychological framework tracking:

```sql
- id (UUID, Primary Key)
- user_id (Foreign Key to users)
- platform (tiktok/instagram/youtube)
- objective (watch_time/shares/saves/ctr/follows)
- topic, model_type
- hooks (JSONB array of HookObjects)
- top_three_variants (JSONB array)

-- Psychological Framework Integration
- used_formulas (JSONB array of formula codes)
- psychological_strategy (JSONB strategy metadata)
- adaptation_level (0-100, personalization level)
- confidence_score (0-100, AI confidence)

- created_at
```

### 4. Psychological Profiles (`psychological_profiles`)
User psychological preferences and learning data:

```sql
- id (UUID, Primary Key)
- user_id (Foreign Key to users)

-- Psychological Preferences
- preferred_triggers (JSONB array)
- avoided_triggers (JSONB array)
- risk_tolerance (low/medium/high)
- creativity_level (conservative/balanced/experimental)

-- Performance-Based Learning
- successful_formulas (JSONB array of codes)
- underperforming_formulas (JSONB array of codes)
- personality_type (for future MBTI/Big5 integration)

-- Generation Preferences
- preferred_categories (JSONB array)
- content_style (educational/entertainment/mixed)
- urgency_preference (low/moderate/high)

-- Learning and Adaptation
- learning_rate (0-100)
- last_updated, profile_completeness (0-100)

- created_at, updated_at
```

### 5. Hook Performance Analytics (`hook_performance_analytics`)
Track hook effectiveness for learning:

```sql
- id (UUID, Primary Key)
- user_id (Foreign Key to users)
- generation_id (Foreign Key to hook_generations)
- hook_index (Position in generation)
- formula_code (Foreign Key to hook_formulas)
- platform, objective

-- User Feedback
- user_rating (1-5 stars)
- was_used, was_favorited, was_shared

-- Actual Performance (if provided)
- actual_views, actual_engagement, actual_conversions
- performance_notes

-- Analysis Metadata
- confidence_score (0-100)
- context_tags (JSONB array)

- recorded_at, created_at
```

### 6. Hook Trend Tracking (`hook_trend_tracking`)
Formula performance trends and fatigue prevention:

```sql
- id (UUID, Primary Key)
- formula_code (Foreign Key to hook_formulas)
- platform

-- Trend Metrics
- weekly_usage, monthly_usage
- avg_performance_score (0-100)
- trend_direction (rising/falling/stable)

-- Fatigue Indicators
- fatigue_level (0-100)
- last_high_performance
- consecutive_low_performance

-- Seasonality and Context
- seasonality_pattern (JSONB)
- optimal_timeframes (JSONB array)
- context_factors (JSONB)

-- Recommendations
- recommendation_status (active/caution/avoid)
- alternative_formulas (JSONB array)

-- Data Freshness
- last_calculated, data_points

- created_at, updated_at
```

### 7. A/B Test Results (`ab_test_results`)
A/B testing framework for formulas:

```sql
- id (UUID, Primary Key)
- test_id (Foreign Key to ab_tests)
- user_id (Foreign Key to users)
- participant_id (Foreign Key to ab_test_participants)

-- Test Configuration
- variant (A/B)
- formula_code_a, formula_code_b

-- Results
- selected_variant, engagement_score, conversion_score
- user_preference

-- Context
- platform, objective, topic
- context_data (JSONB)

-- Statistical Significance
- confidence_level (0-100)
- sample_size

- completed_at, created_at
```

### 8. Favorite Hooks (`favorite_hooks`)
Enhanced with psychological framework metadata:

```sql
- id (UUID, Primary Key)
- user_id (Foreign Key to users)
- generation_id (Foreign Key to hook_generations)

-- Legacy Support
- hook (Text, for backward compatibility)

-- Enhanced Tri-modal Data
- hook_data (JSONB, full HookObject)
- framework, platform_notes
- topic, platform

- created_at
```

### 9. Analytics Tables
Comprehensive analytics system:

- `analytics_events`: User behavior tracking
- `ab_tests`: A/B test configurations
- `ab_test_participants`: Test participation tracking
- `conversion_funnels`: Funnel definitions
- `funnel_events`: Funnel step tracking
- `user_consent`: GDPR compliance

## Hook Formula Taxonomy

### Question-Based (QH)
- **QH-01**: Direct Question - Low risk, 75% effectiveness
- **QH-02**: Rhetorical Question - Medium risk, 70% effectiveness  
- **QH-03**: Hypothetical "What If" - Low risk, 78% effectiveness
- **QH-04**: High-Stakes Question - High risk, 82% effectiveness

### Statement-Based (ST)
- **ST-01**: Direct Promise - Medium risk, 80% effectiveness
- **ST-02**: Startling Fact - Low risk, 76% effectiveness
- **ST-03**: Contrarian Opinion - High risk, 73% effectiveness
- **ST-04**: Common Mistake ID - Low risk, 77% effectiveness

### Narrative (NA)
- **NA-01**: In Medias Res - Medium risk, 81% effectiveness
- **NA-02**: Cliffhanger - High risk, 79% effectiveness
- **NA-03**: Personal Confession - Medium risk, 74% effectiveness
- **NA-04**: Before & After Teaser - Low risk, 78% effectiveness

### Urgency/Exclusivity (UE)
- **UE-01**: Direct Callout - Medium risk, 72% effectiveness
- **UE-02**: FOMO/Time Pressure - High risk, 84% effectiveness
- **UE-03**: Secret Reveal - High risk, 75% effectiveness
- **UE-04**: Warning/Preemptive - Medium risk, 73% effectiveness

### Efficiency (EF)
- **EF-01**: Numbered List - Low risk, 68% effectiveness
- **EF-02**: Quick Solution/Hack - Medium risk, 71% effectiveness

### Advanced Formulas (AD)
- **AD-01**: Paradox Presentation - High risk, 76% effectiveness
- **AD-02**: Pattern Interrupt - High risk, 82% effectiveness
- **AD-03**: Authority Challenge - High risk, 74% effectiveness
- **AD-04**: Micro-Story Hook - Low risk, 77% effectiveness
- **AD-05**: Future Prediction - High risk, 78% effectiveness
- **AD-06**: Social Proof Stack - Low risk, 75% effectiveness

## Database Utilities

### Core Functions (`/server/db/utils.ts`)

#### User Management
- `getUserById(userId)` - Get user by ID
- `getUserByEmail(email)` - Get user by email
- `updateUserPsychologicalPreferences(userId, preferences)` - Update psychological preferences

#### Psychological Profiles
- `getPsychologicalProfile(userId)` - Get user's psychological profile
- `createOrUpdatePsychologicalProfile(userId, data)` - Create/update profile

#### Hook Formulas
- `getActiveHookFormulas()` - Get all active formulas
- `getHookFormulasByCategory(category)` - Get formulas by category
- `getPersonalizedHookFormulas(userId)` - Get personalized formulas
- `getHookFormulaByCode(code)` - Get formula by code

#### Performance Analytics
- `recordHookPerformance(data)` - Record hook performance
- `getHookPerformanceStats(userId, timeframe)` - Get performance statistics
- `updateHookFormulaTrends()` - Update trend tracking

#### Generation Management
- `getHookGenerationsByUser(userId, limit, offset)` - Get user's generations
- `updateHookGenerationWithFormulas(id, formulas, strategy, adaptation, confidence)` - Update with psychological data

## Configuration

### Environment-Specific Configs (`/server/db/config.ts`)

#### Development
```typescript
{
  max: 10,
  idle_timeout: 10,
  connect_timeout: 5,
  ssl: false
}
```

#### Production
```typescript
{
  max: 50,
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: 'require'
}
```

### Connection Monitoring
- Query performance tracking
- Connection pool management
- Health check endpoints
- Error logging and metrics

## Setup Commands

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:push

# Seed hook formulas
npm run db:seed

# Complete setup (generate + push + seed)
npm run db:setup

# Initialize database with checks
npm run db:init

# Open database studio
npm run db:studio
```

## Performance Optimization

### Indexes
- User lookup indexes (email, firebase_uid, subscription_status)
- Performance analytics indexes (user_id, formula_code, platform, recorded_at)
- Trend tracking indexes (formula_code, platform, trend_direction, fatigue_level)
- Generation history indexes (user_id, created_at, platform)

### JSONB Optimization
- Efficient storage of hook objects and psychological data
- GIN indexes on frequently queried JSONB fields
- Proper JSONB query patterns for array containment

### Connection Management
- Environment-specific connection pools
- Graceful shutdown handling
- Connection monitoring and health checks

## Security

### Data Protection
- User data encryption at rest
- Secure connection strings
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries

### Privacy Compliance
- User consent tracking
- Data retention policies
- GDPR compliance framework
- Analytics anonymization

## Monitoring

### Health Checks
- Database connection status
- Query performance metrics
- Connection pool statistics
- Error rate tracking

### Performance Metrics
- Average query time
- Slow query detection
- Connection utilization
- Cache hit rates

## Future Enhancements

### Planned Features
- Advanced personality profiling (MBTI, Big5)
- Machine learning model integration
- Advanced A/B testing framework
- Real-time performance analytics
- Cross-platform trend analysis

### Scalability Considerations
- Read replica support
- Query optimization
- Data archiving strategies
- Horizontal scaling preparation