<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->get();
        return response()->json([
            'products' => $products->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category->name ?? 'Unknown',
                'price' => $p->price,
                'unit' => $p->unit,
                'image' => $p->image,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string',
                'category' => 'required',
                'price' => 'required|numeric',
                'unit' => 'required|string',
                'image' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            \Log::info('Creating product with data:', [
                'name' => $request->name,
                'category' => $request->category,
                'price' => $request->price,
                'unit' => $request->unit,
            ]);

            // Check if category is a string (name) or number (ID)
            $categoryId = $request->category;
            if (is_string($categoryId) && !is_numeric($categoryId)) {
                // If it's a name, find the category by name
                $category = Category::where('name', $categoryId)->first();
                if (!$category) {
                    return response()->json([
                        'error' => 'Category not found',
                        'message' => "Category '{$categoryId}' does not exist"
                    ], 422);
                }
                $categoryId = $category->id;
            }

            $product = Product::create([
                'name' => $request->name,
                'category_id' => $categoryId,
                'price' => $request->price,
                'unit' => $request->unit,
                'image' => $request->image,
            ]);

            \Log::info('Product created successfully with ID: ' . $product->id);

            return response()->json([
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category->name ?? 'Unknown',
                    'price' => $product->price,
                    'unit' => $product->unit,
                    'image' => $product->image,
                ],
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating product: ' . $e->getMessage() . ' Stack: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to create product',
                'message' => env('APP_DEBUG') ? $e->getMessage() : 'Database error occurred',
                'debug' => env('APP_DEBUG') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->update($request->all());

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category->name,
                'price' => $product->price,
                'unit' => $product->unit,
                'image' => $product->image,
            ],
        ]);
    }

    public function destroy($id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function deleteAll()
    {
        Product::truncate();
        return response()->json(['success' => true]);
    }
}
