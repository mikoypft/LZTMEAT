-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 06, 2026 at 02:09 PM
-- Server version: 10.5.29-MariaDB
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lztmeat_admin`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `type` varchar(50) DEFAULT 'product'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`, `type`) VALUES
(4, 'Beef', NULL, '2026-02-01 18:38:37', '2026-02-01 18:38:37', 'product'),
(5, 'Chicken', NULL, '2026-02-01 18:38:43', '2026-02-01 18:38:43', 'product'),
(7, 'Pork', NULL, '2026-02-01 20:21:20', '2026-02-01 20:21:20', 'product');

-- --------------------------------------------------------

--
-- Table structure for table `discount_settings`
--

CREATE TABLE `discount_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `wholesale_min_units` int(11) NOT NULL DEFAULT 5 COMMENT 'Minimum units to qualify as wholesale',
  `wholesale_discount_percent` decimal(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Discount percentage for wholesale',
  `discount_type` enum('percentage','fixed_amount') NOT NULL DEFAULT 'percentage',
  `wholesale_discount_amount` decimal(8,2) DEFAULT NULL COMMENT 'Fixed discount amount when using fixed_amount type',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `discount_settings`
--

INSERT INTO `discount_settings` (`id`, `wholesale_min_units`, `wholesale_discount_percent`, `discount_type`, `wholesale_discount_amount`, `created_at`, `updated_at`) VALUES
(1, 5, 1.00, 'percentage', NULL, '2026-02-05 05:49:09', '2026-02-05 05:49:09');

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `stock` decimal(10,2) NOT NULL,
  `min_stock_level` decimal(10,2) NOT NULL,
  `reorder_point` decimal(10,2) NOT NULL,
  `cost_per_unit` decimal(10,2) NOT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`id`, `name`, `code`, `category_id`, `category`, `unit`, `stock`, `min_stock_level`, `reorder_point`, `cost_per_unit`, `supplier_id`, `expiry_date`, `created_at`, `updated_at`) VALUES
(7, 'Molo White', 'ING-001', 4, 'Wrapper', 'Pcs', 90.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:20:30', '2026-02-01 21:22:19'),
(8, 'Molo Yellow', 'ING-002', 4, 'Wrapper', 'Pcs', 0.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:21:12', '2026-02-01 21:21:12'),
(9, 'CFAT', 'ING-003', 5, 'Meat', 'Kg', 0.00, 80.00, 20.00, 138.00, 3, NULL, '2026-02-01 21:24:32', '2026-02-01 21:24:32'),
(10, 'MDM', 'ING-004', 5, 'Meat', 'Box', 0.00, 30.00, 5.00, 1600.00, 3, NULL, '2026-02-01 21:29:31', '2026-02-01 21:29:31'),
(11, 'Accord', 'ING-005', 3, 'Spices', 'Kg', 0.00, 20.00, 5.00, 90.00, 8, NULL, '2026-02-03 18:19:50', '2026-02-03 18:19:50'),
(12, 'TVP Fine', 'ING-006', 6, 'Extenders', 'Kg', 0.00, 50.00, 10.00, 82.00, 3, NULL, '2026-02-03 18:24:19', '2026-02-03 18:24:19'),
(13, 'Pine Apple Juice', 'ING-007', 7, 'Seasonings', 'L', 0.00, 20.00, 5.00, 106.25, 9, NULL, '2026-02-03 18:28:28', '2026-02-03 18:28:28');

-- --------------------------------------------------------

--
-- Table structure for table `ingredient_categories`
--

CREATE TABLE `ingredient_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredient_categories`
--

INSERT INTO `ingredient_categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(3, 'Spices', NULL, '2026-02-01 21:05:57', '2026-02-03 18:13:52'),
(4, 'Wrapper', NULL, '2026-02-01 21:18:30', '2026-02-01 21:18:30'),
(5, 'Meat', NULL, '2026-02-01 21:23:19', '2026-02-01 21:23:19'),
(6, 'Extenders', NULL, '2026-02-03 18:21:51', '2026-02-03 18:22:48'),
(7, 'Seasonings', NULL, '2026-02-03 18:25:56', '2026-02-03 18:25:56');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `location` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `product_id`, `location`, `quantity`, `created_at`, `updated_at`) VALUES
(4, 3, 'Main Store', 10, '2026-02-01 20:21:44', '2026-02-01 20:21:44'),
(5, 4, 'Main Store', 50, '2026-02-01 21:34:45', '2026-02-01 21:34:45'),
(6, 4, 'Production Facility', 200, '2026-02-01 22:06:15', '2026-02-01 22:06:15');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_ingredients`
--

CREATE TABLE `production_ingredients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `production_id` bigint(20) UNSIGNED NOT NULL,
  `ingredient_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `production_ingredients`
--

INSERT INTO `production_ingredients` (`id`, `production_id`, `ingredient_id`, `quantity`) VALUES
(3, 3, 7, 70.00),
(4, 4, 7, 10.00);

-- --------------------------------------------------------

--
-- Table structure for table `production_records`
--

CREATE TABLE `production_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `batch_number` varchar(255) NOT NULL,
  `operator` varchar(255) NOT NULL,
  `status` enum('in-progress','completed','quality-check') NOT NULL DEFAULT 'in-progress',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `production_records`
