-- =====================================================
-- Product Mix Items Table Migration
-- Run this SQL in Plesk phpMyAdmin
-- =====================================================
-- This creates the table for managing products within 
-- Product Mix Categories, allowing users to add multiple
-- products to a mix with quantities.
-- =====================================================

CREATE TABLE IF NOT EXISTS `product_mix_items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_mix_category_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_mix_items_category_product_unique` (`product_mix_category_id`, `product_id`),
  KEY `product_mix_items_product_mix_category_id_foreign` (`product_mix_category_id`),
  KEY `product_mix_items_product_id_foreign` (`product_id`),
  CONSTRAINT `product_mix_items_product_mix_category_id_foreign` 
    FOREIGN KEY (`product_mix_category_id`) 
    REFERENCES `product_mix_categories` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `product_mix_items_product_id_foreign` 
    FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DONE! You can now:
-- 1. Click on any Product Mix Category in the UI
-- 2. Click the "List" icon button to manage products
-- 3. Add products to the mix using the modal
-- 4. Remove products from the mix
-- =====================================================
