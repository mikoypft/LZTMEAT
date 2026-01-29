<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    public function index()
    {
        $transfers = Transfer::with('product')->get();

        return response()->json([
            'transfers' => $transfers->map(fn($t) => [
                'id' => $t->id,
                'productId' => $t->product_id,
                'productName' => $t->product->name,
                'from' => $t->from,
                'to' => $t->to,
                'quantity' => $t->quantity,
                'status' => $t->status,
                'requestedBy' => $t->requested_by,
                'createdAt' => $t->created_at->toIso8601String(),
                'updatedAt' => $t->updated_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'productId' => 'required|exists:products,id',
            'from' => 'required|string',
            'to' => 'required|string',
            'quantity' => 'required|integer',
            'requestedBy' => 'required|string',
        ]);

        $transfer = Transfer::create([
            'product_id' => $request->productId,
            'from' => $request->from,
            'to' => $request->to,
            'quantity' => $request->quantity,
            'requested_by' => $request->requestedBy,
        ]);

        $transfer->load('product');

        return response()->json([
            'transfer' => [
                'id' => $transfer->id,
                'productId' => $transfer->product_id,
                'productName' => $transfer->product->name,
                'from' => $transfer->from,
                'to' => $transfer->to,
                'quantity' => $transfer->quantity,
                'status' => $transfer->status,
                'requestedBy' => $transfer->requested_by,
                'createdAt' => $transfer->created_at->toIso8601String(),
                'updatedAt' => $transfer->updated_at->toIso8601String(),
            ],
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Pending,In Transit,Completed,Cancelled',
        ]);

        $transfer = Transfer::findOrFail($id);
        $transfer->update(['status' => $request->status]);

        $transfer->load('product');

        return response()->json([
            'transfer' => [
                'id' => $transfer->id,
                'productId' => $transfer->product_id,
                'productName' => $transfer->product->name,
                'from' => $transfer->from,
                'to' => $transfer->to,
                'quantity' => $transfer->quantity,
                'status' => $transfer->status,
                'requestedBy' => $transfer->requested_by,
                'createdAt' => $transfer->created_at->toIso8601String(),
                'updatedAt' => $transfer->updated_at->toIso8601String(),
            ],
        ]);
    }
}
