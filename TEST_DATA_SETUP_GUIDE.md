# LZT Meat - Test Data Setup Guide

**Purpose:** Prepare consistent test data for comprehensive testing  
**Version:** 1.0  
**Date:** February 6, 2026

---

## 🎯 Overview

This guide provides SQL scripts and procedures to populate your test database with realistic data that covers various scenarios and edge cases.

---

## 📋 Pre-Setup Checklist

- [ ] Database created: `lzt_meat`
- [ ] Migrations run: `php artisan migrate`
- [ ] No existing test data (or existing data backed up)
- [ ] MySQL connection active
- [ ] Can access Laravel backend

---

## 🏪 Stores Setup

### Automatic Setup (Via API)

1. Login as Admin
2. Go to Stores page
3. System should show "Main Store" by default
4. Manually add these stores:

| Name           | Address       | Contact      | Phone    | Email             | Status   |
| -------------- | ------------- | ------------ | -------- | ----------------- | -------- |
| Main Store     | 123 First Ave | Admin        | 555-0001 | main@lztmeat.com  | Active   |
| North Branch   | 456 Second St | John Smith   | 555-0002 | north@lztmeat.com | Active   |
| South Branch   | 789 Third Rd  | Maria Garcia | 555-0003 | south@lztmeat.com | Active   |
| East Warehouse | 321 Fourth Ln | Ahmed Hassan | 555-0004 | east@lztmeat.com  | Active   |
| Test Store     | 999 Test Way  | Test User    | 555-9999 | test@lztmeat.com  | Inactive |

### SQL Manual Insert

```sql
-- Login as root or appropriate user
USE lzt_meat;

-- Insert stores
INSERT INTO stores (id, name, address, contact_person, phone, email, status, created_at, updated_at) VALUES
(1, 'Main Store', '123 First Ave', 'Admin', '555-0001', 'main@lztmeat.com', 'active', NOW(), NOW()),
(2, 'North Branch', '456 Second St', 'John Smith', '555-0002', 'north@lztmeat.com', 'active', NOW(), NOW()),
(3, 'South Branch', '789 Third Rd', 'Maria Garcia', '555-0003', 'south@lztmeat.com', 'active', NOW(), NOW()),
(4, 'East Warehouse', '321 Fourth Ln', 'Ahmed Hassan', '555-0004', 'east@lztmeat.com', 'active', NOW(), NOW()),
(5, 'Test Store', '999 Test Way', 'Test User', '555-9999', 'test@lztmeat.com', 'inactive', NOW(), NOW());
```

---

## 👥 Users/Employees Setup

### Default System Users

| Username   | Password | Role       | Store      | Name               |
| ---------- | -------- | ---------- | ---------- | ------------------ |
| admin      | admin123 | ADMIN      | Main Store | Administrator      |
| store_user | store123 | STORE      | Main Store | Store Manager      |
| production | prod123  | PRODUCTION | Main Store | Production Manager |
| pos_user   | pos123   | POS        | Main Store | POS Operator       |

### Test Employees

Create these employees for testing:

| Name          | Username      | Role       | Store        | Permissions                                   | Can Login |
| ------------- | ------------- | ---------- | ------------ | --------------------------------------------- | --------- |
| John Smith    | john.smith    | Store      | North Branch | Dashboard, Sales, Inventory, Reports, History | Yes       |
| Maria Garcia  | maria.garcia  | Store      | South Branch | Dashboard, Sales, Inventory, Reports          | Yes       |
| Ahmed Hassan  | ahmed.hassan  | Production | Main Store   | Dashboard, Production, Ingredients, Transfer  | Yes       |
| Disabled User | disabled_user | Employee   | Main Store   | Sales                                         | No        |

### SQL Insert

