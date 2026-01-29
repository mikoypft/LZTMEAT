<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials',
            ], 401);
        }

        if (!$user->can_login) {
            return response()->json([
                'error' => 'User account is disabled',
            ], 403);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'employeeRole' => $user->employee_role,
                'permissions' => $user->permissions,
                'storeId' => $user->store_id,
                'storeName' => $user->store?->name,
                'canLogin' => $user->can_login,
            ],
        ]);
    }

    public function refresh(Request $request)
    {
        $request->validate([
            'userId' => 'required|integer',
        ]);

        $user = User::find($request->userId);

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
            ], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'employeeRole' => $user->employee_role,
                'permissions' => $user->permissions,
                'storeId' => $user->store_id,
                'storeName' => $user->store?->name,
                'canLogin' => $user->can_login,
            ],
        ]);
    }
}
