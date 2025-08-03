CREATE TABLE IF NOT EXISTS "api_usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"endpoint" varchar NOT NULL,
	"method" varchar NOT NULL,
	"status_code" integer NOT NULL,
	"response_time" integer NOT NULL,
	"user_agent" text,
	"ip_address" varchar,
	"request_size" integer,
	"response_size" integer,
	"ai_service" varchar,
	"ai_model" varchar,
	"ai_tokens_used" integer,
	"ai_cost" integer,
	"error_type" varchar,
	"error_message" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_intelligence" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_name" varchar NOT NULL,
	"metric_value" integer NOT NULL,
	"metric_type" varchar NOT NULL,
	"dimension" varchar,
	"dimension_value" varchar,
	"period_type" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"calculated_at" timestamp DEFAULT NOW(),
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar,
	"user_id" varchar,
	"error_type" varchar NOT NULL,
	"error_message" text NOT NULL,
	"error_stack" text,
	"error_code" varchar,
	"url" text NOT NULL,
	"user_agent" text,
	"device_info" jsonb DEFAULT '{}'::jsonb,
	"additional_context" jsonb DEFAULT '{}'::jsonb,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar NOT NULL,
	"metric_name" varchar NOT NULL,
	"value" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_journey_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar,
	"stage" varchar NOT NULL,
	"step" varchar NOT NULL,
	"action" varchar NOT NULL,
	"from_stage" varchar,
	"from_step" varchar,
	"duration" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "web_vitals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar,
	"lcp" integer,
	"fid" integer,
	"cls" integer,
	"fcp" integer,
	"ttfb" integer,
	"device_type" varchar NOT NULL,
	"connection_type" varchar,
	"user_agent" text,
	"pathname" varchar NOT NULL,
	"referrer" varchar,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_tracking" ADD CONSTRAINT "api_usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "error_tracking" ADD CONSTRAINT "error_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_journey_tracking" ADD CONSTRAINT "user_journey_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "web_vitals" ADD CONSTRAINT "web_vitals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_endpoint_idx" ON "api_usage_tracking" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_timestamp_idx" ON "api_usage_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_status_code_idx" ON "api_usage_tracking" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_intelligence_metric_name_idx" ON "business_intelligence" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_intelligence_period_idx" ON "business_intelligence" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_intelligence_dimension_idx" ON "business_intelligence" USING btree ("dimension","dimension_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_tracking_error_type_idx" ON "error_tracking" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_tracking_timestamp_idx" ON "error_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_tracking_resolved_idx" ON "error_tracking" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_metrics_metric_type_idx" ON "system_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_metrics_timestamp_idx" ON "system_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_journey_session_id_idx" ON "user_journey_tracking" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_journey_stage_idx" ON "user_journey_tracking" USING btree ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_journey_timestamp_idx" ON "user_journey_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_vitals_session_id_idx" ON "web_vitals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_vitals_pathname_idx" ON "web_vitals" USING btree ("pathname");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_vitals_timestamp_idx" ON "web_vitals" USING btree ("created_at");