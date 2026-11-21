<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthentikLoginService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * Optional additional login method, alongside password login — never a
 * replacement (see CLAUDE.md's "Authentik/OIDC login" section). Gated
 * per-request by config('services.authentik.enabled'), not at
 * route-registration time, so it can be toggled without a route-cache
 * concern.
 *
 * This app is a token-authenticated SPA, not a session-authenticated one
 * (see AuthController) — there is no server session the frontend reads
 * auth state from. So unlike the app this flow was ported from, a
 * successful OIDC login can't just Auth::login() + redirect('/'); it has
 * to hand the SPA a Sanctum token. redirect()/callback() still run under
 * the 'web' middleware group (see routes/web.php) because they're real
 * full-page browser navigations to/from Authentik's domain and need a
 * session to carry Socialite's OAuth state param and (for the link-account
 * path) the pending identity — but the end of every successful path is a
 * redirect to the SPA's /auth/callback route with a one-time Sanctum token
 * in the query string, which main.tsx's AuthCallback page stores and then
 * drops from the URL.
 *
 * redirect() deliberately never adds a `prompt=login` (or similar) override
 * — if the browser already has an active Authentik session, the redirect
 * round-trip completes with no re-prompt. That's the entire "auto sign-on"
 * behaviour; it's inherent OIDC behavior, not a mechanism built here. Do
 * not "helpfully" add a forced-reauth param later without knowing that's
 * what you're trading away.
 */
class AuthentikController extends Controller
{
    public function redirect(): RedirectResponse
    {
        abort_unless(config('services.authentik.enabled'), 404);

        return Socialite::driver('authentik')->redirect();
    }

    public function callback(Request $request, AuthentikLoginService $service): RedirectResponse|Response
    {
        abort_unless(config('services.authentik.enabled'), 404);

        try {
            $oauthUser = Socialite::driver('authentik')->user();
        } catch (Throwable) {
            return redirect('/login?error=authentik_failed');
        }

        if ($user = $service->findLinkedUser($oauthUser->getId())) {
            return $this->completeLogin($user);
        }

        if ($existing = $service->findLinkableUser($oauthUser->getEmail())) {
            // A passwordless account (created via SSO, not password signup)
            // can never satisfy the password-confirmation link step below, so
            // sending it there is an inescapable dead-end. Explain instead.
            // (A safe auto-link for this passwordless case is possible — see
            // the PR discussion — but is intentionally not done here.)
            if ($existing->password === null) {
                return response()->view('auth.link-unavailable', [
                    'email' => $oauthUser->getEmail(),
                ], 409);
            }

            $request->session()->put('pending_oauth_identity', [
                'provider_user_id' => $oauthUser->getId(),
                'email' => $oauthUser->getEmail(),
                'user_id' => $existing->id,
            ]);

            return redirect('/auth/link-account');
        }

        return $this->completeLogin($service->provision($oauthUser));
    }

    /** The manual "prove you own this account" step — see AuthentikLoginService's docblock for why linking never happens on email match alone. */
    public function showLinkAccount(Request $request): View|RedirectResponse
    {
        $pending = $request->session()->get('pending_oauth_identity');
        if (! $pending) {
            return redirect('/login');
        }

        return view('auth.link-account', ['email' => $pending['email'], 'error' => null]);
    }

    public function linkAccount(Request $request, AuthentikLoginService $service): View|RedirectResponse|Response
    {
        $pending = $request->session()->get('pending_oauth_identity');
        abort_unless($pending, 403);

        $validated = $request->validate(['password' => ['required']]);

        $user = User::find($pending['user_id']);

        // Passwordless (SSO-only) account: no password can ever match, so
        // don't loop on "Incorrect password." — explain the dead-end.
        if ($user && $user->password === null) {
            $request->session()->forget('pending_oauth_identity');

            return response()->view('auth.link-unavailable', [
                'email' => $pending['email'],
            ], 409);
        }

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return view('auth.link-account', [
                'email' => $pending['email'],
                'error' => 'Incorrect password.',
            ]);
        }

        $service->link($user, $pending['provider_user_id'], $pending['email']);
        $request->session()->forget('pending_oauth_identity');

        return $this->completeLogin($user);
    }

    /** Public config flag the frontend uses to decide whether to render the "Log in with Authentik" link — see routes/api.php. */
    public function enabled(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['enabled' => (bool) config('services.authentik.enabled')]);
    }

    private function completeLogin(User $user): RedirectResponse
    {
        $token = $user->createToken('authentik-oidc')->plainTextToken;

        return redirect('/auth/callback?' . http_build_query(['token' => $token]));
    }
}
