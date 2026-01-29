<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemHistory extends Model
{
    use HasFactory;

    protected $table = 'system_history';

    protected $fillable = [
        'action',
        'entity',
        'entity_id',
        'details',
        'user_id',
    ];

    protected $casts = [
        'details' => 'json',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
