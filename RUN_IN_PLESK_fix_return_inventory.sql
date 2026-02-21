-- =====================================================
-- Direct inventory correction for Bologna Red
-- after double-counted return receipts.
--
-- Run once in Plesk phpMyAdmin.
-- =====================================================

-- Set AB Market Bologna Red to 0
-- (10 units were returned to production, store should be empty)
UPDATE `inventory` inv
JOIN `products` p ON p.id = inv.product_id
SET inv.quantity = 0
WHERE p.name = 'Bologna Red'
  AND inv.location = 'AB Market';

-- Set Production Facility Bologna Red to 10
-- (0 initial + 10 received back from AB Market)
UPDATE `inventory` inv
JOIN `products` p ON p.id = inv.product_id
SET inv.quantity = 10
WHERE p.name = 'Bologna Red'
  AND inv.location = 'Production Facility';

-- =====================================================
-- DONE.
-- =====================================================
