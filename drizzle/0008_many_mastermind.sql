ALTER TABLE `user_whatsapp_numbers` ADD `keepAlive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_whatsapp_numbers` ADD `connectionStatus` enum('offline','connecting','connected','error') DEFAULT 'offline' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_whatsapp_numbers` ADD `lastHeartbeatAt` timestamp;--> statement-breakpoint
ALTER TABLE `user_whatsapp_numbers` ADD `lastError` text;--> statement-breakpoint
ALTER TABLE `user_whatsapp_numbers` ADD `scheduleCronTaskUid` varchar(65);