<?php

use App\Models\Inventory;

Route::get('/debug/inventory/{productId}', function ($productId) {
    $inventory = Inventory::where('product_id', $productId)
        ->orderBy('location')
        ->get()
        ->map(function ($inv) {
            return [
                'id' => $inv->id,
                'product_id' => $inv->product_id,
                'location' => $inv->location,
                'quantity' => $inv->quantity,
                'updated_at' => $inv->updated_at->toIso8601String(),
            ];
        });
    
    return response()->json(['inventory' => $inventory]);
});

Route::post('/debug/update-inventory', function () {
    $validated = request()->validate([
        'productId' => 'required|exists:products,id',
        'location' => 'required|string',
        'quantity' => 'required|numeric',
    ]);

    \Log::info('DEBUG: Attempting to update inventory', $validated);

    $inventory = Inventory::updateOrCreate(
        [
            'product_id' => $validated['productId'],
            'location' => $validated['location'],
        ],
        [
            'quantity' => $validated['quantity'],
        ]
    );

    \Log::info('DEBUG: After updateOrCreate', [
        'id' => $inventory->id,
        'quantity' => $inventory->quantity,
        'updated_at' => $inventory->updated_at->toIso8601String(),
    ]);

    // Verify the update
    $verify = Inventory::find($inventory->id);
    \Log::info('DEBUG: Verification query', [
        'quantity' => $verify->quantity,
        'updated_at' => $verify->updated_at->toIso8601String(),
    ]);

    return response()->json([
        'success' => true,
        'inventory' => [
            'id' => $inventory->id,
            'product_id' => $inventory->product_id,
            'location' => $inventory->location,
            'quantity' => $inventory->quantity,
            'updated_at' => $inventory->updated_at->toIso8601String(),
        ],
    ]);
});
