<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionIngredient extends Model
{
    use HasFactory;

    protected $table = 'production_ingredients';
    public $timestamps = false;

    protected $fillable = [
        'production_id',
        'ingredient_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function production(): BelongsTo
    {
        return $this->belongsTo(ProductionRecord::class, 'production_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
