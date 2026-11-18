<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserOAuthIdentity;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

/**
 * Authentik/OIDC account resolution — see CLAUDE.md's "Authentik/OIDC
 * login" section.
 *
 * Deliberately does NOT auto-link an incoming OAuth identity to an existing
 * password account just because the emails match (AuthentikController's
 * "link required" path requires the existing account's actual password
 * instead) — trusting an IdP-asserted email alone would let anyone able to
 * get an arbitrary "email" claim through a misconfigured or compromised IdP
 * hijack an existing local account with no further proof.
 *
 * Unlike CommunityHub (the app this flow was ported from), there is no
 * separate "is OAuth signup open" instance setting here — the single
 * AUTHENTIK_ENABLED flag already gates the whole feature, so any unmatched
 * identity is provisioned a new account whenever Authentik login is on.
 */
class AuthentikLoginService
{
    public function findLinkedUser(string $providerUserId): ?User
    {
        return UserOAuthIdentity::where('provider', 'authentik')
            ->where('provider_user_id', $providerUserId)
            ->first()?->user;
    }

    /** An existing password account with this email — a candidate for the manual link-by-password flow. */
    public function findLinkableUser(?string $email): ?User
    {
        return $email ? User::where('email', $email)->first() : null;
    }

    public function link(User $user, string $providerUserId, ?string $email): void
    {
        UserOAuthIdentity::create([
            'user_id' => $user->id,
            'provider' => 'authentik',
            'provider_user_id' => $providerUserId,
            'email' => $email,
        ]);
    }

    /** Provisions a brand-new account for an OAuth identity with no existing match. */
    public function provision(SocialiteUser $oauthUser): User
    {
        $email = $oauthUser->getEmail();
        abort_if(! $email, 422, 'Authentik did not provide an email address for this account.');

        $user = User::create([
            'name' => $oauthUser->getName() ?: $oauthUser->getNickname() ?: Str::before($email, '@'),
            'email' => $email,
            'password' => null,
        ]);

        $this->link($user, $oauthUser->getId(), $email);

        return $user;
    }
}
