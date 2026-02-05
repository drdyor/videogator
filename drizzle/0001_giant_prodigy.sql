CREATE TABLE `pharmaTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(128) NOT NULL,
	`parameters` text,
	`previewImage` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pharmaTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`serviceId` varchar(64) NOT NULL,
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`prompt` text,
	`settings` text,
	`videoUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('general','pharma','specialized') NOT NULL DEFAULT 'general',
	`description` text,
	`capabilities` text,
	`pricing` varchar(255),
	`website` varchar(512),
	`icon` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
