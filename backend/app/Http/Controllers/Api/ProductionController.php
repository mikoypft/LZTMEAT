<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionRecord;
use App\Models\ProductionIngredient;
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
        $request->validate([
            'productId' => 'required|exists:products,id',
            'quantity' => 'required|integer',
            'batchNumber' => 'required|string|unique:production_records',
            'operator' => 'required|string',
            'ingredientsUsed' => 'nullable|json',
        ]);

        $record = ProductionRecord::create([
            'product_id' => $request->productId,
            'quantity' => $request->quantity,
            'batch_number' => $request->batchNumber,
            'operator' => $request->operator,
        ]);

        if ($request->ingredientsUsed) {
            $ingredients = is_string($request->ingredientsUsed) ? json_decode($request->ingredientsUsed, true) : $request->ingredientsUsed;
            foreach ($ingredients as $ingredient) {
                ProductionIngredient::create([
                    'production_id' => $record->id,
                    'ingredient_id' => $ingredient['ingredientId'],
                    'quantity' => $ingredient['quantity'],
                ]);
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
        $record = ProductionRecord::findOrFail($id);
        // Update status logic if needed
        return response()->json([
            'record' => $record,
        ]);
    }

    public function destroy($id)
    {
        ProductionRecord::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
