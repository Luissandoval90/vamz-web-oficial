ALTER TABLE `resources` ADD `is_published` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `resources` ADD `published_at` text;--> statement-breakpoint
CREATE INDEX `resources_is_published_idx` ON `resources` (`is_published`);