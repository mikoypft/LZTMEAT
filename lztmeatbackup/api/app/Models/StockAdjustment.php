<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    protected $fillable = [
        'ingredient_id',
        'ingredient_name',
        'ingredient_code',
        'type',
        'quantity',
        'previous_stock',
        'new_stock',
        'unit',
        'reason',
        'user_id',
        'user_name',
        'ip_address',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'previous_stock' => 'decimal:2',
        'new_stock' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the ingredient that was adjusted.
     */
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * Get the user who made the adjustment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
