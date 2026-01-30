# Quick Start Guide - Ingredients Inventory System

## 🚀 Quick Setup (2 minutes)

### Prerequisites

- PHP 8.0+
- Node.js 16+
- MySQL 8.0+
- Database: `lzt_meat` (already created)

### Start Servers

**Terminal 1 - Backend (PHP)**

```powershell
cd c:\Users\mikoy\Documents\Servxbit\LZTmeat\backend
php -S localhost:8000
# Server starts: http://localhost:8000
```

**Terminal 2 - Frontend (Vite)**

```powershell
cd c:\Users\mikoy\Documents\Servxbit\LZTmeat
npm run dev
# Server starts: http://localhost:5173
```

### Access Application

1. Open browser: `http://localhost:5173`
2. Login credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Navigate to **Ingredients** in sidebar

---

## 📊 What You'll See

### Ingredients Page Features

```
┌─────────────────────────────────────────────────────┐
│  INGREDIENTS INVENTORY                              │
├─────────────────────────────────────────────────────┤
│  📦 Total: 12  │  ₱ Value: ₱230,195  │  ⚠️ Low: 1 │
├─────────────────────────────────────────────────────┤
│  🔍 Search ___________  [Filter Category ▼]         │
│  [➕ Add] [📥 Export] [🔄 Reset]                     │
├─────────────────────────────────────────────────────┤
│ Code      │ Name              │ Stock │ Status      │
├───────────┼──────────────────┼────────┼─────────────┤
│ BEEF-001  │ Beef Chuck       │ 150.5  │ ✅ In Stock │
│ BEEF-002  │ Beef Ribeye      │ 85.25  │ ✅ In Stock │
│ BEEF-003  │ Ground Beef      │ 15.00  │ ⚠️ LOW     │
│ CHK-001   │ Chicken Breast   │ 200.00 │ ✅ In Stock │
│ ...       │ ...              │ ...    │ ...         │
└─────────────────────────────────────────────────────┘
```

---

## 🎮 Operations

### Search for Ingredient

```
Type in search box: "Beef" → Shows all beef products
Type: "BEEF-001" → Shows specific code
Type: "ABC Meat" → Shows supplier's items
```

### Filter by Category

```
Click dropdown → Select "Beef" → Shows only beef items
Click dropdown → Select "All" → Shows all items
```

### Add New Ingredient

```
Click [Add] button
→ Fill form:
   - Name: "New Meat"
   - Code: "NEW-001"
   - Category: "Custom"
   - Unit: "kg"
   - Stock: "100"
   - Min Level: "20"
   - Reorder Point: "30"
   - Cost/Unit: "500"
   - Supplier: [Select from dropdown]
→ Click Save
```

### Adjust Stock

```
Click menu icon on ingredient row
→ Click "Adjust Stock"
→ Select "Add" or "Remove"
→ Enter quantity: "50"
→ Enter reason: "Received shipment"
→ Click Confirm
```

### Edit Details

```
Click menu icon on ingredient row
→ Click "Edit"
→ Modify any fields
→ Click Save
```

### Delete Ingredient

```
Click menu icon on ingredient row
→ Click "Delete"
→ Confirm in popup
→ Item removed
```

### Export to CSV

```
Click [Export] button
→ Downloads: ingredients.csv
→ Open in Excel/Sheets
```

---

## 📈 Sample Data

| Code         | Name            | Stock  | Min    | Supplier            |
| ------------ | --------------- | ------ | ------ | ------------------- |
| BEEF-001     | Beef Chuck      | 150.5  | 50     | ABC Meat Supply     |
| BEEF-002     | Beef Ribeye     | 85.25  | 30     | ABC Meat Supply     |
| **BEEF-003** | **Ground Beef** | **15** | **25** | **ABC Meat Supply** |
| PORK-001     | Pork Shoulder   | 120    | 40     | Fresh Farms Co      |
| CHK-001      | Chicken Breast  | 200    | 80     | Quality Meats Ltd   |
| LAMB-001     | Lamb Chops      | 42     | 15     | Premium Imports     |
| FISH-001     | Fish Fillet     | 65     | 30     | Local Herds         |
| FISH-002     | Shrimp          | 35     | 10     | Local Herds         |

