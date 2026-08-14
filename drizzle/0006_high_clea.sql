CREATE TABLE `conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`externalId` varchar(180),
	`direction` enum('inbound','outbound') NOT NULL,
	`author` enum('lead','ai','manual','system') NOT NULL,
	`body` text NOT NULL,
	`deliveryStatus` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversation_messages_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`stage` enum('new','contacted','waiting','interested','in_progress','not_interested','rescue','closed') NOT NULL DEFAULT 'new',
	`serviceOrder` int NOT NULL DEFAULT 0,
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastMessagePreview` text,
	`lastMessageAt` timestamp,
	`rescueAvailableAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_leadId_unique` UNIQUE(`leadId`)
);
