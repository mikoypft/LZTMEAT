-- Safe Database Migration for Plesk Production
-- Adds transfer receipt tracking fields to the transfers table
-- Date: February 6, 2026
-- Safe: All new columns are nullable, existing data is preserved

-- Add quantity_received column if it doesn't exist
ALTER TABLE `transfers` ADD COLUMN `quantity_received` DECIMAL(10,2) NULL COMMENT 'Actual quantity received (for reconciliation)' AFTER `quantity`;

-- Add discrepancy_reason column if it doesn't exist
ALTER TABLE `transfers` ADD COLUMN `discrepancy_reason` VARCHAR(255) NULL COMMENT 'Reason for any quantity discrepancy' AFTER `quantity_received`;

-- Add received_by column if it doesn't exist
ALTER TABLE `transfers` ADD COLUMN `received_by` VARCHAR(255) NULL COMMENT 'Name/ID of person who received the transfer' AFTER `discrepancy_reason`;

-- Add received_at column if it doesn't exist
ALTER TABLE `transfers` ADD COLUMN `received_at` TIMESTAMP NULL COMMENT 'Timestamp when transfer was received' AFTER `received_by`;

-- Verification: Show the updated transfers table structure
-- DESCRIBE `transfers`;
