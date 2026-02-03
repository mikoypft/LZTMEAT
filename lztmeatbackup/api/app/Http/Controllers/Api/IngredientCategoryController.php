<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IngredientCategory;
use Illuminate\Http\Request;

class IngredientCategoryController extends Controller
{
    public function index()
    {
        $categories = IngredientCategory::all();
        return response()->json([
            'categories' => $categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'createdAt' => $c->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:ingredient_categories',
            'description' => 'nullable|string',
        ]);

        $category = IngredientCategory::create($request->all());

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'createdAt' => $category->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $category = IngredientCategory::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'createdAt' => $category->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ],
        ]);
    }

    public function destroy($id)
    {
        IngredientCategory::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
