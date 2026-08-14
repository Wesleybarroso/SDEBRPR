ALTER TABLE `search_runs` ADD `cep` varchar(12);--> statement-breakpoint
ALTER TABLE `search_runs` ADD `leadLimit` int DEFAULT 50 NOT NULL;