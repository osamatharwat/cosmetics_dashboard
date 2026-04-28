ALTER TABLE `sales` ADD `discountType` enum('none','percentage','fixed') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `discountValue` decimal(10,2) DEFAULT '0' NOT NULL;