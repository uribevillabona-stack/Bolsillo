CREATE TABLE `budget_alerts` (
	`month` text NOT NULL,
	`category_id` integer NOT NULL,
	`threshold` integer NOT NULL,
	`shown_at` integer NOT NULL,
	PRIMARY KEY(`month`, `category_id`, `threshold`),
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`limit_amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_category_id_unique` ON `budgets` (`category_id`);--> statement-breakpoint
CREATE TABLE `recommendation_dismissals` (
	`rule_key` text PRIMARY KEY NOT NULL,
	`dismissed_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `goal_contributions` ADD `from_savings` integer DEFAULT false NOT NULL;