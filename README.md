# Blocks Time Tracker

A time-tracking web app. Drag across a calendar grid to schedule coloured task blocks; tasks and time blocks persist to a REST API and are fetched per date range.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 11 (PHP 8.3) + Sanctum token auth |
| Frontend | React 18 + TypeScript + Vite 5 + Tailwind CSS |
| Database | MySQL 8 |
| Infrastructure | Docker Compose |

The React app is served through Laravel as a Blade view — there is no separate frontend server in production. In development, Vite runs alongside and provides HMR.

## Running Locally

### Prerequisites

- Docker + Docker Compose plugin
- Nothing else — PHP and Node are provided by containers

### Setup

Copy the root environment file:

```bash
cp .env.example .env
```

Start all services:

```bash
docker compose up
```

On first run this will:
1. Pull images
2. Install the Laravel project via Composer
3. Generate the app key and run migrations
4. Install npm dependencies and start the Vite dev server

Once running:

| URL | What |
|-----|------|
| http://localhost:8000 | App (served by nginx → PHP-FPM) |
| http://localhost:5173 | Vite dev server (HMR) |
| localhost:3306 | MySQL (accessible from host) |

Subsequent `docker compose up` calls skip the first-run steps and start in a few seconds.

### Stopping

```bash
docker compose down        # stop containers, keep DB volume
docker compose down -v     # stop containers and delete DB volume (full reset)
```

## Running Tests

### Laravel (PHPUnit)

Run from inside the app container:

```bash
docker compose exec app php artisan test
```

Or on the host if PHP is available locally:

```bash
cd backend && php artisan test
```

Tests use an in-memory SQLite database — no running Docker services needed for the test suite.

### Frontend (Vitest)

```bash
cd backend && npx vitest run      # single run
cd backend && npx vitest          # watch mode
```

## Project Structure

```
/
├── docker/             — Dockerfiles and nginx config
├── backend/            — Laravel application root
│   ├── app/            — Models, Controllers, Policies
│   ├── database/       — Migrations, Factories, Seeders
│   ├── routes/         — api.php (JSON API), web.php (SPA catch-all)
│   ├── resources/js/   — React/TypeScript source
│   └── tests/          — PHPUnit feature tests
├── docker-compose.yml
└── .env.example
```

For detailed architecture, file purposes, API contracts, and development guidelines see [CLAUDE.md](CLAUDE.md).

## Authentication

Registration and login are available at `/register` and `/login`. Auth tokens are stored in `localStorage` and attached to every API request automatically.

## Environment Variables

The root `.env` controls Docker Compose. The defaults in `.env.example` work out of the box:

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_UID` | 1000 | UID the PHP and Node containers run as |
| `APP_GID` | 1000 | GID the PHP and Node containers run as |
| `DB_DATABASE` | timetracker | MySQL database name |
| `DB_USERNAME` | timetracker | MySQL user |
| `DB_PASSWORD` | secret | MySQL password |
| `DB_ROOT_PASSWORD` | rootsecret | MySQL root password |

Set `APP_UID`/`APP_GID` to match your local user (`id -u` / `id -g`) if you encounter file permission issues with generated files.
