<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'from',
        'to',
        'quantity',
        'quantity_received',
        'status',
        'requested_by',
        'discrepancy_reason',
        'received_by',
        'received_at',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
