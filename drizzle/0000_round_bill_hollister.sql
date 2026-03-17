ALTER TABLE `playlist` ADD `is_public` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `playlist` ADD `share_token` text;
--> statement-breakpoint
ALTER TABLE `playlist` ADD `shared_at` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `playlist_share_token_unique` ON `playlist` (`share_token`);
