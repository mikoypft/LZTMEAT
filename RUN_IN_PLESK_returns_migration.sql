-- =====================================================
-- Returns (Scrap / Back Order) Migration
-- Run this SQL in Plesk phpMyAdmin
-- =====================================================
-- This adds type and return_notes columns to the
-- transfers table to support returning products
-- from stores back to the Production Facility.
--
-- type values:
--   'forward'          - normal production → store transfer
--   'return_backorder' - unsold items returned to production
--   'return_scrap'     - damaged/wasted items reported as scrap
-- =====================================================

ALTER TABLE `transfers`
  ADD COLUMN `type` ENUM('forward', 'return_backorder', 'return_scrap')
      NOT NULL DEFAULT 'forward'
      AFTER `status`,
  ADD COLUMN `return_notes` TEXT NULL
      AFTER `type`;

-- =====================================================
-- Also record this migration in the migrations table
-- so Laravel does not try to run it again.
-- =====================================================
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2026_02_21_000000_add_type_to_transfers_table',
       COALESCE((SELECT MAX(`batch`) FROM `migrations`), 0) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations`
  WHERE `migration` = '2026_02_21_000000_add_type_to_transfers_table'
);

-- =====================================================
-- DONE! The system now supports:
-- 1. Returning back-order (unsold) items to production
-- 2. Reporting scrap from stores
-- Use the "Return to Production" button on the
-- Transfer Management page.
-- =====================================================
