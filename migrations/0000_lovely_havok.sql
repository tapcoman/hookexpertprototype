CREATE TABLE IF NOT EXISTS "ab_test_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" varchar NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"variant" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_test_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" varchar NOT NULL,
	"user_id" varchar,
	"participant_id" varchar,
	"variant" varchar NOT NULL,
	"formula_code_a" varchar,
	"formula_code_b" varchar,
	"selected_variant" varchar,
	"engagement_score" integer,
	"conversion_score" integer,
	"user_preference" varchar,
	"platform" varchar NOT NULL,
	"objective" varchar NOT NULL,
	"topic" text,
	"context_data" jsonb DEFAULT '{}'::jsonb,
	"confidence_level" integer,
	"sample_size" integer DEFAULT 1,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"variants" jsonb NOT NULL,
	"traffic_allocation" jsonb NOT NULL,
	"targeting_rules" jsonb,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar,
	"event_type" varchar NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"device_info" jsonb NOT NULL,
	"page_info" jsonb NOT NULL,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversion_funnels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"steps" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorite_hooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"generation_id" varchar,
	"hook" text,
	"hook_data" jsonb,
	"framework" text NOT NULL,
	"platform_notes" text NOT NULL,
	"topic" text,
	"platform" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funnel_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funnel_id" varchar NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"step_index" integer NOT NULL,
	"step_name" varchar NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hook_formulas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"description" text NOT NULL,
	"structural_template" text NOT NULL,
	"psychological_triggers" jsonb NOT NULL,
	"primary_driver" varchar NOT NULL,
	"effectiveness_rating" integer NOT NULL,
	"risk_factor" varchar NOT NULL,
	"optimal_niches" jsonb NOT NULL,
	"example_variations" jsonb NOT NULL,
	"usage_guidelines" text,
	"cautionary_notes" text,
	"avg_engagement_rate" integer DEFAULT 0,
	"avg_conversion_rate" integer DEFAULT 0,
	"fatigue_resistance" integer DEFAULT 50,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "hook_formulas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hook_generations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"objective" text NOT NULL,
	"topic" text NOT NULL,
	"model_type" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"hooks" jsonb NOT NULL,
	"top_three_variants" jsonb,
	"used_formulas" jsonb DEFAULT '[]'::jsonb,
	"psychological_strategy" jsonb DEFAULT '{}'::jsonb,
	"adaptation_level" integer DEFAULT 0,
	"confidence_score" integer DEFAULT 75,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hook_performance_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"generation_id" varchar,
	"hook_index" integer NOT NULL,
	"formula_code" varchar,
	"platform" varchar NOT NULL,
	"objective" varchar NOT NULL,
	"user_rating" integer,
	"was_used" boolean DEFAULT false,
	"was_favorited" boolean DEFAULT false,
	"was_shared" boolean DEFAULT false,
	"actual_views" integer,
	"actual_engagement" integer,
	"actual_conversions" integer,
	"performance_notes" text,
	"confidence_score" integer DEFAULT 50,
	"context_tags" jsonb DEFAULT '[]'::jsonb,
	"recorded_at" timestamp DEFAULT NOW(),
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hook_trend_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formula_code" varchar NOT NULL,
	"platform" varchar NOT NULL,
	"weekly_usage" integer DEFAULT 0,
	"monthly_usage" integer DEFAULT 0,
	"avg_performance_score" integer DEFAULT 0,
	"trend_direction" varchar DEFAULT 'stable',
	"fatigue_level" integer DEFAULT 0,
	"last_high_performance" timestamp,
	"consecutive_low_performance" integer DEFAULT 0,
	"seasonality_pattern" jsonb DEFAULT '{}'::jsonb,
	"optimal_timeframes" jsonb DEFAULT '[]'::jsonb,
	"context_factors" jsonb DEFAULT '{}'::jsonb,
	"recommendation_status" varchar DEFAULT 'active',
	"alternative_formulas" jsonb DEFAULT '[]'::jsonb,
	"last_calculated" timestamp DEFAULT NOW(),
	"data_points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychological_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"preferred_triggers" jsonb DEFAULT '[]'::jsonb,
	"avoided_triggers" jsonb DEFAULT '[]'::jsonb,
	"risk_tolerance" varchar DEFAULT 'medium',
	"creativity_level" varchar DEFAULT 'balanced',
	"successful_formulas" jsonb DEFAULT '[]'::jsonb,
	"underperforming_formulas" jsonb DEFAULT '[]'::jsonb,
	"personality_type" varchar,
	"preferred_categories" jsonb DEFAULT '[]'::jsonb,
	"content_style" varchar DEFAULT 'mixed',
	"urgency_preference" varchar DEFAULT 'moderate',
	"learning_rate" integer DEFAULT 50,
	"last_updated" timestamp DEFAULT NOW(),
	"profile_completeness" integer DEFAULT 0,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_consent" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"consent_type" varchar NOT NULL,
	"consented" boolean NOT NULL,
	"consent_data" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"firebase_uid" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"email_verified" boolean DEFAULT false,
	"company" text,
	"industry" text,
	"role" text,
	"audience" text,
	"voice" text,
	"banned_terms" jsonb DEFAULT '[]'::jsonb,
	"safety" text DEFAULT 'standard',
	"preferred_hook_categories" jsonb DEFAULT '[]'::jsonb,
	"psychological_risk_tolerance" varchar DEFAULT 'medium',
	"creativity_preference" varchar DEFAULT 'balanced',
	"urgency_preference" varchar DEFAULT 'moderate',
	"personality_insights" jsonb DEFAULT '{}'::jsonb,
	"pro_generations_used" integer DEFAULT 0,
	"draft_generations_used" integer DEFAULT 0,
	"weekly_draft_reset" timestamp DEFAULT NOW(),
	"free_credits" integer DEFAULT 5,
	"used_credits" integer DEFAULT 0,
	"is_premium" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar DEFAULT 'free',
	"subscription_plan" varchar DEFAULT 'free',
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_participants" ADD CONSTRAINT "ab_test_participants_test_id_ab_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."ab_tests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_participants" ADD CONSTRAINT "ab_test_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_test_id_ab_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."ab_tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_participant_id_ab_test_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."ab_test_participants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_formula_code_a_hook_formulas_code_fk" FOREIGN KEY ("formula_code_a") REFERENCES "public"."hook_formulas"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_formula_code_b_hook_formulas_code_fk" FOREIGN KEY ("formula_code_b") REFERENCES "public"."hook_formulas"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_hooks" ADD CONSTRAINT "favorite_hooks_generation_id_hook_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."hook_generations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_funnel_id_conversion_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."conversion_funnels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hook_generations" ADD CONSTRAINT "hook_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hook_performance_analytics" ADD CONSTRAINT "hook_performance_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hook_performance_analytics" ADD CONSTRAINT "hook_performance_analytics_generation_id_hook_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."hook_generations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hook_performance_analytics" ADD CONSTRAINT "hook_performance_analytics_formula_code_hook_formulas_code_fk" FOREIGN KEY ("formula_code") REFERENCES "public"."hook_formulas"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hook_trend_tracking" ADD CONSTRAINT "hook_trend_tracking_formula_code_hook_formulas_code_fk" FOREIGN KEY ("formula_code") REFERENCES "public"."hook_formulas"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychological_profiles" ADD CONSTRAINT "psychological_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_participants_test_id_idx" ON "ab_test_participants" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_participants_user_id_idx" ON "ab_test_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_results_test_id_idx" ON "ab_test_results" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_results_user_id_idx" ON "ab_test_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_results_variant_idx" ON "ab_test_results" USING btree ("variant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_results_completed_at_idx" ON "ab_test_results" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorite_hooks_user_id_idx" ON "favorite_hooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorite_hooks_created_at_idx" ON "favorite_hooks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_funnel_id_idx" ON "funnel_events" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_session_id_idx" ON "funnel_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_formulas_code_idx" ON "hook_formulas" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_formulas_category_idx" ON "hook_formulas" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_formulas_primary_driver_idx" ON "hook_formulas" USING btree ("primary_driver");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_formulas_effectiveness_idx" ON "hook_formulas" USING btree ("effectiveness_rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_formulas_active_idx" ON "hook_formulas" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_generations_user_id_idx" ON "hook_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_generations_created_at_idx" ON "hook_generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_generations_platform_idx" ON "hook_generations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_user_id_idx" ON "hook_performance_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_generation_id_idx" ON "hook_performance_analytics" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_formula_code_idx" ON "hook_performance_analytics" USING btree ("formula_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_platform_idx" ON "hook_performance_analytics" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_recorded_at_idx" ON "hook_performance_analytics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_performance_rating_idx" ON "hook_performance_analytics" USING btree ("user_rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_formula_code_idx" ON "hook_trend_tracking" USING btree ("formula_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_platform_idx" ON "hook_trend_tracking" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_direction_idx" ON "hook_trend_tracking" USING btree ("trend_direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_fatigue_idx" ON "hook_trend_tracking" USING btree ("fatigue_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_recommendation_idx" ON "hook_trend_tracking" USING btree ("recommendation_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_trend_calculated_idx" ON "hook_trend_tracking" USING btree ("last_calculated");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psychological_profiles_user_id_idx" ON "psychological_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psychological_profiles_risk_tolerance_idx" ON "psychological_profiles" USING btree ("risk_tolerance");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psychological_profiles_updated_at_idx" ON "psychological_profiles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_consent_user_id_idx" ON "user_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_consent_consent_type_idx" ON "user_consent" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_subscription_status_idx" ON "users" USING btree ("subscription_status");