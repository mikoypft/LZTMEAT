<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'store']);

        if ($request->startDate && $request->endDate) {
            $query->whereBetween('created_at', [$request->startDate, $request->endDate]);
        }

        $sales = $query->get();

        return response()->json([
            'sales' => $sales->map(fn($s) => [
                'id' => $s->id,
                'transactionId' => $s->transaction_id,
                'date' => $s->created_at->toDateString(),
                'location' => $s->store?->name,
                'storeId' => $s->store_id,
                'cashier' => $s->user?->full_name,
                'userId' => $s->user_id,
                'username' => $s->user?->username,
                'customer' => $s->customer,
                'items' => $s->items,
                'subtotal' => $s->subtotal,
                'globalDiscount' => $s->global_discount,
                'tax' => $s->tax,
                'total' => $s->total,
                'paymentMethod' => $s->payment_method,
                'timestamp' => $s->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'transactionId' => 'required|string|unique:sales',
            'userId' => 'nullable|exists:users,id',
            'storeId' => 'nullable|exists:stores,id',
            'items' => 'required|json',
            'total' => 'required|numeric',
            'paymentMethod' => 'required|string',
        ]);

        $sale = Sale::create([
            'transaction_id' => $request->transactionId,
            'user_id' => $request->userId,
            'store_id' => $request->storeId,
            'customer' => $request->customer,
            'items' => $request->items,
            'subtotal' => $request->subtotal ?? 0,
            'global_discount' => $request->globalDiscount ?? 0,
            'tax' => $request->tax ?? 0,
            'total' => $request->total,
            'payment_method' => $request->paymentMethod,
        ]);

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
                'timestamp' => $sale->created_at->toIso8601String(),
            ],
        ]);
    }
}
