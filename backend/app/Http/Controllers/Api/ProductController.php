<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
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
                'sku' => $p->sku,
                'category' => $p->category->name,
                'price' => $p->price,
                'unit' => $p->unit,
                'image' => $p->image,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'unit' => 'required|string',
            'image' => 'nullable|string',
        ]);

        // Find category by name
        $category = \App\Models\Category::where('name', $request->category)->first();
        
        if (!$category) {
            return response()->json([
                'error' => 'Category not found'
            ], 422);
        }

        $product = Product::create([
            'name' => $request->name,
            'category_id' => $category->id,
            'price' => $request->price,
            'unit' => $request->unit,
            'image' => $request->image,
        ]);

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category->name,
                'price' => $product->price,
                'unit' => $product->unit,
                'image' => $product->image,
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        
        $data = $request->only([
            'name',
            'sku',
            'min_stock_level',
            'reorder_point',
            'reorder_quantity',
        ]);
        
        $product->update($data);

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category->name,
                'price' => $product->price,
                'unit' => $product->unit,
                'image' => $product->image,
                'min_stock_level' => $product->min_stock_level,
                'reorder_point' => $product->reorder_point,
                'reorder_quantity' => $product->reorder_quantity,
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
