<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\Inventory;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    private function formatTransfer($t): array
    {
        return [
            'id' => $t->id,
            'productId' => $t->product_id,
            'productName' => $t->product->name,
            'sku' => $t->product->sku,
            'unit' => $t->product->unit,
            'from' => $t->from,
            'to' => $t->to,
            'quantity' => $t->quantity,
            'quantityReceived' => $t->quantity_received,
            'discrepancy' => $t->quantity_received !== null ? $t->quantity - $t->quantity_received : null,
            'discrepancyReason' => $t->discrepancy_reason,
            'date' => $t->created_at->toDateString(),
            'time' => $t->created_at->format('H:i'),
            'status' => strtolower(str_replace(' ', '-', $t->status)),
            'type' => $t->type ?? 'forward',
            'returnNotes' => $t->return_notes,
            'transferredBy' => $t->requested_by,
            'receivedBy' => $t->received_by,
            'createdAt' => $t->created_at->toIso8601String(),
            'updatedAt' => $t->updated_at->toIso8601String(),
        ];
    }

    public function index()
    {
        $transfers = Transfer::with('product')->get();

        return response()->json([
            'transfers' => $transfers->map(fn($t) => $this->formatTransfer($t)),
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
            'type' => 'nullable|in:forward,return_backorder,return_scrap',
            'returnNotes' => 'nullable|string|max:500',
        ]);

        $type = $request->type ?? 'forward';

        // For returns, enforce destination is Production Facility
        if (in_array($type, ['return_backorder', 'return_scrap'])) {
            $request->merge(['to' => 'Production Facility']);
        }

        $transfer = Transfer::create([
            'product_id' => $request->productId,
            'from' => $request->from,
            'to' => $request->to,
            'quantity' => $request->quantity,
            'requested_by' => $request->transferredBy,
            'status' => 'In Transit',
            'type' => $type,
            'return_notes' => $request->returnNotes,
        ]);

        // For return transfers, immediately deduct the store inventory.
        // Items leave the store the moment the return is initiated.
        if (in_array($type, ['return_backorder', 'return_scrap'])) {
            $sourceInventory = Inventory::where('product_id', $request->productId)
                ->where('location', $request->from)
                ->first();
            if ($sourceInventory) {
                $sourceInventory->quantity = max(0, $sourceInventory->quantity - $request->quantity);
                $sourceInventory->save();
                \Log::info("Return created: immediately deducted store inventory", [
                    'location' => $request->from,
                    'new_qty' => $sourceInventory->quantity,
                ]);
            }
        }

        $transfer->load('product');

        return response()->json(['transfer' => $this->formatTransfer($transfer)], 201);
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
            $transferType = $transfer->type ?? 'forward';
            $productId = $transfer->product_id;
            $quantity = $transfer->quantity;
            $fromLocation = $transfer->from;
            $toLocation = $transfer->to;
            
            \Log::info("Processing transfer completion", [
                'transfer_id' => $id,
                'type' => $transferType,
                'product_id' => $productId,
                'quantity' => $quantity,
                'from' => $fromLocation,
                'to' => $toLocation,
            ]);
            
            // Decrease quantity at source location
            $sourceInventory = Inventory::where('product_id', $productId)
                ->where('location', $fromLocation)
                ->first();
            
            if ($sourceInventory) {
                $newQty = max(0, $sourceInventory->quantity - $quantity);
                $sourceInventory->quantity = $newQty;
                $sourceInventory->save();
                \Log::info("Updated source inventory", ['new_qty' => $newQty]);
            }
            
            // Increase destination for all transfer types (including returns).
            $destInventory = Inventory::where('product_id', $productId)
                ->where('location', $toLocation)
                ->first();
            
            if ($destInventory) {
                $newQty = $destInventory->quantity + $quantity;
                $destInventory->quantity = $newQty;
                $destInventory->save();
                \Log::info("Updated destination inventory", ['new_qty' => $newQty]);
            } else {
                Inventory::create([
                    'product_id' => $productId,
                    'location' => $toLocation,
                    'quantity' => $quantity,
                ]);
                \Log::info("Created new destination inventory", ['qty' => $quantity]);
            }
        }
        
        $transfer->update(['status' => $status]);
        
        $transfer->load('product');
        
        return response()->json(['transfer' => $this->formatTransfer($transfer)]);
    }

    public function receiveTransfer(Request $request, $id)
    {
        $request->validate([
            'quantityReceived' => 'required|numeric|min:0',
            'discrepancyReason' => 'nullable|string|in:damaged,evaporation,measurement-error,theft,other',
            'receivedBy' => 'required|string',
        ]);

        $transfer = Transfer::findOrFail($id);
        
        // Only allow receiving if status is "In Transit"
        if (strtolower(str_replace(' ', '-', $transfer->status)) !== 'in-transit') {
            return response()->json(['error' => 'Transfer must be in transit to receive'], 400);
        }

        $quantityReceived = $request->quantityReceived;
        $originalQuantity = $transfer->quantity;
        $discrepancy = $originalQuantity - $quantityReceived;

        $productId = $transfer->product_id;
        $toLocation = $transfer->to;

        \Log::info("Processing transfer receipt", [
            'transfer_id' => $id,
            'quantity_sent' => $originalQuantity,
            'quantity_received' => $quantityReceived,
            'discrepancy' => $discrepancy,
            'discrepancy_reason' => $request->discrepancyReason,
        ]);

        $transferType = $transfer->type ?? 'forward';
        $fromLocation = $transfer->from;

        // For return transfers the store inventory was already deducted at creation time.
        // Here we only need to add to the production (destination) inventory upon receipt.

        // Increase destination inventory for all transfer types.
        $destInventory = Inventory::where('product_id', $productId)
            ->where('location', $toLocation)
            ->first();

        if ($destInventory) {
            $newQty = $destInventory->quantity + $quantityReceived;
            $destInventory->quantity = $newQty;
            $destInventory->save();
            \Log::info("Updated destination inventory", [
                'new_qty' => $newQty,
            ]);
        } else {
            Inventory::create([
                'product_id' => $productId,
                'location' => $toLocation,
                'quantity' => $quantityReceived,
            ]);
            \Log::info("Created new destination inventory", [
                'qty' => $quantityReceived,
            ]);
        }

        // Update transfer with received details
        $transfer->update([
            'status' => 'Completed',
            'quantity_received' => $quantityReceived,
            'discrepancy_reason' => $request->discrepancyReason,
            'received_by' => $request->receivedBy,
            'received_at' => now(),
        ]);

        $transfer->load('product');

        return response()->json(['transfer' => $this->formatTransfer($transfer)]);
    }
}