--

INSERT INTO `production_records` (`id`, `product_id`, `quantity`, `batch_number`, `operator`, `status`, `created_at`, `updated_at`) VALUES
(3, 4, 200, 'B001', 'Current User', 'completed', '2026-02-01 21:36:08', '2026-02-01 22:06:15'),
(4, 3, 60, 'B002', 'Current User', 'in-progress', '2026-02-03 19:46:48', '2026-02-03 19:46:48');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `price`, `unit`, `image`, `created_at`, `updated_at`) VALUES
(3, 'Longganisa', 7, 180.00, 'kg', NULL, '2026-02-01 20:21:43', '2026-02-01 20:21:43'),
(4, 'Siomai (White)', 7, 120.00, 'kg', NULL, '2026-02-01 21:34:45', '2026-02-01 21:34:45');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `store_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customer`)),
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `subtotal` decimal(10,2) NOT NULL,
  `global_discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `sales_type` enum('retail','wholesale') DEFAULT 'retail',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `transaction_id`, `user_id`, `store_id`, `customer`, `items`, `subtotal`, `global_discount`, `tax`, `total`, `payment_method`, `sales_type`, `created_at`, `updated_at`) VALUES
(1, '1769998575688', 1, 1, NULL, '\"[{\\\"productId\\\":2,\\\"name\\\":\\\"Longganisa\\\",\\\"price\\\":180,\\\"quantity\\\":1,\\\"discount\\\":0}]\"', 180.00, 0.00, 14.40, 194.40, 'Cash', 'retail', '2026-02-01 18:16:07', '2026-02-01 18:16:07');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ingredient_id` bigint(20) UNSIGNED NOT NULL,
  `ingredient_name` varchar(255) NOT NULL,
  `ingredient_code` varchar(255) NOT NULL,
  `type` enum('add','remove') NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `previous_stock` decimal(10,2) NOT NULL,
  `new_stock` decimal(10,2) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_adjustments`
--

INSERT INTO `stock_adjustments` (`id`, `ingredient_id`, `ingredient_name`, `ingredient_code`, `type`, `quantity`, `previous_stock`, `new_stock`, `unit`, `reason`, `user_id`, `user_name`, `ip_address`, `created_at`, `updated_at`) VALUES
(14, 7, 'Molo White', 'ING-001', 'add', 90.00, 0.00, 90.00, 'Pcs', 'Stock', 1, 'System Administrator', '162.158.186.133', '2026-02-01 21:22:19', '2026-02-01 21:22:19');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`id`, `name`, `address`, `contact_person`, `phone`, `email`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Main Store', 'Main Branch Location', 'Store Manager', '09123456789', 'store@lztmeat.com', 'active', '2026-01-30 10:56:01', '2026-01-30 10:56:01'),
(4, 'AB Market', 'Novaliches', 'Reyrieza', '09216926051', 'mds.mdssolutions011@gmail.com', 'active', '2026-02-01 21:43:24', '2026-02-01 21:43:24'),
(5, 'Susano Market', 'Novaliches', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', 'active', '2026-02-03 18:30:26', '2026-02-03 18:30:26'),
(6, 'Storage', 'Amparo', 'Ms. Bam', '09216926051', 'lztmeat@gmail.com', 'active', '2026-02-03 18:33:10', '2026-02-03 18:33:10');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `created_at`, `updated_at`) VALUES
(3, 'DEA Meat Trading', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', '25 Alibangbang St. Pangarap Village', '2026-02-01 21:14:17', '2026-02-01 21:14:17'),
(4, '4AG Dumpling Wrapper Trading', 'Alexis Gorosita', '09216926051', 'mds.mdssolutions011@gmail.com', '25 Alibangbang St. Pangarap Village', '2026-02-01 21:16:25', '2026-02-01 21:16:25'),
(6, 'AP-Prime Casing Distributors Co.', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', '25 Alibangbang St. Pangarap Village', '2026-02-01 21:16:58', '2026-02-01 21:16:58'),
(7, 'Monaco Manufacturing Corp', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', '25 Alibangbang St. Pangarap Village', '2026-02-01 21:17:15', '2026-02-01 21:17:15'),
(8, 'Spices Supplier', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', '25 Alibangbang St. Pangarap Village', '2026-02-01 21:17:34', '2026-02-01 21:17:34'),
(9, 'Others', 'None', '09216926051', 'mds.mdssolutions011@gmail.com', 'Amparo', '2026-02-03 18:27:46', '2026-02-03 18:27:46');

-- --------------------------------------------------------

--
-- Table structure for table `system_history`
--

CREATE TABLE `system_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `entity` varchar(255) DEFAULT NULL,
  `entity_id` varchar(255) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

