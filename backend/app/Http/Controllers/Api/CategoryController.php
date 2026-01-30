<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return response()->json([
            'categories' => $categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'createdAt' => $c->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:categories',
            'description' => 'nullable|string',
        ]);

        $category = Category::create($request->all());

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'createdAt' => $category->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function destroy($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    // Ingredient Categories
    public function ingredientCategories()
    {
        $categories = Category::where('type', 'ingredient')->get();
        return response()->json([
            'categories' => $categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'createdAt' => $c->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ]),
        ]);
    }

    public function storeIngredientCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'description' => $request->description,
            'type' => 'ingredient',
        ]);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'createdAt' => $category->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ],
        ], 201);
    }

    public function destroyIngredientCategory($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
