CREATE TABLE `lesson_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lesson_completions_lesson_idx` ON `lesson_completions` (`lesson_id`);