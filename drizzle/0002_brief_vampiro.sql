ALTER TABLE `playlist` ADD `is_saved_shared` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `playlist` ADD `source_playlist_id` text;--> statement-breakpoint
ALTER TABLE `playlist` ADD `source_owner_id` text;--> statement-breakpoint
ALTER TABLE `playlist` ADD `source_owner_name` text;