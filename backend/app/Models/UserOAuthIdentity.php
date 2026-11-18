<?php

namespace App\Models;

use Database\Factories\UserOAuthIdentityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOAuthIdentity extends Model
{
    /** @use HasFactory<UserOAuthIdentityFactory> */
    use HasFactory;

    // Laravel's pluralizer mangles "UserOAuthIdentity" into
    // "user_o_auth_identities" (it splits on the capital-letter run in
    // "OAuth") — set explicitly to match the migration's table name.
    protected $table = 'user_oauth_identities';

    protected $fillable = ['user_id', 'provider', 'provider_user_id', 'email'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
