<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
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

        echo "✅ Default users created:\n";
        echo "   - admin / admin123 (ADMIN)\n";
        echo "   - store_manager / store123 (STORE)\n";
        echo "   - production / prod123 (PRODUCTION)\n";
        echo "   - mark_sioson / 123456 (POS)\n";
    }
}
