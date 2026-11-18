<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Link your account — Blocks Time Tracker</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #111827; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 2rem; width: 100%; max-width: 360px; }
        h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
        p { color: #9ca3af; font-size: .9rem; margin-bottom: 1.25rem; }
        label { display: block; font-size: .85rem; margin-bottom: .25rem; }
        input { width: 100%; padding: .5rem .75rem; border-radius: 6px; border: 1px solid #4b5563; background: #111827; color: #f3f4f6; box-sizing: border-box; margin-bottom: 1rem; }
        button { width: 100%; padding: .6rem; border-radius: 6px; border: none; background: #3b82f6; color: white; font-weight: 600; cursor: pointer; }
        .error { color: #f87171; font-size: .85rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Link your Authentik identity</h1>
        <p>
            An account already exists for <strong>{{ $email }}</strong>. Enter that
            account's password to link Authentik to it. This is a one-time step —
            future Authentik logins will go straight in.
        </p>

        @if ($error)
            <p class="error">{{ $error }}</p>
        @endif

        <form method="POST" action="/auth/link-account">
            @csrf
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autofocus>
            <button type="submit">Link account</button>
        </form>
    </div>
</body>
</html>
