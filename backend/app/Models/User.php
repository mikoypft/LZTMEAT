<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    use HasFactory;

    protected $fillable = [
        'username',
        'email',
        'full_name',
        'role',
        'employee_role',
        'store_id',
        'permissions',
        'can_login',
        'password',
    ];

    protected $casts = [
        'permissions' => 'json',
        'can_login' => 'boolean',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function historyRecords(): HasMany
    {
        return $this->hasMany(SystemHistory::class);
    }
}
