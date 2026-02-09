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
            // Map role from frontend format to database format
            $roleMap = [
                'Store' => 'STORE',
                'Production' => 'PRODUCTION', 
                'POS' => 'POS',
                'Employee' => 'EMPLOYEE',
            ];
            
            $role = $request->input('role');
            if (isset($roleMap[$role])) {
                $role = $roleMap[$role];
            }
            
            // Merge mapped role back
            $request->merge(['role' => $role]);
            
            $request->validate([
                'name' => 'required|string',
                'role' => 'required|in:ADMIN,STORE,PRODUCTION,POS,EMPLOYEE',
                'storeId' => 'nullable|integer|exists:stores,id',
                'mobile' => 'nullable|string',
                'address' => 'nullable|string',
                'email' => 'nullable|email',
                'permissions' => 'nullable',
                'canLogin' => 'nullable|boolean',
            ]);

            // Auto-generate username from name if not provided
            $username = $request->input('username');
            if (!$username) {
                $baseName = strtolower(str_replace(' ', '_', $request->input('name')));
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

            $user = User::create([
                'full_name' => $request->input('name'),
                'username' => $username,
                'password' => Hash::make($password),
                'role' => $role,
                'employee_role' => $employeeRoleMap[$role] ?? null,
                'store_id' => $request->input('storeId') ?: null,
                'mobile' => $request->input('mobile'),
                'address' => $request->input('address'),
                'permissions' => is_array($request->input('permissions')) ? json_encode($request->input('permissions')) : $request->input('permissions'),
                'can_login' => $request->input('canLogin') ?? true,
            ]);

            // Load store relationship
            $user->load('store');

            $response = [
                'employee' => [
                    'id' => (string)$user->id,
                    'name' => $user->full_name,
                    'fullName' => $user->full_name,
                    'mobile' => $user->mobile ?? '',
                    'address' => $user->address ?? '',
                    'role' => $user->role,
                    'employeeRole' => $user->employee_role,
                    'storeId' => $user->store_id ? (string)$user->store_id : null,
                    'storeName' => $user->store?->name ?? null,
                    'permissions' => is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? []),
                    'username' => $user->username,
                    'canLogin' => (bool)$user->can_login,
                    'createdAt' => $user->created_at?->toISOString(),
                ],
            ];
            
            // Include generated password in response if auto-generated
            if ($plainPassword) {
                $response['employee']['password'] = $plainPassword;
            }

            return response()->json($response, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
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
                    'createdAt' => $user->created_at?->toISOString(),
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
