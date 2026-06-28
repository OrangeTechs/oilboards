<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name', 'email', 'company', 'position', 'wells_count', 'source',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
