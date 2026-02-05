<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'store']);

        if ($request->startDate && $request->endDate) {
            // Parse dates and create proper timestamp ranges
            $startDate = Carbon::parse($request->startDate)->startOfDay();
            $endDate = Carbon::parse($request->endDate)->endOfDay();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $sales = $query->get();

        return response()->json([
            'sales' => $sales->map(fn($s) => [
                'id' => $s->id,
                'transactionId' => $s->transaction_id,
                'date' => $s->created_at?->toDateString() ?? date('Y-m-d'),
                'location' => $s->store?->name,
                'storeId' => $s->store_id,
                'cashier' => $s->user?->full_name,
                'userId' => $s->user_id,
                'username' => $s->user?->username,
                'customer' => $s->customer,
                'items' => is_string($s->items) ? json_decode($s->items, true) : $s->items,
                'subtotal' => $s->subtotal,
                'globalDiscount' => $s->global_discount,
                'tax' => $s->tax,
                'total' => $s->total,
                'paymentMethod' => $s->payment_method,
                'salesType' => $s->sales_type,
                'timestamp' => $s->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'transactionId' => 'required|string|unique:sales,transaction_id',
                'userId' => 'nullable|exists:users,id',
                'storeId' => 'nullable|exists:stores,id',
                'items' => 'required',
                'total' => 'required|numeric',
                'paymentMethod' => 'required|string',
            ]);
        } catch (\Exception $e) {
            \Log::error('Sale validation error: ' . json_encode($request->all()));
            throw $e;
        }

        // Ensure items is JSON string
        $items = $request->items;
        if (is_array($items)) {
            $items = json_encode($items);
        }

        $sale = Sale::create([
            'transaction_id' => $request->transactionId,
            'user_id' => $request->userId,
            'store_id' => $request->storeId,
            'customer' => $request->customer,
            'items' => $items,
            'subtotal' => $request->subtotal ?? 0,
            'global_discount' => $request->globalDiscount ?? 0,
            'tax' => $request->tax ?? 0,
            'total' => $request->total,
            'payment_method' => $request->paymentMethod,
            'sales_type' => $request->salesType ?? 'retail',
        ]);

        // Deduct inventory for each item in the sale
        // Use the location (store name) to find the correct inventory records
        $location = $request->location;
        
        try {
            $itemsArray = is_string($items) ? json_decode($items, true) : $items;
            if (is_array($itemsArray) && $location) {
                foreach ($itemsArray as $item) {
                    $productId = $item['productId'] ?? null;
                    $quantity = $item['quantity'] ?? 0;
                    
                    if ($productId && $quantity > 0) {
                        $updated = \DB::table('inventory')
                            ->where('product_id', $productId)
                            ->where('location', $location)
                            ->decrement('quantity', $quantity);
                        
                        \Log::info("Inventory deducted for product {$productId} at {$location}: {$quantity} units (rows affected: {$updated})");
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error updating inventory for sale ' . $sale->id . ': ' . $e->getMessage());
        }

        return response()->json([
            'sale' => [
                'id' => $sale->id,
                'transactionId' => $sale->transaction_id,
                'date' => $sale->created_at->toDateString(),
                'location' => $sale->store?->name,
                'storeId' => $sale->store_id,
                'cashier' => $sale->user?->full_name,
                'userId' => $sale->user_id,
                'username' => $sale->user?->username,
                'customer' => $sale->customer,
                'items' => $sale->items,
                'subtotal' => $sale->subtotal,
                'globalDiscount' => $sale->global_discount,
                'tax' => $sale->tax,
                'total' => $sale->total,
                'paymentMethod' => $sale->payment_method,
                'salesType' => $sale->sales_type,
                'timestamp' => $sale->created_at->toIso8601String(),
            ],
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);
        $sale->update($request->all());

        return response()->json([
            'sale' => [
                'id' => $sale->id,
                'transactionId' => $sale->transaction_id,
                'date' => $sale->created_at->toDateString(),
                'location' => $sale->store?->name,
                'storeId' => $sale->store_id,
                'cashier' => $sale->user?->full_name,
                'userId' => $sale->user_id,
                'username' => $sale->user?->username,
                'customer' => $sale->customer,
                'items' => $sale->items,
                'subtotal' => $sale->subtotal,
                'globalDiscount' => $sale->global_discount,
                'tax' => $sale->tax,
                'total' => $sale->total,
                'paymentMethod' => $sale->payment_method,
                'salesType' => $sale->sales_type,
                'timestamp' => $sale->created_at->toIso8601String(),
            ],
        ]);
    }
}
