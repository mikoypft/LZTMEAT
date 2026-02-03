<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Inventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default store
        $store = Store::firstOrCreate(
            ['name' => 'Main Store'],
            [
                'address' => 'Main Branch Location',
                'contact_person' => 'Store Manager',
                'phone' => '09123456789',
                'email' => 'store@lztmeat.com',
                'status' => 'active',
            ]
        );

        // Create Production Facility store
        $prodFacility = Store::firstOrCreate(
            ['name' => 'Production Facility'],
            [
                'address' => 'Production Floor',
                'contact_person' => 'Production Manager',
                'phone' => '09987654321',
                'email' => 'production@lztmeat.com',
                'status' => 'active',
            ]
        );

        // Create admin user
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'full_name' => 'System Administrator',
                'email' => 'admin@lztmeat.com',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'employee_role' => null,
                'store_id' => null,
                'permissions' => json_encode(['all']),
                'can_login' => true,
            ]
        );

        // Create store manager user
        User::firstOrCreate(
            ['username' => 'store_manager'],
            [
                'full_name' => 'Store Manager',
                'email' => 'storemanager@lztmeat.com',
                'password' => Hash::make('store123'),
                'role' => 'STORE',
                'employee_role' => 'Store',
                'store_id' => $store->id,
                'permissions' => json_encode(['inventory', 'sales', 'transfers']),
                'can_login' => true,
            ]
        );

        // Create production user
        User::firstOrCreate(
            ['username' => 'production'],
            [
                'full_name' => 'Production Staff',
                'email' => 'production@lztmeat.com',
                'password' => Hash::make('prod123'),
                'role' => 'PRODUCTION',
                'employee_role' => 'Production',
                'store_id' => $store->id,
                'permissions' => json_encode(['production', 'ingredients']),
                'can_login' => true,
            ]
        );

        // Create POS user (cashier)
        User::firstOrCreate(
            ['username' => 'mark_sioson'],
            [
                'full_name' => 'Mark Sioson',
                'email' => 'mark@lztmeat.com',
                'password' => Hash::make('123456'),
                'role' => 'POS',
                'employee_role' => 'POS',
                'store_id' => $store->id,
                'permissions' => json_encode(['pos', 'sales']),
                'can_login' => true,
            ]
        );

        // Create product categories
        $porkCategory = Category::firstOrCreate(
            ['name' => 'Pork', 'type' => 'product'],
            ['description' => 'Pork products and meat']
        );

        // Create products
        $longanisa = Product::firstOrCreate(
            ['name' => 'Longganisa'],
            [
                'category_id' => $porkCategory->id,
                'price' => 180.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        $tocino = Product::firstOrCreate(
            ['name' => 'Tocino'],
            [
                'category_id' => $porkCategory->id,
                'price' => 250.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        $chorizo = Product::firstOrCreate(
            ['name' => 'Chorizo'],
            [
                'category_id' => $porkCategory->id,
                'price' => 200.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        // Create ingredient categories
        $meatCategory = Category::firstOrCreate(
            ['name' => 'Meat', 'type' => 'ingredient'],
            ['description' => 'Meat and pork ingredients']
        );

        $spiceCategory = Category::firstOrCreate(
            ['name' => 'Spices', 'type' => 'ingredient'],
            ['description' => 'Spices and seasonings']
        );

        // Create ingredients
        $porkBelly = Ingredient::firstOrCreate(
            ['name' => 'Pork Belly', 'code' => 'ING001'],
            [
                'category' => 'Meat',
                'unit' => 'kg',
                'stock' => 100.00,
                'min_stock_level' => 10.00,
                'reorder_point' => 20.00,
                'cost_per_unit' => 85.00,
                'supplier_id' => null,
            ]
        );

        $salt = Ingredient::firstOrCreate(
            ['name' => 'Salt', 'code' => 'ING002'],
            [
                'category' => 'Spices',
                'unit' => 'kg',
                'stock' => 50.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 15.00,
                'supplier_id' => null,
            ]
        );

        $garlic = Ingredient::firstOrCreate(
            ['name' => 'Garlic', 'code' => 'ING003'],
            [
                'category' => 'Spices',
                'unit' => 'kg',
                'stock' => 25.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 50.00,
                'supplier_id' => null,
            ]
        );

        // Create inventory records
        Inventory::firstOrCreate(
            [
                'product_id' => $longanisa->id,
                'location' => $store->name,
            ],
            ['quantity' => 500]
        );

        Inventory::firstOrCreate(
            [
                'product_id' => $longanisa->id,
                'location' => $prodFacility->name,
            ],
            ['quantity' => 1100]
        );

        Inventory::firstOrCreate(
            [
                'product_id' => $tocino->id,
                'location' => $store->name,
            ],
            ['quantity' => 300]
        );

        Inventory::firstOrCreate(
            [
                'product_id' => $tocino->id,
                'location' => $prodFacility->name,
            ],
            ['quantity' => 0]
        );

        Inventory::firstOrCreate(
            [
                'product_id' => $chorizo->id,
                'location' => $store->name,
            ],
            ['quantity' => 200]
        );

        Inventory::firstOrCreate(
            [
                'product_id' => $chorizo->id,
                'location' => $prodFacility->name,
            ],
            ['quantity' => 0]
        );

        echo "✅ Default users created:\n";
        echo "   - admin / admin123 (ADMIN)\n";
        echo "   - store_manager / store123 (STORE)\n";
        echo "   - production / prod123 (PRODUCTION)\n";
        echo "   - mark_sioson / 123456 (POS)\n";
        echo "\n✅ Categories created:\n";
        echo "   - Pork (Products)\n";
        echo "   - Meat (Ingredients)\n";
        echo "   - Spices (Ingredients)\n";
        echo "\n✅ Products created:\n";
        echo "   - Longganisa\n";
        echo "   - Tocino\n";
        echo "   - Chorizo\n";
        echo "\n✅ Ingredients created:\n";
        echo "   - Pork Belly (100 kg)\n";
        echo "   - Salt (50 kg)\n";
        echo "   - Garlic (25 kg)\n";
        echo "\n✅ Inventory initialized\n";
    }
}
