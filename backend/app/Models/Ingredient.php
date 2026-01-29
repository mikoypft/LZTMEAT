<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'category',
        'unit',
        'stock',
        'min_stock_level',
        'reorder_point',
        'cost_per_unit',
        'supplier_id',
        'expiry_date',
    ];

    protected $casts = [
        'stock' => 'decimal:2',
        'min_stock_level' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
