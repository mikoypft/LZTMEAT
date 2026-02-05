<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    /**
     * Get all stock adjustments with optional filters.
     */
    public function index(Request $request)
    {
        try {
            $query = StockAdjustment::query()
                ->orderBy('created_at', 'desc');

            // Filter by ingredient
            if ($request->has('ingredient_id')) {
                $query->where('ingredient_id', $request->ingredient_id);
            }

            // Filter by type (add/remove)
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by user
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // Pagination
            $perPage = $request->get('per_page', 50);
            $adjustments = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'adjustments' => $adjustments->items(),
                'pagination' => [
                    'total' => $adjustments->total(),
                    'per_page' => $adjustments->perPage(),
                    'current_page' => $adjustments->currentPage(),
                    'last_page' => $adjustments->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching stock adjustments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stock adjustments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new stock adjustment record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'ingredient_id' => 'required|exists:ingredients,id',
                'type' => 'required|in:add,remove',
                'quantity' => 'required|numeric|min:0.01',
                'reason' => 'nullable|string|max:1000',
                'user_id' => 'nullable|exists:users,id',
                'user_name' => 'nullable|string|max:255',
            ]);

            // Get the ingredient
            $ingredient = Ingredient::findOrFail($validated['ingredient_id']);
            
            // Calculate stock changes
            $previousStock = $ingredient->stock;
            $delta = $validated['type'] === 'add' 
                ? $validated['quantity'] 
                : -$validated['quantity'];
            $newStock = max(0, $previousStock + $delta);

            // Create the adjustment record
            $adjustment = StockAdjustment::create([
                'ingredient_id' => $ingredient->id,
                'ingredient_name' => $ingredient->name,
                'ingredient_code' => $ingredient->code,
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'unit' => $ingredient->unit,
                'reason' => $validated['reason'] ?? null,
                'user_id' => $validated['user_id'] ?? null,
                'user_name' => $validated['user_name'] ?? 'System',
                'ip_address' => $request->ip(),
            ]);

            // Update the ingredient stock
            Log::info('Before ingredient update', ['id' => $ingredient->id, 'current_stock' => $ingredient->stock, 'new_stock' => $newStock]);
            DB::table('ingredients')
                ->where('id', $ingredient->id)
                ->update(['stock' => $newStock]);
            Log::info('After ingredient update', ['id' => $ingredient->id, 'updated_stock' => $newStock]);

            Log::info('Stock adjustment recorded', [
                'adjustment_id' => $adjustment->id,
                'ingredient' => $ingredient->name,
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stock adjustment recorded successfully',
                'adjustment' => $adjustment,
                'ingredient' => [
                    'id' => $ingredient->id,
                    'name' => $ingredient->name,
                    'stock' => $newStock,
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating stock adjustment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create stock adjustment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get adjustment history for a specific ingredient.
     */
    public function ingredientHistory($ingredientId)
    {
        try {
            $adjustments = StockAdjustment::where('ingredient_id', $ingredientId)
                ->orderBy('created_at', 'desc')
                ->limit(100)
                ->get();

            return response()->json([
                'success' => true,
                'adjustments' => $adjustments
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching ingredient adjustment history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch adjustment history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary statistics for stock adjustments.
     */
    public function summary(Request $request)
    {
        try {
            $query = StockAdjustment::query();

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            $totalAdditions = (clone $query)->where('type', 'add')->sum('quantity');
            $totalRemovals = (clone $query)->where('type', 'remove')->sum('quantity');
            $totalAdjustments = (clone $query)->count();

            // Get recent adjustments
            $recentAdjustments = StockAdjustment::orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_additions' => $totalAdditions,
                    'total_removals' => $totalRemovals,
                    'total_adjustments' => $totalAdjustments,
                    'net_change' => $totalAdditions - $totalRemovals,
                ],
                'recent' => $recentAdjustments
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching stock adjustment summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
