<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\UserOAuthIdentity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class AuthentikTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.authentik.enabled' => true]);
    }

    private function fakeOAuthUser(array $overrides = []): SocialiteUser
    {
        return SocialiteUser::fake(array_merge([
            'id' => 'sub-123',
            'email' => 'oauth-user@example.com',
            'name' => 'OAuth User',
            'nickname' => 'oauthuser',
        ], $overrides));
    }

    public function test_the_enabled_endpoint_reflects_config(): void
    {
        config(['services.authentik.enabled' => false]);
        $this->getJson('/api/auth/authentik/enabled')->assertOk()->assertJson(['enabled' => false]);

        config(['services.authentik.enabled' => true]);
        $this->getJson('/api/auth/authentik/enabled')->assertOk()->assertJson(['enabled' => true]);
    }

    public function test_redirect_and_callback_404_when_authentik_is_disabled(): void
    {
        config(['services.authentik.enabled' => false]);

        $this->get('/auth/authentik/redirect')->assertNotFound();
        $this->get('/auth/authentik/callback')->assertNotFound();
    }

    public function test_redirect_sends_the_browser_to_authentik(): void
    {
        config(['services.authentik.base_url' => 'https://authentik.example.com']);

        $response = $this->get('/auth/authentik/redirect');

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://authentik.example.com/application/o/authorize/',
            $response->headers->get('Location')
        );
    }

    public function test_an_existing_linked_identity_logs_in_and_issues_a_token(): void
    {
        $user = User::factory()->create();
        UserOAuthIdentity::factory()->for($user)->create(['provider_user_id' => 'sub-123']);

        Socialite::fake('authentik', $this->fakeOAuthUser());

        $response = $this->get('/auth/authentik/callback');

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('/auth/callback?token=', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $this->assertNotEmpty($query['token']);

        $me = $this->withToken($query['token'])->getJson('/api/auth/user');
        $me->assertOk()->assertJsonPath('email', $user->email);
    }

    public function test_a_matching_email_with_no_linked_identity_requires_manual_link(): void
    {
        $user = User::factory()->create(['email' => 'oauth-user@example.com', 'password' => Hash::make('secret123')]);

        Socialite::fake('authentik', $this->fakeOAuthUser());

        $response = $this->get('/auth/authentik/callback');

        $response->assertRedirect('/auth/link-account');
        $this->assertDatabaseCount('user_oauth_identities', 0);

        $page = $this->get('/auth/link-account');
        $page->assertOk();

        $link = $this->post('/auth/link-account', ['password' => 'secret123']);
        $link->assertRedirect();
        $this->assertStringContainsString('/auth/callback?token=', $link->headers->get('Location'));
        $this->assertDatabaseHas('user_oauth_identities', ['user_id' => $user->id, 'provider_user_id' => 'sub-123']);
    }

    public function test_an_incorrect_password_on_the_link_step_is_rejected(): void
    {
        User::factory()->create(['email' => 'oauth-user@example.com', 'password' => Hash::make('secret123')]);
        Socialite::fake('authentik', $this->fakeOAuthUser());
        $this->get('/auth/authentik/callback');

        $response = $this->post('/auth/link-account', ['password' => 'wrong-password']);

        $response->assertOk();
        $response->assertSee('Incorrect password');
        $this->assertDatabaseCount('user_oauth_identities', 0);
    }

    public function test_a_new_identity_with_no_match_provisions_a_new_account(): void
    {
        Socialite::fake('authentik', $this->fakeOAuthUser());

        $response = $this->get('/auth/authentik/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('/auth/callback?token=', $response->headers->get('Location'));

        $user = User::where('email', 'oauth-user@example.com')->firstOrFail();
        $this->assertNull($user->password);
        $this->assertDatabaseHas('user_oauth_identities', ['user_id' => $user->id, 'provider_user_id' => 'sub-123']);
    }

    public function test_the_callback_route_is_throttled(): void
    {
        Socialite::fake('authentik', fn () => $this->fakeOAuthUser(['id' => uniqid('sub-', true)]));

        for ($i = 0; $i < 10; $i++) {
            $this->get('/auth/authentik/callback');
        }

        $response = $this->get('/auth/authentik/callback');

        $response->assertStatus(429);
    }

    public function test_password_login_still_works_when_authentik_is_enabled(): void
    {
        $user = User::factory()->create(['password' => Hash::make('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()->assertJsonStructure(['user', 'token']);
    }
}
