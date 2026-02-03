<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemHistory;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index()
    {
        $history = SystemHistory::with('user')->latest()->get();

        return response()->json([
            'history' => $history->map(fn($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'description' => $h->action,
                'user' => $h->user?->username ?? 'System',
                'timestamp' => $h->created_at->toIso8601String(),
                'details' => $h->details,
            ]),
        ]);
    }

    public function posHistory()
    {
        $history = SystemHistory::where('entity', 'Sale')
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'history' => $history->map(fn($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity' => $h->entity,
                'entityId' => $h->entity_id,
                'details' => $h->details,
                'user' => $h->user?->username ?? 'System',
                'timestamp' => $h->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function inventoryHistory()
    {
        $history = SystemHistory::where('entity', 'Inventory')
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'history' => $history->map(fn($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity' => $h->entity,
                'entityId' => $h->entity_id,
                'details' => $h->details,
                'user' => $h->user?->username ?? 'System',
                'timestamp' => $h->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function productionHistory()
    {
        $history = SystemHistory::where('entity', 'Production')
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'history' => $history->map(fn($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity' => $h->entity,
                'entityId' => $h->entity_id,
                'details' => $h->details,
                'user' => $h->user?->username ?? 'System',
                'timestamp' => $h->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function ingredientsHistory()
    {
        $history = SystemHistory::where('entity', 'Ingredient')
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'history' => $history->map(fn($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity' => $h->entity,
                'entityId' => $h->entity_id,
                'details' => $h->details,
                'user' => $h->user?->username ?? 'System',
                'timestamp' => $h->created_at->toIso8601String(),
            ]),
        ]);
    }
}
