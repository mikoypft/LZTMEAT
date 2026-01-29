<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'user_id',
        'store_id',
        'customer',
        'items',
        'subtotal',
        'global_discount',
        'tax',
        'total',
        'payment_method',
    ];

    protected $casts = [
        'customer' => 'json',
        'items' => 'json',
        'subtotal' => 'decimal:2',
        'global_discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
