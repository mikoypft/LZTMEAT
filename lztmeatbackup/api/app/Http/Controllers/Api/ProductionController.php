<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionRecord;
use App\Models\ProductionIngredient;
use App\Models\Inventory;
use Illuminate\Http\Request;

class ProductionController extends Controller
{
    public function index()
    {
        $records = ProductionRecord::with(['product', 'ingredients'])->get();
        
        return response()->json([
            'records' => $records->map(fn($r) => [
                'id' => $r->id,
                'productId' => $r->product_id,
                'productName' => $r->product->name,
                'quantity' => $r->quantity,
                'batchNumber' => $r->batch_number,
                'operator' => $r->operator,
                'status' => $r->status,
                'ingredientsUsed' => $r->ingredients->map(fn($pi) => [
                    'ingredientId' => $pi->ingredient_id,
                    'ingredientName' => $pi->ingredient->name,
                    'quantity' => $pi->quantity,
                ]),
                'timestamp' => $r->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        // Debug logging
        \Log::info('Production store called', [
            'all_input' => $request->all(),
            'status_value' => $request->status,
            'status_is_null' => is_null($request->status),
        ]);

        $request->validate([
            'productId' => 'required|exists:products,id',
            'quantity' => 'required|numeric',
            'batchNumber' => 'required|string|unique:production_records,batch_number',
            'operator' => 'required|string',
            'status' => 'nullable|in:in-progress,completed,quality-check',
            'ingredientsUsed' => 'nullable',
        ]);

        // Force in-progress status for new productions
        $statusToUse = 'in-progress';
        \Log::info('Setting status to', ['status' => $statusToUse]);

        $record = ProductionRecord::create([
            'product_id' => $request->productId,
            'quantity' => $request->quantity,
            'batch_number' => $request->batchNumber,
            'operator' => $request->operator,
            'status' => $statusToUse,
        ]);

        if ($request->ingredientsUsed) {
            $ingredients = is_string($request->ingredientsUsed) ? json_decode($request->ingredientsUsed, true) : $request->ingredientsUsed;
            if (is_array($ingredients)) {
                foreach ($ingredients as $ingredient) {
                    if (isset($ingredient['ingredientId']) && isset($ingredient['quantity'])) {
                        ProductionIngredient::create([
                            'production_id' => $record->id,
                            'ingredient_id' => $ingredient['ingredientId'],
                            'quantity' => $ingredient['quantity'],
                        ]);
                    }
                }
            }
        }

        $record->load(['product', 'ingredients']);

        return response()->json([
            'record' => [
                'id' => $record->id,
                'productId' => $record->product_id,
                'productName' => $record->product->name,
                'quantity' => $record->quantity,
                'batchNumber' => $record->batch_number,
                'operator' => $record->operator,
                'status' => $record->status,
                'ingredientsUsed' => $record->ingredients->map(fn($pi) => [
                    'ingredientId' => $pi->ingredient_id,
                    'ingredientName' => $pi->ingredient->name,
                    'quantity' => $pi->quantity,
                ]),
                'timestamp' => $record->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:in-progress,completed,quality-check',
        ]);

        $record = ProductionRecord::findOrFail($id);
        $oldStatus = $record->status;
        $newStatus = $request->status;

        \Log::info('updateStatus called', ['id' => $id, 'oldStatus' => $oldStatus, 'newStatus' => $newStatus, 'product_id' => $record->product_id, 'quantity' => $record->quantity]);

        // Update the status
        $record->update(['status' => $newStatus]);

        // If transitioning to completed status, sync inventory
        if ($newStatus === 'completed' && $oldStatus !== 'completed') {
            \Log::info('Syncing inventory for completed production', ['product_id' => $record->product_id]);
            
            // Calculate total completed quantity for this product
            $totalCompleted = ProductionRecord::where('product_id', $record->product_id)
                ->where('status', 'completed')
                ->sum('quantity');
            
            // Sync the Production Facility inventory to match total completed
            $inventory = Inventory::updateOrCreate(
                [
                    'product_id' => $record->product_id,
                    'location' => 'Production Facility'
                ],
                ['quantity' => $totalCompleted]
            );
            
            \Log::info('Synced inventory', ['product_id' => $record->product_id, 'total_quantity' => $inventory->quantity]);
        }

        $record->load(['product', 'ingredients']);

        return response()->json([
            'record' => [
                'id' => $record->id,
                'productId' => $record->product_id,
                'productName' => $record->product->name,
                'quantity' => $record->quantity,
                'batchNumber' => $record->batch_number,
                'operator' => $record->operator,
                'status' => $record->status,
                'ingredientsUsed' => $record->ingredients->map(fn($pi) => [
                    'ingredientId' => $pi->ingredient_id,
                    'ingredientName' => $pi->ingredient->name,
                    'quantity' => $pi->quantity,
                ]),
                'timestamp' => $record->created_at->toIso8601String(),
            ],
        ]);
    }

    public function destroy($id)
    {
        ProductionRecord::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
