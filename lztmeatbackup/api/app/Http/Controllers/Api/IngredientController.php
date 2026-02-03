<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    public function index()
    {
        $ingredients = Ingredient::with('supplier')->get();
        return response()->json([
            'ingredients' => $ingredients->map(fn($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'code' => $i->code,
                'category' => $i->category,
                'unit' => $i->unit,
                'stock' => $i->stock,
                'minStockLevel' => $i->min_stock_level,
                'reorderPoint' => $i->reorder_point,
                'costPerUnit' => $i->cost_per_unit,
                'supplier' => $i->supplier?->name,
                'lastUpdated' => $i->updated_at->toIso8601String(),
                'expiryDate' => $i->expiry_date?->toDateString(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:ingredients',
            'category' => 'required|string',
            'unit' => 'required|string',
            'stock' => 'required|numeric',
            'minStockLevel' => 'required|numeric',
            'reorderPoint' => 'required|numeric',
            'costPerUnit' => 'required|numeric',
            'supplierId' => 'nullable|exists:suppliers,id',
            'expiryDate' => 'nullable|date',
        ]);

        $ingredient = Ingredient::create([
            'name' => $request->name,
            'code' => $request->code,
            'category' => $request->category,
            'unit' => $request->unit,
            'stock' => $request->stock,
            'min_stock_level' => $request->minStockLevel,
            'reorder_point' => $request->reorderPoint,
            'cost_per_unit' => $request->costPerUnit,
            'supplier_id' => $request->supplierId,
            'expiry_date' => $request->expiryDate,
        ]);

        return response()->json([
            'ingredient' => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'category' => $ingredient->category,
                'unit' => $ingredient->unit,
                'stock' => $ingredient->stock,
                'minStockLevel' => $ingredient->min_stock_level,
                'reorderPoint' => $ingredient->reorder_point,
                'costPerUnit' => $ingredient->cost_per_unit,
                'supplierId' => $ingredient->supplier_id,
                'supplier' => $ingredient->supplier?->name,
                'lastUpdated' => $ingredient->updated_at->toIso8601String(),
                'expiryDate' => $ingredient->expiry_date?->toDateString(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        
        $updateData = [];
        if ($request->has('name')) $updateData['name'] = $request->name;
        if ($request->has('stock')) $updateData['stock'] = $request->stock;
        if ($request->has('minStockLevel')) $updateData['min_stock_level'] = $request->minStockLevel;
        if ($request->has('reorderPoint')) $updateData['reorder_point'] = $request->reorderPoint;
        if ($request->has('costPerUnit')) $updateData['cost_per_unit'] = $request->costPerUnit;
        if ($request->has('supplierId')) $updateData['supplier_id'] = $request->supplierId;
        if ($request->has('expiryDate')) $updateData['expiry_date'] = $request->expiryDate;

        $ingredient->update($updateData);

        return response()->json([
            'ingredient' => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'category' => $ingredient->category,
                'unit' => $ingredient->unit,
                'stock' => $ingredient->stock,
                'minStockLevel' => $ingredient->min_stock_level,
                'reorderPoint' => $ingredient->reorder_point,
                'costPerUnit' => $ingredient->cost_per_unit,
                'supplierId' => $ingredient->supplier_id,
                'supplier' => $ingredient->supplier?->name,
                'lastUpdated' => $ingredient->updated_at->toIso8601String(),
                'expiryDate' => $ingredient->expiry_date?->toDateString(),
            ],
        ]);
    }

    public function destroy($id)
    {
        Ingredient::findOrFail($id)->delete();
        return response()->json(['ingredient' => true]);
    }

    public function reset()
    {
        Ingredient::truncate();
        return response()->json([
            'ingredients' => [],
        ]);
    }
}
