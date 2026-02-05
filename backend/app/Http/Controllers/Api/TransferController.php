<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\Inventory;
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
                'sku' => $t->product->sku,
                'unit' => $t->product->unit,
                'from' => $t->from,
                'to' => $t->to,
                'quantity' => $t->quantity,
                'date' => $t->created_at->toDateString(),
                'time' => $t->created_at->format('H:i'),
                'status' => strtolower(str_replace(' ', '-', $t->status)),
                'transferredBy' => $t->requested_by,
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
            'quantity' => 'required|numeric|min:0.01',
            'transferredBy' => 'required|string',
        ]);

        $transfer = Transfer::create([
            'product_id' => $request->productId,
            'from' => $request->from,
            'to' => $request->to,
            'quantity' => $request->quantity,
            'requested_by' => $request->transferredBy,
            'status' => 'Pending',
        ]);

        $transfer->load('product');

        return response()->json([
            'transfer' => [
                'id' => $transfer->id,
                'productId' => $transfer->product_id,
                'productName' => $transfer->product->name,
                'sku' => $transfer->product->sku,
                'unit' => $transfer->product->unit,
                'from' => $transfer->from,
                'to' => $transfer->to,
                'quantity' => $transfer->quantity,
                'date' => $transfer->created_at->toDateString(),
                'time' => $transfer->created_at->format('H:i'),
                'status' => strtolower(str_replace(' ', '-', $transfer->status)),
                'transferredBy' => $transfer->requested_by,
                'createdAt' => $transfer->created_at->toIso8601String(),
                'updatedAt' => $transfer->updated_at->toIso8601String(),
            ],
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,in-transit,completed,cancelled,rejected',
        ]);

        $transfer = Transfer::findOrFail($id);
        $oldStatus = $transfer->status;
        $status = ucfirst(str_replace('-', ' ', $request->status));
        
        // Only process inventory changes when status changes to "Completed"
        if ($status === 'Completed' && $oldStatus !== 'Completed') {
            // Update inventory: decrease from source, increase at destination
            $productId = $transfer->product_id;
            $quantity = $transfer->quantity;
            $fromLocation = $transfer->from;
            $toLocation = $transfer->to;
            
            \Log::info("Processing transfer completion", [
                'transfer_id' => $id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'from' => $fromLocation,
                'to' => $toLocation,
            ]);
            
            // Decrease quantity at source location
            $sourceInventory = Inventory::where('product_id', $productId)
                ->where('location', $fromLocation)
                ->first();
            
            \Log::info("Source inventory check", [
                'found' => $sourceInventory ? true : false,
                'current_qty' => $sourceInventory?->quantity ?? 0,
            ]);
            
            if ($sourceInventory) {
                $newQty = max(0, $sourceInventory->quantity - $quantity);
                $sourceInventory->quantity = $newQty;
                $sourceInventory->save();
                \Log::info("Updated source inventory", [
                    'new_qty' => $newQty,
                ]);
            }
            
            // Increase quantity at destination location
            $destInventory = Inventory::where('product_id', $productId)
                ->where('location', $toLocation)
                ->first();
            
            \Log::info("Destination inventory check", [
                'found' => $destInventory ? true : false,
                'current_qty' => $destInventory?->quantity ?? 0,
            ]);
            
            if ($destInventory) {
                $newQty = $destInventory->quantity + $quantity;
                $destInventory->quantity = $newQty;
                $destInventory->save();
                \Log::info("Updated destination inventory", [
                    'new_qty' => $newQty,
                ]);
            } else {
                // Create new inventory entry if it doesn't exist
                Inventory::create([
                    'product_id' => $productId,
                    'location' => $toLocation,
                    'quantity' => $quantity
                ]);
                \Log::info("Created new destination inventory", [
                    'qty' => $quantity,
                ]);
            }
        }
        
        $transfer->update(['status' => $status]);

        $transfer->load('product');

        return response()->json([
            'transfer' => [
                'id' => $transfer->id,
                'productId' => $transfer->product_id,
                'productName' => $transfer->product->name,
                'sku' => $transfer->product->sku,
                'unit' => $transfer->product->unit,
                'from' => $transfer->from,
                'to' => $transfer->to,
                'quantity' => $transfer->quantity,
                'date' => $transfer->created_at->toDateString(),
                'time' => $transfer->created_at->format('H:i'),
                'status' => strtolower(str_replace(' ', '-', $transfer->status)),
                'transferredBy' => $transfer->requested_by,
                'createdAt' => $transfer->created_at->toIso8601String(),
                'updatedAt' => $transfer->updated_at->toIso8601String(),
            ],
        ]);
    }
}
