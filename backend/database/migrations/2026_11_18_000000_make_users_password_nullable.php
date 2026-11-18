<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An Authentik-provisioned account (see AuthentikLoginService::provision())
 * has no password to hash — nullable, honestly, rather than storing a
 * bcrypt hash of a random/unusable placeholder value. AuthController::login()
 * already requires `password` on every request and Auth::attempt() simply
 * fails a null-password row, so existing password login is unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
        });
    }
};
