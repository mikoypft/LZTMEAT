-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 24, 2026 at 09:31 AM
-- Server version: 10.3.39-MariaDB-0ubuntu0.20.04.2-log
-- PHP Version: 8.4.17

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
-- Table structure for table `discounts`
--

CREATE TABLE `discounts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Discount',
  `wholesale_min_units` int(11) NOT NULL DEFAULT 5,
  `discount_type` varchar(50) NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `discounts`
--

INSERT INTO `discounts` (`id`, `name`, `wholesale_min_units`, `discount_type`, `discount_value`, `is_active`, `created_at`, `updated_at`) VALUES
(5, 'WHOLESALE FOR SIOMAI', 5, 'fixed_amount', 5.00, 1, '2026-03-09 09:20:04', '2026-03-11 07:15:41'),
(7, 'SABIT WHOLESALE', 5, 'fixed_amount', 5.00, 1, '2026-03-11 07:16:46', '2026-03-11 07:20:49'),
(8, 'SHANGHAI WHOLESALE', 10, 'fixed_amount', 5.00, 1, '2026-03-11 07:22:11', '2026-03-11 07:23:13'),
(9, 'CHEESEDOG & CHICKEN NUGGETS', 5, 'fixed_amount', 5.00, 1, '2026-03-11 07:24:45', '2026-03-11 11:19:12'),
(10, 'SQUARE HAM', 5, 'fixed_amount', 10.00, 1, '2026-03-11 07:26:23', '2026-03-11 07:27:41');

-- --------------------------------------------------------

--
-- Table structure for table `discount_product_map`
--

CREATE TABLE `discount_product_map` (
  `discount_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `discount_product_map`
--

INSERT INTO `discount_product_map` (`discount_id`, `product_id`) VALUES
(5, 49),
(5, 50),
(7, 30),
(7, 34),
(7, 35),
(7, 36),
(7, 37),
(7, 38),
(7, 39),
(7, 41),
(7, 44),
(7, 47),
(7, 55),
(7, 57),
(7, 58),
(8, 28),
(9, 42),
(9, 56),
(10, 59);

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
-- Table structure for table `discrepancy_adjustments`
--

CREATE TABLE `discrepancy_adjustments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sales_discrepancy_id` bigint(20) UNSIGNED NOT NULL,
  `store_name` varchar(255) NOT NULL DEFAULT '',
  `product_id` varchar(255) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL DEFAULT '',
  `quantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `unit_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cashier` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `discrepancy_adjustments`
--

INSERT INTO `discrepancy_adjustments` (`id`, `sales_discrepancy_id`, `store_name`, `product_id`, `product_name`, `quantity`, `unit`, `unit_cost`, `total_cost`, `cashier`, `user_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'AB Market', '42', 'Cheesedog', 1.000, 'kg', 1.00, 1.00, 'test pos', 48, 'test', '2026-03-15 08:13:58', '2026-03-15 08:13:58');

-- --------------------------------------------------------

--
-- Table structure for table `eod_stock_counts`
--

CREATE TABLE `eod_stock_counts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_name` varchar(255) NOT NULL DEFAULT '',
  `store_id` bigint(20) UNSIGNED DEFAULT NULL,
  `store_name` varchar(255) NOT NULL DEFAULT '',
  `shift_date` date NOT NULL,
  `shift` enum('AM','PM') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `eod_stock_counts`
--

INSERT INTO `eod_stock_counts` (`id`, `user_id`, `user_name`, `store_id`, `store_name`, `shift_date`, `shift`, `notes`, `created_at`, `updated_at`) VALUES
(1, 48, 'test pos', 4, 'AB Market', '2026-03-15', NULL, 'qwe', '2026-03-15 08:13:20', '2026-03-15 08:13:20'),
(2, 48, 'test pos', 4, 'AB Market', '2026-03-15', NULL, 'qwe', '2026-03-15 08:28:46', '2026-03-15 08:28:46'),
(3, 48, 'test pos', 4, 'AB Market', '2026-03-15', NULL, NULL, '2026-03-15 08:39:56', '2026-03-15 08:39:56'),
(4, 48, 'test pos', 4, 'AB Market', '2026-03-15', NULL, NULL, '2026-03-15 08:48:12', '2026-03-15 08:48:12'),
(5, 48, 'test pos', 4, 'AB Market', '2026-03-15', NULL, NULL, '2026-03-15 08:56:20', '2026-03-15 08:56:20');

-- --------------------------------------------------------

--
-- Table structure for table `eod_stock_count_items`
--

CREATE TABLE `eod_stock_count_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `eod_count_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` varchar(255) NOT NULL DEFAULT '',
  `product_name` varchar(255) NOT NULL DEFAULT '',
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `expected_qty` decimal(10,3) NOT NULL DEFAULT 0.000,
  `actual_qty` decimal(10,3) NOT NULL DEFAULT 0.000,
  `discrepancy` decimal(10,3) NOT NULL DEFAULT 0.000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `eod_stock_count_items`
--

INSERT INTO `eod_stock_count_items` (`id`, `eod_count_id`, `product_id`, `product_name`, `unit`, `expected_qty`, `actual_qty`, `discrepancy`, `created_at`) VALUES
(1, 1, '53', 'Ballham 1kg', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:13:20'),
(2, 1, '54', 'Ballham 500g', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:13:20'),
(3, 1, '35', 'Bologna Brown', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:13:20'),
(4, 1, '34', 'Bologna Red', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:13:20'),
(5, 1, '42', 'Cheesedog', 'kg', 98.000, 97.000, 1.000, '2026-03-15 08:13:20'),
(6, 1, '56', 'Chicken Nuggets', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(7, 1, '55', 'Longgadog Brown', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(8, 1, '39', 'Longgadog Red', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(9, 1, '58', 'Longganisa Brown', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(10, 1, '36', 'Longganisa Red', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(11, 1, '57', 'Meatballs', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(12, 1, '38', 'Medium Brown', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(13, 1, '37', 'Medium Red', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(14, 1, '47', 'Plastic Embotido', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(15, 1, '60', 'Plastic/dulo', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(16, 1, '44', 'Rolled Ham', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(17, 1, '28', 'Shanghai', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(18, 1, '50', 'Siomai White', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(19, 1, '49', 'Siomai Yellow', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(20, 1, '30', 'Skinless Plain', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(21, 1, '67', 'Skinless Red', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(22, 1, '59', 'Square Ham', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(23, 1, '41', 'Steamed Skinless', 'kg', 100.000, 100.000, 0.000, '2026-03-15 08:13:20'),
(24, 2, '53', 'Ballham 1kg', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:28:46'),
(25, 2, '54', 'Ballham 500g', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:28:46'),
(26, 2, '35', 'Bologna Brown', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:28:46'),
(27, 2, '34', 'Bologna Red', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:28:46'),
(28, 2, '42', 'Cheesedog', 'kg', 98.000, 97.000, 1.000, '2026-03-15 08:28:46'),
(29, 3, '53', 'Ballham 1kg', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:39:56'),
(30, 3, '54', 'Ballham 500g', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:39:56'),
(31, 3, '35', 'Bologna Brown', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:39:56'),
(32, 3, '34', 'Bologna Red', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:39:56'),
(33, 3, '42', 'Cheesedog', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:39:56'),
(34, 4, '53', 'Ballham 1kg', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:48:12'),
(35, 4, '54', 'Ballham 500g', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:48:12'),
(36, 4, '35', 'Bologna Brown', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:48:12'),
(37, 4, '34', 'Bologna Red', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:48:12'),
(38, 4, '42', 'Cheesedog', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:48:12'),
(39, 5, '53', 'Ballham 1kg', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:56:20'),
(40, 5, '54', 'Ballham 500g', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:56:20'),
(41, 5, '35', 'Bologna Brown', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:56:20'),
(42, 5, '34', 'Bologna Red', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:56:20'),
(43, 5, '42', 'Cheesedog', 'kg', 97.000, 97.000, 0.000, '2026-03-15 08:56:20');

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
(7, 'Molo White', 'ING-001', NULL, 'Wrapper', 'Pcs', 400.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:20:30', '2026-03-23 13:47:35'),
(8, 'Molo Yellow', 'ING-002', NULL, 'Wrapper', 'Pcs', 180.00, 500.00, 100.00, 17.00, 4, NULL, '2026-02-01 21:21:12', '2026-03-23 13:47:52'),
(9, 'CFAT', 'ING-003', NULL, 'Meat', 'Kg', 0.00, 80.00, 20.00, 140.00, 3, NULL, '2026-02-01 21:24:32', '2026-03-06 19:26:39'),
(10, 'MDM', 'ING-004', NULL, 'Raw Materials', '500Kg', 0.00, 100.00, 100.00, 76.00, 3, NULL, '2026-02-01 21:29:31', '2026-03-18 23:25:24'),
(11, 'Accord', 'ING-005', NULL, 'Spices', 'Kg', 39.00, 20.00, 5.00, 90.00, 8, NULL, '2026-02-03 18:19:50', '2026-03-23 13:49:00'),
(12, 'TVP Fine', 'ING-006', NULL, 'Raw Materials', 'Kg', 5.00, 50.00, 10.00, 82.00, 3, NULL, '2026-02-03 18:24:19', '2026-03-23 13:53:24'),
(13, 'Pine Apple Juice', 'ING-007', NULL, 'Seasonings', 'L', 0.00, 24.00, 5.00, 106.25, NULL, NULL, '2026-02-03 18:28:28', '2026-03-06 19:26:39'),
(14, 'Praque Powder', 'ING-008', NULL, 'Spices', 'kg', 20.00, 20.00, 5.00, 25.00, 8, NULL, '2026-02-10 01:48:20', '2026-03-23 13:49:29'),
(15, 'Ham Spice', 'ING-009', NULL, 'Spices', 'kg', 7.00, 5.00, 2.00, 170.00, 8, NULL, '2026-02-10 01:49:05', '2026-03-23 13:50:30'),
(16, 'Ham Flavor', 'ING-010', NULL, 'Spices', 'kg', 4.00, 5.00, 2.00, 170.00, 8, NULL, '2026-02-10 01:49:40', '2026-03-23 13:50:46'),
(17, 'Vitamin C', 'ING-011', NULL, 'Spices', 'kg', 3.00, 2.00, 1.00, 380.00, 8, NULL, '2026-02-10 01:50:09', '2026-03-23 13:51:30'),
(18, 'Sodium', 'ING-012', NULL, 'Spices', 'kg', 5.00, 5.00, 2.00, 230.00, 8, NULL, '2026-02-10 01:50:45', '2026-03-23 13:50:06'),
(19, 'Alexander', 'ING-013', NULL, 'Seasonings', 'L', 6.00, 8.00, 4.00, 69.33, 3, NULL, '2026-02-11 01:44:02', '2026-03-23 13:54:12'),
(20, 'Knorr Liquid Seasoning', 'ING-014', NULL, 'Seasonings', 'L', 6.00, 5.00, 2.00, 258.58, 3, NULL, '2026-02-11 01:45:06', '2026-03-23 14:01:25'),
(21, 'Tvp Gem', 'ING-015', NULL, 'Raw Materials', 'kg', 2.50, 20.00, 10.00, 82.00, 3, NULL, '2026-02-11 01:46:07', '2026-03-23 13:53:54'),
(22, 'Asin', 'ING-016', NULL, 'Raw Materials', 'kg', 125.00, 40.00, 10.00, 7.50, 3, NULL, '2026-02-11 01:51:09', '2026-03-23 14:00:15'),
(23, 'MSG-Vetsin', 'ING-017', NULL, 'Raw Materials', 'kg', 62.00, 25.00, 10.00, 48.00, 3, NULL, '2026-02-11 01:52:15', '2026-03-23 13:59:40'),
(24, 'Sugar', 'ING-018', NULL, 'Raw Materials', 'kg', 2000.00, 250.00, 100.00, 53.00, NULL, NULL, '2026-02-11 02:07:09', '2026-03-23 13:57:55'),
(25, 'Cornstarch', 'ING-019', NULL, 'Raw Materials', 'kg', 962.00, 200.00, 100.00, 36.00, NULL, NULL, '2026-02-11 02:07:59', '2026-03-23 13:58:54'),
(26, 'Giling-fat', 'ING-020', NULL, 'Raw Materials', 'kg', 0.00, 50.00, 25.00, 135.00, 3, NULL, '2026-02-11 02:12:52', '2026-03-04 02:59:29'),
(27, 'Carrots', 'ING-021', NULL, 'Raw Materials', 'kg', 0.00, 10.00, 5.00, 38.00, NULL, NULL, '2026-02-11 07:52:17', '2026-03-06 19:26:34'),
(28, 'Onion', 'ING-022', NULL, 'Raw Materials', 'kg', 0.00, 10.00, 5.00, 50.00, NULL, NULL, '2026-02-11 07:52:51', '2026-03-06 19:26:34'),
(29, 'Redbell Pepper', 'ING-023', NULL, 'Raw Materials', 'kg', 0.00, 2.00, 1.00, 150.00, NULL, NULL, '2026-02-11 07:53:44', '2026-03-06 19:26:34'),
(30, 'Celery', 'ING-024', NULL, 'Raw Materials', 'kg', 0.00, 2.00, 1.00, 90.00, NULL, NULL, '2026-02-11 07:54:24', '2026-03-06 19:26:34'),
(31, 'Garlic', 'ING-025', NULL, 'Raw Materials', 'kg', 0.00, 10.00, 5.00, 120.00, NULL, NULL, '2026-02-11 08:00:41', '2026-03-06 19:26:39'),
(32, 'Tali', 'ING-026', NULL, 'Raw Materials', 'pcs', 16.00, 60.00, 10.00, 80.00, 7, NULL, '2026-02-11 08:12:07', '2026-03-23 13:57:08'),
(33, 'Lumpia Wrapper', 'ING-027', NULL, 'Wrapper', '2bags', 2.00, 7.00, 2.00, 380.00, 18, NULL, '2026-02-11 09:22:12', '2026-03-23 13:48:18'),
(34, 'Hanks-isaw', 'ING-028', NULL, 'Raw Materials', '37', 18.00, 50.00, 10.00, 500.00, 6, NULL, '2026-02-11 09:24:29', '2026-03-23 13:53:05'),
(35, 'Cheese', 'ING-029', NULL, 'Raw Materials', 'pcs', 1.00, 10.00, 2.00, 145.00, NULL, NULL, '2026-02-11 09:27:11', '2026-03-23 14:01:47'),
(36, 'Multiblend', 'ING-030', NULL, 'Spices', 'kg', 5.00, 5.00, 2.00, 220.00, 3, NULL, '2026-02-11 09:28:43', '2026-03-23 13:51:48'),
(37, 'Curry Powder', 'ING-031', NULL, 'Spices', 'kg', 0.50, 3.00, 1.00, 250.00, NULL, NULL, '2026-02-11 09:29:16', '2026-03-23 14:02:10'),
(40, 'Gas', 'ING-034', NULL, 'Utilities', 'L', 1.00, 3.00, 1.00, 3425.00, 11, NULL, '2026-02-12 03:09:36', '2026-03-23 13:52:42'),
(41, '6X8', 'ING-035', NULL, 'Packaging Materials', 'pcs', 0.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:46:31', '2026-03-04 02:56:59'),
(42, '6X10', 'ING-036', NULL, 'Packaging Materials', 'pcs', 1.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:47:00', '2026-03-23 13:44:41'),
(43, 'PE 6X8', 'ING-037', NULL, 'Packaging Materials', 'pcs', 0.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:48:14', '2026-03-04 03:02:02'),
(44, 'PE X10', 'ING-038', NULL, 'Packaging Materials', 'pcs', 0.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:52:45', '2026-03-04 03:02:10'),
(45, '8X11', 'ING-039', NULL, 'Packaging Materials', 'pcs', 2.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:53:08', '2026-03-23 13:43:33'),
(46, '10X14', 'ING-040', NULL, 'Packaging Materials', 'pcs', 3.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:53:48', '2026-03-23 13:44:03'),
(47, '12X18', 'ING-041', NULL, 'Packaging Materials', 'pcs', 1.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:54:21', '2026-03-23 13:44:24'),
(48, 'Medium', 'ING-042', NULL, 'Packaging Materials', 'pcs', 6.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:54:49', '2026-03-23 13:45:49'),
(49, 'Large', 'ING-043', NULL, 'Packaging Materials', 'pcs', 8.00, 200.00, 100.00, 100.00, NULL, NULL, '2026-02-12 03:55:11', '2026-03-23 13:46:09'),
(50, 'Rollbag Big', 'ING-044', NULL, 'Packaging Materials', 'pcs', 4.00, 20.00, 4.00, 100.00, NULL, NULL, '2026-02-12 03:55:42', '2026-03-23 13:46:30'),
(51, 'Rollbag Small', 'ING-045', NULL, 'Packaging Materials', 'pcs', 2.00, 20.00, 4.00, 100.00, NULL, NULL, '2026-02-12 03:57:02', '2026-03-23 13:46:44'),
(52, 'Plastic Shanghai', 'ING-046', NULL, 'Packaging Materials', 'pcs', 1.00, 5.00, 1.00, 100.00, NULL, NULL, '2026-02-12 03:57:31', '2026-03-23 13:47:10'),
(53, 'Plastic Skinless', 'ING-047', NULL, 'Packaging Materials', 'pcs', 4.00, 5.00, 1.00, 100.00, NULL, NULL, '2026-02-12 03:57:57', '2026-03-23 13:55:16'),
(54, 'Strand Red', 'ING-048', NULL, 'Packaging Materials', 'pcs', 19.00, 10.00, 5.00, 200.00, NULL, NULL, '2026-02-12 03:58:20', '2026-03-23 13:55:36'),
(55, 'Strand White', 'ING-049', NULL, 'Packaging Materials', 'pcs', 6.00, 10.00, 5.00, 200.00, NULL, NULL, '2026-02-12 03:59:32', '2026-03-23 13:55:55'),
(56, 'Strand Clear', 'ING-050', NULL, 'Packaging Materials', 'pcs', 14.00, 10.00, 5.00, 200.00, NULL, NULL, '2026-02-12 04:00:19', '2026-03-23 13:56:20'),
(57, 'Strand Embo', 'ING-051', NULL, 'Packaging Materials', 'pcs', 37.00, 10.00, 5.00, 200.00, NULL, NULL, '2026-02-12 04:01:44', '2026-03-23 13:56:31'),
(58, 'Amiflex', 'ING-052', NULL, 'Packaging Materials', 'pcs', 1.00, 2.00, 1.00, 5000.00, 3, NULL, '2026-02-12 04:02:10', '2026-03-23 13:54:48'),
(61, 'Water', 'ING-053', NULL, 'Raw Materials', 'L', 0.00, 500.00, 1000.00, 5.00, 18, NULL, '2026-03-12 09:32:31', '2026-03-19 17:04:33');

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
(17, 'Raw Materials', '', '2026-03-12 09:28:43', '2026-03-12 09:28:43');

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
(2, 34, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(3, 36, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(4, 37, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(5, 39, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(6, 50, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(7, 67, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(8, 28, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(9, 30, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(10, 35, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(11, 38, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(12, 41, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(13, 42, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(14, 44, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(15, 47, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(16, 49, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(17, 53, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(18, 54, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(19, 55, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(20, 56, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(21, 57, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(22, 58, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(23, 59, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(24, 60, 'AB Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(25, 34, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(26, 36, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(27, 37, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(28, 39, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(29, 50, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(30, 67, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(31, 28, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(32, 30, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(33, 35, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(34, 38, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(35, 41, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(36, 42, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(37, 44, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(38, 47, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(39, 49, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(40, 53, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(41, 54, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(42, 55, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(43, 56, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(44, 57, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(45, 58, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(46, 59, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(47, 60, 'Amparo Store', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(48, 34, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(49, 36, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(50, 37, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(51, 39, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(52, 50, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(53, 67, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(54, 28, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(55, 30, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(56, 35, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(57, 38, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(58, 41, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(59, 42, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(60, 44, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(61, 47, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(62, 49, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(63, 53, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(64, 54, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(65, 55, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(66, 56, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(67, 57, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(68, 58, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(69, 59, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(70, 60, 'BO for Disposal', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(71, 34, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(72, 36, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(73, 37, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(74, 39, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(75, 50, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(76, 67, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(77, 28, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(78, 30, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(79, 35, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(80, 38, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(81, 41, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(82, 42, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(83, 44, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(84, 47, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(85, 49, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(86, 53, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(87, 54, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(88, 55, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(89, 56, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(90, 57, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(91, 58, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(92, 59, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(93, 60, 'BO for Recycle', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(94, 34, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(95, 36, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(96, 37, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(97, 39, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(98, 50, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(99, 67, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(100, 28, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(101, 30, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(102, 35, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(103, 38, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(104, 41, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(105, 42, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(106, 44, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(107, 47, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(108, 49, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(109, 53, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(110, 54, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(111, 55, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(112, 56, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(113, 57, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(114, 58, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(115, 59, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(116, 60, 'Commissary', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(117, 34, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(118, 36, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(119, 37, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(120, 39, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(121, 50, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(122, 67, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(123, 28, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(124, 30, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(125, 35, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(126, 38, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(127, 41, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(128, 42, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(129, 44, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(130, 47, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(131, 49, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(132, 53, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(133, 54, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(134, 55, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(135, 56, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(136, 57, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(137, 58, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(138, 59, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30'),
(139, 60, 'Susano Market', 0.00, '2026-03-14 10:48:15', '2026-03-16 09:34:30');

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
(1, 90, 66, 'Test Product', 95.00, 'kg', '2026-03-09 00:18:02', '2026-03-09 00:18:02');

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
(28, 'Shanghai', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:28:25', '2026-03-11 11:15:40', 1),
(30, 'Skinless Plain', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:30:37', '2026-03-12 09:19:14', 1),
(34, 'Bologna Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:33:43', '2026-03-11 12:01:54', 1),
(35, 'Bologna Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:34:18', '2026-03-11 12:01:24', 1),
(36, 'Longganisa Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:34:52', '2026-02-12 06:34:52', 1),
(37, 'Medium Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:35:28', '2026-02-12 06:35:28', 1),
(38, 'Medium Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:35:51', '2026-03-11 11:15:03', 1),
(39, 'Longgadog Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:36:27', '2026-02-12 06:36:27', 1),
(41, 'Steamed Skinless', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:37:28', '2026-03-11 11:16:16', 1),
(42, 'Cheesedog', 16, 140.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:37:50', '2026-03-12 09:15:00', 1),
(44, 'Rolled Ham', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:39:51', '2026-03-11 11:15:31', 1),
(47, 'Plastic Embotido', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 06:41:53', '2026-03-11 11:15:16', 1),
(49, 'Siomai Yellow', 16, 120.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 09:12:23', '2026-03-12 09:19:38', 1),
(50, 'Siomai White', 14, 120.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-02-12 10:09:59', '2026-03-12 09:19:29', 1),
(53, 'Ballham 1kg', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 04:57:08', '2026-03-12 09:14:20', 1),
(54, 'Ballham 500g', 16, 65.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:09:21', '2026-03-11 11:14:18', 1),
(55, 'Longgadog Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:11:29', '2026-03-04 05:11:29', 1),
(56, 'Chicken Nuggets', 16, 140.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:14:11', '2026-03-11 12:02:54', 1),
(57, 'Meatballs', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:14:39', '2026-03-04 05:14:39', 1),
(58, 'Longganisa Brown', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:15:14', '2026-03-04 05:15:14', 1),
(59, 'Square Ham', 16, 150.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:16:30', '2026-03-04 05:16:30', 1),
(60, 'Plastic/dulo', 16, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-04 05:17:24', '2026-03-04 05:17:24', 1),
(67, 'Skinless Red', 14, 130.00, 'kg', NULL, 0.00, 0.00, 0.00, '2026-03-11 11:17:48', '2026-03-12 09:20:38', 1);

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

-- --------------------------------------------------------

--
-- Table structure for table `product_fractional_prices`
--

CREATE TABLE `product_fractional_prices` (
  `product_id` int(11) NOT NULL,
  `fractional_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `threshold_weight` decimal(10,4) NOT NULL DEFAULT 1.0000
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `product_fractional_prices`
--

