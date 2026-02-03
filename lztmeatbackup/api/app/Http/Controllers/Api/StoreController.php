<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index()
    {
        $stores = Store::all();

        return response()->json([
            'stores' => $stores->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'address' => $s->address,
                'contactPerson' => $s->contact_person,
                'phone' => $s->phone,
                'email' => $s->email,
                'status' => $s->status,
                'createdAt' => $s->created_at->toIso8601String(),
                'updatedAt' => $s->updated_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:stores',
            'address' => 'required|string',
            'contactPerson' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'status' => 'required|in:active,inactive',
        ]);

        $store = Store::create([
            'name' => $request->name,
            'address' => $request->address,
            'contact_person' => $request->contactPerson,
            'phone' => $request->phone,
            'email' => $request->email,
            'status' => $request->status,
        ]);

        return response()->json([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'contactPerson' => $store->contact_person,
                'phone' => $store->phone,
                'email' => $store->email,
                'status' => $store->status,
                'createdAt' => $store->created_at->toIso8601String(),
                'updatedAt' => $store->updated_at->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $store = Store::findOrFail($id);

        $updateData = [];
        if ($request->has('name')) $updateData['name'] = $request->name;
        if ($request->has('address')) $updateData['address'] = $request->address;
        if ($request->has('contactPerson')) $updateData['contact_person'] = $request->contactPerson;
        if ($request->has('phone')) $updateData['phone'] = $request->phone;
        if ($request->has('email')) $updateData['email'] = $request->email;
        if ($request->has('status')) $updateData['status'] = $request->status;

        $store->update($updateData);

        return response()->json([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'contactPerson' => $store->contact_person,
                'phone' => $store->phone,
                'email' => $store->email,
                'status' => $store->status,
                'createdAt' => $store->created_at->toIso8601String(),
                'updatedAt' => $store->updated_at->toIso8601String(),
            ],
        ]);
    }

    public function destroy($id)
    {
        Store::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
