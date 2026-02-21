-- Fix all negative inventory values
-- Run this once in phpMyAdmin on the admin_lztmeat database
-- Safe to run multiple times (UPDATE is idempotent when qty >= 0)

UPDATE `inventory`
SET `quantity` = 0
WHERE `quantity` < 0;

-- Verify (should return 0 rows after fix)
SELECT * FROM `inventory` WHERE `quantity` < 0;
