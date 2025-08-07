CREATE TABLE `favorite_hooks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text,
	`hook` text,
	`hook_data` text,
	`framework` text NOT NULL,
	`platform_notes` text NOT NULL,
	`topic` text,
	`platform` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generation_id`) REFERENCES `hook_generations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `hook_generations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`objective` text NOT NULL,
	`topic` text NOT NULL,
	`model_type` text DEFAULT 'gpt-4o-mini' NOT NULL,
	`hooks` text NOT NULL,
	`top_three_variants` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`email_verified` integer DEFAULT false,
	`company` text,
	`industry` text,
	`role` text,
	`is_premium` integer DEFAULT false,
	`free_credits` integer DEFAULT 5,
	`used_credits` integer DEFAULT 0,
	`subscription_status` text DEFAULT 'free',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);