<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeBlock extends Model
{
    use HasFactory;

    protected $fillable = ['task_id', 'user_id', 'date', 'start_time', 'end_time'];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'start_time' => 'integer',
        'end_time' => 'integer',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
