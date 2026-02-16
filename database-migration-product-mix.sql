-- Product Mix Categories Table Migration
-- Run this SQL in your Plesk database

CREATE TABLE IF NOT EXISTS `product_mix_categories` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_mix_categories_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add some sample data
INSERT INTO `product_mix_categories` (`name`, `description`, `created_at`, `updated_at`) VALUES
('Combo Packages', 'Bundled product combinations', NOW(), NOW()),
('Mixed Packs', 'Variety pack products', NOW(), NOW()),
('Custom Mix', 'Custom mixed products', NOW(), NOW());
