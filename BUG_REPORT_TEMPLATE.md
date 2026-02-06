# Bug Report Template

_Use this template for reporting any issues found during testing_

---

## 🐛 Bug Report

### Basic Information

**Bug ID:** LZT-XXXX  
**Report Date:** ****\_\_\_****  
**Reported By:** ****\_\_\_****  
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Status:** ☐ New ☐ Acknowledged ☐ In Fix ☐ Resolved ☐ Closed

---

## Description

### Title (One-line summary)

---

### Detailed Description

What happened? What did you expect to happen?

---

---

---

---

## Environment

**Browser:**

- [ ] Chrome (Version: **\_\_\_**)
- [ ] Firefox (Version: **\_\_\_**)
- [ ] Safari (Version: **\_\_\_**)
- [ ] Edge (Version: **\_\_\_**)
- [ ] Other: **********\_**********

**Device:**

- [ ] Desktop (Resolution: ****\_\_****)
- [ ] Tablet (Device: ****\_\_****)
- [ ] Mobile (Device: ****\_\_****)

**Operating System:** ********\_\_\_********

**Backend URL:** ********\_\_\_********

**Frontend URL:** ********\_\_\_********

---

## Steps to Reproduce

1. ***

2. ***

3. ***

4. ***

### Expected Result

---

---

### Actual Result

---

---

---

## Evidence

### Screenshots/Videos

[Attach screenshots or video links]

### Console Errors

```
[Paste any browser console error messages]




```

### Network Errors

```
[Paste any API/network error messages]




```

### Browser DevTools Info

- localStorage: [Relevant data]
- sessionStorage: [Relevant data]
- Console: [See above]

---

## Impact Analysis

### Affected Feature

- [ ] Authentication
- [ ] Store Management
- [ ] Product Management
- [ ] Inventory
- [ ] Production
- [ ] Sales/POS
- [ ] Reports
- [ ] Transfers
- [ ] Employees
- [ ] Suppliers
- [ ] History
- [ ] Other: ******\_\_\_******

### Affected Users

- [ ] All users
- [ ] Specific role: ******\_\_\_\_******
- [ ] Specific user: ******\_\_\_\_******
- [ ] Specific store: ******\_\_\_\_******

### Frequency

- [ ] Always reproducible
- [ ] Intermittent (Frequency: ****\_\_\_\_****)
- [ ] Unable to reproduce consistently

### Data Loss Risk

- [ ] Yes (Describe: **************\_\_\_**************)
- [ ] No

---

## Workaround (If Available)

Is there a temporary workaround?

- [ ] No workaround
- [ ] Yes: ******************************\_\_\_\_******************************

---

## Severity Justification

**Why is this severity level?**

---

---

---

## Additional Information

### Related Issues

[Link to related bugs or feature requests]

### Code References

[If developer: reference to potentially affected code]

### Database Impact

- [ ] Yes (Describe: ******\_\_\_\_******)
- [ ] No impact
- [ ] Unknown

---

## Developer Notes (To be filled by developer)

### Root Cause

---

---

### Fix Details

---

---

### Testing Notes

---

### Regression Risk

- [ ] No
- [ ] Low
- [ ] Medium
- [ ] High (Explain: **************\_\_\_**************)

---

## Resolution

### Fixed By

---

### Fix Date

---

### Version Fixed In

---

### QA Verification

- [ ] Verified - Bug Fixed
- [ ] Verified - Not Fixed
- [ ] Unable to Verify
- [ ] Pending Re-test

**QA Verified By:** ************\_************ **Date:** ****\_\_****

---

## Sign-Off

**Reported By:** ************\_************ **Date:** ****\_\_****

**Developer Assignment:** ************\_************ **Date:** ****\_\_****

**QA Sign-Off:** ************\_************ **Date:** ****\_\_****

---

## Historical Log

| Date | Status | Notes | Updated By |
| ---- | ------ | ----- | ---------- |
|      |        |       |            |
|      |        |       |            |
|      |        |       |            |

---

## Example Bug Reports

### Example 1: Critical Login Bug

**Title:** Login fails with "Network Error" even when server is running

**Steps:**

1. Navigate to http://localhost:5173
2. Enter username "admin" and password "admin123"
3. Click Login button
4. Observe error message

**Expected:** Should show dashboard for admin user

**Actual:** Shows "Network Error - Please check your connection"

**Console Error:**

```
GET http://localhost:8000/api/auth/login 404
```

**Root Cause:** Backend not running on port 8000

---

### Example 2: Data Integrity Bug

**Title:** Inventory goes negative when creating sale

**Steps:**

1. New product with stock: 5 units
2. Create sale with 10 units
3. Check inventory

**Expected:** Cannot create sale (validation error)

**Actual:** Sale created, inventory shows -5 units

**Severity:** Critical (Data integrity issue)

---

### Example 3: UI Bug

**Title:** Store dropdown in Reports page showing no stores

**Steps:**

1. Login as Admin
2. Navigate to Reports
3. Look at Store dropdown

**Expected:** Shows "Main Store" and other stores

**Actual:** Dropdown shows only "All Stores" option, no specific stores listed

**Browser:** Chrome 120, Windows 10, Desktop

**Console Error:** None

**Root Cause:** Missing `useEffect` hook to load stores on component mount
**Fix:** Added `useEffect` with `getStores()` API call

---

## 📝 Quick Checklist for Reporting

Before submitting a bug report:

- [ ] Have I reproduced it multiple times?
- [ ] Is it really a bug and not user error?
- [ ] Can I clearly explain the steps?
- [ ] Have I captured screenshots/videos?
- [ ] Have I checked console for errors?
- [ ] Is there a similar bug already reported?
- [ ] Have I assigned correct severity?
- [ ] Have I provided environment details?
- [ ] Have I tested in multiple browsers (if relevant)?
- [ ] Have I checked if workaround exists?

---

**For Questions:** Reach out to the development team  
**Bug Tracking System:** [Link to issue tracker]  
**Slack Channel:** #bugs