```sql
-- Insert test employees
INSERT INTO users (id, username, password, full_name, role, employee_role, store_id, can_login, created_at, updated_at) VALUES
(1, 'john.smith', CONCAT('$2y$12$', SHA2('john123', 256)), 'John Smith', 'EMPLOYEE', 'Store', 2, 1, NOW(), NOW()),
(2, 'maria.garcia', CONCAT('$2y$12$', SHA2('maria123', 256)), 'Maria Garcia', 'EMPLOYEE', 'Store', 3, 1, NOW(), NOW()),
(3, 'ahmed.hassan', CONCAT('$2y$12$', SHA2('ahmed123', 256)), 'Ahmed Hassan', 'EMPLOYEE', 'Production', 1, 1, NOW(), NOW()),
(4, 'disabled_user', CONCAT('$2y$12$', SHA2('disabled123', 256)), 'Disabled User', 'EMPLOYEE', 'Employee', 1, 0, NOW(), NOW());
```

---

## 📦 Products Setup

### Common Meat Products

```
SKU         | Name                | Category    | Unit  | Price  | Min Stock | Reorder
BA001       | Beef Brisket        | Beef        | kg    | 450.00 | 50        | 100
BA002       | Beef Ribs           | Beef        | kg    | 520.00 | 30        | 60
P001        | Pork Belly          | Pork        | kg    | 320.00 | 40        | 80
P002        | Pork Chops          | Pork        | kg    | 380.00 | 50        | 100
C001        | Chicken Breast      | Poultry     | kg    | 220.00 | 60        | 120
C002        | Chicken Thighs      | Poultry     | kg    | 180.00 | 40        | 80
L001        | Lamb Chops          | Lamb        | kg    | 580.00 | 20        | 40
S001        | Longanisa (Sweet)   | Specialty   | piece | 185.00 | 100       | 200
S002        | Longanisa (Spicy)   | Specialty   | piece | 195.00 | 80        | 160
M001        | Ground Beef         | Beef        | kg    | 380.00 | 50        | 100
```

### Categories Required

- Beef
- Pork
- Poultry
- Lamb
- Specialty

---

## 📊 Inventory Setup

### Stock Levels by Store

Each store should have these products with varying stock:

| Product           | Main Store | North Branch | South Branch | East Warehouse |
| ----------------- | ---------- | ------------ | ------------ | -------------- |
| Beef Brisket      | 150        | 80           | 60           | 120            |
| Pork Belly        | 120        | 40           | 100          | 90             |
| Chicken Breast    | 200        | 150          | 120          | 180            |
| Longanisa (Sweet) | 500        | 300          | 250          | 400            |
| Ground Beef       | 100        | 50           | 80           | 70             |

---

## 🧪 Ingredients Setup

### Test Ingredients

| Name             | Category      | Unit  | Supplier   | Current Stock |
| ---------------- | ------------- | ----- | ---------- | ------------- |
| White Peppercorn | Spices        | grams | Supplier A | 500           |
| Salt             | Spices        | grams | Supplier A | 2000          |
| Curing Nitrate   | Curing Agents | grams | Supplier B | 200           |
| Garlic Powder    | Spices        | grams | Supplier A | 300           |
| Brown Sugar      | Sweeteners    | grams | Supplier C | 1000          |

---

## 🏭 Production Records (Sample Data)

### Create Production Batch

**Example:** Creating Longanisa batch

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| Product          | Longanisa (Sweet)                                  |
| Quantity         | 100 pieces                                         |
| Date             | 2026-02-05                                         |
| Status           | Completed                                          |
| Ingredients Used | - White Peppercorn: 10g, - Salt: 20g, - Garlic: 5g |

Create 3-5 production records with different statuses (Completed, In Progress, Pending)

---

## 💰 Sales Transactions (Sample Data)

### Create Test Sales

**Sale 1: Cash Transaction**

- Items: Longanisa x 5, Chicken Breast x 10kg
- Subtotal: 2,925
- Tax: 351
- Total: 3,276
- Payment: Cash
- Timestamp: 2026-02-05 10:30