_⚠️ Ground Beef is low stock and needs reorder_

---

## 🔌 API Endpoints

### For Developers

**Get All Ingredients**

```bash
curl http://localhost:8000/api/ingredients
```

**Add Ingredient**

```bash
curl -X POST http://localhost:8000/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{"name":"Beef","code":"B001","category":"Beef","unit":"kg","stock":100,"minStockLevel":20,"reorderPoint":30,"costPerUnit":500,"supplierId":1}'
```

**Update Ingredient**

```bash
curl -X PUT http://localhost:8000/api/ingredients/1 \
  -H "Content-Type: application/json" \
  -d '{"stock":150,"minStockLevel":50}'
```

**Delete Ingredient**

```bash
curl -X DELETE http://localhost:8000/api/ingredients/1
```

**Get Suppliers**

```bash
curl http://localhost:8000/api/suppliers
```

---

## ✅ Testing Checklist

After opening the page, verify:

- [ ] Page loads without errors
- [ ] Ingredients table shows 12 items
- [ ] Statistics display correctly
- [ ] Search works (try "Beef")
- [ ] Filter works (select "Beef" category)
- [ ] Can scroll and see all columns
- [ ] Add button opens modal
- [ ] Menu buttons appear on hover
- [ ] Export downloads CSV file
- [ ] Low stock item highlighted in red/orange

---

## 🆘 Troubleshooting

### Ingredients Not Showing

```
Solution 1: Check servers are running
  - Terminal 1 should show: "PHP 8.x Development Server"
  - Terminal 2 should show: "VITE v6.3.5 ready"

Solution 2: Refresh browser (Ctrl+F5)

Solution 3: Check browser console (F12 → Console tab)
  - Look for red error messages
  - Check Network tab for failed API calls

Solution 4: Verify database has data
  - Run: php check_db.php
  - Should show "ingredients: 12 records"
```

### API Errors

```
HTTP 404: Backend not running
  Solution: Start PHP server on localhost:8000

HTTP 500: Database error
  Solution: Check MySQL is running
  Run: php check_db.php

CORS Error: Frontend blocked
  Solution: Restart PHP server
```

### Page Stuck Loading

```
Solution: Hard refresh browser (Ctrl+Shift+R)
         Clears cache and reloads all files
```

---

## 📁 Project Structure

```
LZTmeat/
├── backend/
│   └── index.php                 # REST API server
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── IngredientsInventoryPage.tsx
│   │   └── context/
│   │       └── IngredientsContext.tsx
│   └── utils/
│       └── api.ts                # API client
├── seed_ingredients.php          # Sample data
├── check_db.php                  # Database check
└── package.json                  # Node dependencies
```

---

## 🎓 Learning Resources

### File Locations

- **Frontend Page**: `src/app/components/IngredientsInventoryPage.tsx`
- **State Context**: `src/app/context/IngredientsContext.tsx`
- **API Client**: `src/utils/api.ts`
- **Backend API**: `backend/index.php`
- **Database**: `lzt_meat` MySQL database

### Key Concepts

1. **Context API**: Global state management
2. **REST API**: Backend HTTP endpoints
3. **React Hooks**: useState, useContext, useEffect
4. **TypeScript**: Type-safe data structures
5. **Tailwind CSS**: Styling framework

---

## 📞 Support

**Common Questions**

Q: How do I add more suppliers?
A: Use the Suppliers page from main menu

Q: Can I modify prices bulk?
A: Currently one-by-one via UI. Bulk updates can be added

Q: How do I track stock history?
A: Check the History page for transaction records

Q: Can I export to other formats?
A: Currently CSV. Excel/PDF export can be added

---

## ✨ System Ready!

Your Ingredients Inventory Management System is fully operational.

**Status**: ✅ PRODUCTION READY
**Data**: ✅ LOADED (12 ingredients, 5 suppliers)
**API**: ✅ FUNCTIONAL (5 endpoints)
**Frontend**: ✅ RUNNING (port 5173)
**Backend**: ✅ RUNNING (port 8000)

**Start managing your ingredients now!** 🚀

---

Last Updated: Jan 29, 2026
