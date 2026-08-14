CREATE TABLE `user_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apifyApiKey` text,
	`n8nWebhookUrl` text,
	`n8nWebhookToken` text,
	`openrouterApiKey` text,
	`evolutionApiUrl` text,
	`evolutionApiKey` text,
	`postgresUrl` text,
	`hasuraEndpoint` text,
	`hasuraAdminSecret` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_integrations_userId_unique` UNIQUE(`userId`)
);
