<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TimeBlockController;
use App\Http\Controllers\Web\AuthentikController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public flag the frontend polls to decide whether to render the "Log in
// with Authentik" link — the actual redirect/callback routes live in
// routes/web.php (they need a session; this one doesn't).
Route::get('/auth/authentik/enabled', [AuthentikController::class, 'enabled']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    Route::apiResource('tasks', TaskController::class);
    Route::post('/time-blocks/erase', [TimeBlockController::class, 'erase']);
    Route::apiResource('time-blocks', TimeBlockController::class);
});
