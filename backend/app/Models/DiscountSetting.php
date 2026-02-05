<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscountSetting extends Model
{
    protected $table = 'discount_settings';

    protected $fillable = [
        'wholesale_min_units',
        'wholesale_discount_percent',
        'discount_type',
        'wholesale_discount_amount',
    ];

    protected $casts = [
        'wholesale_min_units' => 'integer',
        'wholesale_discount_percent' => 'decimal:2',
        'wholesale_discount_amount' => 'decimal:2',
    ];

    public static function getSettings()
    {
        return self::first() ?? self::create([
            'wholesale_min_units' => 5,
            'wholesale_discount_percent' => 1.00,
        ]);
    }
}
