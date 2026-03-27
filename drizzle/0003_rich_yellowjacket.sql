ALTER TABLE `resources` ADD `title` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `description` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `cover_path` text;--> statement-breakpoint
ALTER TABLE `resources` ADD `file_size` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `resources` ADD `cover_size` integer DEFAULT 0 NOT NULL;