<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\Supplier;
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
        $porkCategory = Category::updateOrCreate(
            ['name' => 'Pork'],
            ['description' => 'Pork products and meat', 'type' => 'product']
        );

        // Create products
        $longanisa = Product::updateOrCreate(
            ['name' => 'Longganisa'],
            [
                'sku' => 'LONG-SW-001',
                'category_id' => $porkCategory->id,
                'price' => 180.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        $tocino = Product::updateOrCreate(
            ['name' => 'Tocino'],
            [
                'sku' => 'TOC-PK-001',
                'category_id' => $porkCategory->id,
                'price' => 250.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        $chorizo = Product::updateOrCreate(
            ['name' => 'Chorizo'],
            [
                'sku' => 'CHOR-BIL-001',
                'category_id' => $porkCategory->id,
                'price' => 200.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        // Add more products with same prices for testing wholesale discounts
        Product::updateOrCreate(
            ['name' => 'Longganisa Deluxe'],
            [
                'sku' => 'LONG-DEL-001',
                'category_id' => $porkCategory->id,
                'price' => 180.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        Product::updateOrCreate(
            ['name' => 'Premium Longganisa'],
            [
                'sku' => 'LONG-PREM-001',
                'category_id' => $porkCategory->id,
                'price' => 180.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        Product::updateOrCreate(
            ['name' => 'Tocino Premium'],
            [
                'sku' => 'TOC-PREM-001',
                'category_id' => $porkCategory->id,
                'price' => 250.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        Product::updateOrCreate(
            ['name' => 'Tocino Sweet'],
            [
                'sku' => 'TOC-SWT-001',
                'category_id' => $porkCategory->id,
                'price' => 250.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        Product::updateOrCreate(
            ['name' => 'Chorizo Bilao'],
            [
                'sku' => 'CHOR-BLA-001',
                'category_id' => $porkCategory->id,
                'price' => 200.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        Product::updateOrCreate(
            ['name' => 'Chorizo Extra'],
            [
                'sku' => 'CHOR-EX-001',
                'category_id' => $porkCategory->id,
                'price' => 200.00,
                'unit' => 'kg',
                'image' => null,
            ]
        );

        // Create ingredient categories
        $meatCategory = Category::updateOrCreate(
            ['name' => 'Meat'],
            ['description' => 'Meat and pork ingredients', 'type' => 'ingredient']
        );

        $spiceCategory = Category::updateOrCreate(
            ['name' => 'Spices & Seasonings'],
            ['description' => 'Spices and seasonings for flavoring', 'type' => 'ingredient']
        );

        $curingSaltCategory = Category::updateOrCreate(
            ['name' => 'Curing & Preservation'],
            ['description' => 'Ingredients for curing and food preservation', 'type' => 'ingredient']
        );

        $sweetenerCategory = Category::updateOrCreate(
            ['name' => 'Sweeteners'],
            ['description' => 'Sugar and sweetening ingredients', 'type' => 'ingredient']
        );

        $flavorCategory = Category::updateOrCreate(
            ['name' => 'Flavor Enhancers'],
            ['description' => 'Sauces and smoke for flavor enhancement', 'type' => 'ingredient']
        );

        $produceCategory = Category::updateOrCreate(
            ['name' => 'Fresh Produce'],
            ['description' => 'Fresh vegetables and aromatics', 'type' => 'ingredient']
        );

        // Create suppliers
        $supplier1 = Supplier::firstOrCreate(
            ['name' => 'Metro Supplies'],
            [
                'contact_person' => 'John Santos',
                'phone' => '09171234567',
                'email' => 'info@metrosupplies.com',
                'address' => 'New Manila, Quezon City',
            ]
        );

        $supplier2 = Supplier::firstOrCreate(
            ['name' => 'Fresh Imports Inc.'],
            [
                'contact_person' => 'Maria Cruz',
                'phone' => '09289876543',
                'email' => 'sales@freshimports.com',
                'address' => 'Makati City',
            ]
        );

        $supplier3 = Supplier::firstOrCreate(
            ['name' => 'Local Farms Cooperative'],
            [
                'contact_person' => 'Pedro Reyes',
                'phone' => '09365432109',
                'email' => 'coop@localfarms.com',
                'address' => 'Laguna Province',
            ]
        );

        // Create ingredients
        $porkBelly = Ingredient::updateOrCreate(
            ['name' => 'Pork Belly', 'code' => 'ING001'],
            [
                'category_id' => $meatCategory->id,
                'unit' => 'kg',
                'stock' => 300.00,
                'min_stock_level' => 10.00,
                'reorder_point' => 20.00,
                'cost_per_unit' => 85.00,
                'supplier_id' => $supplier1->id,
            ]
        );

        $salt = Ingredient::updateOrCreate(
            ['name' => 'Salt', 'code' => 'ING002'],
            [
                'category_id' => $curingSaltCategory->id,
                'unit' => 'kg',
                'stock' => 50.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 15.00,
                'supplier_id' => $supplier3->id,
            ]
        );

        $garlic = Ingredient::updateOrCreate(
            ['name' => 'Garlic', 'code' => 'ING003'],
            [
                'category_id' => $produceCategory->id,
                'unit' => 'kg',
                'stock' => 25.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 50.00,
                'supplier_id' => $supplier2->id,
            ]
        );

        // Add more ingredients for products
        Ingredient::updateOrCreate(
            ['name' => 'Brown Sugar', 'code' => 'ING004'],
            [
                'category_id' => $sweetenerCategory->id,
                'unit' => 'kg',
                'stock' => 40.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 45.00,
                'supplier_id' => $supplier1->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Black Pepper', 'code' => 'ING005'],
            [
                'category_id' => $spiceCategory->id,
                'unit' => 'kg',
                'stock' => 15.00,
                'min_stock_level' => 2.00,
                'reorder_point' => 5.00,
                'cost_per_unit' => 150.00,
                'supplier_id' => $supplier2->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Red Chili Powder', 'code' => 'ING006'],
            [
                'category_id' => $spiceCategory->id,
                'unit' => 'kg',
                'stock' => 20.00,
                'min_stock_level' => 3.00,
                'reorder_point' => 8.00,
                'cost_per_unit' => 120.00,
                'supplier_id' => $supplier3->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Curing Salt', 'code' => 'ING007'],
            [
                'category_id' => $curingSaltCategory->id,
                'unit' => 'kg',
                'stock' => 30.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 35.00,
                'supplier_id' => $supplier1->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Paprika', 'code' => 'ING008'],
            [
                'category_id' => $spiceCategory->id,
                'unit' => 'kg',
                'stock' => 18.00,
                'min_stock_level' => 3.00,
                'reorder_point' => 6.00,
                'cost_per_unit' => 95.00,
                'supplier_id' => $supplier2->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Liquid Smoke', 'code' => 'ING009'],
            [
                'category_id' => $flavorCategory->id,
                'unit' => 'liter',
                'stock' => 10.00,
                'min_stock_level' => 2.00,
                'reorder_point' => 4.00,
                'cost_per_unit' => 200.00,
                'supplier_id' => $supplier1->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Ginger', 'code' => 'ING010'],
            [
                'category_id' => $produceCategory->id,
                'unit' => 'kg',
                'stock' => 12.00,
                'min_stock_level' => 2.00,
                'reorder_point' => 5.00,
                'cost_per_unit' => 60.00,
                'supplier_id' => $supplier3->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'Soy Sauce', 'code' => 'ING011'],
            [
                'category_id' => $flavorCategory->id,
                'unit' => 'liter',
                'stock' => 35.00,
                'min_stock_level' => 5.00,
                'reorder_point' => 10.00,
                'cost_per_unit' => 40.00,
                'supplier_id' => $supplier2->id,
            ]
        );

        Ingredient::updateOrCreate(
            ['name' => 'White Pepper', 'code' => 'ING012'],
            [
                'category_id' => $spiceCategory->id,
                'unit' => 'kg',
                'stock' => 8.00,
                'min_stock_level' => 1.00,
                'reorder_point' => 3.00,
                'cost_per_unit' => 180.00,
                'supplier_id' => $supplier1->id,
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

        // Add inventory for new products
        $newLongganisaDeluxe = Product::where('name', 'Longganisa Deluxe')->first();
        if ($newLongganisaDeluxe) {
            Inventory::firstOrCreate(
                ['product_id' => $newLongganisaDeluxe->id, 'location' => $store->name],
                ['quantity' => 350]
            );
            Inventory::firstOrCreate(
                ['product_id' => $newLongganisaDeluxe->id, 'location' => $prodFacility->name],
                ['quantity' => 800]
            );
        }

        $premiumLongganisa = Product::where('name', 'Premium Longganisa')->first();
        if ($premiumLongganisa) {
            Inventory::firstOrCreate(
                ['product_id' => $premiumLongganisa->id, 'location' => $store->name],
                ['quantity' => 400]
            );
            Inventory::firstOrCreate(
                ['product_id' => $premiumLongganisa->id, 'location' => $prodFacility->name],
                ['quantity' => 900]
            );
        }

        $tocinoPremium = Product::where('name', 'Tocino Premium')->first();
        if ($tocinoPremium) {
            Inventory::firstOrCreate(
                ['product_id' => $tocinoPremium->id, 'location' => $store->name],
                ['quantity' => 280]
            );
            Inventory::firstOrCreate(
                ['product_id' => $tocinoPremium->id, 'location' => $prodFacility->name],
                ['quantity' => 600]
            );
        }

        $tocinoSweet = Product::where('name', 'Tocino Sweet')->first();
        if ($tocinoSweet) {
            Inventory::firstOrCreate(
                ['product_id' => $tocinoSweet->id, 'location' => $store->name],
                ['quantity' => 320]
            );
            Inventory::firstOrCreate(
                ['product_id' => $tocinoSweet->id, 'location' => $prodFacility->name],
                ['quantity' => 700]
            );
        }

        $chorizoBilao = Product::where('name', 'Chorizo Bilao')->first();
        if ($chorizoBilao) {
            Inventory::firstOrCreate(
                ['product_id' => $chorizoBilao->id, 'location' => $store->name],
                ['quantity' => 250]
            );
            Inventory::firstOrCreate(
                ['product_id' => $chorizoBilao->id, 'location' => $prodFacility->name],
                ['quantity' => 500]
            );
        }

        $chorizoExtra = Product::where('name', 'Chorizo Extra')->first();
        if ($chorizoExtra) {
            Inventory::firstOrCreate(
                ['product_id' => $chorizoExtra->id, 'location' => $store->name],
                ['quantity' => 300]
            );
            Inventory::firstOrCreate(
                ['product_id' => $chorizoExtra->id, 'location' => $prodFacility->name],
                ['quantity' => 550]
            );
        }

        echo "✅ Default users created:\n";
        echo "   - admin / admin123 (ADMIN)\n";
        echo "   - store_manager / store123 (STORE)\n";
        echo "   - production / prod123 (PRODUCTION)\n";
        echo "   - mark_sioson / 123456 (POS)\n";
        echo "\n✅ Suppliers created:\n";
        echo "   - Metro Supplies (John Santos)\n";
        echo "   - Fresh Imports Inc. (Maria Cruz)\n";
        echo "   - Local Farms Cooperative (Pedro Reyes)\n";
        echo "\n✅ Categories created:\n";
        echo "   - Pork (Products)\n";
        echo "   - Meat (Ingredients)\n";
        echo "   - Spices (Ingredients)\n";
        echo "\n✅ Products created:\n";
        echo "   - Longganisa\n";
        echo "   - Longganisa Deluxe (₱180)\n";
        echo "   - Premium Longganisa (₱180)\n";
        echo "   - Tocino\n";
        echo "   - Tocino Premium (₱250)\n";
        echo "   - Tocino Sweet (₱250)\n";
        echo "   - Chorizo\n";
        echo "   - Chorizo Bilao (₱200)\n";
        echo "   - Chorizo Extra (₱200)\n";
        echo "\n✅ Ingredients created:\n";
        echo "   - Pork Belly (100 kg)\n";
        echo "   - Salt (50 kg)\n";
        echo "   - Garlic (25 kg)\n";
        echo "   - Brown Sugar (40 kg)\n";
        echo "   - Black Pepper (15 kg)\n";
        echo "   - Red Chili Powder (20 kg)\n";
        echo "   - Curing Salt (30 kg)\n";
        echo "   - Paprika (18 kg)\n";
        echo "   - Liquid Smoke (10 liters)\n";
        echo "   - Ginger (12 kg)\n";
        echo "   - Soy Sauce (35 liters)\n";
        echo "   - White Pepper (8 kg)\n";
        echo "\n✅ Inventory initialized\n";
    }
}
