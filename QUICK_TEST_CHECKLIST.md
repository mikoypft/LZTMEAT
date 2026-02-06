# LZT Meat - Quick Test Checklist

**Date:** ****\_\_\_****  
**Tester:** ****\_\_\_****  
**Build Version:** ****\_\_\_****

---

## ✅ Critical Path Testing (Start Here)

### 1. Login & Access

- [ ] Can login with Admin credentials
- [ ] Can login with Store credentials
- [ ] Can login with Production credentials
- [ ] Can login with POS credentials
- [ ] Invalid login shows error
- [ ] Session persists on refresh
- [ ] Can logout

### 2. Dashboard

- [ ] Dashboard loads without errors
- [ ] Key metrics display
- [ ] No "undefined" or error text visible
- [ ] Page is responsive

### 3. Main Modules Load

- [ ] Inventory page loads
- [ ] Sales/POS loads
- [ ] Production loads
- [ ] Reports loads
- [ ] Stores loads
- [ ] Employees loads

### 4. Create & Read Operations

- [ ] Can add product to inventory
- [ ] Inventory list updates
- [ ] Can add store
- [ ] Stores list updates
- [ ] Can create sales transaction
- [ ] Sales appears in list
- [ ] Can create employee
- [ ] Employees appears in list

### 5. Update & Delete Operations

- [ ] Can edit product
- [ ] Can edit store
- [ ] Can edit employee
- [ ] Can delete store (non-main)
- [ ] Deleted items removed from lists

### 6. Inter-Store Transfer

- [ ] Can create transfer
- [ ] Transfer moves to In Transit
- [ ] Transfer can be received
- [ ] Inventory updated correctly

### 7. Reports

- [ ] Reports page loads
- [ ] Stores dropdown populated
- [ ] Can select date
- [ ] PDF export works
- [ ] CSV export works

---

## 🔍 Feature-Specific Testing

### Inventory Management

- [ ] Stock levels accurate
- [ ] Manual adjustments work
- [ ] Reorder alerts display
- [ ] Search works
- [ ] Filter by store works

### Sales/POS

- [ ] Can add items to cart
- [ ] Subtotal calculates correctly
- [ ] Tax calculates correctly
- [ ] Discount applies
- [ ] Payment methods work
- [ ] Receipt prints/exports
- [ ] Sale recorded in system

### Production

- [ ] Can create production record
- [ ] Can select ingredients
- [ ] Status updates: Pending → In Progress → Completed
- [ ] Ingredients deducted from stock
- [ ] Production output increases inventory

### Transfers

- [ ] Can transfer between stores
- [ ] Quantity reduces at source
- [ ] Quantity increases at destination
- [ ] Status workflow: Pending → In Transit → Received

### Employees

- [ ] Can create with different roles
- [ ] Role-based access works
- [ ] Permissions apply correctly
- [ ] Can toggle "Can Login" status

---

## 🐛 Error Scenarios

- [ ] No negative stock allowed
- [ ] Required fields enforced
- [ ] Duplicate SKUs prevented
- [ ] Duplicate usernames prevented
- [ ] Cannot delete Main Store
- [ ] Cannot transfer zero quantity
- [ ] Network errors gracefully handled
- [ ] Long data loads without timeout

---

## 📊 Data Integrity

- [ ] Inventory math checks (Opening + In - Out = Closing)
- [ ] Sales total matches report totals
- [ ] No orphaned records
- [ ] All timestamps recorded
- [ ] All changes logged in history
- [ ] User attribution correct

---

## 🔐 Security & Permissions

- [ ] Admin can access all modules
- [ ] Store users limited to their store
- [ ] Production users cannot access sales
- [ ] POS users cannot access inventory
- [ ] Employee role restricted by permissions
- [ ] Cannot modify other users' transactions

---

## 🌐 Browser/Device Testing

### Desktop Chrome

- [ ] All features work ✓
- [ ] No console errors
- [ ] Responsive on 1920px ✓
- [ ] Responsive on 1024px ✓

### Desktop Firefox

- [ ] All features work ✓
- [ ] No console errors
- [ ] Styling correct ✓

### Desktop Safari

- [ ] All features work ✓
- [ ] No console errors
- [ ] Styling correct ✓

### Mobile/Tablet

- [ ] Layout responsive ✓
- [ ] Touch interactions work ✓
- [ ] Forms readable ✓
- [ ] No horizontal scroll ✓

---

## ⚡ Performance Check

- [ ] Pages load within 3 seconds ✓
- [ ] Lists with 1000+ items responsive ✓
- [ ] PDF generation < 10 seconds ✓
- [ ] No memory leaks after extended use ✓

---

## 🚀 Final Sign-Off

**All Critical Path Tests Passed:** ☐ YES ☐ NO

**Total Issues Found:** **\_\_\_**

**Critical Issues:** **\_\_\_** **HIGH:** **\_\_\_** **MEDIUM:** **\_\_\_** **LOW:** **\_\_\_**

**Ready for Deployment:** ☐ YES ☐ NO (Requires fixes)

**Notes/Comments:**

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Tester Signature:** ************\_************ **Date:** ****\_\_****

---

## 🔗 Related Documents

- Full Test Plan: [COMPREHENSIVE_TEST_PLAN.md](COMPREHENSIVE_TEST_PLAN.md)
- Bug Report Template: [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md)
- API Documentation: [backend/README.md](backend/README.md)
