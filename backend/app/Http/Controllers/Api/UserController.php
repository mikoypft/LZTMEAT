<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('store')->get();

        return response()->json([
            'employees' => $users->map(fn($u) => [
                'id' => $u->id,
                'fullName' => $u->full_name,
                'mobile' => $u->mobile ?? '',
                'address' => $u->address ?? '',
                'role' => $u->employee_role ?? $u->role,
                'storeId' => $u->store_id,
                'storeName' => $u->store?->name,
                'permissions' => $u->permissions,
                'username' => $u->username,
                'canLogin' => $u->can_login,
            ]),
        ]);
    }

    public function allUsers()
    {
        $users = User::with('store')->get();

        return response()->json([
            'users' => $users->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->full_name,
                'username' => $u->username,
                'mobile' => $u->mobile ?? '',
                'address' => $u->address ?? '',
                'role' => $u->role,
                'employeeRole' => $u->employee_role,
                'storeId' => $u->store_id,
                'storeName' => $u->store?->name,
                'permissions' => $u->permissions,
                'canLogin' => $u->can_login,
                'userType' => $u->role === 'EMPLOYEE' ? 'employee' : 'system',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        try {
            // Clear any OPcache to ensure fresh code
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }

            // Map role from frontend format to database format
            $roleMap = [
                'Store' => 'STORE',
                'Production' => 'PRODUCTION', 
                'POS' => 'POS',
                'Employee' => 'EMPLOYEE',
                'ADMIN' => 'ADMIN',
                'STORE' => 'STORE',
                'PRODUCTION' => 'PRODUCTION',
                'EMPLOYEE' => 'EMPLOYEE',
            ];
            
            $role = $request->input('role');
            if (isset($roleMap[$role])) {
                $role = $roleMap[$role];
            }

            // Auto-generate username from name if not provided
            $username = $request->input('username');
            if (!$username) {
                $baseName = strtolower(str_replace(' ', '_', $request->input('name')));
                $baseName = preg_replace('/[^a-z0-9_]/', '', $baseName);
                if (empty($baseName)) {
                    $baseName = 'user';
                }
                $username = $baseName;
                $counter = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $baseName . '_' . $counter;
                    $counter++;
                }
            }
            
            // Auto-generate password if not provided
            $password = $request->input('password');
            $plainPassword = null;
            if (!$password) {
                $plainPassword = substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8);
                $password = $plainPassword;
            }

            // Map employee_role properly for all roles
            $employeeRoleMap = [
                'EMPLOYEE' => 'Employee',
                'STORE' => 'Store',
                'PRODUCTION' => 'Production',
                'POS' => 'POS',
            ];

            // Handle store_id - convert to integer or null
            $storeId = $request->input('storeId');
            if ($storeId !== null && $storeId !== '' && $storeId !== 'null') {
                $storeId = (int)$storeId;
            } else {
                $storeId = null;
            }

            // Handle permissions - pass as array since model casts to json
            $permissions = $request->input('permissions');
            if (is_string($permissions)) {
                $decoded = json_decode($permissions, true);
                $permissions = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($permissions)) {
                $permissions = [];
            }

            // Use raw DB insert to avoid any model issues
            $userId = \Illuminate\Support\Facades\DB::table('users')->insertGetId([
                'full_name' => $request->input('name'),
                'username' => $username,
                'password' => \Illuminate\Support\Facades\Hash::make($password),
                'role' => $role,
                'employee_role' => $employeeRoleMap[$role] ?? null,
                'store_id' => $storeId,
                'mobile' => $request->input('mobile') ?? '',
                'address' => $request->input('address') ?? '',
                'permissions' => json_encode($permissions),
                'can_login' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Fetch the created user
            $user = User::with('store')->find($userId);

            $storeName = null;
            if ($user && $user->store) {
                $storeName = $user->store->name;
            }

            $responseData = [
                'employee' => [
                    'id' => (string)$userId,
                    'name' => $request->input('name'),
                    'fullName' => $request->input('name'),
                    'mobile' => $request->input('mobile') ?? '',
                    'address' => $request->input('address') ?? '',
                    'role' => $role,
                    'employeeRole' => $employeeRoleMap[$role] ?? null,
                    'storeId' => $storeId ? (string)$storeId : null,
                    'storeName' => $storeName,
                    'permissions' => $permissions,
                    'username' => $username,
                    'canLogin' => true,
                    'createdAt' => date('c'),
                ],
            ];
            
            // Include generated password in response if auto-generated
            if ($plainPassword) {
                $responseData['employee']['password'] = $plainPassword;
            }

            return response()->json($responseData, 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Employee creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Failed to create employee: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // Map role from frontend format to database format
            $roleMap = [
                'Store' => 'STORE',
                'Production' => 'PRODUCTION',
                'POS' => 'POS',
                'Employee' => 'EMPLOYEE',
            ];

            $updateData = [];
            if ($request->has('name')) $updateData['full_name'] = $request->name;
            if ($request->has('mobile')) $updateData['mobile'] = $request->mobile;
            if ($request->has('address')) $updateData['address'] = $request->address;
            if ($request->has('password')) $updateData['password'] = Hash::make($request->password);
            if ($request->has('username')) $updateData['username'] = $request->username;
            if ($request->has('storeId')) $updateData['store_id'] = $request->storeId ?: null;
            if ($request->has('email')) $updateData['email'] = $request->email;
            if ($request->has('role')) {
                $role = $request->role;
                if (isset($roleMap[$role])) {
                    $role = $roleMap[$role];
                }
                $updateData['role'] = $role;
                // Set employee_role based on mapped role
                $employeeRoleMap = [
                    'EMPLOYEE' => 'Employee',
                    'STORE' => 'Store',
                    'PRODUCTION' => 'Production',
                    'POS' => 'POS',
                ];
                $updateData['employee_role'] = $employeeRoleMap[$role] ?? null;
            }
            if ($request->has('permissions')) {
                $permissions = $request->permissions;
                $updateData['permissions'] = is_array($permissions) ? json_encode($permissions) : $permissions;
            }
            if ($request->has('canLogin')) $updateData['can_login'] = $request->canLogin;

            $user->update($updateData);

            // Reload the user with store relationship
            $user->load('store');

            return response()->json([
                'employee' => [
                    'id' => (string)$user->id,
                    'name' => $user->full_name,
                    'username' => $user->username ?? '',
                    'mobile' => $user->mobile ?? '',
                    'address' => $user->address ?? '',
                    'role' => $user->role ?? '',
                    'employeeRole' => $user->employee_role ?? null,
                    'storeId' => $user->store_id ? (string)$user->store_id : null,
                    'storeName' => $user->store?->name ?? null,
                    'permissions' => is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? []),
                    'canLogin' => (bool)($user->can_login ?? false),
                    'createdAt' => $user->created_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update employee: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
