<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Optional additional login method — see CLAUDE.md's "Authentik/OIDC
    // login" section. Kept here rather than a dedicated config/authentik.php
    // because Socialite's own convention (and socialiteproviders/authentik
    // specifically) reads OAuth driver credentials from
    // config('services.<driver>'). `enabled` is checked per-request in
    // AuthentikController, not at route-registration time, so it can be
    // flipped without a route-cache-sensitive restart.
    'authentik' => [
        'enabled' => (bool) env('AUTHENTIK_ENABLED', false),
        'client_id' => env('AUTHENTIK_CLIENT_ID'),
        'client_secret' => env('AUTHENTIK_CLIENT_SECRET'),
        'redirect' => env('AUTHENTIK_REDIRECT_URI', env('APP_URL') . '/auth/authentik/callback'),
        // Authentik's own base URL, e.g. https://authentik.example.com —
        // Provider::getBaseUrl() appends /application/o/authorize|token/.
        'base_url' => env('AUTHENTIK_BASE_URL'),
    ],

];