**Sale 2: Card Transaction**

- Items: Beef Brisket x 20kg, Pork Chops x 15kg
- Subtotal: 15,300
- Tax: 1,836
- Total: 17,136
- Payment: Credit Card
- Timestamp: 2026-02-05 14:15

**Sale 3: With Discount**

- Items: Chicken Breast x 30kg
- Subtotal: 6,600
- Discount: -990 (15%)
- Tax: 682.80
- Total: 6,292.80
- Payment: Cash
- Timestamp: 2026-02-05 16:45

---

## 🚚 Transfers (Sample Data)

### Create Test Transfers

**Transfer 1**

- From: Main Store
- To: North Branch
- Product: Pork Belly
- Quantity: 50 kg
- Status: Completed (received)
- Date: 2026-02-04

**Transfer 2**

- From: Main Store
- To: South Branch
- Product: Chicken Breast
- Quantity: 100 kg
- Status: In Transit
- Date: 2026-02-05

**Transfer 3**

- From: East Warehouse
- To: North Branch
- Product: Longanisa
- Quantity: 200 pieces
- Status: Pending
- Date: 2026-02-06

---

## 🏢 Suppliers Setup

### Test Suppliers

| ID  | Name       | Contact Person | Phone    | Email                | Address           |
| --- | ---------- | -------------- | -------- | -------------------- | ----------------- |
| 1   | Supplier A | Jose Santos    | 555-5001 | supplier_a@email.com | 1234 Supplier Way |
| 2   | Supplier B | Maria Reyes    | 555-5002 | supplier_b@email.com | 5678 Merchant Rd  |
| 3   | Supplier C | Juan Dela Cruz | 555-5003 | supplier_c@email.com | 9012 Trade St     |

---

## 💳 Discounts Setup

### Test Discount Rules

**Discount 1: Volume Discount**

- Name: "Bulk Purchase - 10%"
- Type: Percentage
- Value: 10%
- Applicable To: All Beef products
- Start Date: 2026-02-01
- Status: Active

**Discount 2: Fixed Amount Discount**

- Name: "Longanisa Promotion - ₱50 Off"
- Type: Fixed Amount
- Value: 50
- Applicable To: Longanisa products
- Start Date: 2026-02-01
- End Date: 2026-02-28
- Status: Active

**Discount 3: Expired Discount**

- Name: "Old Promotion"
- Type: Percentage
- Value: 5%
- Applicable To: All Products
- Start Date: 2026-01-01
- End Date: 2026-01-31
- Status: Inactive

---

## 🧪 Test Scenarios

### Scenario 1: Normal Day Sales

1. Create 5-10 sales transactions throughout the day
2. Mix payment methods (Cash, Card, Mobile)
3. Include discounted and regular items
4. Verify inventory updates correctly

### Scenario 2: Stock Transfer & Receiving

1. Create transfer from Main Store to North Branch
2. Mark as "In Transit"
3. Verify source inventory decreased
4. Complete receiving
5. Verify destination inventory increased

### Scenario 3: Low Stock Alert

1. Reduce inventory of a product below its reorder point
2. Check if reorder alerts appear in inventory module
3. Generate reorder report
4. Verify report accuracy

### Scenario 4: Production Workflow

1. Create production record
2. Specify ingredients used
3. Set status to "In Progress"
4. Verify ingredients deducted from inventory
5. Mark as "Completed"
6. Verify output added to production inventory

### Scenario 5: Multi-Store Consistency

1. Create same product in multiple stores with different prices
2. Create transfers between stores
3. Verify each store's inventory is independent
4. Verify transfers correctly adjust quantities

### Scenario 6: Permission Testing

1. Login as Store user
2. Try accessing Production module (should be denied)
3. Try accessing Reports (should be allowed)
4. Login as POS user
5. Try accessing Inventory (should be denied)

### Scenario 7: Report Generation\*\*

