<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::all();

        return response()->json([
            'suppliers' => $suppliers->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'contactPerson' => $s->contact_person,
                'phone' => $s->phone,
                'email' => $s->email,
                'address' => $s->address,
                'createdAt' => $s->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'contactPerson' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'address' => 'required|string',
        ]);

        $supplier = Supplier::create([
            'name' => $request->name,
            'contact_person' => $request->contactPerson,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
        ]);

        return response()->json([
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'contactPerson' => $supplier->contact_person,
                'phone' => $supplier->phone,
                'email' => $supplier->email,
                'address' => $supplier->address,
                'createdAt' => $supplier->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $updateData = [];
        if ($request->has('name')) $updateData['name'] = $request->name;
        if ($request->has('contactPerson')) $updateData['contact_person'] = $request->contactPerson;
        if ($request->has('phone')) $updateData['phone'] = $request->phone;
        if ($request->has('email')) $updateData['email'] = $request->email;
        if ($request->has('address')) $updateData['address'] = $request->address;

        $supplier->update($updateData);

        return response()->json([
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'contactPerson' => $supplier->contact_person,
                'phone' => $supplier->phone,
                'email' => $supplier->email,
                'address' => $supplier->address,
                'createdAt' => $supplier->created_at->toIso8601String(),
            ],
        ]);
    }

    public function destroy($id)
    {
        Supplier::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
