-- =====================================================
-- One-time fix: deduct inventory for return transfers
-- that were created before the immediate-deduct fix.
--
-- Run once in Plesk phpMyAdmin then delete this file.
-- =====================================================

-- Step 1: Mark any in-transit transfers going TO Production Facility
-- as return_backorder (old transfers were created without a type).
UPDATE `transfers`
SET `type` = 'return_backorder'
WHERE `to` = 'Production Facility'
  AND `status` = 'In Transit'
  AND (`type` = 'forward' OR `type` IS NULL);

-- Step 2: Deduct store inventory for those in-transit returns.
-- This fixes transfers that were created before the immediate-deduct fix.
UPDATE `inventory` inv
JOIN `transfers` t
  ON t.product_id = inv.product_id
 AND t.from = inv.location
 AND t.to = 'Production Facility'
 AND t.status = 'In Transit'
SET inv.quantity = GREATEST(0, inv.quantity - t.quantity);

-- =====================================================
-- DONE. Future returns will deduct immediately on creation.
-- =====================================================
