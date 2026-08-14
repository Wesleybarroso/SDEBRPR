CREATE TABLE `integration_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(40) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`externalId` varchar(180),
	`payload` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'received',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_qualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`score` int NOT NULL,
	`status` enum('qualified','discarded') NOT NULL,
	`reason` text,
	`model` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_qualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`phone` varchar(40) NOT NULL,
	`isValid` boolean,
	`jid` varchar(100),
	`source` varchar(40) DEFAULT 'evolution-go',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_checks_id` PRIMARY KEY(`id`)
);