CREATE TABLE `transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `from` varchar(255) NOT NULL,
  `to` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('Pending','In Transit','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `requested_by` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('ADMIN','STORE','PRODUCTION','POS','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `employee_role` enum('Store','Production','Employee','POS') DEFAULT NULL,
  `store_id` bigint(20) UNSIGNED DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `can_login` tinyint(1) NOT NULL DEFAULT 1,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `mobile`, `address`, `full_name`, `role`, `employee_role`, `store_id`, `permissions`, `can_login`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@lztmeat.com', NULL, NULL, 'System Administrator', 'ADMIN', NULL, NULL, '\"[\\\"all\\\"]\"', 1, '$2y$12$YbfvgJJ1dnBSo5rHyHvDU.ndvorINxZBIC2ucyCbty0LwxJMG.0dS', NULL, '2026-01-30 10:56:01', '2026-01-30 10:56:01'),
(6, 'ms._bam', NULL, '09', 'Amparo', 'Ms. Bam', 'EMPLOYEE', 'Employee', 1, '\"[\\\"ingredients\\\",\\\"categories\\\",\\\"inventory\\\"]\"', 1, '$2y$12$TlrPPPXe.cKN1Hojr63Neu33G0DJCjqR5WH9Q5uWV4RtHymShixHS', NULL, '2026-02-01 21:40:52', '2026-02-01 21:41:06'),
(7, 'mark_sioson', NULL, '09216926051', 'Caloocan', 'Mark Sioson', 'POS', NULL, 4, '\"[]\"', 1, '$2y$12$M4DR7xoCU.VLiImsO32FuOBiaPUsxsdGp95h.kUzk0NzWaYfPYCsy', NULL, '2026-02-01 21:44:02', '2026-02-01 21:44:12'),
(8, 'wilson', NULL, '09216926051', 'Amparo', 'Wilson', 'PRODUCTION', NULL, 1, '\"[]\"', 1, '$2y$12$3xfXumzelWy1.2PiwNR6Z.cQZwUuRdyoSLTwFdy.m2/jmPqz7UkJK', NULL, '2026-02-01 22:15:08', '2026-02-01 22:15:17'),
(9, 'richard', NULL, '09216926051', NULL, 'richard', 'POS', NULL, 1, '\"[]\"', 1, '$2y$12$OzdsqAPAPKE1xeHxVFP6hOy0.YVw8W1zqe2IS.Bo0X1rhXw21KjMq', NULL, '2026-02-03 19:05:04', '2026-02-03 19:05:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_name_unique` (`name`);

--
-- Indexes for table `discount_settings`
--
ALTER TABLE `discount_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ingredients_code_unique` (`code`),
  ADD KEY `ingredients_supplier_id_foreign` (`supplier_id`),
  ADD KEY `ingredients_category_id_foreign` (`category_id`);

--
-- Indexes for table `ingredient_categories`
--
ALTER TABLE `ingredient_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inventory_product_id_location_unique` (`product_id`,`location`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `production_ingredients`
--
ALTER TABLE `production_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `production_ingredients_production_id_foreign` (`production_id`),
  ADD KEY `production_ingredients_ingredient_id_foreign` (`ingredient_id`);

--
-- Indexes for table `production_records`
--
ALTER TABLE `production_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `production_records_batch_number_unique` (`batch_number`),
  ADD KEY `production_records_product_id_foreign` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_category_id_foreign` (`category_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sales_transaction_id_unique` (`transaction_id`),
  ADD KEY `sales_user_id_foreign` (`user_id`),
  ADD KEY `sales_store_id_foreign` (`store_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_adjustments_ingredient_id_index` (`ingredient_id`),
  ADD KEY `stock_adjustments_user_id_index` (`user_id`),
  ADD KEY `stock_adjustments_type_index` (`type`),
  ADD KEY `stock_adjustments_created_at_index` (`created_at`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stores_name_unique` (`name`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_history`
--
ALTER TABLE `system_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_history_user_id_foreign` (`user_id`);

--
-- Indexes for table `transfers`
--
ALTER TABLE `transfers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfers_product_id_foreign` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_store_id_foreign` (`store_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `discount_settings`
--
ALTER TABLE `discount_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `ingredient_categories`
--
ALTER TABLE `ingredient_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_ingredients`
--
ALTER TABLE `production_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `production_records`
--
ALTER TABLE `production_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `system_history`
--
ALTER TABLE `system_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transfers`
--
ALTER TABLE `transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD CONSTRAINT `ingredients_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `ingredient_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ingredients_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_ingredients`
--
ALTER TABLE `production_ingredients`
  ADD CONSTRAINT `production_ingredients_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_ingredients_production_id_foreign` FOREIGN KEY (`production_id`) REFERENCES `production_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_records`
--
ALTER TABLE `production_records`
  ADD CONSTRAINT `production_records_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD CONSTRAINT `stock_adjustments_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_adjustments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `system_history`
--
ALTER TABLE `system_history`
  ADD CONSTRAINT `system_history_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transfers`
--
ALTER TABLE `transfers`
  ADD CONSTRAINT `transfers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
