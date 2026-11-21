<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') — Blocks Time Tracker</title>
    <style>
        :root {
            --canvas: #ffffff;
            --fg: #1a1a1a;
            --muted: #a6a6a6;
            --hover: #f2f2f2;
        }
        @media (prefers-color-scheme: dark) {
            :root { --canvas: #1a1a1a; --fg: #ffffff; --muted: #595959; --hover: #262626; }
        }
        html.dark { --canvas: #1a1a1a; --fg: #ffffff; --muted: #595959; --hover: #262626; }
        * { box-sizing: border-box; }
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--canvas); color: var(--fg);
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; margin: 0; padding: 1.5rem;
        }
        .card { text-align: center; max-width: 24rem; }
        .code { font-size: 3rem; font-weight: 700; line-height: 1; margin: 0; }
        h1 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 .5rem; }
        p { color: var(--muted); font-size: .95rem; margin: 0 0 1.5rem; }
        a.home {
            display: inline-block; padding: .55rem 1rem; border-radius: 8px;
            border: 1px solid var(--muted); color: var(--fg); text-decoration: none;
            font-weight: 500; font-size: .9rem;
        }
        a.home:hover { background: var(--hover); }
    </style>
    <script>
        try { if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark'); } catch (e) {}
    </script>
</head>
<body>
    <div class="card">
        <p class="code">@yield('code')</p>
        <h1>@yield('title')</h1>
        <p>@yield('message')</p>
        <a class="home" href="/">Go to Blocks</a>
    </div>
</body>
</html>
