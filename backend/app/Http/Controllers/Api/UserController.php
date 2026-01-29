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
                'name' => $u->full_name,
                'mobile' => $u->email ?? '',
                'address' => '',
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
                'role' => $u->role,
                'employeeRole' => $u->employee_role,
                'storeId' => $u->store_id,
                'storeName' => $u->store?->name,
                'canLogin' => $u->can_login,
                'userType' => $u->role === 'EMPLOYEE' ? 'employee' : 'system',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'username' => 'required|string|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:ADMIN,STORE,PRODUCTION,POS,EMPLOYEE',
            'storeId' => 'nullable|exists:stores,id',
            'mobile' => 'nullable|string',
            'email' => 'nullable|email',
            'permissions' => 'nullable|json',
            'canLogin' => 'nullable|boolean',
        ]);

        $user = User::create([
            'full_name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'employee_role' => $request->role === 'EMPLOYEE' ? 'Employee' : null,
            'store_id' => $request->storeId,
            'email' => $request->email,
            'permissions' => $request->permissions,
            'can_login' => $request->canLogin ?? true,
        ]);

        return response()->json([
            'employee' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'mobile' => $user->email ?? '',
                'address' => '',
                'role' => $user->employee_role ?? $user->role,
                'storeId' => $user->store_id,
                'storeName' => $user->store?->name,
                'permissions' => $user->permissions,
                'username' => $user->username,
                'canLogin' => $user->can_login,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $updateData = [];
        if ($request->has('name')) $updateData['full_name'] = $request->name;
        if ($request->has('password')) $updateData['password'] = Hash::make($request->password);
        if ($request->has('storeId')) $updateData['store_id'] = $request->storeId;
        if ($request->has('email')) $updateData['email'] = $request->email;
        if ($request->has('permissions')) $updateData['permissions'] = $request->permissions;
        if ($request->has('canLogin')) $updateData['can_login'] = $request->canLogin;

        $user->update($updateData);

        return response()->json([
            'employee' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'mobile' => $user->email ?? '',
                'address' => '',
                'role' => $user->employee_role ?? $user->role,
                'storeId' => $user->store_id,
                'storeName' => $user->store?->name,
                'permissions' => $user->permissions,
                'username' => $user->username,
                'canLogin' => $user->can_login,
            ],
        ]);
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
