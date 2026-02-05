<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type'); // 'product' or 'ingredient'
        
        $query = Category::query();
        if ($type) {
            $query->where('type', $type);
        }
        
        $categories = $query->get();
        return response()->json([
            'categories' => $categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'type' => $c->type,
                'createdAt' => $c->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:categories',
            'description' => 'nullable|string',
            'type' => 'nullable|in:product,ingredient',
        ]);

        $data = $request->all();
        $data['type'] = $data['type'] ?? 'product';
        
        $category = Category::create($data);

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'type' => $category->type,
                'createdAt' => $category->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|unique:categories,name,' . $id,
            'description' => 'nullable|string',
        ]);

        $category->update($request->all());

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'createdAt' => $category->created_at->toIso8601String(),
            ],
        ]);
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

    public function updateIngredientCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|unique:categories,name,' . $id,
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

    public function destroyIngredientCategory($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