1. Generate daily report for selected date
2. Select specific store
3. Export as PDF
4. Verify PDF contains correct data
5. Export as CSV
6. Verify CSV opens in Excel

---

## 📝 Data Quality Checks

After setup, verify:

- [ ] All stored timestamps are in correct format (ISO 8601)
- [ ] All numeric fields store correct decimal places
- [ ] No NULL values in required fields
- [ ] Foreign key relationships intact
- [ ] No duplicate SKUs or usernames
- [ ] Stock doesn't go negative
- [ ] All products linked to correct categories
- [ ] All employees linked to correct stores
- [ ] Price fields have 2 decimal places
- [ ] Phone numbers consistent format

---

## 🔄 Data Reset Script

Use this when you need to reset test data between test cycles:

```sql
-- Backup current data
-- BACKUP TABLES FIRST!

-- Clear all tables (except users for now)
TRUNCATE TABLE sales;
TRUNCATE TABLE transfers;
TRUNCATE TABLE inventory;
TRUNCATE TABLE inventory_history;
TRUNCATE TABLE products;
TRUNCATE TABLE production_records;
TRUNCATE TABLE production_ingredients;
TRUNCATE TABLE ingredients;
TRUNCATE TABLE stock_adjustments;
TRUNCATE TABLE system_history;

-- Keep users and stores
-- Re-run migrations for clean slate: php artisan migrate:reset && php artisan migrate
```

---

## 🏁 Validation Checklist

After completing data setup:

- [ ] All 5 stores exist
- [ ] At least 10 products created
- [ ] At least 15 inventory records
- [ ] At least 5 employees with correct roles
- [ ] At least 3 suppliers
- [ ] At least 5 sales transactions created
- [ ] At least 2 production records
- [ ] At least 2 transfers
- [ ] No console errors loading pages
- [ ] Inventory math checks out
- [ ] All timestamps recorded
- [ ] All users can login

---

## 📞 Troubleshooting

### Stores not appearing in dropdown

- [ ] Ensure stores created via API/UI (not just SQL)
- [ ] Refresh browser
- [ ] Check localStorage is not blocking data
- [ ] Verify API `/stores` endpoint returns data

### Products not showing in POS

- [ ] Check products assigned to user's store
- [ ] Verify inventory exists for products
- [ ] Check product status is active
- [ ] Refresh page

### Sales not calculating correctly

- [ ] Verify tax rate configured
- [ ] Check discount calculation
- [ ] Confirm prices saved correctly
- [ ] Review calculation formula

### Transfers not working

- [ ] Ensure both stores exist
- [ ] Verify product stock available
- [ ] Check transfer status workflow
- [ ] Confirm inventory updates after receipt

### Reports not generating

- [ ] Check date is within data range
- [ ] Verify selected store exists
- [ ] Check server logs for errors
- [ ] Try PDF first, then CSV

---

## 🎓 Learning Paths

### Path 1: Inventory Focus

1. Create products
2. Set inventory levels
3. Create transfers
4. Verify stock math
5. Generate reports

### Path 2: Sales Focus

1. Create sales transactions
2. Apply discounts
3. Process different payment methods
4. Print receipts
5. Run sales reports

### Path 3: Production Focus

1. Create production batches
2. Use ingredients
3. Update production status
4. Track output
5. View production history

### Path 4: Multi-Store Focus

1. View store-specific inventory
2. Create transfers between stores
3. Receive transfers
4. Generate store-specific reports
5. Verify data isolation

---

## 📚 Reference Documents

- [COMPREHENSIVE_TEST_PLAN.md](COMPREHENSIVE_TEST_PLAN.md) - Full test plan
- [QUICK_TEST_CHECKLIST.md](QUICK_TEST_CHECKLIST.md) - Quick testing checklist
- [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md) - How to report bugs
- [backend/README.md](backend/README.md) - API documentation

---

**Last Updated:** February 6, 2026  
**Author:** System Admin  
**Questions?** Contact the development team
