<?php

use App\Http\Controllers\Web\AuthentikController;
use Illuminate\Support\Facades\Route;

// Authentik/OIDC — real browser navigations to/from Authentik's own domain,
// so these need the 'web' group's session (OAuth state, pending link
// identity), unlike the token-authenticated routes in api.php. Always
// registered; gated per-request inside AuthentikController
// (config('services.authentik.enabled')) rather than here, so toggling it
// needs no route-cache/boot concern. Must come before the catch-all below.
Route::get('/auth/authentik/redirect', [AuthentikController::class, 'redirect'])->name('authentik.redirect');
Route::get('/auth/authentik/callback', [AuthentikController::class, 'callback'])
    ->middleware('throttle:10,1')->name('authentik.callback');

// The "an OAuth identity matched an existing password account" manual link
// step — see AuthentikLoginService's docblock for why this exists instead
// of auto-linking on email match. Server-rendered (not part of the React
// SPA): it's a rare fallback path, and a plain @csrf form sidesteps wiring
// CSRF cookies into the SPA's otherwise-stateless axios client just for this.
Route::get('/auth/link-account', [AuthentikController::class, 'showLinkAccount']);
Route::post('/auth/link-account', [AuthentikController::class, 'linkAccount'])->middleware('throttle:10,1');

// Catch-all: serve the React SPA for every non-API route
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
