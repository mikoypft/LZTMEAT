-- =====================================================
-- One-time fix: deduct inventory for return transfers
-- that were created before the immediate-deduct fix.
--
-- Run once in Plesk phpMyAdmin then delete this file.
-- =====================================================

-- Deduct store inventory for any return transfers that
-- are still In Transit (created before the fix, so the
-- store was never decremented).
UPDATE inventory inv
JOIN transfers t ON t.product_id = inv.product_id
   AND t.from = inv.location
   AND t.type IN ('return_backorder', 'return_scrap')
   AND t.status = 'In Transit'
SET inv.quantity = GREATEST(0, inv.quantity - t.quantity);

-- =====================================================
-- DONE. Future returns will deduct immediately on creation.
-- =====================================================
