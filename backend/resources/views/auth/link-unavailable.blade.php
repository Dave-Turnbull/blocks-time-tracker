<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Can't link account — Blocks Time Tracker</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #111827; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
        .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 2rem; width: 100%; max-width: 380px; }
        h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
        p { color: #9ca3af; font-size: .9rem; margin: 0 0 1rem; line-height: 1.5; }
        a { display: inline-block; color: #60a5fa; text-decoration: none; font-weight: 600; font-size: .9rem; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Can't link this account</h1>
        <p>
            An account already exists for <strong>{{ $email }}</strong> that was
            created with single sign-on and has no password, so it can't be linked
            from here.
        </p>
        <p>
            If this is your account, ask an administrator to reconnect it — its
            single sign-on identity needs to be updated on the server.
        </p>
        <a href="/login">Back to login</a>
    </div>
</body>
</html>
