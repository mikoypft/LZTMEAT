-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 07, 2026 at 01:22 AM
-- Server version: 10.3.39-MariaDB-0ubuntu0.20.04.2-log
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `admin_lztmeat`
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
(14, 'Pork', '', '2026-02-12 04:35:47', '2026-02-12 04:35:47', 'product'),
(16, 'Chicken', '', '2026-03-04 04:58:29', '2026-03-04 04:58:29', 'product');

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
(1, 5, 5.00, 'fixed_amount', 25.00, '2026-02-05 05:49:09', '2026-02-05 05:49:09');

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
(7, 'Molo White', 'ING-001', NULL, 'Wrapper', 'Pcs', 100.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:20:30', '2026-03-04 03:01:16'),
(8, 'Molo Yellow', 'ING-002', NULL, 'Wrapper', 'Pcs', 100.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:21:12', '2026-03-04 03:01:23'),
(9, 'CFAT', 'ING-003', NULL, 'Meat', 'Kg', 99.00, 80.00, 20.00, 140.00, 3, NULL, '2026-02-01 21:24:32', '2026-03-04 04:54:53'),
(10, 'MDM', 'ING-004', NULL, 'Raw Materials', 'Kg', 1096.00, 30.00, 5.00, 1600.00, 3, NULL, '2026-02-01 21:29:31', '2026-03-06 08:04:39'),
(11, 'Accord', 'ING-005', NULL, 'Spices', 'Kg', 96.00, 20.00, 5.00, 90.00, 8, NULL, '2026-02-03 18:19:50', '2026-03-06 08:04:39'),
(12, 'TVP Fine', 'ING-006', NULL, 'Raw Materials', 'Kg', 298.00, 50.00, 10.00, 82.00, 3, NULL, '2026-02-03 18:24:19', '2026-03-06 07:57:29'),
(13, 'Pine Apple Juice', 'ING-007', NULL, 'Seasonings', 'L', 97.00, 24.00, 5.00, 106.25, 9, NULL, '2026-02-03 18:28:28', '2026-03-06 08:04:39'),
(14, 'Praque Powder', 'ING-008', NULL, 'Spices', 'kg', 96.40, 20.00, 5.00, 25.00, 8, NULL, '2026-02-10 01:48:20', '2026-03-06 08:04:39'),
(15, 'Ham Spice', 'ING-009', NULL, 'Spices', 'kg', 98.00, 5.00, 2.00, 170.00, 8, NULL, '2026-02-10 01:49:05', '2026-03-06 08:04:39'),
(16, 'Ham Flavor', 'ING-010', NULL, 'Spices', 'kg', 98.00, 5.00, 2.00, 170.00, 8, NULL, '2026-02-10 01:49:40', '2026-03-06 08:04:39'),
(17, 'Vitamin C', 'ING-011', NULL, 'Spices', 'kg', 98.00, 2.00, 1.00, 380.00, 8, NULL, '2026-02-10 01:50:09', '2026-03-06 08:04:39'),
(18, 'Sodium', 'ING-012', NULL, 'Spices', 'kg', 98.00, 5.00, 2.00, 230.00, 8, NULL, '2026-02-10 01:50:45', '2026-03-06 07:57:29'),
(19, 'Alexander', 'ING-013', NULL, 'Seasonings', 'L', 98.00, 8.00, 4.00, 69.33, 3, NULL, '2026-02-11 01:44:02', '2026-03-06 07:57:29'),
(20, 'Knorr Liquid Seasoning', 'ING-014', NULL, 'Seasonings', 'L', 98.00, 5.00, 2.00, 258.58, 3, NULL, '2026-02-11 01:45:06', '2026-03-06 07:57:29'),
(21, 'Tvp Gem', 'ING-015', NULL, 'Raw Materials', 'kg', 100.00, 20.00, 10.00, 82.00, 3, NULL, '2026-02-11 01:46:07', '2026-03-04 03:04:14'),
(22, 'Asin', 'ING-016', NULL, 'Raw Materials', 'kg', 100.00, 40.00, 10.00, 7.50, 3, NULL, '2026-02-11 01:51:09', '2026-03-04 02:58:07'),
(23, 'MSG-Vetsin', 'ING-017', NULL, 'Raw Materials', 'kg', 96.00, 25.00, 10.00, 48.00, 3, NULL, '2026-02-11 01:52:15', '2026-03-06 08:04:39'),
(24, 'Sugar', 'ING-018', NULL, 'Raw Materials', 'kg', 1096.00, 250.00, 100.00, 53.00, 9, NULL, '2026-02-11 02:07:09', '2026-03-06 08:04:39'),
(25, 'Cornstarch', 'ING-019', NULL, 'Raw Materials', 'kg', 396.40, 200.00, 100.00, 36.00, 9, NULL, '2026-02-11 02:07:59', '2026-03-06 08:04:39'),
(26, 'Giling-fat', 'ING-020', NULL, 'Raw Materials', 'kg', 100.00, 50.00, 25.00, 135.00, 3, NULL, '2026-02-11 02:12:52', '2026-03-04 02:59:29'),
(27, 'Carrots', 'ING-021', NULL, 'Raw Materials', 'kg', 99.00, 10.00, 5.00, 38.00, 9, NULL, '2026-02-11 07:52:17', '2026-03-06 07:57:29'),
(28, 'Onion', 'ING-022', NULL, 'Raw Materials', 'kg', 99.00, 10.00, 5.00, 50.00, 9, NULL, '2026-02-11 07:52:51', '2026-03-06 07:57:29'),
(29, 'Redbell Pepper', 'ING-023', NULL, 'Raw Materials', 'kg', 99.00, 2.00, 1.00, 150.00, 9, NULL, '2026-02-11 07:53:44', '2026-03-06 07:57:29'),
(30, 'Celery', 'ING-024', NULL, 'Raw Materials', 'kg', 99.00, 2.00, 1.00, 90.00, 9, NULL, '2026-02-11 07:54:24', '2026-03-06 07:57:29'),
(31, 'Garlic', 'ING-025', NULL, 'Raw Materials', 'kg', 98.00, 10.00, 5.00, 120.00, 9, NULL, '2026-02-11 08:00:41', '2026-03-06 07:57:29'),
(32, 'Tali', 'ING-026', NULL, 'Raw Materials', 'pcs', 100.00, 60.00, 10.00, 80.00, 7, NULL, '2026-02-11 08:12:07', '2026-03-04 03:03:59'),
(33, 'Lumpia Wrapper', 'ING-027', NULL, 'Wrapper', 'pcs', 100.00, 8.00, 2.00, 380.00, 9, NULL, '2026-02-11 09:22:12', '2026-03-04 03:00:51'),
(34, 'hangs-isaw', 'ING-028', NULL, 'Raw Materials', 'pcs', 100.00, 50.00, 10.00, 550.00, 6, NULL, '2026-02-11 09:24:29', '2026-03-04 02:59:56'),
(35, 'Cheese', 'ING-029', NULL, 'Raw Materials', 'pcs', 99.00, 10.00, 2.00, 145.00, 9, NULL, '2026-02-11 09:27:11', '2026-03-04 08:28:51'),
(36, 'Multiblend', 'ING-030', NULL, 'Spices', 'kg', 98.00, 5.00, 2.00, 220.00, 3, NULL, '2026-02-11 09:28:43', '2026-03-06 08:04:39'),
(37, 'Curry Powder', 'ING-031', NULL, 'Spices', 'kg', 100.00, 3.00, 1.00, 250.00, 9, NULL, '2026-02-11 09:29:16', '2026-03-04 02:59:03'),
(40, 'Gas', 'ING-034', NULL, 'Utilities', 'L', 100.00, 3.00, 1.00, 3425.00, 11, NULL, '2026-02-12 03:09:36', '2026-03-04 02:59:20'),
(41, '6X8', 'ING-035', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:46:31', '2026-03-04 02:56:59'),
(42, '6X10', 'ING-036', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:47:00', '2026-03-04 02:56:50'),
(43, 'PE 6X8', 'ING-037', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:48:14', '2026-03-04 03:02:02'),
(44, 'PE X10', 'ING-038', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:52:45', '2026-03-04 03:02:10'),
(45, '8X11', 'ING-039', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:53:08', '2026-03-04 02:57:07'),
(46, '10X14', 'ING-040', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:53:48', '2026-03-04 02:56:30'),
(47, '12X18', 'ING-041', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:54:21', '2026-03-04 02:56:41'),
(48, 'Medium', 'ING-042', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:54:49', '2026-03-04 03:01:08'),
(49, 'Large', 'ING-043', NULL, 'Packaging Materials', 'pcs', 100.00, 200.00, 100.00, 100.00, 9, NULL, '2026-02-12 03:55:11', '2026-03-04 03:00:12'),
(50, 'Rollbag Big', 'ING-044', NULL, 'Packaging Materials', 'pcs', 100.00, 20.00, 4.00, 100.00, 9, NULL, '2026-02-12 03:55:42', '2026-03-04 03:02:57'),
(51, 'Rollbag Small', 'ING-045', NULL, 'Packaging Materials', 'pcs', 100.00, 20.00, 4.00, 100.00, 9, NULL, '2026-02-12 03:57:02', '2026-03-04 03:03:05'),
(52, 'Plastic Shanghai', 'ING-046', NULL, 'Packaging Materials', 'pcs', 100.00, 5.00, 1.00, 100.00, 9, NULL, '2026-02-12 03:57:31', '2026-03-04 03:02:25'),
(53, 'Plastic Skinless', 'ING-047', NULL, 'Packaging Materials', 'pcs', 100.00, 5.00, 1.00, 100.00, 9, NULL, '2026-02-12 03:57:57', '2026-03-04 03:02:32'),
(54, 'Strand Red', 'ING-048', NULL, 'Packaging Materials', 'pcs', 100.00, 10.00, 5.00, 200.00, 9, NULL, '2026-02-12 03:58:20', '2026-03-04 03:03:36'),
(55, 'Strand White', 'ING-049', NULL, 'Packaging Materials', 'pcs', 100.00, 10.00, 5.00, 200.00, 9, NULL, '2026-02-12 03:59:32', '2026-03-04 03:03:43'),
(56, 'Strand Clear', 'ING-050', NULL, 'Packaging Materials', 'pcs', 100.00, 10.00, 5.00, 200.00, 9, NULL, '2026-02-12 04:00:19', '2026-03-04 03:03:21'),
(57, 'Strand Embo', 'ING-051', NULL, 'Packaging Materials', 'pcs', 100.00, 10.00, 5.00, 200.00, 9, NULL, '2026-02-12 04:01:44', '2026-03-04 03:03:29'),
(58, 'Amiflex', 'ING-052', NULL, 'Packaging Materials', 'pcs', 100.00, 2.00, 1.00, 5000.00, 3, NULL, '2026-02-12 04:02:10', '2026-03-04 02:57:54');

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

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `location` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `product_id`, `location`, `quantity`, `created_at`, `updated_at`) VALUES
(76, 39, 'Production Facility', 44.62, '2026-02-18 01:30:07', '2026-03-04 05:23:55'),
(77, 36, 'Production Facility', 44.00, '2026-02-18 01:30:07', '2026-03-04 05:14:18'),
(82, 36, 'Production', 0.00, '2026-02-18 01:35:30', '2026-02-18 01:35:30'),
(83, 36, 'Storage', 0.00, '2026-02-18 01:35:30', '2026-02-18 01:35:30'),
(84, 50, 'Production Facility', 0.00, '2026-02-18 01:58:00', '2026-02-18 04:18:29'),
(85, 49, 'Production Facility', 0.00, '2026-02-18 01:58:00', '2026-02-18 04:18:29'),
(94, 30, 'Production Facility', 10.00, '2026-02-19 03:02:23', '2026-03-04 04:00:49'),
(95, 41, 'Production Facility', 10.00, '2026-02-19 03:02:23', '2026-03-04 04:00:49'),
(99, 30, 'Storage', 0.00, '2026-02-19 03:12:51', NULL),
(100, 34, 'Storage', 0.00, '2026-02-20 07:40:27', NULL),
(101, 34, 'AB Market', 0.00, '2026-02-20 07:40:27', '2026-02-21 04:01:25'),
(103, 34, 'Production Facility', 50.00, '2026-02-21 04:01:20', '2026-03-04 04:56:50'),
(118, 39, 'AB Market', 7.38, '2026-03-04 04:11:50', '2026-03-04 05:23:55'),
(120, 36, 'Commissary', 40.00, '2026-03-04 04:13:24', '2026-03-04 04:59:04'),
(122, 36, 'AB Market', 2.00, '2026-03-04 04:14:57', '2026-03-04 05:14:18'),
(125, 35, 'Production Facility', 39.00, '2026-03-04 04:56:50', '2026-03-04 05:08:09'),
(129, 38, 'Production Facility', 50.00, '2026-03-04 04:56:50', NULL),
(130, 37, 'Production Facility', 100.00, '2026-03-04 04:56:50', NULL),
(132, 39, 'Commissary', 40.00, '2026-03-04 04:58:59', NULL),
(136, 35, 'AB Market', 7.00, '2026-03-04 05:08:09', NULL),
(137, 39, '', -4.00, '2026-03-04 05:09:03', NULL),
(141, 37, '', -12.00, '2026-03-04 05:14:52', NULL),
(142, 37, 'AB Market', 5.00, '2026-03-04 05:14:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_02_21_000000_add_type_to_transfers_table', 1);

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

-- --------------------------------------------------------

--
-- Table structure for table `production_outputs`
--

CREATE TABLE `production_outputs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `production_record_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `production_outputs`
--

INSERT INTO `production_outputs` (`id`, `production_record_id`, `product_id`, `product_name`, `quantity`, `unit`, `created_at`, `updated_at`) VALUES
(4, 30, 39, 'Longgadog Red', 50.00, 'kg', '2026-02-18 01:30:07', '2026-02-18 01:30:07'),
(5, 30, 36, 'Longganisa Red', 50.00, 'kg', '2026-02-18 01:30:07', '2026-02-18 01:30:07'),
(6, 31, 39, 'Longgadog Red', 25.00, 'kg', '2026-02-18 01:32:51', '2026-02-18 01:32:51'),
(7, 31, 36, 'Longganisa Red', 25.00, 'kg', '2026-02-18 01:32:51', '2026-02-18 01:32:51'),
(8, 32, 39, 'Longgadog Red', 250.00, 'kg', '2026-02-18 01:33:56', '2026-02-18 01:33:56'),
(9, 32, 36, 'Longganisa Red', 250.00, 'kg', '2026-02-18 01:33:56', '2026-02-18 01:33:56'),
(10, 33, 50, 'Siomai White', 25.00, 'kg', '2026-02-18 01:58:00', '2026-02-18 01:58:00'),
(11, 33, 49, 'Siomai Yellow', 25.00, 'kg', '2026-02-18 01:58:00', '2026-02-18 01:58:00'),
(12, 39, 50, 'Siomai White', 1.00, 'kg', '2026-02-18 03:04:55', '2026-02-18 03:04:55'),
(13, 39, 49, 'Siomai Yellow', 1.00, 'kg', '2026-02-18 03:04:55', '2026-02-18 03:04:55'),
(14, 40, 50, 'Siomai White', 1.00, 'kg', '2026-02-18 03:05:19', '2026-02-18 03:05:19'),
(15, 40, 49, 'Siomai Yellow', 1.00, 'kg', '2026-02-18 03:05:19', '2026-02-18 03:05:19'),
(16, 41, 50, 'Siomai White', 1.00, 'kg', '2026-02-18 03:22:38', '2026-02-18 03:22:38'),
(17, 41, 49, 'Siomai Yellow', 1.00, 'kg', '2026-02-18 03:22:38', '2026-02-18 03:22:38'),
(18, 42, 50, 'Siomai White', 23.50, 'kg', '2026-02-18 04:18:29', '2026-02-18 04:18:29'),
(19, 42, 49, 'Siomai Yellow', 23.50, 'kg', '2026-02-18 04:18:29', '2026-02-18 04:18:29'),
(20, 44, 30, 'Skinless Plain', 5.00, 'kg', '2026-02-19 03:02:23', '2026-02-19 03:02:23'),
(21, 44, 41, 'Steamed Skinless', 5.00, 'kg', '2026-02-19 03:02:23', '2026-02-19 03:02:23'),
(22, 46, 30, 'Skinless Plain', 5.00, 'kg', '2026-02-19 03:11:47', '2026-02-19 03:11:47'),
(23, 46, 41, 'Steamed Skinless', 5.00, 'kg', '2026-02-19 03:11:47', '2026-02-19 03:11:47'),
(26, 55, 52, 'Test', 1.00, 'kg', '2026-02-24 01:33:48', '2026-02-24 01:33:48'),
(27, 64, 52, 'Test', 1.00, 'kg', '2026-02-24 02:21:01', '2026-02-24 02:21:01'),
(28, 65, 52, 'Test', 1.00, 'kg', '2026-02-24 02:29:13', '2026-02-24 02:29:13'),
(29, 66, 52, 'Test', 2.00, 'kg', '2026-02-24 02:34:29', '2026-02-24 02:34:29'),
(30, 67, 52, 'Test', 1.00, 'kg', '2026-02-24 02:55:35', '2026-02-24 02:55:35'),
(31, 75, 39, 'Longgadog Red', 45.00, 'kg', '2026-03-04 04:00:24', '2026-03-04 04:00:24'),
(32, 75, 36, 'Longganisa Red', 45.00, 'kg', '2026-03-04 04:00:24', '2026-03-04 04:00:24'),
(33, 74, 30, 'Skinless Plain', 10.00, 'kg', '2026-03-04 04:00:49', '2026-03-04 04:00:49'),
(34, 74, 41, 'Steamed Skinless', 10.00, 'kg', '2026-03-04 04:00:49', '2026-03-04 04:00:49'),
(35, 77, 35, 'Bologna Brown', 50.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(36, 77, 34, 'Bologna Red', 50.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(37, 77, 39, 'Longgadog Red', 50.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(38, 77, 36, 'Longganisa Red', 50.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(39, 77, 38, 'Medium Brown', 50.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(40, 77, 37, 'Medium Red', 100.00, 'kg', '2026-03-04 04:56:50', '2026-03-04 04:56:50');

-- --------------------------------------------------------

--
-- Table structure for table `production_records`
--

CREATE TABLE `production_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_mix_category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_mix_category_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `mix_weight` decimal(10,2) DEFAULT NULL,
  `mix_used` decimal(10,2) DEFAULT NULL,
  `raw_packed_items` decimal(10,2) DEFAULT NULL,
  `batch_number` varchar(255) NOT NULL,
  `operator` varchar(255) NOT NULL,
  `initial_ingredients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`initial_ingredients`)),
  `status` enum('in-progress','completed','quality-check') NOT NULL DEFAULT 'in-progress',
  `phase` enum('mixing','packing','cooking','completed') NOT NULL DEFAULT 'mixing',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `mixing_discrepancy` decimal(10,3) DEFAULT NULL,
  `packing_discrepancy` decimal(10,3) DEFAULT NULL,
  `cooking_discrepancy` decimal(10,3) DEFAULT NULL,
  `mixing_discrepancy_reason` text DEFAULT NULL,
  `packing_discrepancy_reason` text DEFAULT NULL,
  `cooking_discrepancy_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `production_records`
--

INSERT INTO `production_records` (`id`, `product_id`, `product_mix_category_id`, `product_mix_category_name`, `quantity`, `mix_weight`, `mix_used`, `raw_packed_items`, `batch_number`, `operator`, `initial_ingredients`, `status`, `phase`, `created_at`, `updated_at`, `mixing_discrepancy`, `packing_discrepancy`, `cooking_discrepancy`, `mixing_discrepancy_reason`, `packing_discrepancy_reason`, `cooking_discrepancy_reason`) VALUES
(77, NULL, 4, 'Longganisa mix', 0.00, 350.00, 350.00, 350.00, 'B001', 'OGAHAYON, NOLI', '[{\"ingredientId\":\"10\",\"quantity\":1},{\"ingredientId\":\"9\",\"quantity\":1},{\"ingredientId\":\"12\",\"quantity\":1},{\"ingredientId\":\"25\",\"quantity\":1},{\"ingredientId\":\"24\",\"quantity\":1},{\"ingredientId\":\"31\",\"quantity\":1},{\"ingredientId\":\"19\",\"quantity\":1},{\"ingredientId\":\"13\",\"quantity\":1},{\"ingredientId\":\"20\",\"quantity\":1},{\"ingredientId\":\"11\",\"quantity\":1},{\"ingredientId\":\"14\",\"quantity\":1},{\"ingredientId\":\"23\",\"quantity\":1},{\"ingredientId\":\"18\",\"quantity\":1}]', 'completed', 'completed', '2026-03-04 04:54:53', '2026-03-04 04:56:50', NULL, NULL, NULL, NULL, NULL, NULL),
(78, NULL, 8, 'Salami Mix', 0.00, 100.00, NULL, 100.00, 'B002', 'System Administrator', '[{\"ingredientId\":\"10\",\"quantity\":1},{\"ingredientId\":\"24\",\"quantity\":1},{\"ingredientId\":\"25\",\"quantity\":0.6},{\"ingredientId\":\"13\",\"quantity\":1},{\"ingredientId\":\"35\",\"quantity\":1},{\"ingredientId\":\"11\",\"quantity\":1},{\"ingredientId\":\"14\",\"quantity\":0.6},{\"ingredientId\":\"23\",\"quantity\":1},{\"ingredientId\":\"17\",\"quantity\":1},{\"ingredientId\":\"15\",\"quantity\":1},{\"ingredientId\":\"16\",\"quantity\":1},{\"ingredientId\":\"36\",\"quantity\":1}]', 'in-progress', 'cooking', '2026-03-04 08:28:51', '2026-03-04 08:30:49', NULL, NULL, NULL, NULL, NULL, NULL),
(79, NULL, 8, 'Salami Mix', 0.00, 100.00, NULL, 100.00, 'B003', 'test', NULL, 'in-progress', 'cooking', '2026-03-04 08:29:45', '2026-03-04 08:30:43', NULL, NULL, NULL, NULL, NULL, NULL),
(80, NULL, 7, 'GULAY MIX', 0.00, 100.00, NULL, 50.00, 'B004', 'System Administrator', '[{\"ingredientId\":\"10\",\"quantity\":1},{\"ingredientId\":\"27\",\"quantity\":1},{\"ingredientId\":\"28\",\"quantity\":1},{\"ingredientId\":\"30\",\"quantity\":1},{\"ingredientId\":\"29\",\"quantity\":1},{\"ingredientId\":\"31\",\"quantity\":1},{\"ingredientId\":\"12\",\"quantity\":1},{\"ingredientId\":\"25\",\"quantity\":1},{\"ingredientId\":\"24\",\"quantity\":1},{\"ingredientId\":\"19\",\"quantity\":1},{\"ingredientId\":\"20\",\"quantity\":1},{\"ingredientId\":\"11\",\"quantity\":1},{\"ingredientId\":\"14\",\"quantity\":1},{\"ingredientId\":\"23\",\"quantity\":1},{\"ingredientId\":\"18\",\"quantity\":1}]', 'in-progress', 'cooking', '2026-03-06 07:57:29', '2026-03-06 07:58:03', -85.000, 50.000, NULL, NULL, NULL, NULL),
(81, NULL, 9, 'SQUARE HAM MIX', 0.00, 100.00, NULL, 50.00, 'B005', 'System Administrator', '[{\"ingredientId\":\"10\",\"quantity\":1},{\"ingredientId\":\"25\",\"quantity\":1},{\"ingredientId\":\"24\",\"quantity\":1},{\"ingredientId\":\"13\",\"quantity\":1},{\"ingredientId\":\"11\",\"quantity\":1},{\"ingredientId\":\"14\",\"quantity\":1},{\"ingredientId\":\"23\",\"quantity\":1},{\"ingredientId\":\"17\",\"quantity\":1},{\"ingredientId\":\"15\",\"quantity\":1},{\"ingredientId\":\"16\",\"quantity\":1},{\"ingredientId\":\"36\",\"quantity\":1}]', 'in-progress', 'cooking', '2026-03-06 08:04:39', '2026-03-06 08:06:10', -89.000, 50.000, NULL, NULL, 'test', NULL);

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
  `min_stock_level` decimal(10,2) DEFAULT 0.00,
  `reorder_point` decimal(10,2) DEFAULT 0.00,
  `reorder_quantity` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `discountable` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`, `price`, `unit`, `image`, `min_stock_level`, `reorder_point`, `reorder_quantity`, `created_at`, `updated_at`, `discountable`) VALUES
(28, 'Shanghai', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:28:25', '2026-02-12 06:28:25', 1),
(30, 'Skinless Plain', 14, 115.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:30:37', '2026-02-12 06:30:37', 1),
(34, 'Bologna Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:33:43', '2026-02-12 06:33:43', 1),
(35, 'Bologna Brown', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:34:18', '2026-02-15 11:28:46', 1),
(36, 'Longganisa Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:34:52', '2026-02-12 06:34:52', 1),
(37, 'Medium Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:35:28', '2026-02-12 06:35:28', 1),
(38, 'Medium Brown', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:35:51', '2026-02-12 06:35:51', 1),
(39, 'Longgadog Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:36:27', '2026-02-12 06:36:27', 1),
(41, 'Steamed Skinless', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:37:28', '2026-02-12 06:37:28', 1),
(42, 'Cheesedog', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:37:50', '2026-02-12 06:37:50', 1),
(44, 'Rolled Ham', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:39:51', '2026-02-12 06:39:51', 1),
(47, 'Plastic Embotido', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:41:53', '2026-03-05 09:50:35', 1),
(49, 'Siomai Yellow', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 09:12:23', '2026-02-12 09:12:23', 1),
(50, 'Siomai White', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 10:09:59', '2026-02-12 10:09:59', 1),
(53, 'Ballham 1kg', 14, 0.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 04:57:08', '2026-03-05 09:50:39', 1),
(54, 'Ballham 500g', 16, 65.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:09:21', '2026-03-04 05:09:21', 1),
(55, 'Longgadog Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:11:29', '2026-03-04 05:11:29', 1),
(56, 'Chicken Nuggets', 16, 140.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:14:11', '2026-03-04 05:14:11', 1),
(57, 'Meatballs', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:14:39', '2026-03-04 05:14:39', 1),
(58, 'Longganisa Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:15:14', '2026-03-04 05:15:14', 1),
(59, 'Square Ham', 16, 150.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:16:30', '2026-03-04 05:16:30', 1),
(60, 'Plastic/dulo', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:17:24', '2026-03-04 05:17:24', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product_default_ingredients`
--

CREATE TABLE `product_default_ingredients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `ingredient_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_default_ingredients`
--

INSERT INTO `product_default_ingredients` (`id`, `product_id`, `ingredient_id`, `quantity`, `created_at`, `updated_at`) VALUES
(18, 49, 8, 10.00, '2026-02-12 09:31:02', '2026-02-12 09:31:02'),
(19, 30, 25, 1.00, '2026-02-12 09:31:10', '2026-02-12 09:31:10');

-- --------------------------------------------------------

--
-- Table structure for table `product_mix_categories`
--

CREATE TABLE `product_mix_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_ids` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_mix_categories`
--

INSERT INTO `product_mix_categories` (`id`, `name`, `description`, `product_ids`, `created_at`, `updated_at`) VALUES
(4, 'LONGGANISA MIX', '', NULL, '2026-02-18 01:22:11', '2026-03-04 12:57:39'),
(6, 'SKINLESS MIX', '', NULL, '2026-02-19 02:59:08', '2026-03-04 12:58:12'),
(7, 'GULAY MIX', '', NULL, '2026-02-19 03:05:05', '2026-03-04 12:57:21'),
(8, 'SALAMI MIX', '', NULL, '2026-02-20 07:35:12', '2026-03-04 12:57:56'),
(9, 'SQUARE HAM MIX', '', NULL, '2026-02-20 07:35:21', '2026-03-04 12:58:46'),
(10, 'BALLHAM MIX', '', NULL, '2026-02-20 07:35:36', '2026-03-04 12:56:53');

-- --------------------------------------------------------

--
-- Table structure for table `product_mix_category_default_ingredients`
--

CREATE TABLE `product_mix_category_default_ingredients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_category_id` bigint(20) UNSIGNED NOT NULL,
  `ingredient_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_mix_category_default_ingredients`
--

INSERT INTO `product_mix_category_default_ingredients` (`id`, `product_mix_category_id`, `ingredient_id`, `quantity`, `created_at`, `updated_at`) VALUES
(1, 1, 39, NULL, '2026-02-16 04:26:38', '2026-02-16 04:26:38'),
(2, 2, 59, NULL, '2026-02-16 04:26:45', '2026-02-16 04:26:45'),
(3, 3, 32, NULL, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(4, 3, 51, NULL, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(5, 3, 55, NULL, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(15, 5, 27, NULL, '2026-02-18 01:54:47', '2026-02-18 01:54:47'),
(16, 5, 35, NULL, '2026-02-18 01:54:47', '2026-02-18 01:54:47'),
(30, 11, 39, NULL, '2026-02-23 08:34:07', '2026-02-23 08:34:07'),
(367, 10, 10, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(368, 10, 25, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(369, 10, 24, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(370, 10, 13, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(371, 10, 11, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(372, 10, 14, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(373, 10, 23, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(374, 10, 17, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(375, 10, 15, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(376, 10, 16, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(377, 10, 36, NULL, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(378, 7, 10, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(379, 7, 27, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(380, 7, 28, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(381, 7, 30, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(382, 7, 29, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(383, 7, 31, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(384, 7, 12, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(385, 7, 25, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(386, 7, 24, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(387, 7, 19, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(388, 7, 20, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(389, 7, 11, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(390, 7, 14, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(391, 7, 23, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(392, 7, 18, NULL, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(393, 4, 10, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(394, 4, 9, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(395, 4, 12, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(396, 4, 25, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(397, 4, 24, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(398, 4, 31, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(399, 4, 19, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(400, 4, 13, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(401, 4, 20, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(402, 4, 11, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(403, 4, 14, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(404, 4, 23, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(405, 4, 18, NULL, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(406, 8, 10, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(407, 8, 24, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(408, 8, 25, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(409, 8, 13, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(410, 8, 35, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(411, 8, 11, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(412, 8, 14, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(413, 8, 23, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(414, 8, 17, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(415, 8, 15, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(416, 8, 16, NULL, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(417, 8, 36, NULL, '2026-03-04 12:57:57', '2026-03-04 12:57:57'),
(418, 6, 10, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(419, 6, 9, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(420, 6, 12, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(421, 6, 25, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(422, 6, 24, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(423, 6, 31, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(424, 6, 19, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(425, 6, 20, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(426, 6, 13, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(427, 6, 11, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(428, 6, 14, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(429, 6, 23, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(430, 6, 18, NULL, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(431, 9, 10, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(432, 9, 25, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(433, 9, 24, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(434, 9, 13, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(435, 9, 11, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(436, 9, 14, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(437, 9, 23, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(438, 9, 17, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(439, 9, 15, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(440, 9, 16, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(441, 9, 36, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46');

-- --------------------------------------------------------

--
-- Table structure for table `product_mix_inventory`
--

CREATE TABLE `product_mix_inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_category_id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_name` varchar(255) DEFAULT NULL,
  `weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `production_record_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_mix_inventory`
--

INSERT INTO `product_mix_inventory` (`id`, `product_mix_category_id`, `product_mix_name`, `weight`, `unit`, `stock`, `cost`, `production_record_id`, `created_at`, `updated_at`) VALUES
(8, 4, 'Longganisa Box', 200.00, 'kg', 0.00, 90.00, 29, '2026-02-18 01:23:15', '2026-03-04 04:56:31'),
(9, 4, 'Longganisa Box', 250.00, 'kg', 150.00, 90.00, 30, '2026-02-18 01:29:11', '2026-02-18 01:30:07'),
(10, 4, 'Longganisa Box', 100.00, 'kg', 50.00, 90.00, 31, '2026-02-18 01:32:15', '2026-02-18 01:32:51'),
(11, 4, 'Longganisa Box', 100.00, 'kg', -400.00, 90.00, 32, '2026-02-18 01:33:29', '2026-02-18 01:33:56'),
(12, 5, 'Siomai', 200.00, 'kg', 150.00, 20.00, 33, '2026-02-18 01:56:24', '2026-02-18 01:58:00'),
(13, 5, 'Siomai', 1.00, 'kg', -49.00, 20.00, 34, '2026-02-18 02:43:14', '2026-02-18 04:18:29'),
(14, 6, 'Skinless Mix', 20.00, 'kg', 0.00, 60.00, 43, '2026-02-19 03:00:58', '2026-03-04 03:47:53'),
(22, 10, 'Ballham Mix', 200.00, 'kg', 200.00, 0.00, 68, '2026-03-04 03:25:01', '2026-03-04 03:25:01'),
(23, 6, 'Skinless Mix', 200.00, 'kg', 80.00, 0.00, 72, '2026-03-04 03:46:18', '2026-03-04 03:47:07'),
(24, 4, 'Longganisa mix', 100.00, 'kg', 100.00, 0.00, 70, '2026-03-04 03:50:57', '2026-03-04 03:50:57'),
(25, 7, 'Gulay Mix', 200.00, 'kg', 0.00, 0.00, 69, '2026-03-04 03:51:24', '2026-03-06 07:58:03'),
(26, 4, 'Longganisa mix', 350.00, 'kg', 350.00, 0.00, 77, '2026-03-04 04:56:24', '2026-03-04 04:56:24'),
(27, 8, 'Salami Mix', 100.00, 'kg', 0.00, 0.00, 78, '2026-03-04 08:29:09', '2026-03-04 08:30:49'),
(28, 7, 'GULAY MIX', 100.00, 'kg', 100.00, 0.00, 80, '2026-03-06 07:57:35', '2026-03-06 07:57:35'),
(29, 9, 'SQUARE HAM MIX', 100.00, 'kg', 0.00, 0.00, 81, '2026-03-06 08:05:36', '2026-03-06 08:06:10');

-- --------------------------------------------------------

--
-- Table structure for table `product_mix_items`
--

CREATE TABLE `product_mix_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_category_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_mix_items`
--

INSERT INTO `product_mix_items` (`id`, `product_mix_category_id`, `product_id`, `created_at`, `updated_at`) VALUES
(17, 1, 51, '2026-02-16 04:16:44', '2026-02-16 04:16:44'),
(18, 2, 40, '2026-02-16 04:16:54', '2026-02-16 04:16:54'),
(19, 3, 35, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(20, 3, 34, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(21, 3, 42, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(22, 3, 40, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(23, 3, 33, '2026-02-18 01:15:09', '2026-02-18 01:15:09'),
(25, 4, 39, '2026-02-18 01:22:12', '2026-02-18 01:22:12'),
(26, 5, 50, '2026-02-18 01:54:47', '2026-02-18 01:54:47'),
(27, 5, 49, '2026-02-18 01:54:47', '2026-02-18 01:54:47'),
(28, 6, 30, '2026-02-19 02:59:08', '2026-02-19 02:59:08'),
(29, 6, 41, '2026-02-19 02:59:08', '2026-02-19 02:59:08'),
(30, 7, 50, '2026-02-19 03:05:05', '2026-02-19 03:05:05'),
(31, 7, 49, '2026-02-19 03:05:05', '2026-02-19 03:05:05'),
(32, 11, 52, '2026-02-23 08:34:07', '2026-02-23 08:34:07'),
(34, 4, 36, '2026-02-24 04:48:06', '2026-02-24 04:48:06'),
(35, 8, 42, '2026-03-04 03:41:16', '2026-03-04 03:41:16'),
(36, 8, 44, '2026-03-04 03:41:22', '2026-03-04 03:41:22'),
(37, 4, 35, '2026-03-04 04:52:27', '2026-03-04 04:52:27'),
(38, 4, 34, '2026-03-04 04:52:28', '2026-03-04 04:52:28'),
(39, 4, 38, '2026-03-04 04:53:22', '2026-03-04 04:53:22'),
(40, 4, 37, '2026-03-04 04:53:23', '2026-03-04 04:53:23'),
(41, 10, 53, '2026-03-04 05:19:36', '2026-03-04 05:19:36'),
(42, 10, 54, '2026-03-04 05:19:37', '2026-03-04 05:19:37'),
(43, 7, 28, '2026-03-04 05:20:21', '2026-03-04 05:20:21'),
(44, 7, 47, '2026-03-04 05:20:30', '2026-03-04 05:20:30'),
(45, 7, 57, '2026-03-04 05:20:35', '2026-03-04 05:20:35'),
(46, 4, 55, '2026-03-04 05:21:10', '2026-03-04 05:21:10'),
(47, 4, 58, '2026-03-04 05:21:20', '2026-03-04 05:21:20'),
(48, 4, 41, '2026-03-04 05:21:48', '2026-03-04 05:21:48'),
(49, 9, 59, '2026-03-04 05:24:09', '2026-03-04 05:24:09');

-- --------------------------------------------------------

--
-- Table structure for table `raw_product_inventory`
--

CREATE TABLE `raw_product_inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_category_id` bigint(20) UNSIGNED NOT NULL,
  `product_mix_name` varchar(255) DEFAULT NULL,
  `weight` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `production_record_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raw_product_inventory`
--

INSERT INTO `raw_product_inventory` (`id`, `product_mix_category_id`, `product_mix_name`, `weight`, `unit`, `stock`, `cost`, `production_record_id`, `created_at`, `updated_at`) VALUES
(9, 6, 'Skinless Mix', 120.50, 'kg', 0.50, 0.00, 73, '2026-03-04 03:47:53', '2026-03-04 04:00:49'),
(10, 4, 'Longganisa mix', 90.00, 'kg', 0.00, 0.00, 75, '2026-03-04 03:52:18', '2026-03-04 04:00:24'),
(11, 7, 'Gulay Mix', 155.00, 'kg', 155.00, 0.00, 76, '2026-03-04 04:08:45', '2026-03-04 04:08:45'),
(12, 4, 'Longganisa mix', 350.00, 'kg', 0.00, 130.00, 77, '2026-03-04 04:56:31', '2026-03-04 04:56:50'),
(13, 8, 'Salami Mix', 100.00, 'kg', 100.00, 0.00, 79, '2026-03-04 08:30:43', '2026-03-04 08:30:43'),
(14, 8, 'Salami Mix', 100.00, 'kg', 100.00, 112.00, 78, '2026-03-04 08:30:49', '2026-03-04 08:30:49'),
(15, 7, 'GULAY MIX', 50.00, 'kg', 50.00, 150.00, 80, '2026-03-06 07:58:03', '2026-03-06 07:58:03'),
(16, 9, 'SQUARE HAM MIX', 50.00, 'kg', 50.00, 110.00, 81, '2026-03-06 08:06:10', '2026-03-06 08:06:10');

-- --------------------------------------------------------

--
-- Table structure for table `report_entries`
--

CREATE TABLE `report_entries` (
  `id` bigint(20) NOT NULL,
  `report_date` date NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 0,
  `cashier_id` int(11) NOT NULL DEFAULT 0,
  `product_id` int(11) NOT NULL,
  `wgs` decimal(10,3) NOT NULL DEFAULT 0.000,
  `add_qty` decimal(10,3) NOT NULL DEFAULT 0.000,
  `return_qty` decimal(10,3) NOT NULL DEFAULT 0.000,
  `scrap_bo` decimal(10,3) NOT NULL DEFAULT 0.000,
  `turn_over` decimal(10,3) NOT NULL DEFAULT 0.000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reseco_amount` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `report_entries`
--

INSERT INTO `report_entries` (`id`, `report_date`, `store_id`, `cashier_id`, `product_id`, `wgs`, `add_qty`, `return_qty`, `scrap_bo`, `turn_over`, `created_at`, `updated_at`, `reseco_amount`) VALUES
(1, '2026-03-05', 0, 0, 53, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(2, '2026-03-05', 0, 0, 54, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(3, '2026-03-05', 0, 0, 35, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(4, '2026-03-05', 0, 0, 34, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(5, '2026-03-05', 0, 0, 42, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(6, '2026-03-05', 0, 0, 56, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(7, '2026-03-05', 0, 0, 55, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(8, '2026-03-05', 0, 0, 39, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(9, '2026-03-05', 0, 0, 58, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(10, '2026-03-05', 0, 0, 36, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(11, '2026-03-05', 0, 0, 57, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(12, '2026-03-05', 0, 0, 38, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(13, '2026-03-05', 0, 0, 37, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(14, '2026-03-05', 0, 0, 47, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(15, '2026-03-05', 0, 0, 60, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(16, '2026-03-05', 0, 0, 44, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(17, '2026-03-05', 0, 0, 28, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(18, '2026-03-05', 0, 0, 50, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(19, '2026-03-05', 0, 0, 49, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(20, '2026-03-05', 0, 0, 30, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(21, '2026-03-05', 0, 0, 59, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00),
(22, '2026-03-05', 0, 0, 41, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-05 10:20:52', '2026-03-05 10:56:12', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `report_headers`
--

CREATE TABLE `report_headers` (
  `id` bigint(20) NOT NULL,
  `report_date` date NOT NULL,
  `store_id` int(11) NOT NULL DEFAULT 0,
  `cashier_id` int(11) NOT NULL DEFAULT 0,
  `reporter_name` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `denominations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `cash_out_rows` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `computation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `report_headers`
--

INSERT INTO `report_headers` (`id`, `report_date`, `store_id`, `cashier_id`, `reporter_name`, `remarks`, `created_at`, `updated_at`, `denominations`, `cash_out_rows`, `computation`) VALUES
(1, '2026-03-05', 0, 0, 'System Administrator', '', '2026-03-05 10:20:52', '2026-03-05 10:56:12', '{\"0\":0,\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0,\"6\":0,\"7\":0,\"8\":0,\"9\":0,\"10\":0,\"11\":0,\"12\":0,\"13\":0,\"14\":0,\"15\":0,\"16\":0,\"17\":0,\"18\":0,\"19\":0,\"20\":0,\"21\":0,\"22\":0,\"23\":0,\"24\":0,\"25\":0,\"26\":0,\"27\":0,\"50\":0,\"100\":0,\"200\":0,\"500\":0,\"1000\":0,\"5000\":0}', '[]', '{\"totalSales\":0,\"cashOut\":0,\"grossSales\":0,\"over\":0}');

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
  `wholesale_discount` decimal(10,2) NOT NULL DEFAULT 0.00,
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

INSERT INTO `sales` (`id`, `transaction_id`, `user_id`, `store_id`, `customer`, `items`, `subtotal`, `global_discount`, `wholesale_discount`, `tax`, `total`, `payment_method`, `sales_type`, `created_at`, `updated_at`) VALUES
(22, '1772597935553', 22, 4, '{\"name\":\"Walk-in Customer\"}', '[{\"productId\":\"39\",\"name\":\"Longgadog Red\",\"price\":650,\"quantity\":1,\"weight\":5,\"discount\":0}]', 650.00, 0.00, 0.00, 0.00, 650.00, 'Mobile Payment', 'retail', '2026-03-04 04:18:54', '2026-03-04 04:18:54'),
(23, '1772601423591', 22, 4, '{\"name\":\"Walk-in Customer\"}', '[{\"productId\":\"35\",\"name\":\"Bologna Brown\",\"price\":520,\"quantity\":1,\"weight\":4,\"discount\":0},{\"productId\":\"39\",\"name\":\"Longgadog Red\",\"price\":260,\"quantity\":1,\"weight\":2,\"discount\":0},{\"productId\":\"36\",\"name\":\"Longganisa Red\",\"price\":1170,\"quantity\":1,\"weight\":9,\"discount\":0},{\"productId\":\"37\",\"name\":\"Medium Red\",\"price\":910,\"quantity\":1,\"weight\":7,\"discount\":0}]', 2860.00, 0.00, 0.00, 0.00, 2860.00, 'Cash', 'retail', '2026-03-04 05:17:02', '2026-03-04 05:17:02');

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

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `discount`, `total`, `created_at`) VALUES
(1, 2, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 04:06:46'),
(2, 3, '4', 5.00, 120.00, 1.00, 594.00, '2026-02-07 04:15:30'),
(3, 4, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 04:17:30'),
(4, 5, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 04:21:27'),
(5, 6, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 04:22:25'),
(6, 7, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 06:06:57'),
(7, 8, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 06:16:01'),
(8, 9, '3', 5.00, 180.00, 0.00, 900.00, '2026-02-07 06:21:24'),
(9, 10, '3', 5.00, 180.00, 0.00, 900.00, '2026-02-07 06:36:07'),
(10, 11, '4', 5.00, 120.00, 0.00, 600.00, '2026-02-07 06:46:18'),
(11, 12, '4', 1.00, 120.00, 0.00, 120.00, '2026-02-08 00:39:31'),
(12, 13, '27', 5.00, 123.00, 0.00, 615.00, '2026-02-11 18:35:26'),
(13, 14, '27', 5.00, 123.00, 0.00, 615.00, '2026-02-11 18:46:50'),
(14, 15, '27', 1.00, 123.00, 0.00, 123.00, '2026-02-11 19:15:14'),
(15, 16, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 02:50:42'),
(16, 17, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 02:53:43'),
(17, 18, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 02:56:43'),
(18, 19, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 04:36:54'),
(19, 20, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 04:39:14'),
(20, 21, '51', 1.00, 184.50, 0.00, 184.50, '2026-02-13 04:42:28'),
(21, 22, '39', 1.00, 650.00, 0.00, 650.00, '2026-03-04 04:18:54'),
(22, 23, '35', 1.00, 520.00, 0.00, 520.00, '2026-03-04 05:17:02'),
(23, 23, '39', 1.00, 260.00, 0.00, 260.00, '2026-03-04 05:17:02'),
(24, 23, '36', 1.00, 1170.00, 0.00, 1170.00, '2026-03-04 05:17:02'),
(25, 23, '37', 1.00, 910.00, 0.00, 910.00, '2026-03-04 05:17:02');

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
(14, 7, 'Molo White', 'ING-001', 'add', 90.00, 0.00, 90.00, 'Pcs', 'Stock', 1, 'System Administrator', '162.158.186.133', '2026-02-01 21:22:19', '2026-02-01 21:22:19'),
(16, 46, '10X14', 'ING-040', 'add', 1.00, 0.00, 1.00, 'pcs', 'Restock', 1, 'System Administrator', '172.64.217.106', '2026-02-12 06:02:59', '2026-02-12 06:02:59'),
(17, 7, 'Molo White', 'ING-001', 'add', 100.00, 0.00, 100.00, 'Pcs', 'Stock', 1, 'System Administrator', '172.71.214.31', '2026-02-12 09:09:14', '2026-02-12 09:09:14'),
(18, 8, 'Molo Yellow', 'ING-002', 'add', 100.00, 0.00, 100.00, 'Pcs', 'Stock', 1, 'System Administrator', '172.71.214.31', '2026-02-12 09:09:22', '2026-02-12 09:09:22'),
(20, 19, 'Alexander', 'ING-013', 'add', 3.00, -3.00, 0.00, 'L', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:04', '2026-02-18 02:29:04'),
(21, 27, 'Carrots', 'ING-021', 'add', 1.00, -1.00, 0.00, 'kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:09', '2026-02-18 02:29:09'),
(22, 9, 'CFAT', 'ING-003', 'add', 3.00, -3.00, 0.00, 'Kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:14', '2026-02-18 02:29:14'),
(23, 35, 'Cheese', 'ING-029', 'add', 1.00, -1.00, 0.00, 'pcs', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:19', '2026-02-18 02:29:19'),
(24, 25, 'Cornstarch', 'ING-019', 'add', 3.00, -3.00, 0.00, 'kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:22', '2026-02-18 02:29:22'),
(25, 31, 'Garlic', 'ING-025', 'add', 3.00, -3.00, 0.00, 'kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:27', '2026-02-18 02:29:27'),
(26, 20, 'Knorr Liquid Seasoning', 'ING-014', 'add', 3.00, -3.00, 0.00, 'L', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:31', '2026-02-18 02:29:31'),
(27, 10, 'MDM', 'ING-004', 'add', 3.00, -3.00, 0.00, 'Box', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:37', '2026-02-18 02:29:37'),
(28, 13, 'Pine Apple Juice', 'ING-007', 'add', 3.00, -3.00, 0.00, 'L', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:29:43', '2026-02-18 02:29:43'),
(29, 24, 'Sugar', 'ING-018', 'add', 3.00, -3.00, 0.00, 'kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:30:07', '2026-02-18 02:30:07'),
(30, 12, 'TVP Fine', 'ING-006', 'add', 3.00, -3.00, 0.00, 'Kg', 'qwe', 1, 'System Administrator', '162.159.98.174', '2026-02-18 02:30:11', '2026-02-18 02:30:11'),
(31, 27, 'Carrots', 'ING-021', 'add', 1.00, 0.00, 1.00, 'kg', 'qwe', 1, 'System Administrator', '162.159.98.175', '2026-02-18 02:42:53', '2026-02-18 02:42:53'),
(32, 35, 'Cheese', 'ING-029', 'add', 1.00, 0.00, 1.00, 'pcs', 'qwe', 1, 'System Administrator', '162.159.98.175', '2026-02-18 02:42:58', '2026-02-18 02:42:58'),
(33, 9, 'CFAT', 'ING-003', 'add', 100.00, 0.00, 100.00, 'Kg', 'Test', 1, 'System Administrator', '162.158.178.65', '2026-02-19 03:00:08', '2026-02-19 03:00:08'),
(34, 10, 'MDM', 'ING-004', 'add', 100.00, 0.00, 100.00, 'Box', 'Test', 1, 'System Administrator', '162.158.178.65', '2026-02-19 03:00:16', '2026-02-19 03:00:16'),
(35, 46, '10X14', 'ING-040', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:56:30', '2026-03-04 02:56:30'),
(36, 47, '12X18', 'ING-041', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:56:41', '2026-03-04 02:56:41'),
(37, 42, '6X10', 'ING-036', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:56:50', '2026-03-04 02:56:50'),
(38, 41, '6X8', 'ING-035', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:56:58', '2026-03-04 02:56:58'),
(39, 45, '8X11', 'ING-039', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:57:07', '2026-03-04 02:57:07'),
(40, 11, 'Accord', 'ING-005', 'add', 100.00, 0.00, 100.00, 'Kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:57:19', '2026-03-04 02:57:19'),
(41, 19, 'Alexander', 'ING-013', 'add', 100.00, 0.00, 100.00, 'L', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:57:33', '2026-03-04 02:57:33'),
(42, 58, 'Amiflex', 'ING-052', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:57:53', '2026-03-04 02:57:53'),
(43, 22, 'Asin', 'ING-016', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:07', '2026-03-04 02:58:07'),
(44, 27, 'Carrots', 'ING-021', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:15', '2026-03-04 02:58:15'),
(45, 30, 'Celery', 'ING-024', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:23', '2026-03-04 02:58:23'),
(46, 9, 'CFAT', 'ING-003', 'add', 100.00, 0.00, 100.00, 'Kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:32', '2026-03-04 02:58:32'),
(47, 35, 'Cheese', 'ING-029', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:39', '2026-03-04 02:58:39'),
(48, 25, 'Cornstarch', 'ING-019', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:58:48', '2026-03-04 02:58:48'),
(49, 37, 'Curry Powder', 'ING-031', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:03', '2026-03-04 02:59:03'),
(50, 31, 'Garlic', 'ING-025', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:10', '2026-03-04 02:59:10'),
(51, 40, 'Gas', 'ING-034', 'add', 100.00, 0.00, 100.00, 'L', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:20', '2026-03-04 02:59:20'),
(52, 26, 'Giling-fat', 'ING-020', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:29', '2026-03-04 02:59:29'),
(53, 16, 'Ham Flavor', 'ING-010', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:37', '2026-03-04 02:59:37'),
(54, 15, 'Ham Spice', 'ING-009', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:45', '2026-03-04 02:59:45'),
(55, 34, 'hangs-isaw', 'ING-028', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 02:59:56', '2026-03-04 02:59:56'),
(56, 20, 'Knorr Liquid Seasoning', 'ING-014', 'add', 100.00, 0.00, 100.00, 'L', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:00:04', '2026-03-04 03:00:04'),
(57, 49, 'Large', 'ING-043', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:00:11', '2026-03-04 03:00:11'),
(58, 33, 'Lumpia Wrapper', 'ING-027', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:00:50', '2026-03-04 03:00:50'),
(59, 10, 'MDM', 'ING-004', 'add', 100.00, 0.00, 100.00, 'Box', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:00:59', '2026-03-04 03:00:59'),
(60, 48, 'Medium', 'ING-042', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:07', '2026-03-04 03:01:07'),
(61, 7, 'Molo White', 'ING-001', 'add', 100.00, 0.00, 100.00, 'Pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:15', '2026-03-04 03:01:15'),
(62, 8, 'Molo Yellow', 'ING-002', 'add', 100.00, 0.00, 100.00, 'Pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:23', '2026-03-04 03:01:23'),
(63, 23, 'MSG-Vetsin', 'ING-017', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:30', '2026-03-04 03:01:30'),
(64, 36, 'Multiblend', 'ING-030', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:44', '2026-03-04 03:01:44'),
(65, 28, 'Onion', 'ING-022', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:01:53', '2026-03-04 03:01:53'),
(66, 43, 'PE 6X8', 'ING-037', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:01', '2026-03-04 03:02:01'),
(67, 44, 'PE X10', 'ING-038', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:09', '2026-03-04 03:02:09'),
(68, 13, 'Pine Apple Juice', 'ING-007', 'add', 100.00, 0.00, 100.00, 'L', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:17', '2026-03-04 03:02:17'),
(69, 52, 'Plastic Shanghai', 'ING-046', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:24', '2026-03-04 03:02:24'),
(70, 53, 'Plastic Skinless', 'ING-047', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:31', '2026-03-04 03:02:31'),
(71, 14, 'Praque Powder', 'ING-008', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '172.70.214.43', '2026-03-04 03:02:40', '2026-03-04 03:02:40'),
(72, 29, 'Redbell Pepper', 'ING-023', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:02:49', '2026-03-04 03:02:49'),
(73, 50, 'Rollbag Big', 'ING-044', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:02:57', '2026-03-04 03:02:57'),
(74, 51, 'Rollbag Small', 'ING-045', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:04', '2026-03-04 03:03:04'),
(75, 18, 'Sodium', 'ING-012', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:11', '2026-03-04 03:03:11'),
(76, 56, 'Strand Clear', 'ING-050', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:20', '2026-03-04 03:03:20'),
(77, 57, 'Strand Embo', 'ING-051', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:29', '2026-03-04 03:03:29'),
(78, 54, 'Strand Red', 'ING-048', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:35', '2026-03-04 03:03:35'),
(79, 55, 'Strand White', 'ING-049', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:43', '2026-03-04 03:03:43'),
(80, 24, 'Sugar', 'ING-018', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:50', '2026-03-04 03:03:50'),
(81, 32, 'Tali', 'ING-026', 'add', 100.00, 0.00, 100.00, 'pcs', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:03:59', '2026-03-04 03:03:59'),
(82, 12, 'TVP Fine', 'ING-006', 'add', 100.00, 0.00, 100.00, 'Kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:04:06', '2026-03-04 03:04:06'),
(83, 21, 'Tvp Gem', 'ING-015', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:04:13', '2026-03-04 03:04:13'),
(84, 17, 'Vitamin C', 'ING-011', 'add', 100.00, 0.00, 100.00, 'kg', 'restock', 1, 'System Administrator', '104.23.251.175', '2026-03-04 03:04:22', '2026-03-04 03:04:22'),
(85, 25, 'Cornstarch', 'ING-019', 'add', 300.00, 80.00, 380.00, 'kg', 'Restock', 1, 'System Administrator', '172.68.164.16', '2026-03-04 03:28:47', '2026-03-04 03:28:47'),
(86, 10, 'MDM', 'ING-004', 'add', 1000.00, 0.00, 1000.00, 'Box', 'Restock', 1, 'System Administrator', '172.68.164.16', '2026-03-04 03:29:57', '2026-03-04 03:29:57'),
(87, 24, 'Sugar', 'ING-018', 'add', 1000.00, 70.00, 1070.00, 'kg', 'Restock', 1, 'System Administrator', '172.68.164.16', '2026-03-04 03:30:39', '2026-03-04 03:30:39'),
(88, 12, 'TVP Fine', 'ING-006', 'add', 200.00, 100.00, 300.00, 'Kg', 'Restock', 1, 'System Administrator', '172.68.164.16', '2026-03-04 03:30:56', '2026-03-04 03:30:56'),
(89, 10, 'MDM', 'ING-004', 'add', 1000.00, 0.00, 1000.00, 'Kg', 'Restock', 1, 'System Administrator', '162.158.90.173', '2026-03-04 03:33:53', '2026-03-04 03:33:53');

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
(1, 'Amparo Store', 'Main Branch Location', 'Store Manager', '09123456789', 'store@lztmeat.com', 'active', '2026-01-30 10:56:01', '2026-01-30 10:56:01'),
(4, 'AB Market', 'Novaliches', 'Reyrieza', '09216926051', 'mds.mdssolutions011@gmail.com', 'active', '2026-02-01 21:43:24', '2026-02-01 21:43:24'),
(5, 'Susano Market', 'Novaliches', 'Mark David Sioson', '09216926051', 'mds.mdssolutions011@gmail.com', 'active', '2026-02-03 18:30:26', '2026-02-03 18:30:26'),
(6, 'Commissary', 'Amparo', 'Ms. Bam', '09618824124', 'lztmeat@gmail.com', 'active', '2026-02-03 18:33:10', '2026-03-02 09:04:06');

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
(9, 'Others', 'None', '09216926051', 'mds.mdssolutions011@gmail.com', 'Amparo', '2026-02-03 18:27:46', '2026-02-03 18:27:46'),
(11, 'JMT Aceron Gas', 'joel', '09216926051', 'mds.mdssolutions011@gmail.com', 'Amparo Village Caloocan City', '2026-02-12 03:08:53', '2026-02-12 03:08:53');

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

--
-- Dumping data for table `system_history`
--

INSERT INTO `system_history` (`id`, `action`, `entity`, `entity_id`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
(61, 'User Created', 'User', '17', '{\"name\":\"Mark David Sioson\",\"role\":\"PRODUCTION\",\"username\":\"mark_david_sioson\"}', NULL, '2026-03-01 11:30:50', '2026-03-01 11:30:50'),
(62, 'User Deleted', 'User', '12', '{\"name\":\"Cj\",\"role\":\"POS\"}', NULL, '2026-03-02 01:54:05', '2026-03-02 01:54:05'),
(63, 'User Deleted', 'User', '17', '{\"name\":\"Mark David Sioson\",\"role\":\"PRODUCTION\"}', NULL, '2026-03-02 01:54:08', '2026-03-02 01:54:08'),
(64, 'User Deleted', 'User', '7', '{\"name\":\"Mark Sioson\",\"role\":\"POS\"}', NULL, '2026-03-02 01:54:10', '2026-03-02 01:54:10'),
(65, 'User Deleted', 'User', '9', '{\"name\":\"richard\",\"role\":\"POS\"}', NULL, '2026-03-02 01:54:16', '2026-03-02 01:54:16'),
(66, 'User Deleted', 'User', '8', '{\"name\":\"Wilson\",\"role\":\"PRODUCTION\"}', NULL, '2026-03-02 01:54:21', '2026-03-02 01:54:21'),
(67, 'User Created', 'User', '18', '{\"name\":\"OGAHAYON, NOLI\",\"role\":\"PRODUCTION\",\"username\":\"ogahayon,_noli\"}', NULL, '2026-03-02 08:56:38', '2026-03-02 08:56:38'),
(68, 'Store Updated', 'Store', '6', '{\"name\":\"Commissary\"}', NULL, '2026-03-02 09:04:06', '2026-03-02 09:04:06'),
(69, 'User Updated', 'User', '18', '{\"name\":\"OGAHAYON, NOLI\",\"role\":\"PRODUCTION\"}', NULL, '2026-03-02 09:08:07', '2026-03-02 09:08:07'),
(70, 'User Updated', 'User', '18', '{\"name\":\"OGAHAYON, NOLI\",\"role\":\"PRODUCTION\"}', NULL, '2026-03-02 09:12:13', '2026-03-02 09:12:13'),
(71, 'User Created', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"PRODUCTION\",\"username\":\"mark_sioson\"}', NULL, '2026-03-02 09:13:04', '2026-03-02 09:13:04'),
(72, 'User Updated', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"PRODUCTION\"}', NULL, '2026-03-02 09:13:15', '2026-03-02 09:13:15'),
(73, 'User Updated', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-02 09:19:28', '2026-03-02 09:19:28'),
(74, 'User Updated', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-02 09:20:04', '2026-03-02 09:20:04'),
(75, 'User Updated', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-02 09:20:53', '2026-03-02 09:20:53'),
(76, 'User Created', 'User', '20', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"username\":\"test\"}', NULL, '2026-03-02 09:22:03', '2026-03-02 09:22:03'),
(77, 'User Deleted', 'User', '20', '{\"name\":\"test\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-02 09:39:02', '2026-03-02 09:39:02'),
(78, 'User Created', 'User', '21', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"username\":\"test\"}', NULL, '2026-03-02 09:40:00', '2026-03-02 09:40:00'),
(79, 'User Deleted', 'User', '21', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-02 13:33:49', '2026-03-02 13:33:49'),
(80, 'Product Mix Category Updated', 'ProductMixCategory', '10', '{\"name\":\"Ballham Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-02 13:42:39', '2026-03-02 13:42:39'),
(81, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '10', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-02 13:42:40', '2026-03-02 13:42:40'),
(82, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:50:50', '2026-03-03 00:50:50'),
(83, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":9,\"ingredients\":[\"MDM\",\"Cheese\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:50:51', '2026-03-03 00:50:51'),
(84, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:51:58', '2026-03-03 00:51:58'),
(85, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"Cheese\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:51:58', '2026-03-03 00:51:58'),
(86, 'Product Mix Category Updated', 'ProductMixCategory', '8', '{\"name\":\"Salami Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:54:47', '2026-03-03 00:54:47'),
(87, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '8', '{\"ingredientCount\":12,\"ingredients\":[\"MDM\",\"Sugar\",\"Cornstarch\",\"Pine Apple Juice\",\"Cheese\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:54:48', '2026-03-03 00:54:48'),
(88, 'Product Mix Category Updated', 'ProductMixCategory', '7', '{\"name\":\"Gulay Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:58:07', '2026-03-03 00:58:07'),
(89, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '7', '{\"ingredientCount\":15,\"ingredients\":[\"MDM\",\"Carrots\",\"Onion\",\"Celery\",\"Redbell Pepper\",\"Garlic\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Alexander\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 00:58:07', '2026-03-03 00:58:07'),
(90, 'Product Mix Category Updated', 'ProductMixCategory', '6', '{\"name\":\"Skinless Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:01:26', '2026-03-03 01:01:26'),
(91, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '6', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Knorr Liquid Seasoning\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:01:26', '2026-03-03 01:01:26'),
(92, 'Product Mix Category Updated', 'ProductMixCategory', '9', '{\"name\":\"Square ham Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:03:51', '2026-03-03 01:03:51'),
(93, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '9', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:03:51', '2026-03-03 01:03:51'),
(94, 'Product Mix Category Updated', 'ProductMixCategory', '10', '{\"name\":\"Ballham Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:06:12', '2026-03-03 01:06:12'),
(95, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '10', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:06:13', '2026-03-03 01:06:13'),
(96, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:14:00', '2026-03-03 01:14:00'),
(97, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:14:01', '2026-03-03 01:14:01'),
(98, 'Product Mix Category Updated', 'ProductMixCategory', '8', '{\"name\":\"Salami Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:14:43', '2026-03-03 01:14:43'),
(99, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '8', '{\"ingredientCount\":12,\"ingredients\":[\"MDM\",\"Sugar\",\"Cornstarch\",\"Pine Apple Juice\",\"Cheese\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-03 01:14:44', '2026-03-03 01:14:44'),
(100, 'Inventory Adjustment', 'Ingredient', '46', '{\"ingredient\":\"10X14\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:30', '2026-03-04 02:56:30'),
(101, 'Ingredient Updated', 'Ingredient', '46', '{\"name\":\"10X14\",\"code\":\"ING-040\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:30', '2026-03-04 02:56:30'),
(102, 'Inventory Adjustment', 'Ingredient', '47', '{\"ingredient\":\"12X18\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:41', '2026-03-04 02:56:41'),
(103, 'Ingredient Updated', 'Ingredient', '47', '{\"name\":\"12X18\",\"code\":\"ING-041\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:41', '2026-03-04 02:56:41'),
(104, 'Inventory Adjustment', 'Ingredient', '42', '{\"ingredient\":\"6X10\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:50', '2026-03-04 02:56:50'),
(105, 'Ingredient Updated', 'Ingredient', '42', '{\"name\":\"6X10\",\"code\":\"ING-036\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:50', '2026-03-04 02:56:50'),
(106, 'Inventory Adjustment', 'Ingredient', '41', '{\"ingredient\":\"6X8\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:58', '2026-03-04 02:56:58'),
(107, 'Ingredient Updated', 'Ingredient', '41', '{\"name\":\"6X8\",\"code\":\"ING-035\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:56:59', '2026-03-04 02:56:59'),
(108, 'Inventory Adjustment', 'Ingredient', '45', '{\"ingredient\":\"8X11\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:07', '2026-03-04 02:57:07'),
(109, 'Ingredient Updated', 'Ingredient', '45', '{\"name\":\"8X11\",\"code\":\"ING-039\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:07', '2026-03-04 02:57:07'),
(110, 'Inventory Adjustment', 'Ingredient', '11', '{\"ingredient\":\"Accord\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:19', '2026-03-04 02:57:19'),
(111, 'Ingredient Updated', 'Ingredient', '11', '{\"name\":\"Accord\",\"code\":\"ING-005\",\"unit\":\"Kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:20', '2026-03-04 02:57:20'),
(112, 'Inventory Adjustment', 'Ingredient', '19', '{\"ingredient\":\"Alexander\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:33', '2026-03-04 02:57:33'),
(113, 'Ingredient Updated', 'Ingredient', '19', '{\"name\":\"Alexander\",\"code\":\"ING-013\",\"unit\":\"L\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:34', '2026-03-04 02:57:34'),
(114, 'Inventory Adjustment', 'Ingredient', '58', '{\"ingredient\":\"Amiflex\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:53', '2026-03-04 02:57:53'),
(115, 'Ingredient Updated', 'Ingredient', '58', '{\"name\":\"Amiflex\",\"code\":\"ING-052\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:57:54', '2026-03-04 02:57:54'),
(116, 'Inventory Adjustment', 'Ingredient', '22', '{\"ingredient\":\"Asin\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:07', '2026-03-04 02:58:07'),
(117, 'Ingredient Updated', 'Ingredient', '22', '{\"name\":\"Asin\",\"code\":\"ING-016\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:07', '2026-03-04 02:58:07'),
(118, 'Inventory Adjustment', 'Ingredient', '27', '{\"ingredient\":\"Carrots\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:15', '2026-03-04 02:58:15'),
(119, 'Ingredient Updated', 'Ingredient', '27', '{\"name\":\"Carrots\",\"code\":\"ING-021\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:16', '2026-03-04 02:58:16'),
(120, 'Inventory Adjustment', 'Ingredient', '30', '{\"ingredient\":\"Celery\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:23', '2026-03-04 02:58:23'),
(121, 'Ingredient Updated', 'Ingredient', '30', '{\"name\":\"Celery\",\"code\":\"ING-024\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:24', '2026-03-04 02:58:24'),
(122, 'Inventory Adjustment', 'Ingredient', '9', '{\"ingredient\":\"CFAT\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:32', '2026-03-04 02:58:32'),
(123, 'Ingredient Updated', 'Ingredient', '9', '{\"name\":\"CFAT\",\"code\":\"ING-003\",\"unit\":\"Kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:33', '2026-03-04 02:58:33'),
(124, 'Inventory Adjustment', 'Ingredient', '35', '{\"ingredient\":\"Cheese\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:39', '2026-03-04 02:58:39'),
(125, 'Ingredient Updated', 'Ingredient', '35', '{\"name\":\"Cheese\",\"code\":\"ING-029\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:39', '2026-03-04 02:58:39'),
(126, 'Inventory Adjustment', 'Ingredient', '25', '{\"ingredient\":\"Cornstarch\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:48', '2026-03-04 02:58:48'),
(127, 'Ingredient Updated', 'Ingredient', '25', '{\"name\":\"Cornstarch\",\"code\":\"ING-019\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:58:48', '2026-03-04 02:58:48'),
(128, 'Inventory Adjustment', 'Ingredient', '37', '{\"ingredient\":\"Curry Powder\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:03', '2026-03-04 02:59:03'),
(129, 'Ingredient Updated', 'Ingredient', '37', '{\"name\":\"Curry Powder\",\"code\":\"ING-031\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:03', '2026-03-04 02:59:03'),
(130, 'Inventory Adjustment', 'Ingredient', '31', '{\"ingredient\":\"Garlic\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:10', '2026-03-04 02:59:10'),
(131, 'Ingredient Updated', 'Ingredient', '31', '{\"name\":\"Garlic\",\"code\":\"ING-025\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:10', '2026-03-04 02:59:10'),
(132, 'Inventory Adjustment', 'Ingredient', '40', '{\"ingredient\":\"Gas\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:20', '2026-03-04 02:59:20'),
(133, 'Ingredient Updated', 'Ingredient', '40', '{\"name\":\"Gas\",\"code\":\"ING-034\",\"unit\":\"L\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:20', '2026-03-04 02:59:20'),
(134, 'Inventory Adjustment', 'Ingredient', '26', '{\"ingredient\":\"Giling-fat\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:29', '2026-03-04 02:59:29'),
(135, 'Ingredient Updated', 'Ingredient', '26', '{\"name\":\"Giling-fat\",\"code\":\"ING-020\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:29', '2026-03-04 02:59:29'),
(136, 'Inventory Adjustment', 'Ingredient', '16', '{\"ingredient\":\"Ham Flavor\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:37', '2026-03-04 02:59:37'),
(137, 'Ingredient Updated', 'Ingredient', '16', '{\"name\":\"Ham Flavor\",\"code\":\"ING-010\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:37', '2026-03-04 02:59:37'),
(138, 'Inventory Adjustment', 'Ingredient', '15', '{\"ingredient\":\"Ham Spice\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:45', '2026-03-04 02:59:45'),
(139, 'Ingredient Updated', 'Ingredient', '15', '{\"name\":\"Ham Spice\",\"code\":\"ING-009\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:46', '2026-03-04 02:59:46'),
(140, 'Inventory Adjustment', 'Ingredient', '34', '{\"ingredient\":\"hangs-isaw\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:56', '2026-03-04 02:59:56'),
(141, 'Ingredient Updated', 'Ingredient', '34', '{\"name\":\"hangs-isaw\",\"code\":\"ING-028\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 02:59:56', '2026-03-04 02:59:56'),
(142, 'Inventory Adjustment', 'Ingredient', '20', '{\"ingredient\":\"Knorr Liquid Seasoning\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:04', '2026-03-04 03:00:04'),
(143, 'Ingredient Updated', 'Ingredient', '20', '{\"name\":\"Knorr Liquid Seasoning\",\"code\":\"ING-014\",\"unit\":\"L\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:04', '2026-03-04 03:00:04'),
(144, 'Inventory Adjustment', 'Ingredient', '49', '{\"ingredient\":\"Large\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:11', '2026-03-04 03:00:11'),
(145, 'Ingredient Updated', 'Ingredient', '49', '{\"name\":\"Large\",\"code\":\"ING-043\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:12', '2026-03-04 03:00:12'),
(146, 'Inventory Adjustment', 'Ingredient', '33', '{\"ingredient\":\"Lumpia Wrapper\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:50', '2026-03-04 03:00:50'),
(147, 'Ingredient Updated', 'Ingredient', '33', '{\"name\":\"Lumpia Wrapper\",\"code\":\"ING-027\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:51', '2026-03-04 03:00:51'),
(148, 'Inventory Adjustment', 'Ingredient', '10', '{\"ingredient\":\"MDM\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:00:59', '2026-03-04 03:00:59'),
(149, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"Box\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:00', '2026-03-04 03:01:00'),
(150, 'Inventory Adjustment', 'Ingredient', '48', '{\"ingredient\":\"Medium\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:07', '2026-03-04 03:01:07'),
(151, 'Ingredient Updated', 'Ingredient', '48', '{\"name\":\"Medium\",\"code\":\"ING-042\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:08', '2026-03-04 03:01:08'),
(152, 'Inventory Adjustment', 'Ingredient', '7', '{\"ingredient\":\"Molo White\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:15', '2026-03-04 03:01:15'),
(153, 'Ingredient Updated', 'Ingredient', '7', '{\"name\":\"Molo White\",\"code\":\"ING-001\",\"unit\":\"Pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:16', '2026-03-04 03:01:16'),
(154, 'Inventory Adjustment', 'Ingredient', '8', '{\"ingredient\":\"Molo Yellow\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:23', '2026-03-04 03:01:23'),
(155, 'Ingredient Updated', 'Ingredient', '8', '{\"name\":\"Molo Yellow\",\"code\":\"ING-002\",\"unit\":\"Pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:23', '2026-03-04 03:01:23'),
(156, 'Inventory Adjustment', 'Ingredient', '23', '{\"ingredient\":\"MSG-Vetsin\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:30', '2026-03-04 03:01:30'),
(157, 'Ingredient Updated', 'Ingredient', '23', '{\"name\":\"MSG-Vetsin\",\"code\":\"ING-017\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:31', '2026-03-04 03:01:31'),
(158, 'Inventory Adjustment', 'Ingredient', '36', '{\"ingredient\":\"Multiblend\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:44', '2026-03-04 03:01:44'),
(159, 'Ingredient Updated', 'Ingredient', '36', '{\"name\":\"Multiblend\",\"code\":\"ING-030\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:45', '2026-03-04 03:01:45'),
(160, 'Inventory Adjustment', 'Ingredient', '28', '{\"ingredient\":\"Onion\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:53', '2026-03-04 03:01:53'),
(161, 'Ingredient Updated', 'Ingredient', '28', '{\"name\":\"Onion\",\"code\":\"ING-022\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:01:53', '2026-03-04 03:01:53'),
(162, 'Inventory Adjustment', 'Ingredient', '43', '{\"ingredient\":\"PE 6X8\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:01', '2026-03-04 03:02:01'),
(163, 'Ingredient Updated', 'Ingredient', '43', '{\"name\":\"PE 6X8\",\"code\":\"ING-037\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:02', '2026-03-04 03:02:02'),
(164, 'Inventory Adjustment', 'Ingredient', '44', '{\"ingredient\":\"PE X10\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:09', '2026-03-04 03:02:09'),
(165, 'Ingredient Updated', 'Ingredient', '44', '{\"name\":\"PE X10\",\"code\":\"ING-038\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:10', '2026-03-04 03:02:10'),
(166, 'Inventory Adjustment', 'Ingredient', '13', '{\"ingredient\":\"Pine Apple Juice\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:17', '2026-03-04 03:02:17'),
(167, 'Ingredient Updated', 'Ingredient', '13', '{\"name\":\"Pine Apple Juice\",\"code\":\"ING-007\",\"unit\":\"L\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:17', '2026-03-04 03:02:17'),
(168, 'Inventory Adjustment', 'Ingredient', '52', '{\"ingredient\":\"Plastic Shanghai\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:24', '2026-03-04 03:02:24'),
(169, 'Ingredient Updated', 'Ingredient', '52', '{\"name\":\"Plastic Shanghai\",\"code\":\"ING-046\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:25', '2026-03-04 03:02:25'),
(170, 'Inventory Adjustment', 'Ingredient', '53', '{\"ingredient\":\"Plastic Skinless\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:31', '2026-03-04 03:02:31'),
(171, 'Ingredient Updated', 'Ingredient', '53', '{\"name\":\"Plastic Skinless\",\"code\":\"ING-047\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:32', '2026-03-04 03:02:32'),
(172, 'Inventory Adjustment', 'Ingredient', '14', '{\"ingredient\":\"Praque Powder\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:40', '2026-03-04 03:02:40'),
(173, 'Ingredient Updated', 'Ingredient', '14', '{\"name\":\"Praque Powder\",\"code\":\"ING-008\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:41', '2026-03-04 03:02:41'),
(174, 'Inventory Adjustment', 'Ingredient', '29', '{\"ingredient\":\"Redbell Pepper\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:49', '2026-03-04 03:02:49'),
(175, 'Ingredient Updated', 'Ingredient', '29', '{\"name\":\"Redbell Pepper\",\"code\":\"ING-023\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:49', '2026-03-04 03:02:49'),
(176, 'Inventory Adjustment', 'Ingredient', '50', '{\"ingredient\":\"Rollbag Big\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:57', '2026-03-04 03:02:57'),
(177, 'Ingredient Updated', 'Ingredient', '50', '{\"name\":\"Rollbag Big\",\"code\":\"ING-044\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:02:57', '2026-03-04 03:02:57'),
(178, 'Inventory Adjustment', 'Ingredient', '51', '{\"ingredient\":\"Rollbag Small\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:04', '2026-03-04 03:03:04'),
(179, 'Ingredient Updated', 'Ingredient', '51', '{\"name\":\"Rollbag Small\",\"code\":\"ING-045\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:05', '2026-03-04 03:03:05'),
(180, 'Inventory Adjustment', 'Ingredient', '18', '{\"ingredient\":\"Sodium\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:11', '2026-03-04 03:03:11'),
(181, 'Ingredient Updated', 'Ingredient', '18', '{\"name\":\"Sodium\",\"code\":\"ING-012\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:12', '2026-03-04 03:03:12'),
(182, 'Inventory Adjustment', 'Ingredient', '56', '{\"ingredient\":\"Strand Clear\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:20', '2026-03-04 03:03:20'),
(183, 'Ingredient Updated', 'Ingredient', '56', '{\"name\":\"Strand Clear\",\"code\":\"ING-050\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:21', '2026-03-04 03:03:21'),
(184, 'Inventory Adjustment', 'Ingredient', '57', '{\"ingredient\":\"Strand Embo\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:29', '2026-03-04 03:03:29'),
(185, 'Ingredient Updated', 'Ingredient', '57', '{\"name\":\"Strand Embo\",\"code\":\"ING-051\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:29', '2026-03-04 03:03:29'),
(186, 'Inventory Adjustment', 'Ingredient', '54', '{\"ingredient\":\"Strand Red\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:35', '2026-03-04 03:03:35'),
(187, 'Ingredient Updated', 'Ingredient', '54', '{\"name\":\"Strand Red\",\"code\":\"ING-048\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:36', '2026-03-04 03:03:36'),
(188, 'Inventory Adjustment', 'Ingredient', '55', '{\"ingredient\":\"Strand White\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:43', '2026-03-04 03:03:43'),
(189, 'Ingredient Updated', 'Ingredient', '55', '{\"name\":\"Strand White\",\"code\":\"ING-049\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:43', '2026-03-04 03:03:43'),
(190, 'Inventory Adjustment', 'Ingredient', '24', '{\"ingredient\":\"Sugar\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:50', '2026-03-04 03:03:50'),
(191, 'Ingredient Updated', 'Ingredient', '24', '{\"name\":\"Sugar\",\"code\":\"ING-018\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:50', '2026-03-04 03:03:50'),
(192, 'Inventory Adjustment', 'Ingredient', '32', '{\"ingredient\":\"Tali\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:59', '2026-03-04 03:03:59'),
(193, 'Ingredient Updated', 'Ingredient', '32', '{\"name\":\"Tali\",\"code\":\"ING-026\",\"unit\":\"pcs\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:03:59', '2026-03-04 03:03:59'),
(194, 'Inventory Adjustment', 'Ingredient', '12', '{\"ingredient\":\"TVP Fine\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:06', '2026-03-04 03:04:06'),
(195, 'Ingredient Updated', 'Ingredient', '12', '{\"name\":\"TVP Fine\",\"code\":\"ING-006\",\"unit\":\"Kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:07', '2026-03-04 03:04:07'),
(196, 'Inventory Adjustment', 'Ingredient', '21', '{\"ingredient\":\"Tvp Gem\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:13', '2026-03-04 03:04:13'),
(197, 'Ingredient Updated', 'Ingredient', '21', '{\"name\":\"Tvp Gem\",\"code\":\"ING-015\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:14', '2026-03-04 03:04:14'),
(198, 'Inventory Adjustment', 'Ingredient', '17', '{\"ingredient\":\"Vitamin C\",\"type\":\"add\",\"quantity\":100,\"previousStock\":0,\"newStock\":100,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:22', '2026-03-04 03:04:22'),
(199, 'Ingredient Updated', 'Ingredient', '17', '{\"name\":\"Vitamin C\",\"code\":\"ING-011\",\"unit\":\"kg\",\"stock\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:04:23', '2026-03-04 03:04:23'),
(200, 'User Created', 'User', '22', '{\"name\":\"calen\",\"role\":\"EMPLOYEE\",\"username\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:17:13', '2026-03-04 03:17:13'),
(201, 'User Updated', 'User', '22', '{\"name\":\"calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:17:24', '2026-03-04 03:17:24'),
(202, 'Production Started', 'ProductionRecord', '68', '{\"batchNumber\":\"B001\",\"categoryName\":\"Ballham Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:24:07', '2026-03-04 03:24:07'),
(203, 'Mixing Completed', 'ProductionRecord', '68', '{\"batchNumber\":\"B001\",\"operator\":\"System Administrator\",\"category\":\"Ballham Mix\",\"mixWeight\":\"200.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:25:01', '2026-03-04 03:25:01'),
(204, 'User Updated', 'User', '18', '{\"name\":\"OGAHAYON, NOLI\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:25:36', '2026-03-04 03:25:36'),
(205, 'Inventory Adjustment', 'Ingredient', '25', '{\"ingredient\":\"Cornstarch\",\"type\":\"add\",\"quantity\":300,\"previousStock\":80,\"newStock\":380,\"reason\":\"Restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:28:47', '2026-03-04 03:28:47'),
(206, 'Ingredient Updated', 'Ingredient', '25', '{\"name\":\"Cornstarch\",\"code\":\"ING-019\",\"unit\":\"kg\",\"stock\":380,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:28:48', '2026-03-04 03:28:48'),
(207, 'Inventory Adjustment', 'Ingredient', '10', '{\"ingredient\":\"MDM\",\"type\":\"add\",\"quantity\":1000,\"previousStock\":0,\"newStock\":1000,\"reason\":\"Restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:29:57', '2026-03-04 03:29:57'),
(208, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"Box\",\"stock\":1000,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:29:57', '2026-03-04 03:29:57'),
(209, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"Kg\",\"stock\":0,\"_performedBy\":\"Ms. Bam\"}', 6, '2026-03-04 03:30:11', '2026-03-04 03:30:11'),
(210, 'Inventory Adjustment', 'Ingredient', '24', '{\"ingredient\":\"Sugar\",\"type\":\"add\",\"quantity\":1000,\"previousStock\":70,\"newStock\":1070,\"reason\":\"Restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:30:39', '2026-03-04 03:30:39'),
(211, 'Ingredient Updated', 'Ingredient', '24', '{\"name\":\"Sugar\",\"code\":\"ING-018\",\"unit\":\"kg\",\"stock\":1070,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:30:39', '2026-03-04 03:30:39'),
(212, 'Inventory Adjustment', 'Ingredient', '12', '{\"ingredient\":\"TVP Fine\",\"type\":\"add\",\"quantity\":200,\"previousStock\":100,\"newStock\":300,\"reason\":\"Restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:30:56', '2026-03-04 03:30:56'),
(213, 'Ingredient Updated', 'Ingredient', '12', '{\"name\":\"TVP Fine\",\"code\":\"ING-006\",\"unit\":\"Kg\",\"stock\":300,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:30:56', '2026-03-04 03:30:56'),
(214, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"Kg\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:33:37', '2026-03-04 03:33:37'),
(215, 'Inventory Adjustment', 'Ingredient', '10', '{\"ingredient\":\"MDM\",\"type\":\"add\",\"quantity\":1000,\"previousStock\":0,\"newStock\":1000,\"reason\":\"Restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:33:53', '2026-03-04 03:33:53'),
(216, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"Kg\",\"stock\":1000,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:33:54', '2026-03-04 03:33:54'),
(217, 'Production Started', 'ProductionRecord', '69', '{\"batchNumber\":\"B002\",\"categoryName\":\"Gulay Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:35:37', '2026-03-04 03:35:37'),
(218, 'Production Started', 'ProductionRecord', '70', '{\"batchNumber\":\"B003\",\"categoryName\":\"Longganisa mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:37:19', '2026-03-04 03:37:19'),
(219, 'Product Mix Category Updated', 'ProductMixCategory', '8', '{\"name\":\"Salami Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:40:05', '2026-03-04 03:40:05'),
(220, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '8', '{\"ingredientCount\":12,\"ingredients\":[\"MDM\",\"Sugar\",\"Cornstarch\",\"Pine Apple Juice\",\"Cheese\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:40:06', '2026-03-04 03:40:06'),
(221, 'Product Added to Mix Category', 'ProductMixCategory', '8', '{\"productId\":\"42\",\"productName\":\"Cheesedog\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:41:16', '2026-03-04 03:41:16'),
(222, 'Product Added to Mix Category', 'ProductMixCategory', '8', '{\"productId\":\"44\",\"productName\":\"Rolled Ham\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:41:22', '2026-03-04 03:41:22'),
(223, 'Production Started', 'ProductionRecord', '71', '{\"batchNumber\":\"B004\",\"categoryName\":\"Salami Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:42:36', '2026-03-04 03:42:36'),
(224, 'Production Started', 'ProductionRecord', '72', '{\"batchNumber\":\"B005\",\"categoryName\":\"Skinless Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:43:35', '2026-03-04 03:43:35'),
(225, 'User Created', 'User', '23', '{\"name\":\"test\",\"role\":\"POS\",\"username\":\"test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:46:11', '2026-03-04 03:46:11'),
(226, 'Mixing Completed', 'ProductionRecord', '72', '{\"batchNumber\":\"B005\",\"operator\":\"System Administrator\",\"category\":\"Skinless Mix\",\"mixWeight\":\"200.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:46:18', '2026-03-04 03:46:18'),
(227, 'User Updated', 'User', '23', '{\"name\":\"test\",\"role\":\"POS\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:46:21', '2026-03-04 03:46:21'),
(228, 'Packing Started (from mix inventory)', 'ProductionRecord', '73', '{\"batchNumber\":\"B006\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Skinless Mix\",\"mixWeight\":120,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 03:47:07', '2026-03-04 03:47:07'),
(229, 'Packing Completed', 'ProductionRecord', '73', '{\"batchNumber\":\"B006\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Skinless Mix\",\"rawPackedItems\":120.5,\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 03:47:53', '2026-03-04 03:47:53'),
(230, 'Cooking Started (from raw inventory)', 'ProductionRecord', '74', '{\"batchNumber\":\"B007\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Skinless Mix\",\"rawWeight\":100,\"ingredientsUsed\":0,\"note\":\"Cooking started directly from raw product inventory (packing step skipped)\",\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 03:49:25', '2026-03-04 03:49:25'),
(231, 'Mixing Completed', 'ProductionRecord', '70', '{\"batchNumber\":\"B003\",\"operator\":\"System Administrator\",\"category\":\"Longganisa mix\",\"mixWeight\":\"100.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:50:57', '2026-03-04 03:50:57'),
(232, 'Mixing Completed', 'ProductionRecord', '69', '{\"batchNumber\":\"B002\",\"operator\":\"System Administrator\",\"category\":\"Gulay Mix\",\"mixWeight\":\"200.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:51:24', '2026-03-04 03:51:24'),
(233, 'Packing Started (from mix inventory)', 'ProductionRecord', '75', '{\"batchNumber\":\"B008\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"mixWeight\":100,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 03:51:54', '2026-03-04 03:51:54'),
(234, 'Packing Completed', 'ProductionRecord', '75', '{\"batchNumber\":\"B008\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"rawPackedItems\":90,\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 03:52:18', '2026-03-04 03:52:18'),
(235, 'User Updated', 'User', '6', '{\"name\":\"Ms. Bam\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:57:31', '2026-03-04 03:57:31'),
(236, 'User Updated', 'User', '6', '{\"name\":\"Ms. Bam\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 03:58:40', '2026-03-04 03:58:40'),
(237, 'Cooking Completed', 'ProductionRecord', '75', '{\"batchNumber\":\"B008\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"mixUsed\":90,\"outputCount\":2,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:00:24', '2026-03-04 04:00:24'),
(238, 'Cooking Completed', 'ProductionRecord', '74', '{\"batchNumber\":\"B007\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Skinless Mix\",\"mixUsed\":20,\"outputCount\":2,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:00:49', '2026-03-04 04:00:49'),
(239, 'Packing Started (from mix inventory)', 'ProductionRecord', '76', '{\"batchNumber\":\"B009\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Gulay Mix\",\"mixWeight\":150,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 04:08:32', '2026-03-04 04:08:32'),
(240, 'Packing Completed', 'ProductionRecord', '76', '{\"batchNumber\":\"B009\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Gulay Mix\",\"rawPackedItems\":155,\"_performedBy\":\"OGAHAYON, NOLI\"}', 18, '2026-03-04 04:08:45', '2026-03-04 04:08:45'),
(241, 'Transfer Created', 'Transfer', '32', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantity\":45,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:11:40', '2026-03-04 04:11:40'),
(242, 'Transfer Received', 'Transfer', '32', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantitySent\":45,\"quantityReceived\":45,\"discrepancy\":0,\"receivedBy\":\"admin\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:11:50', '2026-03-04 04:11:50'),
(243, 'Transfer Created', 'Transfer', '33', '{\"from\":\"Production Facility\",\"to\":\"Commissary\",\"quantity\":45,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:13:19', '2026-03-04 04:13:19'),
(244, 'Transfer Received', 'Transfer', '33', '{\"from\":\"Production Facility\",\"to\":\"Commissary\",\"quantitySent\":45,\"quantityReceived\":45,\"discrepancy\":0,\"receivedBy\":\"admin\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:13:24', '2026-03-04 04:13:24'),
(245, 'Transfer Created', 'Transfer', '34', '{\"from\":\"Commissary\",\"to\":\"AB Market\",\"quantity\":45,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:14:30', '2026-03-04 04:14:30'),
(246, 'Transfer Received', 'Transfer', '34', '{\"from\":\"Commissary\",\"to\":\"AB Market\",\"quantitySent\":45,\"quantityReceived\":45,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:14:57', '2026-03-04 04:14:57'),
(247, 'Sale Created', 'Sale', '22', '{\"transactionId\":\"1772597935553\",\"total\":650,\"itemCount\":1,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"calen\"}', 22, '2026-03-04 04:18:54', '2026-03-04 04:18:54'),
(248, 'Transfer Created', 'Transfer', '35', '{\"from\":\"AB Market\",\"to\":\"Production Facility\",\"quantity\":5,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:27:15', '2026-03-04 04:27:15'),
(249, 'User Updated', 'User', '6', '{\"name\":\"Ms. Bam\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:33:54', '2026-03-04 04:33:54'),
(250, 'Transaction Created', 'Transaction', '2', '{\"type\":\"Cash In\",\"amount\":5000,\"description\":\"Exy hardware\",\"category\":\"Other Income\",\"createdBy\":\"Ms. Bam\"}', NULL, '2026-03-04 04:35:57', '2026-03-04 04:35:57'),
(251, 'Transaction Created', 'Transaction', '3', '{\"type\":\"Cash In\",\"amount\":5000,\"description\":\"Exy hardware\",\"category\":\"Other Income\",\"createdBy\":\"Ms. Bam\"}', NULL, '2026-03-04 04:35:57', '2026-03-04 04:35:57'),
(252, 'Transaction Created', 'Transaction', '4', '{\"type\":\"Cash In\",\"amount\":5000,\"description\":\"Exy hardware\",\"category\":\"Other Income\",\"createdBy\":\"Ms. Bam\"}', NULL, '2026-03-04 04:36:06', '2026-03-04 04:36:06'),
(253, 'Transaction Created', 'Transaction', '5', '{\"type\":\"Cash Out\",\"amount\":500,\"description\":\"Test\",\"category\":\"Other Expenses\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-04 04:39:32', '2026-03-04 04:39:32'),
(254, 'User Updated', 'User', '22', '{\"name\":\"calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:43:27', '2026-03-04 04:43:27'),
(255, 'Transfer Received', 'Transfer', '35', '{\"from\":\"AB Market\",\"to\":\"Production Facility\",\"quantitySent\":5,\"quantityReceived\":5,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:07', '2026-03-04 04:50:07'),
(256, 'Production Deleted', 'ProductionRecord', '76', '{\"batchNumber\":\"B009\",\"categoryName\":\"Gulay Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:41', '2026-03-04 04:50:41'),
(257, 'Production Deleted', 'ProductionRecord', '75', '{\"batchNumber\":\"B008\",\"categoryName\":\"Longganisa mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:43', '2026-03-04 04:50:43'),
(258, 'Production Deleted', 'ProductionRecord', '74', '{\"batchNumber\":\"B007\",\"categoryName\":\"Skinless Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:45', '2026-03-04 04:50:45'),
(259, 'Production Deleted', 'ProductionRecord', '73', '{\"batchNumber\":\"B006\",\"categoryName\":\"Skinless Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:46', '2026-03-04 04:50:46'),
(260, 'Production Deleted', 'ProductionRecord', '72', '{\"batchNumber\":\"B005\",\"categoryName\":\"Skinless Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:48', '2026-03-04 04:50:48'),
(261, 'Production Deleted', 'ProductionRecord', '71', '{\"batchNumber\":\"B004\",\"categoryName\":\"Salami Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:50', '2026-03-04 04:50:50'),
(262, 'Production Deleted', 'ProductionRecord', '70', '{\"batchNumber\":\"B003\",\"categoryName\":\"Longganisa mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:52', '2026-03-04 04:50:52'),
(263, 'Production Deleted', 'ProductionRecord', '69', '{\"batchNumber\":\"B002\",\"categoryName\":\"Gulay Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:54', '2026-03-04 04:50:54'),
(264, 'Production Deleted', 'ProductionRecord', '68', '{\"batchNumber\":\"B001\",\"categoryName\":\"Ballham Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:50:57', '2026-03-04 04:50:57'),
(265, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"35\",\"productName\":\"Bologna Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:52:27', '2026-03-04 04:52:27'),
(266, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"34\",\"productName\":\"Bologna Red\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:52:28', '2026-03-04 04:52:28'),
(267, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:52:58', '2026-03-04 04:52:58'),
(268, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:52:59', '2026-03-04 04:52:59'),
(269, 'Product Removed from Mix Category', 'ProductMixCategory', '10', '{\"productId\":\"44\",\"productName\":\"Rolled Ham\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:53:04', '2026-03-04 04:53:04'),
(270, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"38\",\"productName\":\"Medium Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:53:22', '2026-03-04 04:53:22');
INSERT INTO `system_history` (`id`, `action`, `entity`, `entity_id`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
(271, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"37\",\"productName\":\"Medium Red\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:53:23', '2026-03-04 04:53:23'),
(272, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:54:15', '2026-03-04 04:54:15'),
(273, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:54:16', '2026-03-04 04:54:16'),
(274, 'Production Started', 'ProductionRecord', '77', '{\"batchNumber\":\"B001\",\"categoryName\":\"Longganisa mix\",\"phase\":\"mixing\",\"operator\":\"OGAHAYON, NOLI\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:54:54', '2026-03-04 04:54:54'),
(275, 'Mixing Completed', 'ProductionRecord', '77', '{\"batchNumber\":\"B001\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"mixWeight\":\"350.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:56:24', '2026-03-04 04:56:24'),
(276, 'Packing Completed', 'ProductionRecord', '77', '{\"batchNumber\":\"B001\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"rawPackedItems\":350,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:56:31', '2026-03-04 04:56:31'),
(277, 'Cooking Completed', 'ProductionRecord', '77', '{\"batchNumber\":\"B001\",\"operator\":\"OGAHAYON, NOLI\",\"category\":\"Longganisa mix\",\"mixUsed\":350,\"outputCount\":6,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:56:50', '2026-03-04 04:56:50'),
(278, 'Product Created', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"category\":\"Pork\",\"price\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:57:08', '2026-03-04 04:57:08'),
(279, 'Transfer Created', 'Transfer', '36', '{\"from\":\"AB Market\",\"to\":\"Commissary\",\"quantity\":40,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:57:50', '2026-03-04 04:57:50'),
(280, 'Category Created', 'Category', '16', '{\"name\":\"Chicken\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:58:29', '2026-03-04 04:58:29'),
(281, 'Transfer Created', 'Transfer', '37', '{\"from\":\"AB Market\",\"to\":\"Commissary\",\"quantity\":40,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:58:47', '2026-03-04 04:58:47'),
(282, 'Transfer Received', 'Transfer', '37', '{\"from\":\"AB Market\",\"to\":\"Commissary\",\"quantitySent\":40,\"quantityReceived\":40,\"discrepancy\":0,\"receivedBy\":\"admin\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:58:59', '2026-03-04 04:58:59'),
(283, 'Transfer Received', 'Transfer', '36', '{\"from\":\"AB Market\",\"to\":\"Commissary\",\"quantitySent\":40,\"quantityReceived\":40,\"discrepancy\":0,\"receivedBy\":\"admin\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 04:59:04', '2026-03-04 04:59:04'),
(284, 'Transfer Created', 'Transfer', '38', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantity\":10.67,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:07:59', '2026-03-04 05:07:59'),
(285, 'Transfer Received', 'Transfer', '38', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantitySent\":11,\"quantityReceived\":11,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:08:09', '2026-03-04 05:08:09'),
(286, 'Transfer Created', 'Transfer', '39', '{\"from\":\"\",\"to\":\"AB Market\",\"quantity\":3.68,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:08:45', '2026-03-04 05:08:45'),
(287, 'Transfer Received', 'Transfer', '39', '{\"from\":\"\",\"to\":\"AB Market\",\"quantitySent\":4,\"quantityReceived\":4,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:09:03', '2026-03-04 05:09:03'),
(288, 'Product Created', 'Product', '54', '{\"name\":\"Ballham 500g\",\"category\":\"Chicken\",\"price\":65,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:09:21', '2026-03-04 05:09:21'),
(289, 'Product Created', 'Product', '55', '{\"name\":\"Longgadog Brown\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:11:29', '2026-03-04 05:11:29'),
(290, 'Transfer Created', 'Transfer', '40', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantity\":11,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:08', '2026-03-04 05:14:08'),
(291, 'Product Created', 'Product', '56', '{\"name\":\"Chicken Nuggets\",\"category\":\"Chicken\",\"price\":140,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:11', '2026-03-04 05:14:11'),
(292, 'Transfer Received', 'Transfer', '40', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantitySent\":11,\"quantityReceived\":11,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:18', '2026-03-04 05:14:18'),
(293, 'Product Created', 'Product', '57', '{\"name\":\"Meatballs\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:39', '2026-03-04 05:14:39'),
(294, 'Transfer Created', 'Transfer', '41', '{\"from\":\"\",\"to\":\"AB Market\",\"quantity\":12,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:45', '2026-03-04 05:14:45'),
(295, 'Transfer Received', 'Transfer', '41', '{\"from\":\"\",\"to\":\"AB Market\",\"quantitySent\":12,\"quantityReceived\":12,\"discrepancy\":0,\"receivedBy\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:14:52', '2026-03-04 05:14:52'),
(296, 'Product Created', 'Product', '58', '{\"name\":\"Longganisa Brown\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:15:14', '2026-03-04 05:15:14'),
(297, 'Product Created', 'Product', '59', '{\"name\":\"Square Ham\",\"category\":\"Chicken\",\"price\":150,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:16:30', '2026-03-04 05:16:30'),
(298, 'Sale Created', 'Sale', '23', '{\"transactionId\":\"1772601423591\",\"total\":2860,\"itemCount\":4,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"calen\"}', 22, '2026-03-04 05:17:02', '2026-03-04 05:17:02'),
(299, 'Product Created', 'Product', '60', '{\"name\":\"Plastic\\/dulo\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:17:24', '2026-03-04 05:17:24'),
(300, 'Product Added to Mix Category', 'ProductMixCategory', '10', '{\"productId\":\"53\",\"productName\":\"Ballham 1kg\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:19:36', '2026-03-04 05:19:36'),
(301, 'Product Added to Mix Category', 'ProductMixCategory', '10', '{\"productId\":\"54\",\"productName\":\"Ballham 500g\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:19:37', '2026-03-04 05:19:37'),
(302, 'Product Mix Category Updated', 'ProductMixCategory', '10', '{\"name\":\"Ballham Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:19:47', '2026-03-04 05:19:47'),
(303, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '10', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:19:47', '2026-03-04 05:19:47'),
(304, 'Product Added to Mix Category', 'ProductMixCategory', '7', '{\"productId\":\"28\",\"productName\":\"Shanghai\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:20:21', '2026-03-04 05:20:21'),
(305, 'Product Added to Mix Category', 'ProductMixCategory', '7', '{\"productId\":\"47\",\"productName\":\"Plastic Embotido\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:20:30', '2026-03-04 05:20:30'),
(306, 'Product Added to Mix Category', 'ProductMixCategory', '7', '{\"productId\":\"57\",\"productName\":\"Meatballs\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:20:35', '2026-03-04 05:20:35'),
(307, 'Product Mix Category Updated', 'ProductMixCategory', '7', '{\"name\":\"Gulay Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:20:45', '2026-03-04 05:20:45'),
(308, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '7', '{\"ingredientCount\":15,\"ingredients\":[\"MDM\",\"Carrots\",\"Onion\",\"Celery\",\"Redbell Pepper\",\"Garlic\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Alexander\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:20:45', '2026-03-04 05:20:45'),
(309, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"55\",\"productName\":\"Longgadog Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:21:10', '2026-03-04 05:21:10'),
(310, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"58\",\"productName\":\"Longganisa Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:21:20', '2026-03-04 05:21:20'),
(311, 'Product Added to Mix Category', 'ProductMixCategory', '4', '{\"productId\":\"41\",\"productName\":\"Steamed Skinless\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:21:48', '2026-03-04 05:21:48'),
(312, 'Transfer Created', 'Transfer', '42', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantity\":5.5,\"requestedBy\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:22:53', '2026-03-04 05:22:53'),
(313, 'Transfer Received', 'Transfer', '42', '{\"from\":\"Production Facility\",\"to\":\"AB Market\",\"quantitySent\":\"5.50\",\"quantityReceived\":5.38,\"discrepancy\":0.1200000000000001,\"receivedBy\":\"ms._bam\",\"_performedBy\":\"calen\"}', 22, '2026-03-04 05:23:55', '2026-03-04 05:23:55'),
(314, 'Product Added to Mix Category', 'ProductMixCategory', '9', '{\"productId\":\"59\",\"productName\":\"Square Ham\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:24:09', '2026-03-04 05:24:09'),
(315, 'Product Mix Category Updated', 'ProductMixCategory', '9', '{\"name\":\"Square ham Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:24:14', '2026-03-04 05:24:14'),
(316, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '9', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 05:24:14', '2026-03-04 05:24:14'),
(317, 'Production Started', 'ProductionRecord', '78', '{\"batchNumber\":\"B002\",\"categoryName\":\"Salami Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:28:51', '2026-03-04 08:28:51'),
(318, 'Mixing Completed', 'ProductionRecord', '78', '{\"batchNumber\":\"B002\",\"operator\":\"System Administrator\",\"category\":\"Salami Mix\",\"mixWeight\":\"100.00\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:29:09', '2026-03-04 08:29:09'),
(319, 'Packing Started (from mix inventory)', 'ProductionRecord', '79', '{\"batchNumber\":\"B003\",\"operator\":\"test\",\"category\":\"Salami Mix\",\"mixWeight\":100,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:29:45', '2026-03-04 08:29:45'),
(320, 'Packing Completed', 'ProductionRecord', '79', '{\"batchNumber\":\"B003\",\"operator\":\"test\",\"category\":\"Salami Mix\",\"rawPackedItems\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:30:43', '2026-03-04 08:30:43'),
(321, 'Packing Completed', 'ProductionRecord', '78', '{\"batchNumber\":\"B002\",\"operator\":\"System Administrator\",\"category\":\"Salami Mix\",\"rawPackedItems\":100,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:30:49', '2026-03-04 08:30:49'),
(322, 'User Created', 'User', '24', '{\"name\":\"testing\",\"role\":\"EMPLOYEE\",\"username\":\"testing\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:42:19', '2026-03-04 08:42:19'),
(323, 'User Updated', 'User', '24', '{\"name\":\"testing\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 08:42:32', '2026-03-04 08:42:32'),
(324, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"Longganisa Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:54:52', '2026-03-04 12:54:52'),
(325, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:54:52', '2026-03-04 12:54:52'),
(326, 'Product Mix Category Updated', 'ProductMixCategory', '10', '{\"name\":\"BALLHAM MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:56:53', '2026-03-04 12:56:53'),
(327, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '10', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:56:54', '2026-03-04 12:56:54'),
(328, 'Product Mix Category Updated', 'ProductMixCategory', '7', '{\"name\":\"GULAY MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(329, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '7', '{\"ingredientCount\":15,\"ingredients\":[\"MDM\",\"Carrots\",\"Onion\",\"Celery\",\"Redbell Pepper\",\"Garlic\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Alexander\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:21', '2026-03-04 12:57:21'),
(330, 'Product Mix Category Updated', 'ProductMixCategory', '4', '{\"name\":\"LONGGANISA MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:39', '2026-03-04 12:57:39'),
(331, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '4', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Pine Apple Juice\",\"Knorr Liquid Seasoning\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:40', '2026-03-04 12:57:40'),
(332, 'Product Mix Category Updated', 'ProductMixCategory', '8', '{\"name\":\"SALAMI MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:56', '2026-03-04 12:57:56'),
(333, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '8', '{\"ingredientCount\":12,\"ingredients\":[\"MDM\",\"Sugar\",\"Cornstarch\",\"Pine Apple Juice\",\"Cheese\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:57:57', '2026-03-04 12:57:57'),
(334, 'Product Mix Category Updated', 'ProductMixCategory', '6', '{\"name\":\"SKINLESS MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(335, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '6', '{\"ingredientCount\":13,\"ingredients\":[\"MDM\",\"CFAT\",\"TVP Fine\",\"Cornstarch\",\"Sugar\",\"Garlic\",\"Alexander\",\"Knorr Liquid Seasoning\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Sodium\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:58:12', '2026-03-04 12:58:12'),
(336, 'Product Mix Category Updated', 'ProductMixCategory', '9', '{\"name\":\"SQUARE HAM MIX\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(337, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '9', '{\"ingredientCount\":11,\"ingredients\":[\"MDM\",\"Cornstarch\",\"Sugar\",\"Pine Apple Juice\",\"Accord\",\"Praque Powder\",\"MSG-Vetsin\",\"Vitamin C\",\"Ham Spice\",\"Ham Flavor\",\"Multiblend\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(338, 'Product Discount Disabled', 'Product', '47', '{\"name\":\"Plastic Embotido\",\"discountable\":false,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 09:50:32', '2026-03-05 09:50:32'),
(339, 'Product Discount Enabled', 'Product', '47', '{\"name\":\"Plastic Embotido\",\"discountable\":true,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 09:50:35', '2026-03-05 09:50:35'),
(340, 'Product Discount Disabled', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"discountable\":false,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 09:50:39', '2026-03-05 09:50:39'),
(341, 'Product Discount Enabled', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"discountable\":true,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 09:50:39', '2026-03-05 09:50:39'),
(342, 'Report Data Saved', 'Report', '2026-03-05', '{\"storeId\":0,\"cashierId\":0,\"rowCount\":22,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 10:20:52', '2026-03-05 10:20:52'),
(343, 'Report Data Saved', 'Report', '2026-03-05', '{\"storeId\":0,\"cashierId\":0,\"rowCount\":22,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 10:40:00', '2026-03-05 10:40:00'),
(344, 'Report Data Saved', 'Report', '2026-03-05', '{\"storeId\":0,\"cashierId\":0,\"rowCount\":22,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 10:53:36', '2026-03-05 10:53:36'),
(345, 'Report Data Saved', 'Report', '2026-03-05', '{\"storeId\":0,\"cashierId\":0,\"rowCount\":22,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 10:56:12', '2026-03-05 10:56:12'),
(346, 'Supplier Created', 'Supplier', '12', '{\"name\":\"[PW-TEST] Supplier 1772717996806\",\"contactPerson\":\"Test Contact\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 13:39:56', '2026-03-05 13:39:56'),
(347, 'Supplier Created', 'Supplier', '13', '{\"name\":\"[PW-TEST] Supplier 1772718376754\",\"contactPerson\":\"Test Contact\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 13:46:16', '2026-03-05 13:46:16'),
(348, 'Supplier Created', 'Supplier', '14', '{\"name\":\"[PW-TEST] Supplier 1772720463815\",\"contactPerson\":\"Test Contact\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:21:03', '2026-03-05 14:21:03'),
(349, 'Supplier Updated', 'Supplier', '14', '{\"name\":\"[PW-TEST] Supplier 1772720463815 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:21:04', '2026-03-05 14:21:04'),
(350, 'Supplier Deleted', 'Supplier', '14', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:21:05', '2026-03-05 14:21:05'),
(351, 'Supplier Deleted', 'Supplier', '12', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:21:12', '2026-03-05 14:21:12'),
(352, 'Supplier Deleted', 'Supplier', '13', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:21:13', '2026-03-05 14:21:13'),
(353, 'Store Created', 'Store', '8', '{\"name\":\"[PW-TEST] Branch 1772720695530\",\"address\":\"123 Test St, Quezon City\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:24:54', '2026-03-05 14:24:54'),
(354, 'Store Updated', 'Store', '8', '{\"name\":\"[PW-TEST] Branch 1772720695530 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:24:56', '2026-03-05 14:24:56'),
(355, 'Store Deleted', 'Store', '8', '{\"name\":\"[PW-TEST] Branch 1772720695530 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:24:58', '2026-03-05 14:24:58'),
(356, 'Product Created', 'Product', '61', '{\"name\":\"[PW-TEST] Longganisa 1772720764242\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:03', '2026-03-05 14:26:03'),
(357, 'Product Deleted', 'Product', '61', '{\"name\":\"[PW-TEST] Longganisa 1772720764242\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:09', '2026-03-05 14:26:09'),
(358, 'Ingredient Category Created', 'IngredientCategory', '14', '{\"name\":\"[PW-TEST] IngCat 1772720789081\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:28', '2026-03-05 14:26:28'),
(359, 'Ingredient Category Deleted', 'IngredientCategory', '14', '{\"name\":\"[PW-TEST] IngCat 1772720789081\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:29', '2026-03-05 14:26:29'),
(360, 'Category Created', 'Category', '17', '{\"name\":\"[PW-TEST] ProdCat 1772720793923\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:33', '2026-03-05 14:26:33'),
(361, 'Ingredient Category Deleted', 'IngredientCategory', '11', '{\"name\":\"Packaging Materials\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:34', '2026-03-05 14:26:34'),
(362, 'Ingredient Category Deleted', 'IngredientCategory', '5', '{\"name\":\"Raw Materials\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:34', '2026-03-05 14:26:34'),
(363, 'Ingredient Category Deleted', 'IngredientCategory', '7', '{\"name\":\"Seasonings\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:35', '2026-03-05 14:26:35'),
(364, 'Ingredient Category Deleted', 'IngredientCategory', '3', '{\"name\":\"Spices\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:35', '2026-03-05 14:26:35'),
(365, 'Ingredient Category Deleted', 'IngredientCategory', '6', '{\"name\":\"Utilities\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:36', '2026-03-05 14:26:36'),
(366, 'Ingredient Category Deleted', 'IngredientCategory', '4', '{\"name\":\"Wrapper\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:36', '2026-03-05 14:26:36'),
(367, 'Category Deleted', 'Category', '17', '{\"name\":\"[PW-TEST] ProdCat 1772720793923\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:36', '2026-03-05 14:26:36'),
(368, 'Supplier Created', 'Supplier', '15', '{\"name\":\"[PW-TEST] Supplier 1772720807928\",\"contactPerson\":\"Test Contact\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:47', '2026-03-05 14:26:47'),
(369, 'Supplier Updated', 'Supplier', '15', '{\"name\":\"[PW-TEST] Supplier 1772720807928 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:48', '2026-03-05 14:26:48'),
(370, 'Supplier Deleted', 'Supplier', '15', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:26:49', '2026-03-05 14:26:49'),
(371, 'Store Created', 'Store', '9', '{\"name\":\"[PW-TEST] Branch 1772720823181\",\"address\":\"123 Test St, Quezon City\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:27:02', '2026-03-05 14:27:02'),
(372, 'Store Updated', 'Store', '9', '{\"name\":\"[PW-TEST] Branch 1772720823181 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:27:04', '2026-03-05 14:27:04'),
(373, 'Store Deleted', 'Store', '9', '{\"name\":\"[PW-TEST] Branch 1772720823181 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:27:06', '2026-03-05 14:27:06'),
(374, 'Product Created', 'Product', '62', '{\"name\":\"[PW-TEST] Longganisa 1772721099762\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:31:39', '2026-03-05 14:31:39'),
(375, 'Product Deleted', 'Product', '62', '{\"name\":\"[PW-TEST] Longganisa 1772721099762\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 14:31:45', '2026-03-05 14:31:45'),
(376, 'User Created', 'User', '25', '{\"name\":\"[PW-TEST] Employee 1772723011543\",\"role\":\"STORE\",\"username\":\"[pw-test]_employee_1772723011543\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:03:31', '2026-03-05 15:03:31'),
(377, 'User Deleted', 'User', '25', '{\"name\":\"[PW-TEST] Employee 1772723011543\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:03:46', '2026-03-05 15:03:46'),
(378, 'Transaction Created', 'Transaction', '6', '{\"type\":\"Cash Out\",\"amount\":1,\"description\":\"[PW-TEST] Cash Out Test 1772723037458\",\"category\":\"Supplies\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-05 15:03:57', '2026-03-05 15:03:57'),
(379, 'User Created', 'User', '26', '{\"name\":\"[PW-TEST] Employee 1772723344648\",\"role\":\"STORE\",\"username\":\"[pw-test]_employee_1772723344648\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:09:04', '2026-03-05 15:09:04'),
(380, 'User Deleted', 'User', '26', '{\"name\":\"[PW-TEST] Employee 1772723344648\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:09:22', '2026-03-05 15:09:22'),
(381, 'User Created', 'User', '27', '{\"name\":\"[PW-TEST] Employee 1772723752307\",\"role\":\"STORE\",\"username\":\"[pw-test]_employee_1772723752307\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:15:51', '2026-03-05 15:15:51'),
(382, 'User Deleted', 'User', '27', '{\"name\":\"[PW-TEST] Employee 1772723752307\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:15:53', '2026-03-05 15:15:53'),
(383, 'Product Created', 'Product', '63', '{\"name\":\"[PW-TEST] Longganisa 1772723930595\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:18:51', '2026-03-05 15:18:51'),
(384, 'Product Default Ingredients Updated', 'Product', '63', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:18:52', '2026-03-05 15:18:52'),
(385, 'Product Updated', 'Product', '63', '{\"name\":\"[PW-TEST] Longganisa 1772723930595 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:18:52', '2026-03-05 15:18:52'),
(386, 'Product Deleted', 'Product', '63', '{\"name\":\"[PW-TEST] Longganisa 1772723930595 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:19:00', '2026-03-05 15:19:00'),
(387, 'Product Created', 'Product', '64', '{\"name\":\"[PW-TEST] Longganisa 1772723992403\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:19:52', '2026-03-05 15:19:52'),
(388, 'Product Default Ingredients Updated', 'Product', '64', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:19:54', '2026-03-05 15:19:54'),
(389, 'Product Updated', 'Product', '64', '{\"name\":\"[PW-TEST] Longganisa 1772723992403 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:19:54', '2026-03-05 15:19:54'),
(390, 'Product Deleted', 'Product', '64', '{\"name\":\"[PW-TEST] Longganisa 1772723992403 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:19:56', '2026-03-05 15:19:56'),
(391, 'Product Created', 'Product', '65', '{\"name\":\"[PW-TEST] Longganisa 1772724095898\",\"category\":\"Chicken\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:21:36', '2026-03-05 15:21:36'),
(392, 'Product Default Ingredients Updated', 'Product', '65', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:21:37', '2026-03-05 15:21:37'),
(393, 'Product Updated', 'Product', '65', '{\"name\":\"[PW-TEST] Longganisa 1772724095898 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:21:38', '2026-03-05 15:21:38'),
(394, 'Product Deleted', 'Product', '65', '{\"name\":\"[PW-TEST] Longganisa 1772724095898 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:21:40', '2026-03-05 15:21:40'),
(395, 'Ingredient Category Created', 'IngredientCategory', '15', '{\"name\":\"[PW-TEST] IngCat 1772724128209\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:07', '2026-03-05 15:22:07'),
(396, 'Ingredient Category Deleted', 'IngredientCategory', '15', '{\"name\":\"[PW-TEST] IngCat 1772724128209\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:08', '2026-03-05 15:22:08'),
(397, 'Category Created', 'Category', '18', '{\"name\":\"[PW-TEST] ProdCat 1772724133962\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:13', '2026-03-05 15:22:13'),
(398, 'Category Deleted', 'Category', '18', '{\"name\":\"[PW-TEST] ProdCat 1772724133962\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:14', '2026-03-05 15:22:14'),
(399, 'Supplier Created', 'Supplier', '16', '{\"name\":\"[PW-TEST] Supplier 1772724150724\",\"contactPerson\":\"Test Contact\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:30', '2026-03-05 15:22:30'),
(400, 'Supplier Updated', 'Supplier', '16', '{\"name\":\"[PW-TEST] Supplier 1772724150724 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:31', '2026-03-05 15:22:31'),
(401, 'Supplier Deleted', 'Supplier', '16', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:32', '2026-03-05 15:22:32'),
(402, 'Store Created', 'Store', '10', '{\"name\":\"[PW-TEST] Branch 1772724171879\",\"address\":\"123 Test St, Quezon City\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:51', '2026-03-05 15:22:51'),
(403, 'Store Updated', 'Store', '10', '{\"name\":\"[PW-TEST] Branch 1772724171879 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:53', '2026-03-05 15:22:53'),
(404, 'Store Deleted', 'Store', '10', '{\"name\":\"[PW-TEST] Branch 1772724171879 EDITED\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:22:54', '2026-03-05 15:22:54'),
(405, 'User Created', 'User', '28', '{\"name\":\"[PW-TEST] Employee 1772724275645\",\"role\":\"STORE\",\"username\":\"[pw-test]_employee_1772724275645\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:24:35', '2026-03-05 15:24:35'),
(406, 'User Deleted', 'User', '28', '{\"name\":\"[PW-TEST] Employee 1772724275645\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-05 15:24:36', '2026-03-05 15:24:36'),
(407, 'Transaction Created', 'Transaction', '7', '{\"type\":\"Cash Out\",\"amount\":1,\"description\":\"[PW-TEST] Cash Out Test 1772724292012\",\"category\":\"Supplies\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-05 15:24:51', '2026-03-05 15:24:51'),
(408, 'Production Started', 'ProductionRecord', '80', '{\"batchNumber\":\"B004\",\"categoryName\":\"GULAY MIX\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 07:57:29', '2026-03-06 07:57:29'),
(409, 'Mixing Completed', 'ProductionRecord', '80', '{\"batchNumber\":\"B004\",\"operator\":\"System Administrator\",\"category\":\"GULAY MIX\",\"totalIngredientsKg\":15,\"mixWeightKg\":100,\"mixingDiscrepancy\":-85,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 07:57:35', '2026-03-06 07:57:35'),
(410, 'Packing Completed', 'ProductionRecord', '80', '{\"batchNumber\":\"B004\",\"operator\":\"System Administrator\",\"category\":\"GULAY MIX\",\"mixWeightInputKg\":100,\"rawPackedItemsKg\":50,\"packingDiscrepancy\":50,\"packingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 07:58:03', '2026-03-06 07:58:03'),
(411, 'Production Started', 'ProductionRecord', '81', '{\"batchNumber\":\"B005\",\"categoryName\":\"SQUARE HAM MIX\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:04:39', '2026-03-06 08:04:39'),
(412, 'Mixing Completed', 'ProductionRecord', '81', '{\"batchNumber\":\"B005\",\"operator\":\"System Administrator\",\"category\":\"SQUARE HAM MIX\",\"totalIngredientsKg\":11,\"mixWeightKg\":100,\"mixingDiscrepancy\":-89,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:05:36', '2026-03-06 08:05:36'),
(413, 'Packing Completed', 'ProductionRecord', '81', '{\"batchNumber\":\"B005\",\"operator\":\"System Administrator\",\"category\":\"SQUARE HAM MIX\",\"mixWeightInputKg\":100,\"rawPackedItemsKg\":50,\"packingDiscrepancy\":50,\"packingDiscrepancyReason\":\"test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:06:10', '2026-03-06 08:06:10'),
(414, 'User Created', 'User', '29', '{\"name\":\"prod\",\"role\":\"PRODUCTION\",\"username\":\"prod\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:13:02', '2026-03-06 08:13:02'),
(415, 'User Updated', 'User', '29', '{\"name\":\"prod\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:13:11', '2026-03-06 08:13:11'),
(416, 'User Updated', 'User', '29', '{\"name\":\"prod\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 08:14:14', '2026-03-06 08:14:14');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('Cash In','Cash Out') NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `description` varchar(500) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `type`, `amount`, `description`, `category`, `reference`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'Cash In', 5000.00, 'Exy hardware', 'Other Income', 'Ft123', 'Ms. Bam', '2026-03-04 04:35:57', '2026-03-04 04:35:57'),
(5, 'Cash Out', 500.00, 'Test', 'Other Expenses', NULL, 'System Administrator', '2026-03-04 04:39:32', '2026-03-04 04:39:32'),
(6, 'Cash Out', 1.00, '[PW-TEST] Cash Out Test 1772723037458', 'Supplies', NULL, 'System Administrator', '2026-03-05 15:03:57', '2026-03-05 15:03:57'),
(7, 'Cash Out', 1.00, '[PW-TEST] Cash Out Test 1772724292012', 'Supplies', NULL, 'System Administrator', '2026-03-05 15:24:51', '2026-03-05 15:24:51');

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

CREATE TABLE `transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `from` varchar(255) NOT NULL,
  `to` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `quantity_received` decimal(10,2) DEFAULT NULL COMMENT 'Actual quantity received (for reconciliation)',
  `discrepancy_reason` varchar(255) DEFAULT NULL COMMENT 'Reason for any quantity discrepancy',
  `received_by` varchar(255) DEFAULT NULL COMMENT 'Name/ID of person who received the transfer',
  `received_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when transfer was received',
  `status` enum('Pending','In Transit','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `type` enum('forward','return_backorder','return_scrap') NOT NULL DEFAULT 'forward',
  `return_notes` text DEFAULT NULL,
  `requested_by` varchar(255) NOT NULL,
  `transferred_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `discrepancy` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transfers`
--

INSERT INTO `transfers` (`id`, `product_id`, `from`, `to`, `quantity`, `quantity_received`, `discrepancy_reason`, `received_by`, `received_at`, `status`, `type`, `return_notes`, `requested_by`, `transferred_by`, `created_at`, `updated_at`, `discrepancy`) VALUES
(32, 39, 'Production Facility', 'AB Market', 45.00, 45.00, NULL, 'admin', '2026-03-04 04:11:50', 'Completed', 'forward', NULL, '', 'calen', '2026-03-04 04:11:40', NULL, NULL),
(33, 36, 'Production Facility', 'Commissary', 45.00, 45.00, NULL, 'admin', '2026-03-04 04:13:24', 'Completed', 'forward', NULL, '', 'admin', '2026-03-04 04:13:19', NULL, NULL),
(34, 36, 'Commissary', 'AB Market', 45.00, 45.00, NULL, 'calen', '2026-03-04 04:14:57', 'Completed', 'forward', NULL, '', 'admin', '2026-03-04 04:14:30', NULL, NULL),
(35, 36, 'AB Market', 'Production Facility', 5.00, 5.00, NULL, 'calen', '2026-03-04 04:50:07', 'Completed', 'forward', NULL, '', 'calen', '2026-03-04 04:27:15', NULL, NULL),
(36, 36, 'AB Market', 'Commissary', 40.00, 40.00, NULL, 'admin', '2026-03-04 04:59:04', 'Completed', 'forward', NULL, '', 'admin', '2026-03-04 04:57:50', NULL, NULL),
(37, 39, 'AB Market', 'Commissary', 40.00, 40.00, NULL, 'admin', '2026-03-04 04:58:59', 'Completed', 'forward', NULL, '', 'calen', '2026-03-04 04:58:47', NULL, NULL),
(38, 35, 'Production Facility', 'AB Market', 11.00, 11.00, NULL, 'calen', '2026-03-04 05:08:09', 'Completed', 'forward', NULL, '', 'ms._bam', '2026-03-04 05:07:59', NULL, NULL),
(39, 39, '', 'AB Market', 4.00, 4.00, NULL, 'calen', '2026-03-04 05:09:03', 'Completed', 'forward', NULL, '', 'ms._bam', '2026-03-04 05:08:45', NULL, NULL),
(40, 36, 'Production Facility', 'AB Market', 11.00, 11.00, NULL, 'calen', '2026-03-04 05:14:18', 'Completed', 'forward', NULL, '', 'ms._bam', '2026-03-04 05:14:08', NULL, NULL),
(41, 37, '', 'AB Market', 12.00, 12.00, NULL, 'calen', '2026-03-04 05:14:52', 'Completed', 'forward', NULL, '', 'ms._bam', '2026-03-04 05:14:45', NULL, NULL),
(42, 39, 'Production Facility', 'AB Market', 5.50, 5.38, 'measurement-error', 'ms._bam', '2026-03-04 05:23:55', 'Completed', 'forward', NULL, '', 'ms._bam', '2026-03-04 05:22:53', NULL, NULL);

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
  `updated_at` timestamp NULL DEFAULT NULL,
  `employee_profile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `mobile`, `address`, `full_name`, `role`, `employee_role`, `store_id`, `permissions`, `can_login`, `password`, `remember_token`, `created_at`, `updated_at`, `employee_profile`) VALUES
(1, 'admin', 'admin@lztmeat.com', NULL, NULL, 'System Administrator', 'ADMIN', NULL, NULL, '\"[\\\"all\\\"]\"', 1, '$2y$12$YbfvgJJ1dnBSo5rHyHvDU.ndvorINxZBIC2ucyCbty0LwxJMG.0dS', NULL, '2026-01-30 10:56:01', '2026-01-30 10:56:01', NULL),
(6, 'ms._bam', NULL, '09216926051', 'Amparo', 'Ms. Bam', 'EMPLOYEE', 'Employee', 1, '[\"suppliers\",\"categories\",\"inventory\",\"production\",\"dashboard\",\"pos\",\"ingredients\",\"transfer\",\"sales\",\"employees\",\"history\",\"transactions\"]', 1, '$2y$12$TlrPPPXe.cKN1Hojr63Neu33G0DJCjqR5WH9Q5uWV4RtHymShixHS', NULL, '2026-02-01 21:40:52', '2026-03-04 04:33:54', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}'),
(18, 'OGAHAYON, NOLI', NULL, '09994072297', 'DUNGON STREET AMPARO SUBDIVISION CALOOCAN CITY', 'OGAHAYON, NOLI', 'PRODUCTION', NULL, 1, '[]', 1, '$2y$12$kMi3BmKVGWqaxHA3YqPEwuBSBuC5VzW479CPbOrpzRZDyNS9jXN1.', NULL, '2026-03-02 08:56:38', '2026-03-04 03:25:36', '{\"dateOfBirth\":\"1975-11-28\",\"gender\":\"Male\",\"civilStatus\":\"Married\",\"nationality\":\"FILIPINO\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"33-5794729-5\",\"philhealthNumber\":\"19-052274417-8\",\"tinNumber\":\"914-533-632\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"CARMELA OGAHAYON\",\"emergencyContactRelationship\":\"WIFE\",\"emergencyContactPhone\":\"\",\"dateHired\":\"2025-11-01\",\"position\":\"PRODUCTION STAFF\",\"department\":\"SIOMAI\",\"education\":[]}'),
(19, 'mark sioson', NULL, '09216926051', '', 'mark sioson', 'EMPLOYEE', NULL, 6, '[\"pos\",\"production\",\"dashboard\"]', 1, '$2y$12$CXo222v8lMcgTpEy5SGzXux0tQ2/AjrnYIyQikxAJNFNMdCqeJ/em', NULL, '2026-03-02 09:13:04', '2026-03-02 09:20:52', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}'),
(22, 'calen', NULL, '09216926051', '', 'calen', 'EMPLOYEE', NULL, NULL, '[\"dashboard\",\"pos\",\"transfer\",\"reports\"]', 1, '$2y$12$FL6/XFq0NlNrsd.V2gplseW0GG18DLKLSUqGayHJnqL5AqhcNoRTa', NULL, '2026-03-04 03:17:13', '2026-03-04 04:43:27', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}'),
(23, 'test', NULL, '09123456789', 'test', 'test', 'POS', NULL, 4, '[\"pos\"]', 1, '$2y$12$o9fHHyTh5esmMbYDSTqtQeRnUHAZjq0.Il4ujkh4/HyxvbqMHJo8e', NULL, '2026-03-04 03:46:11', '2026-03-04 03:46:21', '{\"dateOfBirth\":\"2026-03-04\",\"gender\":\"Male\",\"civilStatus\":\"Single\",\"nationality\":\"test\",\"bloodType\":\"A+\",\"height\":\"123\",\"weight\":\"123\",\"sssNumber\":\"123\",\"philhealthNumber\":\"123\",\"tinNumber\":\"123\",\"pagibigNumber\":\"123\",\"emergencyContactName\":\"test\",\"emergencyContactRelationship\":\"test\",\"emergencyContactPhone\":\"09123456789\",\"dateHired\":\"2026-03-04\",\"position\":\"test\",\"department\":\"test\",\"education\":[{\"school\":\"test\",\"degree\":\"test\",\"yearGraduated\":\"123\"}]}'),
(24, 'testing', NULL, '09123456789', 'testing', 'testing', 'EMPLOYEE', NULL, 4, '[\"dashboard\",\"pos\",\"production\",\"inventory\",\"categories\",\"ingredients\",\"transfer\",\"sales\",\"reports\",\"stores\",\"employees\",\"suppliers\",\"discounts\",\"history\",\"transactions\"]', 1, '$2y$12$5hKsgBUw5mca2nffTklgY.KXS1z62uGOjckofyXeOswbvEiFYvzrK', NULL, '2026-03-04 08:42:19', '2026-03-04 08:42:32', '{\"dateOfBirth\":\"2026-03-04\",\"gender\":\"Male\",\"civilStatus\":\"Single\",\"nationality\":\"testing\",\"bloodType\":\"A+\",\"height\":\"123\",\"weight\":\"123\",\"sssNumber\":\"123\",\"philhealthNumber\":\"123\",\"tinNumber\":\"123\",\"pagibigNumber\":\"123\",\"emergencyContactName\":\"testing\",\"emergencyContactRelationship\":\"testing\",\"emergencyContactPhone\":\"09123456789\",\"dateHired\":\"2026-03-04\",\"position\":\"testing\",\"department\":\"testing\",\"education\":[{\"school\":\"testing\",\"degree\":\"testing\",\"yearGraduated\":\"123\"}]}'),
(29, 'prod', NULL, '09123456789', 'prod', 'prod', 'PRODUCTION', NULL, 4, '[\"production_mix\",\"production_pack\"]', 1, '$2y$12$I2g/PPNeEGGQ5MinElkFNeAMKXkKzDsAvghTXXJNAdYugCQp3cZZq', NULL, '2026-03-06 08:13:02', '2026-03-06 08:14:14', '{\"dateOfBirth\":\"2026-03-06\",\"gender\":\"Male\",\"civilStatus\":\"Single\",\"nationality\":\"prod\",\"bloodType\":\"A+\",\"height\":\"123\",\"weight\":\"123\",\"sssNumber\":\"123\",\"philhealthNumber\":\"123\",\"tinNumber\":\"123\",\"pagibigNumber\":\"123\",\"emergencyContactName\":\"prod\",\"emergencyContactRelationship\":\"prod\",\"emergencyContactPhone\":\"09123456789\",\"dateHired\":\"2026-03-06\",\"position\":\"prod\",\"department\":\"prod\",\"education\":[{\"school\":\"prod\",\"degree\":\"prod\",\"yearGraduated\":\"123\"}]}');

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
-- Indexes for table `production_outputs`
--
ALTER TABLE `production_outputs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_production` (`production_record_id`),
  ADD KEY `idx_product` (`product_id`);

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
-- Indexes for table `product_default_ingredients`
--
ALTER TABLE `product_default_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_ingredient` (`product_id`,`ingredient_id`),
  ADD KEY `ingredient_id` (`ingredient_id`);

--
-- Indexes for table `product_mix_categories`
--
ALTER TABLE `product_mix_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_mix_categories_name_unique` (`name`);

--
-- Indexes for table `product_mix_category_default_ingredients`
--
ALTER TABLE `product_mix_category_default_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`product_mix_category_id`),
  ADD KEY `idx_ingredient` (`ingredient_id`);

--
-- Indexes for table `product_mix_inventory`
--
ALTER TABLE `product_mix_inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`product_mix_category_id`),
  ADD KEY `idx_production` (`production_record_id`);

--
-- Indexes for table `product_mix_items`
--
ALTER TABLE `product_mix_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_product` (`product_mix_category_id`,`product_id`),
  ADD KEY `idx_category` (`product_mix_category_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `raw_product_inventory`
--
ALTER TABLE `raw_product_inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`product_mix_category_id`),
  ADD KEY `idx_production` (`production_record_id`);

--
-- Indexes for table `report_entries`
--
ALTER TABLE `report_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_entry` (`report_date`,`store_id`,`cashier_id`,`product_id`);

--
-- Indexes for table `report_headers`
--
ALTER TABLE `report_headers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_header` (`report_date`,`store_id`,`cashier_id`);

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
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `discount_settings`
--
ALTER TABLE `discount_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `ingredient_categories`
--
ALTER TABLE `ingredient_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `production_ingredients`
--
ALTER TABLE `production_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `production_outputs`
--
ALTER TABLE `production_outputs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `production_records`
--
ALTER TABLE `production_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `product_default_ingredients`
--
ALTER TABLE `product_default_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `product_mix_categories`
--
ALTER TABLE `product_mix_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `product_mix_category_default_ingredients`
--
ALTER TABLE `product_mix_category_default_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=442;

--
-- AUTO_INCREMENT for table `product_mix_inventory`
--
ALTER TABLE `product_mix_inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `product_mix_items`
--
ALTER TABLE `product_mix_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `raw_product_inventory`
--
ALTER TABLE `raw_product_inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `report_entries`
--
ALTER TABLE `report_entries`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `report_headers`
--
ALTER TABLE `report_headers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `system_history`
--
ALTER TABLE `system_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=417;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `transfers`
--
ALTER TABLE `transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

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
-- Constraints for table `product_default_ingredients`
--
ALTER TABLE `product_default_ingredients`
  ADD CONSTRAINT `product_default_ingredients_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_default_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE;

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
