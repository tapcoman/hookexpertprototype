CREATE TABLE IF NOT EXISTS "payment_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"stripe_payment_intent_id" varchar,
	"stripe_invoice_id" varchar,
	"stripe_subscription_id" varchar,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'usd',
	"status" varchar NOT NULL,
	"payment_method" varchar,
	"plan_id" varchar,
	"plan_name" varchar,
	"billing_period" varchar,
	"description" text,
	"receipt_url" text,
	"refunded" boolean DEFAULT false,
	"refunded_amount" integer DEFAULT 0,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "payment_history_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payment_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_price_id" varchar NOT NULL,
	"stripe_product_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"currency" varchar DEFAULT 'usd',
	"interval" varchar NOT NULL,
	"interval_count" integer DEFAULT 1,
	"pro_generations_limit" integer,
	"draft_generations_limit" integer,
	"team_seats" integer DEFAULT 1,
	"has_advanced_analytics" boolean DEFAULT false,
	"has_priority_support" boolean DEFAULT false,
	"trial_period_days" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "subscription_plans_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"pro_generations_used" integer DEFAULT 0,
	"draft_generations_used" integer DEFAULT 0,
	"pro_generations_limit" integer,
	"draft_generations_limit" integer,
	"subscription_plan" varchar NOT NULL,
	"stripe_subscription_id" varchar,
	"pro_overage_used" integer DEFAULT 0,
	"overage_charges" integer DEFAULT 0,
	"last_reset_at" timestamp DEFAULT NOW(),
	"next_reset_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"event_data" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"processing_error" text,
	"retry_count" integer DEFAULT 0,
	"user_id" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "webhook_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_history_user_id_idx" ON "payment_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_history_status_idx" ON "payment_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_history_stripe_payment_intent_idx" ON "payment_history" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_history_paid_at_idx" ON "payment_history" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_plans_stripe_price_id_idx" ON "subscription_plans" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_plans_name_idx" ON "subscription_plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_plans_active_idx" ON "subscription_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_tracking_user_id_idx" ON "usage_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_tracking_period_idx" ON "usage_tracking" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_tracking_subscription_idx" ON "usage_tracking" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_tracking_next_reset_idx" ON "usage_tracking" USING btree ("next_reset_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_stripe_event_id_idx" ON "webhook_events" USING btree ("stripe_event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_user_id_idx" ON "webhook_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_created_at_idx" ON "webhook_events" USING btree ("created_at");