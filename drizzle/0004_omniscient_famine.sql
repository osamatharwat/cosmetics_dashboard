CREATE TABLE `chartOfAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountCode` varchar(20) NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountType` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chartOfAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discountTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`saleId` int NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`discountAmount` decimal(12,2) NOT NULL,
	`reason` varchar(255),
	`appliedDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discountTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryDate` timestamp NOT NULL,
	`description` varchar(255) NOT NULL,
	`referenceType` enum('sale','expense','batch','adjustment','other') NOT NULL,
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalEntryLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`journalEntryId` int NOT NULL,
	`accountId` int NOT NULL,
	`debitAmount` decimal(12,2) DEFAULT '0',
	`creditAmount` decimal(12,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journalEntryLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales` DROP COLUMN `discountType`;--> statement-breakpoint
ALTER TABLE `sales` DROP COLUMN `discountValue`;