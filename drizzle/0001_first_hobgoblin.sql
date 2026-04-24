CREATE TABLE `batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`batchSize` int NOT NULL,
	`totalCost` decimal(12,2) NOT NULL,
	`costPerUnit` decimal(10,2) NOT NULL,
	`productionDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`remainingStock` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costBreakdowns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`rawMaterialsCost` decimal(10,2) DEFAULT '0',
	`packagingCost` decimal(10,2) DEFAULT '0',
	`marketingCost` decimal(10,2) DEFAULT '0',
	`laborCost` decimal(10,2) DEFAULT '0',
	`otherCost` decimal(10,2) DEFAULT '0',
	`totalCost` decimal(10,2) NOT NULL,
	`suggestedMarginPercent` decimal(5,2) DEFAULT '30',
	`suggestedSellingPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costBreakdowns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`amount` decimal(12,2) NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otherIncome` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`incomeDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `otherIncome_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`sellingPrice` decimal(10,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`batchId` int,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`costPerUnit` decimal(10,2) NOT NULL,
	`profit` decimal(12,2) NOT NULL,
	`customerName` varchar(255),
	`saleDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
