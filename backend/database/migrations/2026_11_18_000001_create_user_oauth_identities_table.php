<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A join table, not provider/provider_id columns on `users` — a user can
 * hold both a password AND a linked Authentik identity at once (OIDC login
 * is additive, never a replacement for password login), which a join table
 * supports naturally. See App\Models\UserOAuthIdentity, CLAUDE.md's
 * "Authentik/OIDC login" section.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_oauth_identities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // 'authentik' today
            $table->string('provider_user_id'); // the OIDC 'sub' claim — stable, unlike email
            $table->string('email')->nullable(); // snapshot at link time, for audit only
            $table->timestamps();

            $table->unique(['provider', 'provider_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_oauth_identities');
    }
};