INSERT INTO `product_fractional_prices` (`product_id`, `fractional_price`, `created_at`, `updated_at`, `threshold_weight`) VALUES
(28, 65.00, '2026-03-11 11:25:50', '2026-03-11 11:25:50', 0.5000),
(30, 35.00, '2026-03-11 11:26:35', '2026-03-11 11:26:35', 0.2500),
(34, 35.00, '2026-03-11 11:20:51', '2026-03-11 11:20:51', 0.2500),
(35, 35.00, '2026-03-11 11:20:31', '2026-03-11 11:20:31', 0.2500),
(36, 35.00, '2026-03-11 11:23:23', '2026-03-11 11:23:23', 0.2500),
(37, 35.00, '2026-03-11 11:24:32', '2026-03-11 11:24:32', 0.2500),
(38, 35.00, '2026-03-11 11:24:19', '2026-03-11 11:24:19', 0.2500),
(39, 35.00, '2026-03-11 11:22:44', '2026-03-11 11:22:44', 0.2500),
(41, 35.00, '2026-03-11 11:27:16', '2026-03-11 11:27:16', 0.2500),
(42, 40.00, '2026-03-11 11:21:43', '2026-03-11 11:21:43', 0.2500),
(44, 35.00, '2026-03-11 11:25:36', '2026-03-11 11:25:36', 0.2500),
(47, 65.00, '2026-03-11 11:25:07', '2026-03-11 11:25:07', 0.5000),
(49, 30.00, '2026-03-11 11:26:24', '2026-03-11 11:26:24', 0.2500),
(50, 30.00, '2026-03-11 11:26:10', '2026-03-11 11:26:10', 0.2500),
(55, 35.00, '2026-03-11 11:22:44', '2026-03-11 11:22:44', 0.2500),
(56, 40.00, '2026-03-11 11:22:08', '2026-03-11 11:22:08', 0.2500),
(57, 35.00, '2026-03-11 11:23:43', '2026-03-11 11:23:43', 0.2500),
(58, 35.00, '2026-03-11 11:23:00', '2026-03-11 11:23:00', 0.2500),
(59, 40.00, '2026-03-11 11:27:07', '2026-03-11 11:27:07', 0.2500),
(67, 35.00, '2026-03-11 11:26:52', '2026-03-11 11:26:52', 0.2500);

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
(441, 9, 36, NULL, '2026-03-04 12:58:46', '2026-03-04 12:58:46'),
(442, 12, 60, NULL, '2026-03-06 19:47:28', '2026-03-06 19:47:28');

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
(1, 12, 'Test Mix', 12.00, 'kg', 0.00, 0.00, 82, '2026-03-06 19:48:19', '2026-03-07 10:35:39'),
(2, 12, 'Test Mix', 12.00, 'kg', 0.00, 0.00, 86, '2026-03-06 19:59:34', '2026-03-07 10:35:32'),
(3, 12, 'Test Mix', 12.00, 'kg', 0.00, 0.00, 87, '2026-03-06 20:00:05', '2026-03-07 10:35:32'),
(4, 12, 'Test Mix', 100.00, 'kg', 24.00, 0.00, 88, '2026-03-07 10:35:20', '2026-03-07 10:35:32');

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
(49, 9, 59, '2026-03-04 05:24:09', '2026-03-04 05:24:09'),
(50, 12, 66, '2026-03-06 19:47:16', '2026-03-06 19:47:16'),
(51, 7, 56, '2026-03-08 02:41:57', '2026-03-08 02:41:57');

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
(1, 12, 'Test Mix', 1.10, 'kg', 0.00, 0.00, 83, '2026-03-06 19:53:51', '2026-03-07 10:35:46'),
(2, 12, 'Test Mix', 5.00, 'kg', 0.00, 0.00, 85, '2026-03-06 19:58:53', '2026-03-07 10:35:46'),
(3, 12, 'Test Mix', 100.00, 'kg', 0.10, 0.00, 89, '2026-03-07 10:35:39', '2026-03-09 00:18:02');

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
(1, '2026-03-14', 0, 0, 53, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(2, '2026-03-14', 0, 0, 54, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(3, '2026-03-14', 0, 0, 35, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(4, '2026-03-14', 0, 0, 34, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(5, '2026-03-14', 0, 0, 42, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(6, '2026-03-14', 0, 0, 56, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(7, '2026-03-14', 0, 0, 55, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(8, '2026-03-14', 0, 0, 39, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(9, '2026-03-14', 0, 0, 58, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(10, '2026-03-14', 0, 0, 36, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(11, '2026-03-14', 0, 0, 57, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(12, '2026-03-14', 0, 0, 38, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(13, '2026-03-14', 0, 0, 37, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(14, '2026-03-14', 0, 0, 47, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(15, '2026-03-14', 0, 0, 60, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(16, '2026-03-14', 0, 0, 44, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(17, '2026-03-14', 0, 0, 28, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(18, '2026-03-14', 0, 0, 50, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(19, '2026-03-14', 0, 0, 49, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(20, '2026-03-14', 0, 0, 30, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(21, '2026-03-14', 0, 0, 67, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(22, '2026-03-14', 0, 0, 59, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00),
(23, '2026-03-14', 0, 0, 41, 0.000, 0.000, 0.000, 0.000, 0.000, '2026-03-14 09:20:13', '2026-03-14 09:20:13', 0.00);

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
(1, '2026-03-14', 0, 0, 'System Administrator', '', '2026-03-14 09:20:13', '2026-03-14 09:20:13', '{\"20\":0,\"50\":0,\"100\":0,\"200\":0,\"500\":0,\"1000\":0,\"5000\":0}', '[]', '{\"totalSales\":0,\"cashOut\":0,\"grossSales\":0,\"over\":0}');

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
  `updated_at` timestamp NULL DEFAULT NULL,
  `shift` enum('AM','PM') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_discrepancies`
--

CREATE TABLE `sales_discrepancies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `store_id` bigint(20) UNSIGNED DEFAULT NULL,
  `store_name` varchar(255) NOT NULL DEFAULT '',
  `product_id` varchar(255) NOT NULL DEFAULT '',
  `product_name` varchar(255) NOT NULL DEFAULT '',
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `shift_date` date NOT NULL,
  `shift` enum('AM','PM') DEFAULT NULL,
  `starting_stock` decimal(10,3) NOT NULL DEFAULT 0.000,
  `sales_quantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  `expected_remaining` decimal(10,3) NOT NULL DEFAULT 0.000,
  `reported_remaining` decimal(10,3) NOT NULL DEFAULT 0.000,
  `discrepancy_amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `cashier` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','adjusted') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

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
(1, 1, '53', 1.00, 130.00, 0.00, 130.00, '2026-03-14 10:52:21'),
(2, 1, '56', 2.00, 140.00, 0.00, 280.00, '2026-03-14 10:52:21'),
(3, 1, '55', 1.00, 130.00, 0.00, 130.00, '2026-03-14 10:52:21'),
(4, 1, '39', 1.00, 130.00, 0.00, 130.00, '2026-03-14 10:52:21'),
(5, 2, '38', 3.00, 130.00, 0.00, 390.00, '2026-03-14 10:52:33'),
(6, 3, '36', 1.00, 130.00, 0.00, 130.00, '2026-03-14 10:52:39'),
(7, 3, '56', 1.00, 140.00, 0.00, 140.00, '2026-03-14 10:52:39'),
(8, 3, '42', 1.00, 140.00, 0.00, 140.00, '2026-03-14 10:52:39'),
(9, 4, '53', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:06:00'),
(10, 4, '54', 1.00, 65.00, 0.00, 65.00, '2026-03-15 08:06:00'),
(11, 4, '35', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:06:00'),
(12, 4, '34', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:06:00'),
(13, 4, '42', 1.00, 140.00, 0.00, 140.00, '2026-03-15 08:06:00'),
(14, 5, '53', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:08:08'),
(15, 5, '54', 1.00, 65.00, 0.00, 65.00, '2026-03-15 08:08:08'),
(16, 5, '35', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:08:08'),
(17, 5, '34', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:08:08'),
(18, 5, '42', 1.00, 140.00, 0.00, 140.00, '2026-03-15 08:08:08'),
(19, 6, '53', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:10:00'),
(20, 6, '54', 1.00, 65.00, 0.00, 65.00, '2026-03-15 08:10:00'),
(21, 6, '35', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:10:00'),
(22, 6, '34', 1.00, 130.00, 0.00, 130.00, '2026-03-15 08:10:00');

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
(3, 61, 'Water', 'ING-053', 'add', 123.00, 0.00, 123.00, 'L', 'qwe', 1, 'System Administrator', '172.71.87.162', '2026-03-19 17:04:14', '2026-03-19 17:04:14'),
(4, 61, 'Water', 'ING-053', 'remove', 123.00, 123.00, 0.00, 'L', 'qwe', 1, 'System Administrator', '172.71.87.162', '2026-03-19 17:04:33', '2026-03-19 17:04:33'),
(5, 46, '10X14', 'ING-040', 'add', 1.00, 0.00, 1.00, 'pcs', 'Test', 1, 'System Administrator', '104.22.66.183', '2026-03-19 22:55:15', '2026-03-19 22:55:15'),
(6, 46, '10X14', 'ING-040', 'remove', 1.00, 1.00, 0.00, 'pcs', 'Tets', 1, 'System Administrator', '104.22.66.183', '2026-03-19 22:55:25', '2026-03-19 22:55:25'),
(7, 11, 'Accord', 'ING-005', 'add', 20.00, 0.00, 20.00, 'Kg', 'restock', 1, 'System Administrator', '162.158.88.154', '2026-03-20 01:33:59', '2026-03-20 01:33:59'),
(8, 45, '8X11', 'ING-039', 'add', 2.00, 0.00, 2.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 13:43:33', '2026-03-23 13:43:33'),
(9, 46, '10X14', 'ING-040', 'add', 3.00, 0.00, 3.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 13:44:02', '2026-03-23 13:44:02'),
(10, 47, '12X18', 'ING-041', 'add', 1.00, 0.00, 1.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 13:44:24', '2026-03-23 13:44:24'),
(11, 42, '6X10', 'ING-036', 'add', 1.00, 0.00, 1.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 13:44:41', '2026-03-23 13:44:41'),
(12, 48, 'Medium', 'ING-042', 'add', 6.00, 0.00, 6.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:45:49', '2026-03-23 13:45:49'),
(13, 49, 'Large', 'ING-043', 'add', 8.00, 0.00, 8.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:46:09', '2026-03-23 13:46:09'),
(14, 50, 'Rollbag Big', 'ING-044', 'add', 4.00, 0.00, 4.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:46:30', '2026-03-23 13:46:30'),
(15, 51, 'Rollbag Small', 'ING-045', 'add', 2.00, 0.00, 2.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:46:44', '2026-03-23 13:46:44'),
(16, 52, 'Plastic Shanghai', 'ING-046', 'add', 1.00, 0.00, 1.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:47:10', '2026-03-23 13:47:10'),
(17, 7, 'Molo White', 'ING-001', 'add', 400.00, 0.00, 400.00, 'Pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:47:35', '2026-03-23 13:47:35'),
(18, 8, 'Molo Yellow', 'ING-002', 'add', 180.00, 0.00, 180.00, 'Pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:47:52', '2026-03-23 13:47:52'),
(19, 33, 'Lumpia Wrapper', 'ING-027', 'add', 2.00, 0.00, 2.00, '2bags', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:48:18', '2026-03-23 13:48:18'),
(20, 11, 'Accord', 'ING-005', 'add', 19.00, 20.00, 39.00, 'Kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:49:00', '2026-03-23 13:49:00'),
(21, 14, 'Praque Powder', 'ING-008', 'add', 20.00, 0.00, 20.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:49:29', '2026-03-23 13:49:29'),
(22, 18, 'Sodium', 'ING-012', 'add', 5.00, 0.00, 5.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:50:06', '2026-03-23 13:50:06'),
(23, 15, 'Ham Spice', 'ING-009', 'add', 7.00, 0.00, 7.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:50:30', '2026-03-23 13:50:30'),
(24, 16, 'Ham Flavor', 'ING-010', 'add', 4.00, 0.00, 4.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:50:46', '2026-03-23 13:50:46'),
(25, 17, 'Vitamin C', 'ING-011', 'add', 3.00, 0.00, 3.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:51:30', '2026-03-23 13:51:30'),
(26, 36, 'Multiblend', 'ING-030', 'add', 5.00, 0.00, 5.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:51:47', '2026-03-23 13:51:47'),
(27, 40, 'Gas', 'ING-034', 'add', 1.00, 0.00, 1.00, 'L', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:52:42', '2026-03-23 13:52:42'),
(28, 34, 'Hanks-isaw', 'ING-028', 'add', 18.00, 0.00, 18.00, '37', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:53:05', '2026-03-23 13:53:05'),
(29, 12, 'TVP Fine', 'ING-006', 'add', 5.00, 0.00, 5.00, 'Kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:53:24', '2026-03-23 13:53:24'),
(30, 21, 'Tvp Gem', 'ING-015', 'add', 2.50, 0.00, 2.50, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:53:54', '2026-03-23 13:53:54'),
(31, 19, 'Alexander', 'ING-013', 'add', 6.00, 0.00, 6.00, 'L', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:54:12', '2026-03-23 13:54:12'),
(32, 58, 'Amiflex', 'ING-052', 'add', 1.00, 0.00, 1.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:54:48', '2026-03-23 13:54:48'),
(33, 53, 'Plastic Skinless', 'ING-047', 'add', 4.00, 0.00, 4.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:55:16', '2026-03-23 13:55:16'),
(34, 54, 'Strand Red', 'ING-048', 'add', 19.00, 0.00, 19.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:55:36', '2026-03-23 13:55:36'),
(35, 55, 'Strand White', 'ING-049', 'add', 6.00, 0.00, 6.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:55:55', '2026-03-23 13:55:55'),
(36, 56, 'Strand Clear', 'ING-050', 'add', 14.00, 0.00, 14.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:56:20', '2026-03-23 13:56:20'),
(37, 57, 'Strand Embo', 'ING-051', 'add', 37.00, 0.00, 37.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:56:31', '2026-03-23 13:56:31'),
(38, 32, 'Tali', 'ING-026', 'add', 16.00, 0.00, 16.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:57:08', '2026-03-23 13:57:08'),
(39, 24, 'Sugar', 'ING-018', 'add', 2000.00, 0.00, 2000.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:57:55', '2026-03-23 13:57:55'),
(40, 25, 'Cornstarch', 'ING-019', 'add', 37.00, 0.00, 37.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:58:26', '2026-03-23 13:58:26'),
(41, 25, 'Cornstarch', 'ING-019', 'add', 925.00, 37.00, 962.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:58:54', '2026-03-23 13:58:54'),
(42, 23, 'MSG-Vetsin', 'ING-017', 'add', 62.00, 0.00, 62.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 13:59:40', '2026-03-23 13:59:40'),
(43, 22, 'Asin', 'ING-016', 'add', 125.00, 0.00, 125.00, 'kg', 'restock', 1, 'System Administrator', '104.22.66.30', '2026-03-23 14:00:15', '2026-03-23 14:00:15'),
(44, 20, 'Knorr Liquid Seasoning', 'ING-014', 'add', 6.00, 0.00, 6.00, 'L', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 14:01:25', '2026-03-23 14:01:25'),
(45, 35, 'Cheese', 'ING-029', 'add', 1.00, 0.00, 1.00, 'pcs', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 14:01:47', '2026-03-23 14:01:47'),
(46, 37, 'Curry Powder', 'ING-031', 'add', 0.50, 0.00, 0.50, 'kg', 'restock', 1, 'System Administrator', '104.22.66.31', '2026-03-23 14:02:10', '2026-03-23 14:02:10');

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
(1, 'Amparo Store', 'Amparo,Caloocan City', 'Jeannalyn', '09608115448', 'store@lztmeat.com', 'active', '2026-01-30 10:56:01', '2026-03-11 12:34:13'),
(4, 'AB Market', 'Novaliches Quezon City', 'Reyrieza', '09514731424', '', 'active', '2026-02-01 21:43:24', '2026-03-11 12:30:28'),
(5, 'Susano Market', 'Novaliches Quezon City', '', '09514731424', '', 'active', '2026-02-03 18:30:26', '2026-03-11 12:33:52'),
(6, 'Commissary', 'Amparo Caloocan City', 'Administrator', '09473775014', 'lztmeat@gmail.com', 'active', '2026-02-03 18:33:10', '2026-03-11 12:33:02'),
(12, 'BO for Recycle', 'Novaliches Quezon City', '', '', '', 'active', '2026-03-09 00:19:07', '2026-03-11 12:31:59'),
(13, 'BO for Disposal', 'Novaliches Quezon City', '', '', '', 'active', '2026-03-09 00:19:21', '2026-03-11 12:31:27');

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
(3, 'DEA Meat Trading', 'Emelyn Asilo', '09998874720', '', 'Mabini St. Brgy. Sta Lucia North Fairview QC', '2026-02-01 21:14:17', '2026-03-11 11:47:14'),
(4, '4AG Dumpling Wrapper Trading', 'Alexis Gorrecita', '09338163062', '', 'Blk 46 Brgy.Longos Malabon City', '2026-02-01 21:16:25', '2026-03-11 11:41:14'),
(6, 'AP-Prime Casing Distributors Co.', 'Ms. Armie', '09176532564', '', '123 Labo St. Paang Bundok, La Loma Quezon City', '2026-02-01 21:16:58', '2026-03-11 11:44:55'),
(7, 'Monaco Manufacturing Corp', 'Sir Leo', '', '', 'Quezon City', '2026-02-01 21:17:15', '2026-03-11 11:51:21'),
(8, 'Spices Supplier', 'Kuya Loloy', '09291982871', '', 'Amparo Village Caloocan City', '2026-02-01 21:17:34', '2026-03-11 11:52:45'),
(11, 'JMT Aceron Gas', 'Joel', '09985456003', '', 'Amparo Village Caloocan City', '2026-02-12 03:08:53', '2026-03-11 11:48:16'),
(18, 'Other Supplier', 'Sir Lan', '09473775014', '', 'Amparo village Caloocan City', '2026-03-12 09:31:41', '2026-03-12 09:31:41');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_invoices`
--

CREATE TABLE `supplier_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `receipt_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier_invoices`
--

INSERT INTO `supplier_invoices` (`id`, `supplier_id`, `receipt_number`, `invoice_date`, `amount`, `paid`, `remarks`, `created_at`, `updated_at`) VALUES
(2, 4, '0437', '2026-03-11', 8500.00, 0.00, 'PAID', '2026-03-11 11:31:54', '2026-03-18 08:21:58'),
(3, 3, '102002', '2026-03-11', 55497.00, 0.00, 'PAID', '2026-03-11 11:33:18', '2026-03-18 08:23:50'),
(4, 3, '10170', '2026-03-10', 11977.00, 0.00, 'PAID', '2026-03-11 11:36:22', '2026-03-18 08:23:56'),
(5, 3, '10116', '2026-03-09', 61856.00, 0.00, 'PAID', '2026-03-11 11:37:02', '2026-03-18 08:24:03'),
(6, 3, '10357', '2026-03-13', 56786.00, 0.00, 'PAID', '2026-03-13 09:20:05', '2026-03-18 08:23:34'),
(7, 3, '10269', '2026-03-12', 52018.00, 0.00, 'PAID', '2026-03-13 09:20:36', '2026-03-18 08:23:42'),
(8, 3, '10065', '2026-03-08', 55460.00, 0.00, 'PAID', '2026-03-13 09:21:29', '2026-03-18 08:24:12'),
(9, 3, '10017', '2026-03-07', 10740.00, 0.00, 'PAID', '2026-03-13 09:21:44', '2026-03-18 08:24:20'),
(10, 3, '', '2026-03-06', 60128.00, 0.00, 'PAID', '2026-03-13 09:21:59', '2026-03-18 08:24:28'),
(11, 3, '9922', '2026-03-05', 50868.00, 0.00, 'PAID', '2026-03-13 09:22:20', '2026-03-18 08:24:35'),
(12, 3, '9870', '2026-03-04', 54542.00, 0.00, 'PAID', '2026-03-13 09:22:39', '2026-03-18 08:24:44'),
(13, 3, '9811', '2026-03-03', 47372.00, 0.00, 'PAID', '2026-03-13 09:23:01', '2026-03-18 08:24:51'),
(14, 3, '9701', '2026-03-02', 49617.00, 0.00, 'PAID', '2026-03-13 09:23:18', '2026-03-18 08:24:57'),
(15, 3, '9654', '2026-03-01', 45431.00, 0.00, 'PAID', '2026-03-13 09:23:35', '2026-03-18 08:25:03'),
(16, 4, '0447', '2026-03-13', 12750.00, 0.00, 'PAID', '2026-03-13 09:41:18', '2026-03-18 08:21:46'),
(17, 4, '0417', '2026-03-09', 8500.00, 0.00, 'PAID', '2026-03-13 09:42:02', '2026-03-18 08:22:08'),
(18, 4, '0405', '2026-03-06', 10200.00, 0.00, 'PAID', '2026-03-13 09:57:20', '2026-03-18 08:22:28'),
(19, 4, '0393', '2026-03-04', 8500.00, 0.00, 'PAID', '2026-03-13 09:57:39', '2026-03-18 08:22:34'),
(20, 4, '0378', '2026-03-02', 10200.00, 0.00, 'PAID', '2026-03-13 09:57:58', '2026-03-18 08:22:42'),
(21, 8, '', '2026-02-20', 6130.00, 0.00, 'PAID', '2026-03-13 10:09:54', '2026-03-18 08:28:02'),
(22, 8, '', '2026-02-26', 6130.00, 0.00, 'PAID', '2026-03-13 10:10:15', '2026-03-18 08:27:55'),
(23, 8, '', '2026-03-04', 3325.00, 0.00, 'PAID', '2026-03-13 10:10:34', '2026-03-18 08:27:50'),
(24, 8, '', '2026-03-09', 5635.00, 0.00, 'PAID', '2026-03-13 10:10:49', '2026-03-18 08:27:46'),
(25, 3, '10408', '2026-03-14', 5586.00, 0.00, 'PAID', '2026-03-16 01:34:45', '2026-03-18 08:23:24'),
(26, 3, '10438', '2026-03-15', 51224.00, 0.00, 'PAID', '2026-03-16 01:35:01', '2026-03-18 08:23:16'),
(27, 6, '8802', '2026-03-16', 25000.00, 25000.00, 'PAID', '2026-03-16 01:35:21', '2026-03-20 01:27:13'),
(28, 8, '', '2026-03-14', 5785.00, 0.00, 'PAID', '2026-03-16 01:35:50', '2026-03-18 08:27:38'),
(29, 3, '10483', '2026-03-16', 52830.00, 0.00, NULL, '2026-03-16 03:35:48', '2026-03-16 03:35:48'),
(30, 4, '0467', '2026-03-16', 8500.00, 0.00, NULL, '2026-03-16 10:08:47', '2026-03-16 10:08:47'),
(31, 3, '10533', '2026-03-17', 36000.00, 0.00, NULL, '2026-03-18 05:04:59', '2026-03-18 05:04:59'),
(32, 3, '10588', '2026-03-18', 51206.00, 0.00, NULL, '2026-03-18 08:58:07', '2026-03-18 08:58:07'),
(33, 4, '0480', '2026-03-18', 9350.00, 0.00, NULL, '2026-03-18 08:58:30', '2026-03-18 08:58:30'),
(34, 3, '10622', '2026-03-19', 58021.00, 0.00, NULL, '2026-03-19 03:31:30', '2026-03-19 03:31:30'),
(35, 8, '', '2026-03-19', 2820.00, 0.00, NULL, '2026-03-19 03:31:56', '2026-03-19 23:12:52'),
(37, 4, '0492', '2026-03-20', 10200.00, 0.00, NULL, '2026-03-23 02:54:16', '2026-03-23 02:54:16'),
(38, 3, '10674', '2026-03-20', 45900.00, 0.00, NULL, '2026-03-23 02:58:08', '2026-03-23 02:58:08'),
(39, 3, '10713', '2026-03-21', 11380.00, 0.00, NULL, '2026-03-23 02:58:28', '2026-03-23 02:58:28'),
(40, 3, '10752', '2026-03-22', 46820.00, 0.00, NULL, '2026-03-23 02:58:43', '2026-03-23 02:58:43'),
(41, 3, '10860', '2026-03-23', 61233.00, 0.00, NULL, '2026-03-23 02:58:58', '2026-03-23 02:58:58'),
(42, 8, '', '2026-03-23', 5220.00, 0.00, NULL, '2026-03-23 03:01:10', '2026-03-23 03:01:10'),
(43, 18, '', '2026-03-23', 150700.00, 0.00, 'KUYA JOEL-CORNS & SUGAR', '2026-03-23 03:08:09', '2026-03-23 03:08:09'),
(44, 4, '0506', '2026-03-23', 8500.00, 0.00, NULL, '2026-03-23 09:54:40', '2026-03-23 09:54:40');

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
(4, 'Ingredient Category Created', 'IngredientCategory', '16', '{\"name\":\"Test Ing Category\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:39:47', '2026-03-06 19:39:47'),
(5, 'Category Created', 'Category', '19', '{\"name\":\"Test Product Category\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:00', '2026-03-06 19:40:00'),
(6, 'Product Mix Category Created', 'ProductMixCategory', '12', '{\"name\":\"Test Mix Category\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:14', '2026-03-06 19:40:14'),
(7, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '12', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:14', '2026-03-06 19:40:14'),
(8, 'Product Mix Category Updated', 'ProductMixCategory', '12', '{\"name\":\"Test Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:26', '2026-03-06 19:40:26'),
(9, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '12', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:26', '2026-03-06 19:40:26'),
(10, 'Ingredient Category Updated', 'IngredientCategory', '16', '{\"name\":\"Test Ingredient\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:32', '2026-03-06 19:40:32'),
(11, 'Category Updated', 'Category', '19', '{\"name\":\"Test Product\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:40:37', '2026-03-06 19:40:37'),
(12, 'Supplier Created', 'Supplier', '17', '{\"name\":\"Test Supplier\",\"contactPerson\":\"Test Person\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:41:36', '2026-03-06 19:41:36'),
(13, 'Ingredient Created', 'Ingredient', '60', '{\"name\":\"Test Ingredient\",\"code\":\"ING-053\",\"unit\":\"kg\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:42:06', '2026-03-06 19:42:06'),
(14, 'Store Created', 'Store', '11', '{\"name\":\"Test Store\",\"address\":\"Test City\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:43:15', '2026-03-06 19:43:15'),
(15, 'User Created', 'User', '30', '{\"name\":\"Test Employee\",\"role\":\"EMPLOYEE\",\"username\":\"test_employee\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:44:55', '2026-03-06 19:44:55'),
(16, 'User Updated', 'User', '30', '{\"name\":\"Test Employee\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:45:13', '2026-03-06 19:45:13'),
(17, 'Inventory Adjustment', 'Ingredient', '60', '{\"ingredient\":\"Test Ingredient\",\"type\":\"add\",\"quantity\":123,\"previousStock\":0,\"newStock\":123,\"reason\":\"Test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:45:54', '2026-03-06 19:45:54'),
(18, 'Ingredient Updated', 'Ingredient', '60', '{\"name\":\"Test Ingredient\",\"code\":\"ING-053\",\"unit\":\"kg\",\"stock\":123,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:45:54', '2026-03-06 19:45:54'),
(19, 'Product Created', 'Product', '66', '{\"name\":\"Test Product\",\"category\":\"Test Product\",\"price\":123,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:46:49', '2026-03-06 19:46:49'),
(20, 'Product Added to Mix Category', 'ProductMixCategory', '12', '{\"productId\":\"66\",\"productName\":\"Test Product\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:47:16', '2026-03-06 19:47:16'),
(21, 'Product Mix Category Updated', 'ProductMixCategory', '12', '{\"name\":\"Test Mix\",\"description\":\"\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:47:28', '2026-03-06 19:47:28'),
(22, 'Mix Category Default Ingredients Updated', 'ProductMixCategory', '12', '{\"ingredientCount\":1,\"ingredients\":[\"Test Ingredient\"],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:47:28', '2026-03-06 19:47:28'),
(23, 'Production Started', 'ProductionRecord', '82', '{\"batchNumber\":\"B001\",\"categoryName\":\"Test Mix\",\"phase\":\"mixing\",\"operator\":\"Test Employee\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:47:52', '2026-03-06 19:47:52'),
(24, 'Mixing Completed', 'ProductionRecord', '82', '{\"batchNumber\":\"B001\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"totalIngredientsKg\":12,\"mixWeightKg\":12,\"mixingDiscrepancy\":0,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:48:19', '2026-03-06 19:48:19'),
(25, 'Packing Started (from mix inventory)', 'ProductionRecord', '83', '{\"batchNumber\":\"B002\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"mixWeight\":1,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:48:45', '2026-03-06 19:48:45'),
(26, 'Packing Completed', 'ProductionRecord', '83', '{\"batchNumber\":\"B002\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"mixWeightInputKg\":1,\"rawPackedItemsKg\":1.1,\"packingDiscrepancy\":-0.1,\"packingDiscrepancyReason\":\"Lost\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:53:51', '2026-03-06 19:53:51'),
(27, 'Cooking Started (from raw inventory)', 'ProductionRecord', '84', '{\"batchNumber\":\"B003\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"rawWeight\":1,\"ingredientsUsed\":0,\"note\":\"Cooking started directly from raw product inventory (packing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:55:00', '2026-03-06 19:55:00'),
(28, 'Production Deleted', 'ProductionRecord', '84', '{\"batchNumber\":\"B003\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:58:09', '2026-03-06 19:58:09'),
(29, 'Production Deleted', 'ProductionRecord', '83', '{\"batchNumber\":\"B002\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:58:10', '2026-03-06 19:58:10'),
(30, 'Production Deleted', 'ProductionRecord', '82', '{\"batchNumber\":\"B001\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:58:16', '2026-03-06 19:58:16'),
(31, 'Packing Started (from mix inventory)', 'ProductionRecord', '85', '{\"batchNumber\":\"B001\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"mixWeight\":5,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:58:38', '2026-03-06 19:58:38'),
(32, 'Packing Completed', 'ProductionRecord', '85', '{\"batchNumber\":\"B001\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"mixWeightInputKg\":5,\"rawPackedItemsKg\":5,\"packingDiscrepancy\":0,\"packingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:58:53', '2026-03-06 19:58:53'),
(33, 'Production Started', 'ProductionRecord', '86', '{\"batchNumber\":\"B002\",\"categoryName\":\"Test Mix\",\"phase\":\"mixing\",\"operator\":\"System Administrator\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:59:30', '2026-03-06 19:59:30'),
(34, 'Mixing Completed', 'ProductionRecord', '86', '{\"batchNumber\":\"B002\",\"operator\":\"System Administrator\",\"category\":\"Test Mix\",\"totalIngredientsKg\":12,\"mixWeightKg\":12,\"mixingDiscrepancy\":0,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 19:59:34', '2026-03-06 19:59:34'),
(35, 'Production Started', 'ProductionRecord', '87', '{\"batchNumber\":\"B003\",\"categoryName\":\"Test Mix\",\"phase\":\"mixing\",\"operator\":\"Test Employee\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 20:00:01', '2026-03-06 20:00:01'),
(36, 'Mixing Completed', 'ProductionRecord', '87', '{\"batchNumber\":\"B003\",\"operator\":\"Test Employee\",\"category\":\"Test Mix\",\"totalIngredientsKg\":12,\"mixWeightKg\":12,\"mixingDiscrepancy\":0,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-06 20:00:06', '2026-03-06 20:00:06'),
(37, 'Production Started', 'ProductionRecord', '88', '{\"batchNumber\":\"B004\",\"categoryName\":\"Test Mix\",\"phase\":\"mixing\",\"operator\":\"calen\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-07 10:35:12', '2026-03-07 10:35:12'),
(38, 'Mixing Completed', 'ProductionRecord', '88', '{\"batchNumber\":\"B004\",\"operator\":\"calen\",\"category\":\"Test Mix\",\"totalIngredientsKg\":1,\"mixWeightKg\":100,\"mixingDiscrepancy\":-99,\"mixingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-07 10:35:20', '2026-03-07 10:35:20'),
(39, 'Packing Started (from mix inventory)', 'ProductionRecord', '89', '{\"batchNumber\":\"B005\",\"operator\":\"calen\",\"category\":\"Test Mix\",\"mixWeight\":100,\"ingredientsUsed\":0,\"note\":\"Packing started directly from mix inventory (mixing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-07 10:35:32', '2026-03-07 10:35:32'),
(40, 'Packing Completed', 'ProductionRecord', '89', '{\"batchNumber\":\"B005\",\"operator\":\"calen\",\"category\":\"Test Mix\",\"mixWeightInputKg\":100,\"rawPackedItemsKg\":100,\"packingDiscrepancy\":0,\"packingDiscrepancyReason\":null,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-07 10:35:39', '2026-03-07 10:35:39'),
(41, 'Cooking Started (from raw inventory)', 'ProductionRecord', '90', '{\"batchNumber\":\"B006\",\"operator\":\"calen\",\"category\":\"Test Mix\",\"rawWeight\":10,\"ingredientsUsed\":0,\"note\":\"Cooking started directly from raw product inventory (packing step skipped)\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-07 10:35:46', '2026-03-07 10:35:46'),
(42, 'Product Added to Mix Category', 'ProductMixCategory', '7', '{\"productId\":\"56\",\"productName\":\"Chicken Nuggets\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-08 02:41:57', '2026-03-08 02:41:57'),
(43, 'Cooking Completed', 'ProductionRecord', '90', '{\"batchNumber\":\"B006\",\"operator\":\"calen\",\"category\":\"Test Mix\",\"rawPackedUsedKg\":95,\"totalOutputKg\":95,\"cookingDiscrepancy\":0,\"cookingDiscrepancyReason\":null,\"outputCount\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 00:18:02', '2026-03-09 00:18:02'),
(44, 'Store Created', 'Store', '12', '{\"name\":\"BO for Recycle\",\"address\":\"Amparo\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 00:19:07', '2026-03-09 00:19:07'),
(45, 'Store Created', 'Store', '13', '{\"name\":\"BO for Disposal\",\"address\":\"Amparo\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 00:19:21', '2026-03-09 00:19:21'),
(46, 'User Updated', 'User', '22', '{\"name\":\"calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:44:58', '2026-03-09 01:44:58'),
(47, 'User Created', 'User', '31', '{\"name\":\"Reyrieza Rueda\",\"role\":\"EMPLOYEE\",\"username\":\"reyrieza_rueda\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:45:55', '2026-03-09 01:45:55'),
(48, 'User Deleted', 'User', '31', '{\"name\":\"Reyrieza Rueda\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:46:45', '2026-03-09 01:46:45'),
(49, 'User Created', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"username\":\"eden\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:47:50', '2026-03-09 01:47:50'),
(50, 'User Created', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"username\":\"jeannalyn\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:50:25', '2026-03-09 01:50:25'),
(51, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:54:11', '2026-03-09 01:54:11'),
(52, 'User Created', 'User', '34', '{\"name\":\"Maryrose\",\"role\":\"EMPLOYEE\",\"username\":\"maryrose\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:54:55', '2026-03-09 01:54:55'),
(53, 'User Created', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"EMPLOYEE\",\"username\":\"reyrieza\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:55:54', '2026-03-09 01:55:54'),
(54, 'User Created', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"EMPLOYEE\",\"username\":\"sherryl\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 01:57:04', '2026-03-09 01:57:04'),
(55, 'User Deleted', 'User', '30', '{\"name\":\"Test Employee\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 02:04:16', '2026-03-09 02:04:16'),
(56, 'User Created', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"username\":\"test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 02:05:46', '2026-03-09 02:05:46'),
(57, 'User Updated', 'User', '6', '{\"name\":\"Ms. Bam\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:05:06', '2026-03-09 03:05:06'),
(58, 'User Created', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"username\":\"norilyn\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:06:41', '2026-03-09 03:06:41'),
(59, 'User Created', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"EMPLOYEE\",\"username\":\"rejean\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:07:07', '2026-03-09 03:07:07'),
(60, 'User Created', 'User', '40', '{\"name\":\"Julian\",\"role\":\"EMPLOYEE\",\"username\":\"julian\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:07:37', '2026-03-09 03:07:37'),
(61, 'User Created', 'User', '41', '{\"name\":\"Vincent\",\"role\":\"EMPLOYEE\",\"username\":\"vincent\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:08:03', '2026-03-09 03:08:03'),
(62, 'User Created', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"username\":\"analyn\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:09:44', '2026-03-09 03:09:44'),
(63, 'User Created', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"username\":\"bruce\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:10:40', '2026-03-09 03:10:40'),
(64, 'User Updated', 'User', '18', '{\"name\":\"Noli\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:11:27', '2026-03-09 03:11:27'),
(65, 'User Created', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"username\":\"wilson\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 03:11:57', '2026-03-09 03:11:57'),
(66, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:52:58', '2026-03-09 07:52:58'),
(67, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:53:57', '2026-03-09 07:53:57'),
(68, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:54:20', '2026-03-09 07:54:20'),
(69, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:54:22', '2026-03-09 07:54:22'),
(70, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:54:28', '2026-03-09 07:54:28'),
(71, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:54:32', '2026-03-09 07:54:32'),
(72, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:56:48', '2026-03-09 07:56:48'),
(73, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 07:57:54', '2026-03-09 07:57:54'),
(74, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:03:15', '2026-03-09 08:03:15'),
(75, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:03:33', '2026-03-09 08:03:33'),
(76, 'User Updated', 'User', '40', '{\"name\":\"Julian\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:05:49', '2026-03-09 08:05:49'),
(77, 'User Updated', 'User', '34', '{\"name\":\"Maryrose\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:06:13', '2026-03-09 08:06:13'),
(78, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:07:01', '2026-03-09 08:07:01'),
(79, 'User Updated', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:07:27', '2026-03-09 08:07:27'),
(80, 'User Updated', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:07:58', '2026-03-09 08:07:58'),
(81, 'User Updated', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"STORE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:08:20', '2026-03-09 08:08:20'),
(82, 'User Updated', 'User', '41', '{\"name\":\"Vincent\",\"role\":\"PRODUCTION\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:08:39', '2026-03-09 08:08:39'),
(83, 'Transaction Created', 'Transaction', '1', '{\"type\":\"Cash In\",\"amount\":123,\"description\":\"qwe\",\"category\":\"Sales\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-09 08:12:06', '2026-03-09 08:12:06'),
(84, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:14:49', '2026-03-09 08:14:49'),
(85, 'User Updated', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:15:17', '2026-03-09 08:15:17'),
(86, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:15:28', '2026-03-09 08:15:28'),
(87, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:17:49', '2026-03-09 08:17:49'),
(88, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:22:42', '2026-03-09 08:22:42'),
(89, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:22:58', '2026-03-09 08:22:58'),
(90, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:24:34', '2026-03-09 08:24:34'),
(91, 'User Updated', 'User', '40', '{\"name\":\"Julian\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:25:23', '2026-03-09 08:25:23'),
(92, 'User Updated', 'User', '34', '{\"name\":\"Maryrose\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:25:45', '2026-03-09 08:25:45'),
(93, 'User Updated', 'User', '6', '{\"name\":\"Ms. Bam\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:29:06', '2026-03-09 08:29:06'),
(94, 'User Updated', 'User', '18', '{\"name\":\"Noli\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:29:58', '2026-03-09 08:29:58'),
(95, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:30:21', '2026-03-09 08:30:21'),
(96, 'User Updated', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:30:49', '2026-03-09 08:30:49'),
(97, 'User Updated', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:31:19', '2026-03-09 08:31:19'),
(98, 'User Updated', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:31:42', '2026-03-09 08:31:42'),
(99, 'User Updated', 'User', '41', '{\"name\":\"Vincent\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:32:17', '2026-03-09 08:32:17'),
(100, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:33:14', '2026-03-09 08:33:14'),
(101, 'User Updated', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:40:15', '2026-03-09 08:40:15'),
(102, 'User Updated', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:43:14', '2026-03-09 08:43:14'),
(103, 'User Updated', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 08:44:33', '2026-03-09 08:44:33'),
(104, 'Transaction Created', 'Transaction', '2', '{\"type\":\"Cash Out\",\"amount\":120,\"description\":\"WILSON\",\"category\":\"Salaries\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-09 09:30:26', '2026-03-09 09:30:26'),
(105, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-09 09:37:32', '2026-03-09 09:37:32'),
(106, 'Production Deleted', 'ProductionRecord', '90', '{\"batchNumber\":\"B006\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:23', '2026-03-11 08:41:23'),
(107, 'Production Deleted', 'ProductionRecord', '89', '{\"batchNumber\":\"B005\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:29', '2026-03-11 08:41:29'),
(108, 'Production Deleted', 'ProductionRecord', '88', '{\"batchNumber\":\"B004\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:31', '2026-03-11 08:41:31'),
(109, 'Production Deleted', 'ProductionRecord', '87', '{\"batchNumber\":\"B003\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:33', '2026-03-11 08:41:33'),
(110, 'Production Deleted', 'ProductionRecord', '86', '{\"batchNumber\":\"B002\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:35', '2026-03-11 08:41:35'),
(111, 'Production Deleted', 'ProductionRecord', '85', '{\"batchNumber\":\"B001\",\"categoryName\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:40', '2026-03-11 08:41:40'),
(112, 'Product Deleted', 'Product', '66', '{\"name\":\"Test Product\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:41:55', '2026-03-11 08:41:55'),
(113, 'Ingredient Category Deleted', 'IngredientCategory', '16', '{\"name\":\"Test Ingredient\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:01', '2026-03-11 08:42:01'),
(114, 'Category Deleted', 'Category', '19', '{\"name\":\"Test Product\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:03', '2026-03-11 08:42:03'),
(115, 'Product Mix Category Deleted', 'ProductMixCategory', '12', '{\"name\":\"Test Mix\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:06', '2026-03-11 08:42:06'),
(116, 'Ingredient Deleted', 'Ingredient', '60', '{\"name\":\"Test Ingredient\",\"code\":\"ING-053\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:17', '2026-03-11 08:42:17'),
(117, 'Store Deleted', 'Store', '11', '{\"name\":\"Test Store\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:27', '2026-03-11 08:42:27'),
(118, 'User Deleted', 'User', '37', '{\"name\":\"Test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:33', '2026-03-11 08:42:33'),
(119, 'Supplier Deleted', 'Supplier', '17', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 08:42:37', '2026-03-11 08:42:37'),
(120, 'Product Default Ingredients Updated', 'Product', '53', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:09', '2026-03-11 11:14:09'),
(121, 'Product Updated', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:09', '2026-03-11 11:14:09'),
(122, 'Product Default Ingredients Updated', 'Product', '54', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:18', '2026-03-11 11:14:18'),
(123, 'Product Updated', 'Product', '54', '{\"name\":\"Ballham 500g\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:18', '2026-03-11 11:14:18'),
(124, 'Product Default Ingredients Updated', 'Product', '35', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:27', '2026-03-11 11:14:27'),
(125, 'Product Updated', 'Product', '35', '{\"name\":\"Bologna Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:27', '2026-03-11 11:14:27'),
(126, 'Product Default Ingredients Updated', 'Product', '34', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:32', '2026-03-11 11:14:32'),
(127, 'Product Updated', 'Product', '34', '{\"name\":\"Bologna Red\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:32', '2026-03-11 11:14:32'),
(128, 'Product Default Ingredients Updated', 'Product', '42', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:41', '2026-03-11 11:14:41'),
(129, 'Product Updated', 'Product', '42', '{\"name\":\"Cheesedog\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:14:41', '2026-03-11 11:14:41'),
(130, 'Product Default Ingredients Updated', 'Product', '38', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:03', '2026-03-11 11:15:03'),
(131, 'Product Updated', 'Product', '38', '{\"name\":\"Medium Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:03', '2026-03-11 11:15:03'),
(132, 'Product Default Ingredients Updated', 'Product', '47', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:16', '2026-03-11 11:15:16'),
(133, 'Product Updated', 'Product', '47', '{\"name\":\"Plastic Embotido\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:16', '2026-03-11 11:15:16'),
(134, 'Product Default Ingredients Updated', 'Product', '44', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:31', '2026-03-11 11:15:31'),
(135, 'Product Updated', 'Product', '44', '{\"name\":\"Rolled Ham\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:31', '2026-03-11 11:15:31'),
(136, 'Product Default Ingredients Updated', 'Product', '28', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:40', '2026-03-11 11:15:40'),
(137, 'Product Updated', 'Product', '28', '{\"name\":\"Shanghai\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:40', '2026-03-11 11:15:40'),
(138, 'Product Updated', 'Product', '49', '{\"name\":\"Siomai Yellow\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:15:50', '2026-03-11 11:15:50'),
(139, 'Product Updated', 'Product', '30', '{\"name\":\"Skinless Plain\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:16:05', '2026-03-11 11:16:05'),
(140, 'Product Default Ingredients Updated', 'Product', '41', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:16:16', '2026-03-11 11:16:16'),
(141, 'Product Updated', 'Product', '41', '{\"name\":\"Steamed Skinless\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:16:16', '2026-03-11 11:16:16'),
(142, 'Product Created', 'Product', '67', '{\"name\":\"Skinless Red\",\"category\":\"Pork\",\"price\":130,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:17:48', '2026-03-11 11:17:48'),
(143, 'Supplier Updated', 'Supplier', '4', '{\"name\":\"4AG Dumpling Wrapper Trading\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:41:14', '2026-03-11 11:41:14'),
(144, 'Supplier Updated', 'Supplier', '4', '{\"name\":\"4AG Dumpling Wrapper Trading\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:41:14', '2026-03-11 11:41:14'),
(145, 'Supplier Updated', 'Supplier', '4', '{\"name\":\"4AG Dumpling Wrapper Trading\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:41:14', '2026-03-11 11:41:14'),
(146, 'Supplier Updated', 'Supplier', '6', '{\"name\":\"AP-Prime Casing Distributors Co.\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:44:55', '2026-03-11 11:44:55'),
(147, 'Supplier Updated', 'Supplier', '6', '{\"name\":\"AP-Prime Casing Distributors Co.\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:44:55', '2026-03-11 11:44:55'),
(148, 'Supplier Updated', 'Supplier', '3', '{\"name\":\"DEA Meat Trading\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:47:14', '2026-03-11 11:47:14'),
(149, 'Supplier Updated', 'Supplier', '3', '{\"name\":\"DEA Meat Trading\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:47:14', '2026-03-11 11:47:14'),
(150, 'Supplier Updated', 'Supplier', '11', '{\"name\":\"JMT Aceron Gas\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:48:16', '2026-03-11 11:48:16'),
(151, 'Supplier Updated', 'Supplier', '7', '{\"name\":\"Monaco Manufacturing Corp\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:51:21', '2026-03-11 11:51:21'),
(152, 'Supplier Updated', 'Supplier', '8', '{\"name\":\"Spices Supplier\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:51:34', '2026-03-11 11:51:34'),
(153, 'Supplier Updated', 'Supplier', '8', '{\"name\":\"Spices Supplier\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:52:45', '2026-03-11 11:52:45'),
(154, 'Supplier Deleted', 'Supplier', '9', '{\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 11:53:05', '2026-03-11 11:53:05'),
(155, 'Product Default Ingredients Updated', 'Product', '35', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:01:24', '2026-03-11 12:01:24'),
(156, 'Product Updated', 'Product', '35', '{\"name\":\"Bologna Brown\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:01:24', '2026-03-11 12:01:24'),
(157, 'Product Default Ingredients Updated', 'Product', '34', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:01:54', '2026-03-11 12:01:54'),
(158, 'Product Updated', 'Product', '34', '{\"name\":\"Bologna Red\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:01:54', '2026-03-11 12:01:54'),
(159, 'Product Default Ingredients Updated', 'Product', '42', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:02:36', '2026-03-11 12:02:36'),
(160, 'Product Updated', 'Product', '42', '{\"name\":\"Cheesedog\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:02:36', '2026-03-11 12:02:36'),
(161, 'Product Default Ingredients Updated', 'Product', '56', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:02:54', '2026-03-11 12:02:54'),
(162, 'Product Updated', 'Product', '56', '{\"name\":\"Chicken Nuggets\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:02:54', '2026-03-11 12:02:54'),
(163, 'Store Updated', 'Store', '4', '{\"name\":\"AB Market\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:28:50', '2026-03-11 12:28:50'),
(164, 'Store Updated', 'Store', '1', '{\"name\":\"Amparo Store\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:30:14', '2026-03-11 12:30:14'),
(165, 'Store Updated', 'Store', '4', '{\"name\":\"AB Market\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:30:28', '2026-03-11 12:30:28'),
(166, 'Store Updated', 'Store', '13', '{\"name\":\"BO for Disposal\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:30:58', '2026-03-11 12:30:58'),
(167, 'Store Updated', 'Store', '13', '{\"name\":\"BO for Disposal\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:31:27', '2026-03-11 12:31:27'),
(168, 'Store Updated', 'Store', '12', '{\"name\":\"BO for Recycle\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:31:59', '2026-03-11 12:31:59'),
(169, 'Store Updated', 'Store', '6', '{\"name\":\"Commissary\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:33:02', '2026-03-11 12:33:02'),
(170, 'Store Updated', 'Store', '5', '{\"name\":\"Susano Market\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:33:52', '2026-03-11 12:33:52'),
(171, 'Store Updated', 'Store', '1', '{\"name\":\"Amparo Store\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-11 12:34:13', '2026-03-11 12:34:13'),
(172, 'Product Default Ingredients Updated', 'Product', '53', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 08:12:36', '2026-03-12 08:12:36'),
(173, 'Product Updated', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 08:12:36', '2026-03-12 08:12:36'),
(174, 'Product Default Ingredients Updated', 'Product', '53', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 08:12:54', '2026-03-12 08:12:54'),
(175, 'Product Updated', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 08:12:54', '2026-03-12 08:12:54'),
(176, 'Product Default Ingredients Updated', 'Product', '53', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:14:20', '2026-03-12 09:14:20'),
(177, 'Product Updated', 'Product', '53', '{\"name\":\"Ballham 1kg\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:14:20', '2026-03-12 09:14:20'),
(178, 'Product Default Ingredients Updated', 'Product', '42', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:15:00', '2026-03-12 09:15:00'),
(179, 'Product Updated', 'Product', '42', '{\"name\":\"Cheesedog\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:15:00', '2026-03-12 09:15:00'),
(180, 'Product Default Ingredients Updated', 'Product', '30', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:14', '2026-03-12 09:19:14'),
(181, 'Product Updated', 'Product', '30', '{\"name\":\"Skinless Plain\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:14', '2026-03-12 09:19:14'),
(182, 'Product Default Ingredients Updated', 'Product', '50', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:29', '2026-03-12 09:19:29'),
(183, 'Product Updated', 'Product', '50', '{\"name\":\"Siomai White\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:29', '2026-03-12 09:19:29'),
(184, 'Product Default Ingredients Updated', 'Product', '49', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:38', '2026-03-12 09:19:38'),
(185, 'Product Updated', 'Product', '49', '{\"name\":\"Siomai Yellow\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:19:38', '2026-03-12 09:19:38'),
(186, 'Product Default Ingredients Updated', 'Product', '67', '{\"ingredientCount\":0,\"ingredients\":[],\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:20:38', '2026-03-12 09:20:38'),
(187, 'Product Updated', 'Product', '67', '{\"name\":\"Skinless Red\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:20:38', '2026-03-12 09:20:38'),
(188, 'Ingredient Category Created', 'IngredientCategory', '17', '{\"name\":\"Raw Materials\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:28:43', '2026-03-12 09:28:43'),
(189, 'Supplier Created', 'Supplier', '18', '{\"name\":\"Other Supplier\",\"contactPerson\":\"Sir Lan\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:31:41', '2026-03-12 09:31:41'),
(190, 'Ingredient Created', 'Ingredient', '61', '{\"name\":\"Water\",\"code\":\"ING-053\",\"unit\":\"L\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-12 09:32:31', '2026-03-12 09:32:31'),
(191, 'User Updated', 'User', '6', '{\"name\":\"Margarette Franco\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 01:00:48', '2026-03-13 01:00:48'),
(192, 'User Updated', 'User', '6', '{\"name\":\"Margarette Franco\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 01:00:48', '2026-03-13 01:00:48'),
(193, 'User Deleted', 'User', '19', '{\"name\":\"mark sioson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 01:01:05', '2026-03-13 01:01:05'),
(194, 'User Updated', 'User', '6', '{\"name\":\"Margarette\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 01:02:42', '2026-03-13 01:02:42'),
(195, 'User Deleted', 'User', '6', '{\"name\":\"Margarette\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:25:35', '2026-03-13 06:25:35'),
(196, 'User Created', 'User', '45', '{\"name\":\"Margarette\",\"role\":\"EMPLOYEE\",\"username\":\"margarette\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:28:41', '2026-03-13 06:28:41'),
(198, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(199, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(200, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(201, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(202, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(203, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(204, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(205, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(206, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(207, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(208, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:34:41', '2026-03-13 06:34:41'),
(209, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 06:35:43', '2026-03-13 06:35:43'),
(210, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 08:28:41', '2026-03-13 08:28:41'),
(211, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 08:28:44', '2026-03-13 08:28:44'),
(212, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 08:30:05', '2026-03-13 08:30:05'),
(213, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 08:31:37', '2026-03-13 08:31:37'),
(214, 'Transaction Created', 'Transaction', '3', '{\"type\":\"Cash In\",\"amount\":4476,\"description\":\"CAPRI PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-13 08:39:05', '2026-03-13 08:39:05'),
(215, 'Transaction Created', 'Transaction', '4', '{\"type\":\"Cash In\",\"amount\":5073,\"description\":\"BELEN PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-13 08:39:25', '2026-03-13 08:39:25'),
(216, 'Transaction Created', 'Transaction', '5', '{\"type\":\"Cash Out\",\"amount\":10,\"description\":\"CAPITOL TICKET\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-13 08:39:50', '2026-03-13 08:39:50'),
(217, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"Margaret\"}', 45, '2026-03-13 08:54:24', '2026-03-13 08:54:24'),
(218, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 13:13:15', '2026-03-13 13:13:15'),
(219, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 13:13:15', '2026-03-13 13:13:15'),
(220, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-13 13:13:15', '2026-03-13 13:13:15'),
(221, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:43:31', '2026-03-14 08:43:31'),
(222, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:44:10', '2026-03-14 08:44:10'),
(223, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:44:45', '2026-03-14 08:44:45'),
(224, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:45:18', '2026-03-14 08:45:18'),
(225, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:46:23', '2026-03-14 08:46:23'),
(226, 'User Updated', 'User', '40', '{\"name\":\"Julian\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:47:05', '2026-03-14 08:47:05'),
(227, 'User Updated', 'User', '34', '{\"name\":\"Maryrose\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:47:50', '2026-03-14 08:47:50'),
(228, 'User Updated', 'User', '18', '{\"name\":\"Noli\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:48:29', '2026-03-14 08:48:29'),
(229, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:49:15', '2026-03-14 08:49:15'),
(230, 'User Updated', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:49:48', '2026-03-14 08:49:48'),
(231, 'User Updated', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:50:21', '2026-03-14 08:50:21'),
(232, 'User Updated', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:51:00', '2026-03-14 08:51:00'),
(233, 'User Updated', 'User', '41', '{\"name\":\"Vincent\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:51:40', '2026-03-14 08:51:40'),
(234, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 08:52:46', '2026-03-14 08:52:46'),
(235, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:11:29', '2026-03-14 09:11:29'),
(236, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:12:11', '2026-03-14 09:12:11'),
(237, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:13:00', '2026-03-14 09:13:00'),
(238, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:13:26', '2026-03-14 09:13:26'),
(239, 'Report Data Saved', 'Report', '2026-03-14', '{\"storeId\":0,\"cashierId\":0,\"rowCount\":23,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:20:13', '2026-03-14 09:20:13'),
(240, 'User Updated', 'User', '40', '{\"name\":\"Julian\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 09:33:44', '2026-03-14 09:33:44'),
(241, 'Sale Created', 'Sale', '1', '{\"transactionId\":\"1773485542025\",\"total\":670,\"itemCount\":4,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 10:52:21', '2026-03-14 10:52:21'),
(242, 'Sale Created', 'Sale', '2', '{\"transactionId\":\"1773485553681\",\"total\":390,\"itemCount\":1,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 10:52:33', '2026-03-14 10:52:33'),
(243, 'Sale Created', 'Sale', '3', '{\"transactionId\":\"1773485559446\",\"total\":410,\"itemCount\":3,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 10:52:39', '2026-03-14 10:52:39'),
(244, 'Transaction Created', 'Transaction', '6', '{\"type\":\"Cash Out\",\"amount\":5073,\"description\":\"BELEN PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-14 11:03:29', '2026-03-14 11:03:29'),
(245, 'Transaction Created', 'Transaction', '7', '{\"type\":\"Cash Out\",\"amount\":4476,\"description\":\"CAPRI PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-14 11:03:48', '2026-03-14 11:03:48'),
(246, 'Transaction Created', 'Transaction', '8', '{\"type\":\"Cash In\",\"amount\":123,\"description\":\"qwe\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-14 12:29:09', '2026-03-14 12:29:09'),
(247, 'Transaction Created', 'Transaction', '9', '{\"type\":\"Cash Out\",\"amount\":123,\"description\":\"qwe\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-14 12:29:13', '2026-03-14 12:29:13'),
(248, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:38', '2026-03-14 13:24:38'),
(249, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:40', '2026-03-14 13:24:40'),
(250, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:41', '2026-03-14 13:24:41'),
(251, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:42', '2026-03-14 13:24:42'),
(252, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:42', '2026-03-14 13:24:42'),
(253, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:43', '2026-03-14 13:24:43'),
(254, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:44', '2026-03-14 13:24:44'),
(255, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:44', '2026-03-14 13:24:44'),
(256, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:45', '2026-03-14 13:24:45'),
(257, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:48', '2026-03-14 13:24:48'),
(258, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:49', '2026-03-14 13:24:49'),
(259, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:50', '2026-03-14 13:24:50'),
(260, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:52', '2026-03-14 13:24:52'),
(261, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:54', '2026-03-14 13:24:54'),
(262, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:24:55', '2026-03-14 13:24:55'),
(263, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:27:03', '2026-03-14 13:27:03');
INSERT INTO `system_history` (`id`, `action`, `entity`, `entity_id`, `details`, `user_id`, `created_at`, `updated_at`) VALUES
(264, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:33:03', '2026-03-14 13:33:03'),
(265, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-14 13:33:07', '2026-03-14 13:33:07'),
(266, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"Margaret\"}', 45, '2026-03-14 13:34:06', '2026-03-14 13:34:06'),
(267, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"Margaret\"}', 45, '2026-03-14 13:34:07', '2026-03-14 13:34:07'),
(268, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:29:18', '2026-03-15 05:29:18'),
(269, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:34:36', '2026-03-15 05:34:36'),
(270, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:34:56', '2026-03-15 05:34:56'),
(271, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:35:11', '2026-03-15 05:35:11'),
(272, 'User Updated', 'User', '34', '{\"name\":\"Maryrose\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:35:38', '2026-03-15 05:35:38'),
(273, 'User Updated', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:36:06', '2026-03-15 05:36:06'),
(274, 'User Updated', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:36:29', '2026-03-15 05:36:29'),
(275, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:48:36', '2026-03-15 05:48:36'),
(276, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 05:51:19', '2026-03-15 05:51:19'),
(277, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 06:05:24', '2026-03-15 06:05:24'),
(278, 'User Created', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"username\":\"test_pos\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:04:35', '2026-03-15 08:04:35'),
(279, 'User Updated', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:04:44', '2026-03-15 08:04:44'),
(280, 'User Updated', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:04:47', '2026-03-15 08:04:47'),
(281, 'User Updated', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:07:43', '2026-03-15 08:07:43'),
(282, 'Sale Created', 'Sale', '6', '{\"transactionId\":\"1773562200647\",\"total\":455,\"itemCount\":4,\"storeId\":\"4\",\"customer\":\"Walk-in Customer\",\"_performedBy\":\"test pos\"}', NULL, '2026-03-15 08:10:00', '2026-03-15 08:10:00'),
(283, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:24:43', '2026-03-15 08:24:43'),
(284, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:27:00', '2026-03-15 08:27:00'),
(285, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:28:06', '2026-03-15 08:28:06'),
(286, 'User Updated', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-15 08:40:18', '2026-03-15 08:40:18'),
(287, 'Transaction Created', 'Transaction', '10', '{\"type\":\"Cash In\",\"amount\":7843,\"description\":\"Jeannalyn- 03\\/14\\/2026\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-16 02:52:03', '2026-03-16 02:52:03'),
(288, 'Transaction Created', 'Transaction', '11', '{\"type\":\"Cash In\",\"amount\":13770,\"description\":\"Nena-03\\/15\\/2026\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-16 02:52:22', '2026-03-16 02:52:22'),
(289, 'Transaction Created', 'Transaction', '12', '{\"type\":\"Cash Out\",\"amount\":250,\"description\":\"exy harware- black screw and straw\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-16 02:53:31', '2026-03-16 02:53:31'),
(290, 'Transaction Created', 'Transaction', '13', '{\"type\":\"Cash In\",\"amount\":200,\"description\":\"MB-11 TRADING-BEND\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-16 09:26:52', '2026-03-16 09:26:52'),
(291, 'Transaction Created', 'Transaction', '14', '{\"type\":\"Cash Out\",\"amount\":110,\"description\":\"SCHOOL SUPPLIES\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-16 09:28:43', '2026-03-16 09:28:43'),
(292, 'User Deleted', 'User', '48', '{\"name\":\"test pos\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 09:41:29', '2026-03-16 09:41:29'),
(293, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:15:15', '2026-03-16 15:15:15'),
(294, 'User Updated', 'User', '43', '{\"name\":\"Bruce\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:18:09', '2026-03-16 15:18:09'),
(295, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:18:59', '2026-03-16 15:18:59'),
(296, 'User Updated', 'User', '32', '{\"name\":\"Eden\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:19:42', '2026-03-16 15:19:42'),
(297, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:21:23', '2026-03-16 15:21:23'),
(298, 'User Updated', 'User', '33', '{\"name\":\"Jeannalyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:21:43', '2026-03-16 15:21:43'),
(299, 'User Updated', 'User', '40', '{\"name\":\"Julian\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:23:26', '2026-03-16 15:23:26'),
(300, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:26:39', '2026-03-16 15:26:39'),
(301, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:26:39', '2026-03-16 15:26:39'),
(302, 'User Updated', 'User', '18', '{\"name\":\"Noli\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:28:03', '2026-03-16 15:28:03'),
(303, 'User Updated', 'User', '38', '{\"name\":\"Norilyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:29:31', '2026-03-16 15:29:31'),
(304, 'User Updated', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:30:09', '2026-03-16 15:30:09'),
(305, 'User Updated', 'User', '35', '{\"name\":\"Reyrieza\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:30:45', '2026-03-16 15:30:45'),
(306, 'User Updated', 'User', '36', '{\"name\":\"Sherryl\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:31:07', '2026-03-16 15:31:07'),
(307, 'User Updated', 'User', '41', '{\"name\":\"Vincent\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:31:53', '2026-03-16 15:31:53'),
(308, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:32:28', '2026-03-16 15:32:28'),
(309, 'User Updated', 'User', '39', '{\"name\":\"Rejean\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:45:26', '2026-03-16 15:45:26'),
(310, 'User Created', 'User', '49', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"username\":\"test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:49:52', '2026-03-16 15:49:52'),
(311, 'User Updated', 'User', '49', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 15:50:03', '2026-03-16 15:50:03'),
(312, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 23:18:39', '2026-03-16 23:18:39'),
(313, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 23:31:44', '2026-03-16 23:31:44'),
(314, 'User Updated', 'User', '42', '{\"name\":\"Analyn\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-16 23:31:44', '2026-03-16 23:31:44'),
(315, 'Transaction Created', 'Transaction', '15', '{\"type\":\"Cash In\",\"amount\":6131,\"description\":\"BELEN PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-17 09:44:04', '2026-03-17 09:44:04'),
(316, 'Transaction Created', 'Transaction', '16', '{\"type\":\"Cash Out\",\"amount\":50,\"description\":\"LAMINATE\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-17 09:44:19', '2026-03-17 09:44:19'),
(317, 'Transaction Created', 'Transaction', '17', '{\"type\":\"Cash In\",\"amount\":3,\"description\":\"PRINT\",\"category\":\"OTHER INCOME\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-17 09:44:35', '2026-03-17 09:44:35'),
(318, 'Transaction Created', 'Transaction', '18', '{\"type\":\"Cash In\",\"amount\":5556,\"description\":\"JEANNA 03\\/16\\/26\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-17 09:51:58', '2026-03-17 09:51:58'),
(319, 'Transaction Created', 'Transaction', '19', '{\"type\":\"Cash Out\",\"amount\":1200,\"description\":\"WILSON 3\\/16 AND 3\\/17\",\"category\":\"SALARY\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-17 10:14:05', '2026-03-17 10:14:05'),
(320, 'User Updated', 'User', '49', '{\"name\":\"test\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-17 13:27:40', '2026-03-17 13:27:40'),
(321, 'Transaction Created', 'Transaction', '20', '{\"type\":\"Cash In\",\"amount\":5220,\"description\":\"CAPRI PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-18 05:05:47', '2026-03-18 05:05:47'),
(322, 'Transaction Created', 'Transaction', '21', '{\"type\":\"Cash Out\",\"amount\":27005,\"description\":\"MANG LOLOY-SPICES\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-18 05:07:38', '2026-03-18 05:07:38'),
(323, 'Transaction Created', 'Transaction', '22', '{\"type\":\"Cash Out\",\"amount\":210,\"description\":\"STEELWOOL C\\/O PROD.\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-18 05:08:18', '2026-03-18 05:08:18'),
(324, 'Transaction Created', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":630,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-18 05:09:27', '2026-03-18 05:09:27'),
(325, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 06:54:16', '2026-03-18 06:54:16'),
(326, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 08:07:22', '2026-03-18 08:07:22'),
(327, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 08:09:43', '2026-03-18 08:09:43'),
(328, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 08:13:24', '2026-03-18 08:13:24'),
(329, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 08:20:21', '2026-03-18 08:20:21'),
(330, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":635,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 08:30:07', '2026-03-18 08:30:07'),
(331, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":630,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 08:31:48', '2026-03-18 08:31:48'),
(332, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":635,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 08:38:17', '2026-03-18 08:38:17'),
(333, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":630,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 08:38:35', '2026-03-18 08:38:35'),
(334, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 08:57:16', '2026-03-18 08:57:16'),
(335, 'User Updated', 'User', '22', '{\"name\":\"Calen\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-18 09:10:13', '2026-03-18 09:10:13'),
(336, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":635,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 09:14:08', '2026-03-18 09:14:08'),
(337, 'Transaction Updated', 'Transaction', '23', '{\"type\":\"Cash Out\",\"amount\":630,\"description\":\"DM JUICE PINEAPPLE, SUF POWDER\",\"category\":\"OTHER EXPENSES\"}', NULL, '2026-03-18 09:14:16', '2026-03-18 09:14:16'),
(338, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 09:43:05', '2026-03-18 09:43:05'),
(339, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 14:46:25', '2026-03-18 14:46:25'),
(340, 'Ingredient Updated', 'Ingredient', '34', '{\"name\":\"Hanks-isaw\",\"code\":\"ING-028\",\"unit\":\"37pcs\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 23:19:21', '2026-03-18 23:19:21'),
(341, 'Ingredient Updated', 'Ingredient', '34', '{\"name\":\"Hanks-isaw\",\"code\":\"ING-028\",\"unit\":\"37pcs\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 23:20:18', '2026-03-18 23:20:18'),
(342, 'Ingredient Updated', 'Ingredient', '34', '{\"name\":\"Hanks-isaw\",\"code\":\"ING-028\",\"unit\":\"37\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 23:20:53', '2026-03-18 23:20:53'),
(343, 'Ingredient Updated', 'Ingredient', '10', '{\"name\":\"MDM\",\"code\":\"ING-004\",\"unit\":\"500Kg\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 23:25:24', '2026-03-18 23:25:24'),
(344, 'Ingredient Updated', 'Ingredient', '33', '{\"name\":\"Lumpia Wrapper\",\"code\":\"ING-027\",\"unit\":\"2bags\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-18 23:26:47', '2026-03-18 23:26:47'),
(345, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-19 03:11:13', '2026-03-19 03:11:13'),
(346, 'Transaction Created', 'Transaction', '24', '{\"type\":\"Cash Out\",\"amount\":7600,\"description\":\"JMT ACERON GAS\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 03:50:56', '2026-03-19 03:50:56'),
(347, 'Transaction Created', 'Transaction', '25', '{\"type\":\"Cash Out\",\"amount\":970,\"description\":\"DVB AUTO DETAILING-THINNER FOR SIGNAGE\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 03:51:41', '2026-03-19 03:51:41'),
(348, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-19 10:14:31', '2026-03-19 10:14:31'),
(349, 'Transaction Created', 'Transaction', '26', '{\"type\":\"Cash Out\",\"amount\":340,\"description\":\"LOVE BUBBLES-LAUNDRY\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 10:14:50', '2026-03-19 10:14:50'),
(350, 'Transaction Created', 'Transaction', '27', '{\"type\":\"Cash In\",\"amount\":7000,\"description\":\"CUT OFF SALES 03\\/19-JEANNA\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 10:15:23', '2026-03-19 10:15:23'),
(351, 'Transaction Created', 'Transaction', '28', '{\"type\":\"Cash Out\",\"amount\":372,\"description\":\"7-11 BATTERY C\\/O CASA\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 10:15:48', '2026-03-19 10:15:48'),
(352, 'Transaction Created', 'Transaction', '29', '{\"type\":\"Cash Out\",\"amount\":1400,\"description\":\"WILSON 3-18, 3-19 AND SQ HAM \",\"category\":\"SALARY\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-19 10:16:24', '2026-03-19 10:16:24'),
(353, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-19 14:13:46', '2026-03-19 14:13:46'),
(354, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 14:58:56', '2026-03-19 14:58:56'),
(355, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-19 15:01:14', '2026-03-19 15:01:14'),
(356, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 15:02:44', '2026-03-19 15:02:44'),
(357, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 15:05:10', '2026-03-19 15:05:10'),
(358, 'User Updated', 'User', '44', '{\"name\":\"Wilson\",\"role\":\"EMPLOYEE\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 15:07:36', '2026-03-19 15:07:36'),
(359, 'Transaction Updated', 'Transaction', '29', '{\"type\":\"Cash Out\",\"amount\":1405,\"description\":\"WILSON 3-18, 3-19 AND SQ HAM \",\"category\":\"SALARY\"}', NULL, '2026-03-19 15:09:28', '2026-03-19 15:09:28'),
(360, 'Transaction Updated', 'Transaction', '29', '{\"type\":\"Cash Out\",\"amount\":1400,\"description\":\"WILSON 3-18, 3-19 AND SQ HAM \",\"category\":\"SALARY\"}', NULL, '2026-03-19 15:09:50', '2026-03-19 15:09:50'),
(361, 'Ingredient Created', 'Ingredient', '62', '{\"name\":\"test\",\"code\":\"ING-054\",\"unit\":\"kg\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:03:32', '2026-03-19 17:03:32'),
(362, 'Inventory Adjustment', 'Ingredient', '62', '{\"ingredient\":\"test\",\"type\":\"add\",\"quantity\":123,\"previousStock\":0,\"newStock\":123,\"reason\":\"qwe\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:03:44', '2026-03-19 17:03:44'),
(363, 'Ingredient Updated', 'Ingredient', '62', '{\"name\":\"test\",\"code\":\"ING-054\",\"unit\":\"kg\",\"stock\":123,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:03:44', '2026-03-19 17:03:44'),
(364, 'Ingredient Deleted', 'Ingredient', '62', '{\"name\":\"test\",\"code\":\"ING-054\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:04:02', '2026-03-19 17:04:02'),
(365, 'Inventory Adjustment', 'Ingredient', '61', '{\"ingredient\":\"Water\",\"type\":\"add\",\"quantity\":123,\"previousStock\":0,\"newStock\":123,\"reason\":\"qwe\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:04:15', '2026-03-19 17:04:15'),
(366, 'Ingredient Updated', 'Ingredient', '61', '{\"name\":\"Water\",\"code\":\"ING-053\",\"unit\":\"L\",\"stock\":123,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:04:15', '2026-03-19 17:04:15'),
(367, 'Inventory Adjustment', 'Ingredient', '61', '{\"ingredient\":\"Water\",\"type\":\"remove\",\"quantity\":123,\"previousStock\":123,\"newStock\":0,\"reason\":\"qwe\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:04:33', '2026-03-19 17:04:33'),
(368, 'Ingredient Updated', 'Ingredient', '61', '{\"name\":\"Water\",\"code\":\"ING-053\",\"unit\":\"L\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 17:04:33', '2026-03-19 17:04:33'),
(369, 'Inventory Adjustment', 'Ingredient', '46', '{\"ingredient\":\"10X14\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"Test\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 22:55:15', '2026-03-19 22:55:15'),
(370, 'Ingredient Updated', 'Ingredient', '46', '{\"name\":\"10X14\",\"code\":\"ING-040\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 22:55:15', '2026-03-19 22:55:15'),
(371, 'Inventory Adjustment', 'Ingredient', '46', '{\"ingredient\":\"10X14\",\"type\":\"remove\",\"quantity\":1,\"previousStock\":1,\"newStock\":0,\"reason\":\"Tets\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 22:55:25', '2026-03-19 22:55:25'),
(372, 'Ingredient Updated', 'Ingredient', '46', '{\"name\":\"10X14\",\"code\":\"ING-040\",\"unit\":\"pcs\",\"stock\":0,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-19 22:55:25', '2026-03-19 22:55:25'),
(373, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-20 01:23:09', '2026-03-20 01:23:09'),
(374, 'Inventory Adjustment', 'Ingredient', '11', '{\"ingredient\":\"Accord\",\"type\":\"add\",\"quantity\":20,\"previousStock\":0,\"newStock\":20,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-20 01:33:59', '2026-03-20 01:33:59'),
(375, 'Ingredient Updated', 'Ingredient', '11', '{\"name\":\"Accord\",\"code\":\"ING-005\",\"unit\":\"Kg\",\"stock\":20,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-20 01:33:59', '2026-03-20 01:33:59'),
(376, 'Transaction Created', 'Transaction', '30', '{\"type\":\"Cash Out\",\"amount\":5586,\"description\":\"WEEKLY CASH OUT\",\"category\":\"TOTAL SALES CASH OUT\",\"createdBy\":\"System Administrator\"}', NULL, '2026-03-20 06:11:57', '2026-03-20 06:11:57'),
(377, 'User Updated', 'User', '45', '{\"name\":\"Margaret\",\"role\":\"EMPLOYEE\"}', NULL, '2026-03-23 02:44:12', '2026-03-23 02:44:12'),
(378, 'Transaction Created', 'Transaction', '31', '{\"type\":\"Cash In\",\"amount\":6185,\"description\":\"NENA 03\\/21\\/26\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:09:59', '2026-03-23 09:09:59'),
(379, 'Transaction Created', 'Transaction', '32', '{\"type\":\"Cash In\",\"amount\":13045,\"description\":\"JEANNALYN 03\\/22\\/26\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:10:32', '2026-03-23 09:10:32'),
(380, 'Transaction Created', 'Transaction', '33', '{\"type\":\"Cash In\",\"amount\":5097,\"description\":\"CAPRI PAYMENT 03\\/22\\/26\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:10:57', '2026-03-23 09:10:57'),
(381, 'Transaction Created', 'Transaction', '34', '{\"type\":\"Cash Out\",\"amount\":1550,\"description\":\"PINYA AND CHESES\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:11:24', '2026-03-23 09:11:24'),
(382, 'Transaction Created', 'Transaction', '35', '{\"type\":\"Cash Out\",\"amount\":7600,\"description\":\"JMT ACERON GAS\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:11:42', '2026-03-23 09:11:42'),
(383, 'Transaction Created', 'Transaction', '36', '{\"type\":\"Cash Out\",\"amount\":210,\"description\":\"BOND PAPER SHORT\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:12:06', '2026-03-23 09:12:06'),
(384, 'Transaction Created', 'Transaction', '37', '{\"type\":\"Cash Out\",\"amount\":350,\"description\":\"EXY HARDWARE-REGULATOR\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:12:36', '2026-03-23 09:12:36'),
(385, 'Transaction Created', 'Transaction', '38', '{\"type\":\"Cash Out\",\"amount\":20,\"description\":\"20 PCS TOX\",\"category\":\"OTHER EXPENSES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 09:13:28', '2026-03-23 09:13:28'),
(386, 'Transaction Created', 'Transaction', '39', '{\"type\":\"Cash In\",\"amount\":7500,\"description\":\"CUT OFF JEANNALYN 03\\/23\\/26\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-23 10:15:11', '2026-03-23 10:15:11'),
(387, 'Inventory Adjustment', 'Ingredient', '45', '{\"ingredient\":\"8X11\",\"type\":\"add\",\"quantity\":2,\"previousStock\":0,\"newStock\":2,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:43:33', '2026-03-23 13:43:33'),
(388, 'Ingredient Updated', 'Ingredient', '45', '{\"name\":\"8X11\",\"code\":\"ING-039\",\"unit\":\"pcs\",\"stock\":2,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:43:33', '2026-03-23 13:43:33'),
(389, 'Inventory Adjustment', 'Ingredient', '46', '{\"ingredient\":\"10X14\",\"type\":\"add\",\"quantity\":3,\"previousStock\":0,\"newStock\":3,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:02', '2026-03-23 13:44:02'),
(390, 'Ingredient Updated', 'Ingredient', '46', '{\"name\":\"10X14\",\"code\":\"ING-040\",\"unit\":\"pcs\",\"stock\":3,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:03', '2026-03-23 13:44:03'),
(391, 'Inventory Adjustment', 'Ingredient', '47', '{\"ingredient\":\"12X18\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:24', '2026-03-23 13:44:24'),
(392, 'Ingredient Updated', 'Ingredient', '47', '{\"name\":\"12X18\",\"code\":\"ING-041\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:24', '2026-03-23 13:44:24'),
(393, 'Inventory Adjustment', 'Ingredient', '42', '{\"ingredient\":\"6X10\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:41', '2026-03-23 13:44:41'),
(394, 'Ingredient Updated', 'Ingredient', '42', '{\"name\":\"6X10\",\"code\":\"ING-036\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:44:41', '2026-03-23 13:44:41'),
(395, 'Inventory Adjustment', 'Ingredient', '48', '{\"ingredient\":\"Medium\",\"type\":\"add\",\"quantity\":6,\"previousStock\":0,\"newStock\":6,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:45:49', '2026-03-23 13:45:49'),
(396, 'Ingredient Updated', 'Ingredient', '48', '{\"name\":\"Medium\",\"code\":\"ING-042\",\"unit\":\"pcs\",\"stock\":6,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:45:49', '2026-03-23 13:45:49'),
(397, 'Inventory Adjustment', 'Ingredient', '49', '{\"ingredient\":\"Large\",\"type\":\"add\",\"quantity\":8,\"previousStock\":0,\"newStock\":8,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:09', '2026-03-23 13:46:09'),
(398, 'Ingredient Updated', 'Ingredient', '49', '{\"name\":\"Large\",\"code\":\"ING-043\",\"unit\":\"pcs\",\"stock\":8,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:09', '2026-03-23 13:46:09'),
(399, 'Inventory Adjustment', 'Ingredient', '50', '{\"ingredient\":\"Rollbag Big\",\"type\":\"add\",\"quantity\":4,\"previousStock\":0,\"newStock\":4,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:30', '2026-03-23 13:46:30'),
(400, 'Ingredient Updated', 'Ingredient', '50', '{\"name\":\"Rollbag Big\",\"code\":\"ING-044\",\"unit\":\"pcs\",\"stock\":4,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:30', '2026-03-23 13:46:30'),
(401, 'Inventory Adjustment', 'Ingredient', '51', '{\"ingredient\":\"Rollbag Small\",\"type\":\"add\",\"quantity\":2,\"previousStock\":0,\"newStock\":2,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:44', '2026-03-23 13:46:44'),
(402, 'Ingredient Updated', 'Ingredient', '51', '{\"name\":\"Rollbag Small\",\"code\":\"ING-045\",\"unit\":\"pcs\",\"stock\":2,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:46:44', '2026-03-23 13:46:44'),
(403, 'Inventory Adjustment', 'Ingredient', '52', '{\"ingredient\":\"Plastic Shanghai\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:10', '2026-03-23 13:47:10'),
(404, 'Ingredient Updated', 'Ingredient', '52', '{\"name\":\"Plastic Shanghai\",\"code\":\"ING-046\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:10', '2026-03-23 13:47:10'),
(405, 'Inventory Adjustment', 'Ingredient', '7', '{\"ingredient\":\"Molo White\",\"type\":\"add\",\"quantity\":400,\"previousStock\":0,\"newStock\":400,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:35', '2026-03-23 13:47:35'),
(406, 'Ingredient Updated', 'Ingredient', '7', '{\"name\":\"Molo White\",\"code\":\"ING-001\",\"unit\":\"Pcs\",\"stock\":400,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:35', '2026-03-23 13:47:35'),
(407, 'Inventory Adjustment', 'Ingredient', '8', '{\"ingredient\":\"Molo Yellow\",\"type\":\"add\",\"quantity\":180,\"previousStock\":0,\"newStock\":180,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:52', '2026-03-23 13:47:52'),
(408, 'Ingredient Updated', 'Ingredient', '8', '{\"name\":\"Molo Yellow\",\"code\":\"ING-002\",\"unit\":\"Pcs\",\"stock\":180,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:47:52', '2026-03-23 13:47:52'),
(409, 'Inventory Adjustment', 'Ingredient', '33', '{\"ingredient\":\"Lumpia Wrapper\",\"type\":\"add\",\"quantity\":2,\"previousStock\":0,\"newStock\":2,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:48:18', '2026-03-23 13:48:18'),
(410, 'Ingredient Updated', 'Ingredient', '33', '{\"name\":\"Lumpia Wrapper\",\"code\":\"ING-027\",\"unit\":\"2bags\",\"stock\":2,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:48:18', '2026-03-23 13:48:18'),
(411, 'Inventory Adjustment', 'Ingredient', '11', '{\"ingredient\":\"Accord\",\"type\":\"add\",\"quantity\":19,\"previousStock\":20,\"newStock\":39,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:49:00', '2026-03-23 13:49:00'),
(412, 'Ingredient Updated', 'Ingredient', '11', '{\"name\":\"Accord\",\"code\":\"ING-005\",\"unit\":\"Kg\",\"stock\":39,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:49:00', '2026-03-23 13:49:00'),
(413, 'Inventory Adjustment', 'Ingredient', '14', '{\"ingredient\":\"Praque Powder\",\"type\":\"add\",\"quantity\":20,\"previousStock\":0,\"newStock\":20,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:49:29', '2026-03-23 13:49:29'),
(414, 'Ingredient Updated', 'Ingredient', '14', '{\"name\":\"Praque Powder\",\"code\":\"ING-008\",\"unit\":\"kg\",\"stock\":20,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:49:29', '2026-03-23 13:49:29'),
(415, 'Inventory Adjustment', 'Ingredient', '18', '{\"ingredient\":\"Sodium\",\"type\":\"add\",\"quantity\":5,\"previousStock\":0,\"newStock\":5,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:06', '2026-03-23 13:50:06'),
(416, 'Ingredient Updated', 'Ingredient', '18', '{\"name\":\"Sodium\",\"code\":\"ING-012\",\"unit\":\"kg\",\"stock\":5,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:06', '2026-03-23 13:50:06'),
(417, 'Inventory Adjustment', 'Ingredient', '15', '{\"ingredient\":\"Ham Spice\",\"type\":\"add\",\"quantity\":7,\"previousStock\":0,\"newStock\":7,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:30', '2026-03-23 13:50:30'),
(418, 'Ingredient Updated', 'Ingredient', '15', '{\"name\":\"Ham Spice\",\"code\":\"ING-009\",\"unit\":\"kg\",\"stock\":7,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:30', '2026-03-23 13:50:30'),
(419, 'Inventory Adjustment', 'Ingredient', '16', '{\"ingredient\":\"Ham Flavor\",\"type\":\"add\",\"quantity\":4,\"previousStock\":0,\"newStock\":4,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:46', '2026-03-23 13:50:46'),
(420, 'Ingredient Updated', 'Ingredient', '16', '{\"name\":\"Ham Flavor\",\"code\":\"ING-010\",\"unit\":\"kg\",\"stock\":4,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:50:46', '2026-03-23 13:50:46'),
(421, 'Inventory Adjustment', 'Ingredient', '17', '{\"ingredient\":\"Vitamin C\",\"type\":\"add\",\"quantity\":3,\"previousStock\":0,\"newStock\":3,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:51:30', '2026-03-23 13:51:30'),
(422, 'Ingredient Updated', 'Ingredient', '17', '{\"name\":\"Vitamin C\",\"code\":\"ING-011\",\"unit\":\"kg\",\"stock\":3,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:51:30', '2026-03-23 13:51:30'),
(423, 'Inventory Adjustment', 'Ingredient', '36', '{\"ingredient\":\"Multiblend\",\"type\":\"add\",\"quantity\":5,\"previousStock\":0,\"newStock\":5,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:51:47', '2026-03-23 13:51:47'),
(424, 'Ingredient Updated', 'Ingredient', '36', '{\"name\":\"Multiblend\",\"code\":\"ING-030\",\"unit\":\"kg\",\"stock\":5,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:51:48', '2026-03-23 13:51:48'),
(425, 'Inventory Adjustment', 'Ingredient', '40', '{\"ingredient\":\"Gas\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:52:42', '2026-03-23 13:52:42'),
(426, 'Ingredient Updated', 'Ingredient', '40', '{\"name\":\"Gas\",\"code\":\"ING-034\",\"unit\":\"L\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:52:42', '2026-03-23 13:52:42'),
(427, 'Inventory Adjustment', 'Ingredient', '34', '{\"ingredient\":\"Hanks-isaw\",\"type\":\"add\",\"quantity\":18,\"previousStock\":0,\"newStock\":18,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:05', '2026-03-23 13:53:05'),
(428, 'Ingredient Updated', 'Ingredient', '34', '{\"name\":\"Hanks-isaw\",\"code\":\"ING-028\",\"unit\":\"37\",\"stock\":18,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:05', '2026-03-23 13:53:05'),
(429, 'Inventory Adjustment', 'Ingredient', '12', '{\"ingredient\":\"TVP Fine\",\"type\":\"add\",\"quantity\":5,\"previousStock\":0,\"newStock\":5,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:24', '2026-03-23 13:53:24'),
(430, 'Ingredient Updated', 'Ingredient', '12', '{\"name\":\"TVP Fine\",\"code\":\"ING-006\",\"unit\":\"Kg\",\"stock\":5,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:24', '2026-03-23 13:53:24'),
(431, 'Inventory Adjustment', 'Ingredient', '21', '{\"ingredient\":\"Tvp Gem\",\"type\":\"add\",\"quantity\":2.5,\"previousStock\":0,\"newStock\":2.5,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:54', '2026-03-23 13:53:54'),
(432, 'Ingredient Updated', 'Ingredient', '21', '{\"name\":\"Tvp Gem\",\"code\":\"ING-015\",\"unit\":\"kg\",\"stock\":2.5,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:53:54', '2026-03-23 13:53:54'),
(433, 'Inventory Adjustment', 'Ingredient', '19', '{\"ingredient\":\"Alexander\",\"type\":\"add\",\"quantity\":6,\"previousStock\":0,\"newStock\":6,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:54:12', '2026-03-23 13:54:12'),
(434, 'Ingredient Updated', 'Ingredient', '19', '{\"name\":\"Alexander\",\"code\":\"ING-013\",\"unit\":\"L\",\"stock\":6,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:54:12', '2026-03-23 13:54:12'),
(435, 'Inventory Adjustment', 'Ingredient', '58', '{\"ingredient\":\"Amiflex\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:54:48', '2026-03-23 13:54:48'),
(436, 'Ingredient Updated', 'Ingredient', '58', '{\"name\":\"Amiflex\",\"code\":\"ING-052\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:54:48', '2026-03-23 13:54:48'),
(437, 'Inventory Adjustment', 'Ingredient', '53', '{\"ingredient\":\"Plastic Skinless\",\"type\":\"add\",\"quantity\":4,\"previousStock\":0,\"newStock\":4,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:16', '2026-03-23 13:55:16'),
(438, 'Ingredient Updated', 'Ingredient', '53', '{\"name\":\"Plastic Skinless\",\"code\":\"ING-047\",\"unit\":\"pcs\",\"stock\":4,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:16', '2026-03-23 13:55:16'),
(439, 'Inventory Adjustment', 'Ingredient', '54', '{\"ingredient\":\"Strand Red\",\"type\":\"add\",\"quantity\":19,\"previousStock\":0,\"newStock\":19,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:36', '2026-03-23 13:55:36'),
(440, 'Ingredient Updated', 'Ingredient', '54', '{\"name\":\"Strand Red\",\"code\":\"ING-048\",\"unit\":\"pcs\",\"stock\":19,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:36', '2026-03-23 13:55:36'),
(441, 'Inventory Adjustment', 'Ingredient', '55', '{\"ingredient\":\"Strand White\",\"type\":\"add\",\"quantity\":6,\"previousStock\":0,\"newStock\":6,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:55', '2026-03-23 13:55:55'),
(442, 'Ingredient Updated', 'Ingredient', '55', '{\"name\":\"Strand White\",\"code\":\"ING-049\",\"unit\":\"pcs\",\"stock\":6,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:55:55', '2026-03-23 13:55:55'),
(443, 'Inventory Adjustment', 'Ingredient', '56', '{\"ingredient\":\"Strand Clear\",\"type\":\"add\",\"quantity\":14,\"previousStock\":0,\"newStock\":14,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:56:20', '2026-03-23 13:56:20'),
(444, 'Ingredient Updated', 'Ingredient', '56', '{\"name\":\"Strand Clear\",\"code\":\"ING-050\",\"unit\":\"pcs\",\"stock\":14,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:56:20', '2026-03-23 13:56:20'),
(445, 'Inventory Adjustment', 'Ingredient', '57', '{\"ingredient\":\"Strand Embo\",\"type\":\"add\",\"quantity\":37,\"previousStock\":0,\"newStock\":37,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:56:31', '2026-03-23 13:56:31'),
(446, 'Ingredient Updated', 'Ingredient', '57', '{\"name\":\"Strand Embo\",\"code\":\"ING-051\",\"unit\":\"pcs\",\"stock\":37,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:56:31', '2026-03-23 13:56:31'),
(447, 'Inventory Adjustment', 'Ingredient', '32', '{\"ingredient\":\"Tali\",\"type\":\"add\",\"quantity\":16,\"previousStock\":0,\"newStock\":16,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:57:08', '2026-03-23 13:57:08'),
(448, 'Ingredient Updated', 'Ingredient', '32', '{\"name\":\"Tali\",\"code\":\"ING-026\",\"unit\":\"pcs\",\"stock\":16,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:57:08', '2026-03-23 13:57:08'),
(449, 'Inventory Adjustment', 'Ingredient', '24', '{\"ingredient\":\"Sugar\",\"type\":\"add\",\"quantity\":2000,\"previousStock\":0,\"newStock\":2000,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:57:55', '2026-03-23 13:57:55'),
(450, 'Ingredient Updated', 'Ingredient', '24', '{\"name\":\"Sugar\",\"code\":\"ING-018\",\"unit\":\"kg\",\"stock\":2000,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:57:55', '2026-03-23 13:57:55'),
(451, 'Inventory Adjustment', 'Ingredient', '25', '{\"ingredient\":\"Cornstarch\",\"type\":\"add\",\"quantity\":37,\"previousStock\":0,\"newStock\":37,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:58:26', '2026-03-23 13:58:26'),
(452, 'Ingredient Updated', 'Ingredient', '25', '{\"name\":\"Cornstarch\",\"code\":\"ING-019\",\"unit\":\"kg\",\"stock\":37,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:58:26', '2026-03-23 13:58:26'),
(453, 'Inventory Adjustment', 'Ingredient', '25', '{\"ingredient\":\"Cornstarch\",\"type\":\"add\",\"quantity\":925,\"previousStock\":37,\"newStock\":962,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:58:54', '2026-03-23 13:58:54'),
(454, 'Ingredient Updated', 'Ingredient', '25', '{\"name\":\"Cornstarch\",\"code\":\"ING-019\",\"unit\":\"kg\",\"stock\":962,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:58:54', '2026-03-23 13:58:54'),
(455, 'Inventory Adjustment', 'Ingredient', '23', '{\"ingredient\":\"MSG-Vetsin\",\"type\":\"add\",\"quantity\":62,\"previousStock\":0,\"newStock\":62,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:59:40', '2026-03-23 13:59:40'),
(456, 'Ingredient Updated', 'Ingredient', '23', '{\"name\":\"MSG-Vetsin\",\"code\":\"ING-017\",\"unit\":\"kg\",\"stock\":62,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 13:59:40', '2026-03-23 13:59:40'),
(457, 'Inventory Adjustment', 'Ingredient', '22', '{\"ingredient\":\"Asin\",\"type\":\"add\",\"quantity\":125,\"previousStock\":0,\"newStock\":125,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:00:15', '2026-03-23 14:00:15'),
(458, 'Ingredient Updated', 'Ingredient', '22', '{\"name\":\"Asin\",\"code\":\"ING-016\",\"unit\":\"kg\",\"stock\":125,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:00:15', '2026-03-23 14:00:15'),
(459, 'Inventory Adjustment', 'Ingredient', '20', '{\"ingredient\":\"Knorr Liquid Seasoning\",\"type\":\"add\",\"quantity\":6,\"previousStock\":0,\"newStock\":6,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:01:25', '2026-03-23 14:01:25'),
(460, 'Ingredient Updated', 'Ingredient', '20', '{\"name\":\"Knorr Liquid Seasoning\",\"code\":\"ING-014\",\"unit\":\"L\",\"stock\":6,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:01:25', '2026-03-23 14:01:25'),
(461, 'Inventory Adjustment', 'Ingredient', '35', '{\"ingredient\":\"Cheese\",\"type\":\"add\",\"quantity\":1,\"previousStock\":0,\"newStock\":1,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:01:47', '2026-03-23 14:01:47'),
(462, 'Ingredient Updated', 'Ingredient', '35', '{\"name\":\"Cheese\",\"code\":\"ING-029\",\"unit\":\"pcs\",\"stock\":1,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:01:47', '2026-03-23 14:01:47'),
(463, 'Inventory Adjustment', 'Ingredient', '37', '{\"ingredient\":\"Curry Powder\",\"type\":\"add\",\"quantity\":0.5,\"previousStock\":0,\"newStock\":0.5,\"reason\":\"restock\",\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:02:10', '2026-03-23 14:02:10'),
(464, 'Ingredient Updated', 'Ingredient', '37', '{\"name\":\"Curry Powder\",\"code\":\"ING-031\",\"unit\":\"kg\",\"stock\":0.5,\"_performedBy\":\"System Administrator\"}', 1, '2026-03-23 14:02:10', '2026-03-23 14:02:10'),
(465, 'Transaction Created', 'Transaction', '40', '{\"type\":\"Cash In\",\"amount\":4925,\"description\":\"JEANNALYN 03\\/23\\/26\",\"category\":\"AMPARO SALES\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-24 01:29:01', '2026-03-24 01:29:01'),
(466, 'Transaction Created', 'Transaction', '41', '{\"type\":\"Cash In\",\"amount\":6044,\"description\":\"BELEN PAYMENT\",\"category\":\"DELIVERY PAYMENT\",\"createdBy\":\"Margaret\"}', NULL, '2026-03-24 01:29:24', '2026-03-24 01:29:24');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('transaction_categories', '{\"cashIn\":[\"AMPARO SALES\",\"AB MARKET SALES\",\"SUSANO MARKET SALES\",\"DELIVERY PAYMENT\",\"SALARY\",\"REFUND\",\"OTHER EXPENSES\",\"OTHER INCOME\"],\"cashOut\":[\"REFUND\",\"OTHER EXPENSES\",\"AB MARKET SALES\",\"SUSANO MARKET SALES\",\"TOTAL SALES CASH OUT\",\"SALARY\"]}', '2026-03-13 11:56:57');

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
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `source_transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shift` enum('AM','PM') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `type`, `amount`, `description`, `category`, `reference`, `created_by`, `created_at`, `updated_at`, `source_transaction_id`, `shift`) VALUES
(10, 'Cash In', 7843.00, 'Jeannalyn- 03/14/2026', 'AMPARO SALES', NULL, 'Margaret', '2026-03-16 02:52:03', '2026-03-16 02:52:03', NULL, NULL),
(11, 'Cash In', 13770.00, 'Nena-03/15/2026', 'AMPARO SALES', NULL, 'Margaret', '2026-03-16 02:52:22', '2026-03-16 02:52:22', NULL, NULL),
(12, 'Cash Out', 250.00, 'exy harware- black screw and straw', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-16 02:53:31', '2026-03-16 02:53:31', NULL, NULL),
(13, 'Cash In', 200.00, 'MB-11 TRADING-BEND', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-16 09:26:52', '2026-03-16 09:26:52', NULL, NULL),
(14, 'Cash Out', 110.00, 'SCHOOL SUPPLIES', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-16 09:28:43', '2026-03-16 09:28:43', NULL, NULL),
(15, 'Cash In', 6131.00, 'BELEN PAYMENT', 'DELIVERY PAYMENT', NULL, 'Margaret', '2026-03-17 09:44:04', '2026-03-17 09:44:04', NULL, NULL),
(16, 'Cash Out', 50.00, 'LAMINATE', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-17 09:44:19', '2026-03-17 09:44:19', NULL, NULL),
(17, 'Cash In', 3.00, 'PRINT', 'OTHER INCOME', NULL, 'Margaret', '2026-03-17 09:44:35', '2026-03-17 09:44:35', NULL, NULL),
(18, 'Cash In', 5556.00, 'JEANNA 03/16/26', 'AMPARO SALES', NULL, 'Margaret', '2026-03-17 09:51:58', '2026-03-17 09:51:58', NULL, NULL),
(19, 'Cash Out', 1200.00, 'WILSON 3/16 AND 3/17', 'SALARY', NULL, 'Margaret', '2026-03-17 10:14:05', '2026-03-17 10:14:05', NULL, NULL),
(20, 'Cash In', 5220.00, 'CAPRI PAYMENT', 'DELIVERY PAYMENT', NULL, 'Margaret', '2026-03-18 05:05:47', '2026-03-18 05:05:47', NULL, NULL),
(21, 'Cash Out', 27005.00, 'MANG LOLOY-SPICES', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-18 05:07:38', '2026-03-18 05:07:38', NULL, NULL),
(22, 'Cash Out', 210.00, 'STEELWOOL C/O PROD.', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-18 05:08:18', '2026-03-18 05:08:18', NULL, NULL),
(23, 'Cash Out', 630.00, 'DM JUICE PINEAPPLE, SUF POWDER', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-18 05:09:27', '2026-03-18 09:14:16', NULL, NULL),
(24, 'Cash Out', 7600.00, 'JMT ACERON GAS', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-19 03:50:56', '2026-03-19 03:50:56', NULL, 'AM'),
(25, 'Cash Out', 970.00, 'DVB AUTO DETAILING-THINNER FOR SIGNAGE', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-19 03:51:41', '2026-03-19 03:51:41', NULL, 'AM'),
(26, 'Cash Out', 340.00, 'LOVE BUBBLES-LAUNDRY', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-19 10:14:50', '2026-03-19 10:14:50', NULL, 'AM'),
(27, 'Cash In', 7000.00, 'CUT OFF SALES 03/19-JEANNA', 'AMPARO SALES', NULL, 'Margaret', '2026-03-19 10:15:23', '2026-03-19 10:15:23', NULL, 'AM'),
(28, 'Cash Out', 372.00, '7-11 BATTERY C/O CASA', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-19 10:15:48', '2026-03-19 10:15:48', NULL, 'AM'),
(29, 'Cash Out', 1400.00, 'WILSON 3-18, 3-19 AND SQ HAM ', 'SALARY', NULL, 'Margaret', '2026-03-19 10:16:24', '2026-03-19 15:09:50', NULL, 'AM'),
(30, 'Cash Out', 5586.00, 'WEEKLY CASH OUT', 'TOTAL SALES CASH OUT', NULL, 'System Administrator', '2026-03-20 06:11:57', '2026-03-20 06:11:57', NULL, NULL),
(31, 'Cash In', 6185.00, 'NENA 03/21/26', 'AMPARO SALES', NULL, 'Margaret', '2026-03-23 09:09:59', '2026-03-23 09:09:59', NULL, 'AM'),
(32, 'Cash In', 13045.00, 'JEANNALYN 03/22/26', 'AMPARO SALES', NULL, 'Margaret', '2026-03-23 09:10:32', '2026-03-23 09:10:32', NULL, 'AM'),
(33, 'Cash In', 5097.00, 'CAPRI PAYMENT 03/22/26', 'DELIVERY PAYMENT', NULL, 'Margaret', '2026-03-23 09:10:57', '2026-03-23 09:10:57', NULL, 'AM'),
(34, 'Cash Out', 1550.00, 'PINYA AND CHESES', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-23 09:11:24', '2026-03-23 09:11:24', NULL, 'AM'),
(35, 'Cash Out', 7600.00, 'JMT ACERON GAS', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-23 09:11:42', '2026-03-23 09:11:42', NULL, 'AM'),
(36, 'Cash Out', 210.00, 'BOND PAPER SHORT', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-23 09:12:06', '2026-03-23 09:12:06', NULL, 'AM'),
(37, 'Cash Out', 350.00, 'EXY HARDWARE-REGULATOR', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-23 09:12:36', '2026-03-23 09:12:36', NULL, 'AM'),
(38, 'Cash Out', 20.00, '20 PCS TOX', 'OTHER EXPENSES', NULL, 'Margaret', '2026-03-23 09:13:28', '2026-03-23 09:13:28', NULL, 'AM'),
(39, 'Cash In', 7500.00, 'CUT OFF JEANNALYN 03/23/26', 'AMPARO SALES', NULL, 'Margaret', '2026-03-23 10:15:11', '2026-03-23 10:15:11', NULL, 'AM'),
(40, 'Cash In', 4925.00, 'JEANNALYN 03/23/26', 'AMPARO SALES', NULL, 'Margaret', '2026-03-24 01:29:01', '2026-03-24 01:29:01', NULL, 'AM'),
(41, 'Cash In', 6044.00, 'BELEN PAYMENT', 'DELIVERY PAYMENT', NULL, 'Margaret', '2026-03-24 01:29:24', '2026-03-24 01:29:24', NULL, 'AM');

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
  `employee_profile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shift` enum('AM','PM') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `mobile`, `address`, `full_name`, `role`, `employee_role`, `store_id`, `permissions`, `can_login`, `password`, `remember_token`, `created_at`, `updated_at`, `employee_profile`, `shift`) VALUES
(1, 'admin', 'admin@lztmeat.com', NULL, NULL, 'System Administrator', 'ADMIN', NULL, NULL, '\"[\\\"all\\\"]\"', 1, '$2y$12$YbfvgJJ1dnBSo5rHyHvDU.ndvorINxZBIC2ucyCbty0LwxJMG.0dS', NULL, '2026-01-30 10:56:01', '2026-01-30 10:56:01', NULL, NULL),
(18, 'Noli', NULL, '09994072297', 'DUNGON STREET AMPARO SUBDIVISION CALOOCAN CITY', 'Noli', 'EMPLOYEE', NULL, 1, '[\"production\",\"production_pack\",\"production_cook\"]', 1, '$2y$12$SNWWcP8KKY15vCcekLHx8e98lWrYi6DhAlCOHJH9UGMOr6LDdQODW', NULL, '2026-03-02 08:56:38', '2026-03-16 15:28:03', '{\"dateOfBirth\":\"1975-11-28\",\"gender\":\"Male\",\"civilStatus\":\"Married\",\"nationality\":\"FILIPINO\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"33-5794729-5\",\"philhealthNumber\":\"19-052274417-8\",\"tinNumber\":\"914-533-632\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"CARMELA OGAHAYON\",\"emergencyContactRelationship\":\"WIFE\",\"emergencyContactPhone\":\"\",\"dateHired\":\"2025-11-01\",\"position\":\"PRODUCTION STAFF\",\"department\":\"SIOMAI\",\"education\":[]}', NULL),
(22, 'Calen', NULL, '09514731424', '', 'Calen', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"reports\",\"sales\"]', 1, '$2y$12$cVGKYigqrLR5HLyCvMO.iuXT89FvzkILTJAty0YjHruqIKDnlkJPO', NULL, '2026-03-04 03:17:13', '2026-03-18 09:10:13', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', 'AM'),
(32, 'Eden', NULL, '09514731424', '', 'Eden', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"sales\",\"reports\"]', 1, '$2y$12$GQAc5mxC.g7T/s7i1BgXLevWwarZnHpBvGCaOunZdnuLJGHwT2JI.', NULL, '2026-03-09 01:47:50', '2026-03-16 15:19:42', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(33, 'Jeannalyn', NULL, '09514731424', '', 'Jeannalyn', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"sales\",\"reports\"]', 1, '$2y$12$HMkmVk/1RQgtnv92QERW5uzSq3wfqG6ggl1l79GdzXyVTfZ6Oz0jK', NULL, '2026-03-09 01:50:25', '2026-03-16 15:21:43', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"Filipino\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(34, 'Maryrose', NULL, '09514731424', '', 'Maryrose', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"sales\",\"reports\"]', 1, '$2y$12$ltsr5vXZAGrN55277bTObOfTVPNA.OSU3U.zS6E4btsGzdi.A7o3q', NULL, '2026-03-09 01:54:55', '2026-03-15 05:35:38', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(35, 'Reyrieza', NULL, '09514731424', '', 'Reyrieza', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"sales\",\"reports\"]', 1, '$2y$12$Sk.9CLZKm1CXwbKwkmH6l.hfkRA8OffkQu70ykzFe2V3RfTIKFrNW', NULL, '2026-03-09 01:55:54', '2026-03-16 15:30:45', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(36, 'Sherryl', NULL, '09514731424', '', 'Sherryl', 'EMPLOYEE', NULL, NULL, '[\"pos\",\"transfer\",\"sales\",\"reports\"]', 1, '$2y$12$lLfr0hiImB78ty8wodV5suRnLgOGpvjFrY7zTsBUK0li5FxMyp6dO', NULL, '2026-03-09 01:57:04', '2026-03-16 15:31:07', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(38, 'Norilyn', NULL, '09608115448', '', 'Norilyn', 'EMPLOYEE', NULL, NULL, '[\"transfer\",\"production\",\"production_pack\",\"production_cook\"]', 1, '$2y$12$HpIs1oLn/FnT4o.8cxLS9ub3S.fXZJrEdeyVFnzGGL3gFWJc5k3y.', NULL, '2026-03-09 03:06:41', '2026-03-16 15:29:31', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(39, 'Rejean', NULL, '09608115448', '', 'Rejean', 'EMPLOYEE', NULL, NULL, '[\"transfer\",\"production\",\"production_pack\"]', 1, '$2y$12$TH5nIXzdYPy0ZTFzlMxL8OULSQohuHg80uJ061.MMnyj8tkOhazKC', NULL, '2026-03-09 03:07:07', '2026-03-16 15:45:26', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(40, 'Julian', NULL, '09608115448', '', 'Julian', 'EMPLOYEE', NULL, NULL, '[\"production\",\"production_pack\",\"production_cook\",\"transfer\"]', 1, '$2y$12$KhuyCEcASI54G.SaM78/Ue.NcfI3xKVvd0SeMSl35nDm3UMpmieIK', NULL, '2026-03-09 03:07:37', '2026-03-16 15:23:26', '{\"dateOfBirth\":\"\",\"gender\":\"Male\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(41, 'Vincent', NULL, '09608115448', '', 'Vincent', 'EMPLOYEE', NULL, NULL, '[\"production\",\"production_pack\",\"production_cook\",\"transfer\"]', 1, '$2y$12$xxHR763UASques5CzB6RQOBiGtOj0sI36hzwG.s5/7lglS47zxLc2', NULL, '2026-03-09 03:08:03', '2026-03-16 15:31:53', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(42, 'Analyn', NULL, '09608115448', '', 'Analyn', 'EMPLOYEE', NULL, 6, '[\"transfer\",\"production\",\"production_pack\",\"production_cook\"]', 1, '$2y$12$8P1rA.zboXF0oNd/gJlEEOyMAcPyfTsbu15PVbKHf43l1jzq0XVGe', NULL, '2026-03-09 03:09:44', '2026-03-16 23:31:44', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL),
(43, 'Bruce', NULL, '09514731424', '', 'Bruce', 'EMPLOYEE', NULL, NULL, '[\"inventory\",\"transfer\"]', 1, '$2y$12$VLE1kWE9GSpa9LaEc6oTmOglZyhSECZbpOrvtHiIuo8F85pmW/a9K', NULL, '2026-03-09 03:10:40', '2026-03-16 15:18:09', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', 'AM'),
(44, 'Wilson', NULL, '09608115448', '', 'Wilson', 'EMPLOYEE', NULL, NULL, '[\"production\",\"production_cook\",\"ingredients\",\"transfer\",\"inventory\",\"admin_perm_inventory_add\",\"admin_perm_transfer_new\",\"admin_perm_ingredients_edit\"]', 1, '$2y$12$VRn5sRXstkOodrgzG3EX8.sfSDzKwvPrISzi8vJbGFSjDj/sLGf4K', NULL, '2026-03-09 03:11:57', '2026-03-19 15:07:36', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', 'AM'),
(45, 'Margaret', NULL, '09264030439', 'Camarin Caloocan City', 'Margaret', 'EMPLOYEE', NULL, NULL, '[\"inventory\",\"sales\",\"reports\",\"stores\",\"supplier-invoices\",\"transactions\",\"history\",\"admin_perm_transactions_add\",\"admin_perm_transactions_cashout\",\"admin_perm_suppliers_add\",\"transfer\"]', 1, '$2y$12$B3QJt55bMTzxyZqkx73/deESextQ99JMzoJjDH1Jmh3NcgvbwVnQO', NULL, '2026-03-13 06:28:41', '2026-03-23 02:44:12', '{\"dateOfBirth\":\"\",\"gender\":\"Female\",\"civilStatus\":\"Single\",\"nationality\":\"FILIPINO\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', 'AM'),
(49, 'test', NULL, '09123456789', '', 'test', 'EMPLOYEE', NULL, NULL, '[\"production\"]', 1, '$2y$12$2ndH8bBLdD.5kp13v18gIeeKPiuG3cUfV/KLnMEKngkG997Xs08B.', NULL, '2026-03-16 15:49:52', '2026-03-17 13:27:40', '{\"dateOfBirth\":\"\",\"gender\":\"\",\"civilStatus\":\"\",\"nationality\":\"\",\"bloodType\":\"\",\"height\":\"\",\"weight\":\"\",\"sssNumber\":\"\",\"philhealthNumber\":\"\",\"tinNumber\":\"\",\"pagibigNumber\":\"\",\"emergencyContactName\":\"\",\"emergencyContactRelationship\":\"\",\"emergencyContactPhone\":\"\",\"dateHired\":\"\",\"position\":\"\",\"department\":\"\",\"education\":[]}', NULL);

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
-- Indexes for table `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discount_product_map`
--
ALTER TABLE `discount_product_map`
  ADD PRIMARY KEY (`discount_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `discount_settings`
--
ALTER TABLE `discount_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discrepancy_adjustments`
--
ALTER TABLE `discrepancy_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_da_discrepancy` (`sales_discrepancy_id`),
  ADD KEY `idx_da_cashier` (`cashier`),
  ADD KEY `idx_da_created` (`created_at`);

--
-- Indexes for table `eod_stock_counts`
--
ALTER TABLE `eod_stock_counts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eod_user` (`user_id`),
  ADD KEY `idx_eod_store` (`store_id`),
  ADD KEY `idx_eod_date` (`shift_date`);

--
-- Indexes for table `eod_stock_count_items`
--
ALTER TABLE `eod_stock_count_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_eod_items_count` (`eod_count_id`);

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
-- Indexes for table `product_fractional_prices`
--
ALTER TABLE `product_fractional_prices`
  ADD PRIMARY KEY (`product_id`);

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
-- Indexes for table `sales_discrepancies`
--
ALTER TABLE `sales_discrepancies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sd_store` (`store_id`),
  ADD KEY `idx_sd_date` (`shift_date`),
  ADD KEY `idx_sd_status` (`status`);

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
-- Indexes for table `supplier_invoices`
--
ALTER TABLE `supplier_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier` (`supplier_id`),
  ADD KEY `idx_date` (`invoice_date`);

--
-- Indexes for table `system_history`
--
ALTER TABLE `system_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_history_user_id_foreign` (`user_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `discounts`
--
ALTER TABLE `discounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `discount_settings`
--
ALTER TABLE `discount_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `discrepancy_adjustments`
--
ALTER TABLE `discrepancy_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `eod_stock_counts`
--
ALTER TABLE `eod_stock_counts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `eod_stock_count_items`
--
ALTER TABLE `eod_stock_count_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `ingredient_categories`
--
ALTER TABLE `ingredient_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=258;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `production_ingredients`
--
ALTER TABLE `production_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_outputs`
--
ALTER TABLE `production_outputs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `production_records`
--
ALTER TABLE `production_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `product_default_ingredients`
--
ALTER TABLE `product_default_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `product_mix_categories`
--
ALTER TABLE `product_mix_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `product_mix_category_default_ingredients`
--
ALTER TABLE `product_mix_category_default_ingredients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=443;

--
-- AUTO_INCREMENT for table `product_mix_inventory`
--
ALTER TABLE `product_mix_inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `product_mix_items`
--
ALTER TABLE `product_mix_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `raw_product_inventory`
--
ALTER TABLE `raw_product_inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `report_entries`
--
ALTER TABLE `report_entries`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `report_headers`
--
ALTER TABLE `report_headers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sales_discrepancies`
--
ALTER TABLE `sales_discrepancies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `supplier_invoices`
--
ALTER TABLE `supplier_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `system_history`
--
ALTER TABLE `system_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=467;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `transfers`
--
ALTER TABLE `transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

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
