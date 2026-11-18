<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserOAuthIdentity;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<UserOAuthIdentity>
 */
class UserOAuthIdentityFactory extends Factory
{
    protected $model = UserOAuthIdentity::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => 'authentik',
            'provider_user_id' => (string) Str::uuid(),
            'email' => fake()->unique()->safeEmail(),
        ];
    }
}
