-- ============================================================
-- Categorize All Ingredients
-- Run this in phpMyAdmin on the admin_lztmeat database
-- ============================================================

-- ============================================================
-- STEP 1: Set up ingredient categories
-- Removes the existing "Raw Materials" entry (id=17) to avoid
-- duplicates, then inserts all 6 categories cleanly.
-- ============================================================

DELETE FROM `ingredient_categories` WHERE `name` = 'Raw Materials';

INSERT INTO `ingredient_categories` (`name`, `description`, `created_at`, `updated_at`) VALUES
('Raw Materials',       'Base meat and food raw materials',    NOW(), NOW()),
('Packaging Materials', 'Plastic bags and packaging supplies', NOW(), NOW()),
('Spices',              'Spice and curing agents',             NOW(), NOW()),
('Seasonings',          'Liquid and dry seasonings',           NOW(), NOW()),
('Wrapper',             'Wrapper materials for products',      NOW(), NOW()),
('Utilities',           'Utility supplies (e.g. gas)',         NOW(), NOW());

-- ============================================================
-- STEP 2: Assign category_id to each ingredient
-- ============================================================

-- RAW MATERIALS
-- Includes: MDM, CFAT, Giling-fat, TVP Fine, TVP Gem, Isaw,
--           Sugar, Cornstarch, Asin, MSG, Cheese, Garlic,
--           Onion, Carrots, Celery, Bell Pepper
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Raw Materials' LIMIT 1
)
WHERE `name` IN (
    'MDM',
    'CFAT',
    'Giling-fat',
    'TVP Fine',
    'Tvp Gem',
    'Hanks-isaw',
    'Sugar',
    'Cornstarch',
    'Asin',
    'MSG-Vetsin',
    'Cheese',
    'Garlic',
    'Onion',
    'Carrots',
    'Celery',
    'Redbell Pepper',
    'Water'
);

-- PACKAGING MATERIALS
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Packaging Materials' LIMIT 1
)
WHERE `name` IN (
    '6X8',
    '6X10',
    'PE 6X8',
    'PE X10',
    '8X11',
    '10X14',
    '12X18',
    'Medium',
    'Large',
    'Rollbag Big',
    'Rollbag Small',
    'Plastic Shanghai',
    'Plastic Skinless',
    'Strand Red',
    'Strand White',
    'Strand Clear',
    'Strand Embo',
    'Amiflex'
);

-- SPICES
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Spices' LIMIT 1
)
WHERE `name` IN (
    'Accord',
    'Praque Powder',
    'Sodium',
    'Vitamin C',
    'Ham Spice',
    'Ham Flavor',
    'Multiblend',
    'Curry Powder'
);

-- SEASONINGS
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Seasonings' LIMIT 1
)
WHERE `name` IN (
    'Knorr Liquid Seasoning',
    'Alexander',
    'Pine Apple Juice'
);

-- WRAPPER
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Wrapper' LIMIT 1
)
WHERE `name` IN (
    'Molo White',
    'Molo Yellow',
    'Lumpia Wrapper'
);

-- UTILITIES
UPDATE `ingredients`
SET `category_id` = (
    SELECT `id` FROM `ingredient_categories` WHERE `name` = 'Utilities' LIMIT 1
)
WHERE `name` IN (
    'Gas'
);

-- ============================================================
-- VERIFY: Check results after running
-- ============================================================
SELECT
    i.code,
    i.name AS ingredient_name,
    ic.name AS category
FROM `ingredients` i
LEFT JOIN `ingredient_categories` ic ON ic.id = i.category_id
ORDER BY ic.name, i.name;
