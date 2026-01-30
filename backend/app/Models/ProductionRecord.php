<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionRecord extends Model
{
    use HasFactory;

    protected $table = 'production_records';

    protected $fillable = [
        'product_id',
        'quantity',
        'batch_number',
        'operator',
        'status',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(ProductionIngredient::class, 'production_id');
    }
}
