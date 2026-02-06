<?php

require 'bootstrap/app.php';

use App\Models\Ingredient;
use Illuminate\Support\Facades\DB;

// Update categories for each ingredient
$updates = [
    'Pork Belly' => 2,           // Meat
    'Salt' => 6,                  // Curing & Preservation
    'Garlic' => 9,                // Fresh Produce
    'Brown Sugar' => 7,           // Sweeteners
    'Black Pepper' => 5,          // Spices & Seasonings
    'Red Chili Powder' => 5,      // Spices & Seasonings
    'Curing Salt' => 6,           // Curing & Preservation
    'Paprika' => 5,               // Spices & Seasonings
    'Liquid Smoke' => 8,          // Flavor Enhancers
    'Ginger' => 9,                // Fresh Produce
    'Soy Sauce' => 8,             // Flavor Enhancers
    'White Pepper' => 5,          // Spices & Seasonings
];

foreach ($updates as $name => $category_id) {
    Ingredient::where('name', $name)->update(['category_id' => $category_id]);
    echo "✅ $name → Category ID: $category_id\n";
}

echo "\n✅ All ingredients updated with proper categories!\n";
