<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::with('product');

        if ($request->location) {
            $query->where('location', $request->location);
        }

        $inventory = $query->get();

        return response()->json([
            'inventory' => $inventory->map(fn($i) => [
                'id' => $i->id,
                'productId' => $i->product_id,
                'location' => $i->location,
                'quantity' => $i->quantity,
                'lastUpdated' => $i->updated_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'productId' => 'required|exists:products,id',
            'location' => 'required|string',
            'quantity' => 'required|integer',
        ]);

        $inventory = Inventory::updateOrCreate(
            [
                'product_id' => $request->productId,
                'location' => $request->location,
            ],
            ['quantity' => $request->quantity]
        );

        return response()->json([
            'inventory' => [
                'id' => $inventory->id,
                'productId' => $inventory->product_id,
                'location' => $inventory->location,
                'quantity' => $inventory->quantity,
                'lastUpdated' => $inventory->updated_at->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request)
    {
        $request->validate([
            'productId' => 'required|exists:products,id',
            'location' => 'required|string',
            'quantity' => 'required|integer',
        ]);

        $inventory = Inventory::where('product_id', $request->productId)
            ->where('location', $request->location)
            ->firstOrFail();

        $inventory->update(['quantity' => $request->quantity]);

        return response()->json([
            'inventory' => [
                'id' => $inventory->id,
                'productId' => $inventory->product_id,
                'location' => $inventory->location,
                'quantity' => $inventory->quantity,
                'lastUpdated' => $inventory->updated_at->toIso8601String(),
            ],
        ]);
    }
}
