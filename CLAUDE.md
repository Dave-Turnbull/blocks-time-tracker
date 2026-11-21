# Blocks Time Tracker — Agent Reference

This file is the primary context document for agents working on this codebase. Read it before searching files. Keep it up to date when you add features, change architecture, or create new tests.

---

## Project Overview

A time-tracking SPA. Users drag-select cells on a calendar grid to schedule coloured task blocks. Tasks and time blocks persist to a Laravel API; the React frontend fetches them per date range and renders them in the grid.

**Stack:**
- Backend: Laravel 11 (PHP 8.3) + Sanctum token auth
- Frontend: React 18 + TypeScript + Vite 5 + Tailwind CSS — served as a Laravel Blade view via `laravel-vite-plugin`
- Database: MySQL 8 (Docker) / SQLite (tests)
- Infrastructure: Docker Compose (4 services)

---

## Repository Layout

```
/                           ← repo root; docker-compose.yml, .env live here
├── docker/
│   ├── php/
│   │   ├── Dockerfile      ← PHP 8.3-FPM image, installs gosu, creates appuser UID/GID 1000
│   │   └── entrypoint.sh   ← First-run: composer create-project, key:generate, migrate; then exec php-fpm
│   └── nginx/
│       └── default.conf    ← nginx proxies PHP to app:9000, serves /var/www/public
├── backend/                ← Laravel root (bind-mounted to /var/www in containers)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Controller.php              ← Base controller; MUST include `use AuthorizesRequests`
│   │   │   └── Api/
│   │   │       ├── AuthController.php      ← register, login, logout, user
│   │   │       └── TimeBlockController.php ← CRUD + date-range index with grouped response
│   │   │   └── Web/
│   │   │       └── AuthentikController.php ← Authentik/OIDC redirect, callback, link-account, enabled flag
│   │   ├── Models/
│   │   │   ├── User.php               ← HasApiTokens (Sanctum), hasMany Task + TimeBlock + UserOAuthIdentity
│   │   │   ├── Task.php                ← belongsTo User, hasMany TimeBlock; fillable: user_id, name, description, color
│   │   │   ├── TimeBlock.php           ← belongsTo Task + User; fillable: task_id, user_id, date, start_time, end_time
│   │   │   └── UserOAuthIdentity.php   ← belongsTo User; links a (provider, provider_user_id) pair to an account
│   │   ├── Services/
│   │   │   └── AuthentikLoginService.php ← Authentik account resolution: link/match/provision — see CLAUDE.md
│   │   └── Policies/
│   │       ├── TaskPolicy.php       ← update/delete: user_id must match
│   │       └── TimeBlockPolicy.php  ← update/delete: user_id must match
│   ├── database/
│   │   ├── factories/
│   │   │   ├── TaskFactory.php               ← generates random name/description/color (#rrggbb hex)
│   │   │   ├── TimeBlockFactory.php          ← has forUser(User) state that creates consistent task+user_id
│   │   │   └── UserOAuthIdentityFactory.php  ← random provider_user_id, provider: 'authentik'
│   │   └── migrations/
│   │       ├── 2026_06_28_200000_create_tasks_table.php
│   │       ├── 2026_06_28_200001_create_time_blocks_table.php
│   │       ├── 2026_11_18_000000_make_users_password_nullable.php
│   │       └── 2026_11_18_000001_create_user_oauth_identities_table.php
│   ├── routes/
│   │   ├── api.php  ← All JSON API routes (prefixed /api automatically) + public authentik/enabled flag
│   │   └── web.php  ← Authentik redirect/callback/link-account routes, then the catch-all that returns app.blade.php for SPA routing
│   ├── resources/
│   │   ├── views/
│   │   │   ├── app.blade.php                   ← Root HTML; @viteReactRefresh + @vite(['resources/js/main.tsx'])
│   │   │   ├── auth/link-account.blade.php     ← Server-rendered (not SPA) Authentik "prove you own this account" form
│   │   │   ├── auth/link-unavailable.blade.php ← Shown when the email-matched account is passwordless (SSO-only), so the password link step can't apply
│   │   │   └── errors/                         ← Branded override pages for Laravel's default error views: layout.blade.php + 404/403/419/500 (theme-aware, link back to the app)
│   │   └── js/                       ← All React/TypeScript source
│   │       ├── main.tsx              ← Entry point; BrowserRouter, AuthProvider, route guards
│   │       ├── App.tsx               ← Root component; ToolbarProvider → SelectedCellsProvider → RenderDateRange + Toolbar
│   │       ├── lib/api.ts            ← Axios instance (baseURL /api); attaches Bearer token; redirects /login on 401
│   │       ├── contexts/
│   │       │   ├── AuthContext.tsx         ← User state; login/register/logout; fetches /api/auth/user on mount
│   │       │   ├── ToolbarContext.tsx      ← Global toolbar state (goToTarget for "Go to", zoom = grid min scale) + fetches /api/tasks on mount
│   │       │   └── SelectCellsContext.tsx  ← Mouse drag state; owns the sliding 30-day window and fetches /api/time-blocks in 10-day chunks; exposes refreshTimeBlocks, extendWindow, pendingSelection, submitTimeBlock, clearPendingSelection
│   │       ├── pages/
│   │       │   ├── Login.tsx        ← Guest-only; calls AuthContext.login; renders Authentik link when enabled
│   │       │   ├── Register.tsx     ← Guest-only; calls AuthContext.register
│   │       │   └── AuthCallback.tsx ← Route /auth/callback; stores the token from an Authentik login, then navigates home
│   │       ├── components/
│   │       │   ├── Toolbar.tsx             ← Left: task, cell size, go-to date, erase, zoom in/out. Right: theme, new-task placeholder, account menu (logout)
│   │       │   ├── RenderDateRange.tsx     ← Infinite day scroller: renders the window's SingleDays, extends it at the scroll edges with scroll anchoring, handles go-to scrolls
│   │       │   ├── SingleDay.tsx           ← Renders one column of Cell components for a date
│   │       │   ├── TaskList.tsx            ← "Tasks" panel: time blocks for the focused day (exposed as data-day on the section)
│   │       │   ├── TaskPickerModal.tsx     ← Modal after drag-select; pick task or create new; POSTs time block
│   │       │   ├── Popover.tsx             ← Trigger + click-outside backdrop used by toolbar dropdowns
│   │       │   └── Cell/
│   │       │       ├── Cell.tsx                          ← Single time cell; renders task overlay if occupied
│   │       │       ├── groupRadius.ts                    ← GroupPosition type + rounded-corner class per position
│   │       │       └── components/SelectedCellOverlay.tsx ← Fixed blue highlight shown during mouse drag
│   │       ├── utils/
│   │       │   ├── timesToCells.tsx  ← Converts TimeEntry[] to CellObject[] (one per cell-slot in the day)
│   │       │   ├── utils.ts          ← readableDate, readableTime, addDays, daysBetween, listDates, extendDateWindow
│   │       │   └── updateData.ts     ← (legacy helper, not currently used by API-backed flow)
│   │       └── __tests__/
│   │           ├── setup.ts                               ← imports @testing-library/jest-dom
│   │           ├── utils/timesToCells.test.ts             ← 15 tests for timesToCells
│   │           ├── utils/utils.test.ts                    ← 30 tests for readable/date-window helpers
│   │           ├── pages/Login.test.tsx                   ← 9 component tests (mocks AuthContext + react-router + api)
│   │           ├── pages/Register.test.tsx                ← 7 component tests
│   │           ├── pages/AuthCallback.test.tsx             ← 3 component tests
│   │           ├── components/TaskPickerModal.test.tsx    ← 10 component tests
│   │           ├── components/TaskList.test.tsx           ← 12 component tests
│   │           ├── components/RenderDateRange.test.tsx    ← 5 tests: sidebar focused-day sync + go-to focus
│   │           └── components/Toolbar.test.tsx            ← 6 tests: go-to date + zoom controls
│   ├── tests/Feature/Api/
│   │   ├── AuthTest.php       ← 14 tests: register, login, logout, /auth/user
│   │   ├── AuthentikTest.php  ← 10 tests: enabled flag, redirect/callback gating, link/match/provision flows, throttling
│   │   ├── TaskTest.php       ← 16 tests: CRUD + 401/403 isolation
│   │   └── TimeBlockTest.php  ← 29 tests: CRUD + date range + grouped response + overlap/adjacent-merge behaviour
│   ├── vite.config.ts    ← laravel-vite-plugin + @vitejs/plugin-react; HMR host=localhost (prevents Docker CORS)
│   ├── vitest.config.ts  ← environment: jsdom, globals: true, setupFiles: __tests__/setup.ts
│   └── phpunit.xml       ← DB_CONNECTION=sqlite, DB_DATABASE=:memory: for all tests
└── README.md
```

---

## Docker Setup

**Services** (all on `app-network`):

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | mysql:8.0 | 33061→3306 | MySQL; host port 33061 avoids clashing with a local MySQL; health-checked before `app` starts |
| `app` | docker/php/Dockerfile | — | PHP-FPM; bind-mount `./backend:/var/www` |
| `nginx` | nginx:alpine | 8000 | Serves public/; proxies .php to `app:9000` |
| `node` | node:20-alpine | 5173 | Vite dev server; waits for `package.json` then `npm run dev` |

**First-run behaviour** (entrypoint.sh):
1. `chown appuser:appgroup /var/www` (Docker creates bind-mount dirs as root)
2. `composer create-project` if `artisan` missing
3. Patches `.env` (DB_HOST, DB_DATABASE, etc.)
4. `php artisan key:generate` if no key
5. `composer install`
6. Retries `php artisan migrate --force` until DB is ready
7. `exec php-fpm`

**Environment** — root `.env` provides Docker Compose vars:
```
APP_UID=1000
APP_GID=1000
DB_DATABASE=timetracker
DB_USERNAME=timetracker
DB_PASSWORD=secret
DB_ROOT_PASSWORD=rootsecret
```

**Known gotcha — Docker socket:** if `/var/run/docker.sock` is not group-accessible, run:
```bash
sudo chmod 666 /var/run/docker.sock
```

**npm peer deps:** node container runs `npm install --legacy-peer-deps` because `laravel-vite-plugin@^1.0` + `vite@^5` conflict with newer plugin versions. Do not upgrade these without checking peer dep compatibility.

---

## API Reference

All routes prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | `{name, email, password, password_confirmation}` → `{user, token}` 201 |
| POST | `/api/auth/login` | No | `{email, password}` → `{user, token}` |
| POST | `/api/auth/logout` | Yes | Deletes current token → `{message}` |
| GET | `/api/auth/user` | Yes | Returns authed user object |
| GET | `/api/auth/authentik/enabled` | No | `{enabled: bool}` — whether the frontend should render the Authentik login link |

### Authentik/OIDC login

Optional, additional login method alongside password login (`AuthController`) —
never a replacement. Config-gated by `AUTHENTIK_ENABLED` (see `config/services.php`'s
`'authentik'` key); `false` by default, and the app behaves exactly as it did before
this feature existed. Ported from `Dave-Turnbull/CommunityHub`'s equivalent feature;
built on `laravel/socialite` + `socialiteproviders/authentik`.

**Why these routes live in `routes/web.php`, not `api.php`:** `redirect()`/`callback()`
are real full-page browser navigations to/from Authentik's own domain, not XHR calls
from the SPA — they need the `web` middleware group's session to carry Socialite's
OAuth state param (and, on the link-account path below, the pending identity). That's
also why the final step hands the SPA a Sanctum token via a query string redirect
rather than just `Auth::login()` + redirect — this app has no session the frontend
reads auth state from (see AuthController/Frontend Data Flow above), only the Bearer
token in `localStorage`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/authentik/redirect` | Browser nav → Authentik's authorize endpoint. 404 if disabled. |
| GET | `/auth/authentik/callback` | Resolves the OIDC identity, then redirects to `/auth/callback?token=...` (new identity) or `/auth/link-account` (email matches an existing password account). Throttled 10/min. |
| GET/POST | `/auth/link-account` | Server-rendered Blade form (not part of the React SPA — a `@csrf` form sidesteps wiring CSRF cookies into the otherwise-stateless axios client for this one rare fallback path). Requires the existing account's real password before linking. |

**Account resolution** (`App\Services\AuthentikLoginService`), in order:
1. Already linked (`user_oauth_identities` row for `(provider, provider_user_id)`,
   `provider_user_id` being the stable OIDC `sub` claim) → log straight in.
2. Email matches an existing password account, no link yet → **not** auto-linked
   (trusting an IdP-asserted email alone would let a compromised/misconfigured IdP
   hijack a local account). Redirects to `/auth/link-account` instead. But if the
   matched account is **passwordless** (itself SSO-provisioned, so there's no
   password to confirm), the link form can never succeed — the callback renders
   `auth/link-unavailable` (409) explaining the dead-end rather than looping on
   "Incorrect password." (Auto-linking the passwordless case would be safe but is
   deliberately left as a server-side admin action.)
3. No match → provisions a new `User` (`password: null`) and links it. Unlike
   CommunityHub there's no separate "is OAuth signup open" setting — the single
   `AUTHENTIK_ENABLED` flag already gates the whole feature.

**Data model:** `user_oauth_identities` (`App\Models\UserOAuthIdentity`) is a join
table, not columns on `users` — a user can hold a password *and* a linked Authentik
identity at once. Its `$table` is set explicitly: Laravel's pluralizer mangles
`UserOAuthIdentity` into `user_o_auth_identities` (splits on the capital-letter run
in "OAuth"). `users.password` is nullable (migration
`2026_11_18_000000_make_users_password_nullable`) for the same reason.

**Frontend:** `Login.tsx` fetches `/api/auth/authentik/enabled` on mount and
conditionally renders a plain `<a href="/auth/authentik/redirect">` (a real
navigation, not a `Link`/axios call). `AuthCallback.tsx` (route `/auth/callback`)
reads `?token=` from the query string, stores it via `AuthContext.loginWithToken`,
and routes home — the same `localStorage` key (`auth_token`) and axios instance
password login uses.

**Env vars:** `AUTHENTIK_ENABLED`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`,
`AUTHENTIK_BASE_URL`, `AUTHENTIK_REDIRECT_URI` (optional override, defaults to
`{APP_URL}/auth/authentik/callback`). None have a working default — Authentik login
404s until all of `AUTHENTIK_ENABLED=true` + client id/secret/base URL are set to a
real Authentik application's OAuth2 provider config, whose redirect URI must be
`{APP_URL}/auth/authentik/callback`.

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List own tasks, ordered by name |
| POST | `/api/tasks` | `{name, description?, color}` — color must be `#rrggbb` |
| PUT/PATCH | `/api/tasks/{id}` | Partial update; 403 if not owner |
| DELETE | `/api/tasks/{id}` | 204; 403 if not owner |

### Time Blocks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/time-blocks?start=YYYY-MM-DD&end=YYYY-MM-DD` | Returns object keyed by date, each value is an array of time block records |
| POST | `/api/time-blocks` | `{task_id, date, start_time, end_time}` — times in minutes from midnight (0–1440). Same-task blocks flush against the new range (same user/date) are absorbed into one block; combined with overlap trimming this also coalesces same-task overlaps. The response is the merged block. |
| PUT/PATCH | `/api/time-blocks/{id}` | Partial update; 403 if not owner |
| DELETE | `/api/time-blocks/{id}` | 204; 403 if not owner |

**GET /api/time-blocks response shape:**
```json
{
  "2026-06-28": [
    {
      "id": 1,
      "startTime": 540,
      "endTime": 600,
      "taskID": "3",
      "task": { "id": 3, "name": "Design", "description": null, "color": "#3b82f6" }
    }
  ],
  "2026-06-29": []
}
```
Note: `taskID` is a string (the frontend keyed record uses string IDs). The `task` key is the eager-loaded task object.

---

## Frontend Data Flow

1. **Auth bootstrap** (`AuthContext`): on mount, if `auth_token` in localStorage → GET `/api/auth/user` → sets user state.
2. **Task loading** (`ToolbarContext`): on mount → GET `/api/tasks` → converts array to `Record<string, Task>` keyed by `String(task.id)`.
3. **Time block loading** (`SelectCellsContext`): a sliding `dateWindow` (max 30 days, initially today−10 → today+19) drives everything. An effect fetches any not-yet-loaded days in the window as one contiguous GET `/api/time-blocks?start=&end=` and caches them in `loadedDays` (kept beyond the window so scrolling back doesn't refetch). `cellsData`/`currentTimeData` are derived with `useMemo` from window + cache + `minuteinput`; unfetched days render as empty grids of identical height, so there's no layout shift when data lands. `extendWindow('past'|'future')` grows the window by 10 days and, past 30, slides it instead (`extendDateWindow` in utils). The toolbar's `goToTarget` (date + nonce) re-centres the window; `RenderDateRange` extends it from scroll-edge proximity (<400px) with manual scroll anchoring ([overflow-anchor:none] + anchor-day offset correction), and scrolls the go-to day to the top of the viewport once per nonce.
4. **Cell rendering**: `RenderDateRange` → `SingleDay` → `Cell`. Each `Cell` receives a `CellObject` and reads tasks from `ToolbarContext.tasks`.

**Key types:**
```ts
// ToolbarContext
interface Task { id: number; name: string; description: string | null; color: string; }
type TaskRecord = Record<string, Task>;  // keyed by String(task.id)

// SelectCellsContext
interface TimeEntry { id?: number; startTime: number; endTime: number; taskID: string; }

// timesToCells.tsx
class CellObject { tasks: TaskTime[]; startTime: number; numOfMinutes: number; }
interface TaskTime { startTime: number; endTime: number; taskID: string; }
// startTime/endTime inside CellObject.tasks are LOCAL offsets within the cell, not global minutes
```

**Mouse interaction** (SelectCellsContext):
- `mousedown` on a cell sets `selectedCells.day/StartCell/EndCell`
- `mousemove` extends `EndCell` while button is held
- `mouseup` logs selection to console (TODO: open task picker + POST time block)

**Token storage:** `localStorage` key `auth_token`. The axios instance in `lib/api.ts` attaches it automatically.

---

## Running Tests

### Laravel (PHPUnit) — run from inside the `app` container or on host if PHP available:
```bash
docker compose exec app php artisan test
# or: cd backend && php artisan test
```
- Uses SQLite in-memory (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:` in phpunit.xml)
- All test classes use `RefreshDatabase`
- Authenticate with `Sanctum::actingAs($user)`
- **85 tests, all passing**

### Frontend (Vitest) — run from `backend/`:
```bash
cd backend && npx vitest run
# watch mode:
cd backend && npx vitest
```
- Environment: jsdom with `@testing-library/react`
- Setup: `backend/resources/js/__tests__/setup.ts` imports `@testing-library/jest-dom`
- **106 tests, all passing**

---

## Test Patterns

### Laravel feature test skeleton
```php
class MyResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/my-resource');
        $response->assertStatus(401);
    }

    public function test_user_cannot_access_others_resource(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $resource = MyResource::factory()->for($owner)->create();

        Sanctum::actingAs($other);
        $response = $this->deleteJson("/api/my-resource/{$resource->id}");
        $response->assertStatus(403);
    }
}
```

### Frontend component test skeleton
```tsx
// Mock modules that would reach outside jsdom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => vi.fn() };
});

// Provide context values explicitly — do not render full Provider trees
function renderMyComponent(ctxOverrides = {}) {
    return render(
        <AuthContext.Provider value={{ user: null, isLoading: false, login: vi.fn(), ...ctxOverrides }}>
            <MemoryRouter><MyComponent /></MemoryRouter>
        </AuthContext.Provider>
    );
}
```
- Use `getByLabelText` for form inputs — labels **must** have `htmlFor` and inputs **must** have `id`.
- Use `getByRole('button', { name: /text/i })` for buttons.
- Use `waitFor` when the assertion follows an async action.

---

## Good Practices

**Comments only when the WHY is non-obvious.** Don't describe what the code does — that's what the code is for. Only comment when there's a hidden constraint, a subtle invariant, or behaviour that would surprise a reader. Never reference the current task, conversation, or callers.

**Tests are mandatory for new features.** Any new controller action gets a Laravel feature test. Any new React component that renders user-visible state gets a Vitest component test. Utility functions get unit tests. Run both suites before marking work done.

**Update this file when you change the architecture.** If you add a model, controller, context, component, or utility — add it to the directory layout section and document its purpose. If you change an API contract — update the API Reference section. If you change test infrastructure — update the Running Tests and Test Patterns sections.

**Authorization on every mutating endpoint.** `update` and `destroy` actions call `$this->authorize()`, which requires the `AuthorizesRequests` trait on the base `Controller`. The relevant Policy checks `$user->id === $model->user_id`.

**All API responses use the same TimeBlock shape.** `store` and `update` return a single block in the same `{id, startTime, endTime, taskID, task}` shape that `index` uses inside its date arrays. Keep them consistent.

**taskID is always a string on the frontend.** The `TimeEntry` interface and `TaskRecord` key both use `string`. The backend casts `task_id` as integer but the controller serialises it as `(string) $b->task_id`.

**Colour validation:** `color` fields must match `^#[0-9a-fA-F]{6}$`. Enforced in both `TaskController` (store + update) and the migration default `'#3b82f6'`.

**Do not break the HMR config.** `vite.config.ts` sets `hmr: { host: 'localhost', port: 5173 }`. Removing it causes the browser to try to connect to `http://0.0.0.0:5173` and hit a CORS error.

**Do not add `use AuthorizesRequests` to individual controllers.** It belongs only on the base `Controller.php`. Laravel 11 ships with an empty base controller — it was added manually and must stay there.

**Laravel 11 has no `api.php` by default.** It was created via `php artisan install:api`. Do not delete it.

---

## Theming & Design Tokens

All visual styling is centralised so the look can be changed by editing one file.

### Aesthetic

Quiet, flat, greyscale "wireframe" look. The chrome is white, one off-black and three greys; the only hue on screen comes from task colours. No shadows or gradients — shapes come from 1px hairline borders and a fixed set of radii. Large 30px titles over a tight cell grid. Uniformity is the priority: use only the tokens and scales below.

### Architecture

- **`backend/resources/js/index.css`** — single source of truth for colour tokens as CSS custom properties (`:root` = light, `.dark` = dark).
- **`backend/tailwind.config.js`** — maps tokens to Tailwind classes (colours, `borderColor.DEFAULT`, `borderRadius`, `boxShadow.cell`). Components never use raw Tailwind colour names.
- **`darkMode: 'class'`** — toggled via the `dark` class on `<html>` (`ToolbarContext.tsx`). No `dark:` classes in components.

### Colour tokens (bare `R G B` channels, so `bg-fg/35` etc. work)

Dark mode swaps `canvas`/`fg` and inverts the greys. Task colours never change.

| CSS var | Tailwind | Light | Dark | Use |
|---------|----------|-------|------|-----|
| `--color-canvas` | `bg-canvas`, `text-canvas` | `#FFFFFF` | `#1A1A1A` | Page, panels, toolbar, inputs, modals; text on `bg-fg` |
| `--color-fg` | `text-fg`, `bg-fg` | `#1A1A1A` | `#FFFFFF` | Titles, primary text, primary/inverted buttons, focus rings |
| `--color-muted` | `text-muted`, `border` (default) | `#A6A6A6` | `#595959` | All borders, secondary text (dates, times, labels) |
| `--color-outline` | `border-outline`, `text-outline` | `#A6A6A6` | `#FFFFFF` | Cell-group borders, group time labels, toolbar labels — full-contrast in dark |
| `--color-cell` | `bg-cell` | `#D9D9D9` | `#262626` | Empty time cell |
| `--color-hover` | `bg-hover` | `#F2F2F2` | `#262626` | Hover fill (list items, buttons) |
| `--color-danger` | `text-danger`, `border-danger` | red | light red | Error messages only |

Plain `border` already uses `muted` (`borderColor.DEFAULT`).

Interaction overlays: drag selection `bg-fg/35`, sidebar-hover link highlight `bg-fg/20`, modal backdrop `bg-black/40`.

### Scales

- **Spacing:** 1, 2, 4, 8, 16, 32px only.
- **Radii:** `rounded-panel` 16px (panels, modals, popovers), `rounded-group` 11px (cell-group border), `rounded-control` 8px (buttons, inputs, list items), `rounded-cell` 8px (outer corners of first/last cell in a group). Group = cell + 3px padding (2px visual gap + the 1px `shadow-group` line drawn inside it) so corners are concentric — keep that relationship if either changes. `rounded-group`/`rounded-cell` are defined as `calc(var(--day-scale, 1) * Npx)` so they scale with the grid. Popovers use 8px padding around 8px items for the same reason.
- **Type:** titles `text-3xl` (1.875rem) with `leading-none`; body `text-sm`; labels/time labels `text-xs text-muted`.
- **Cell border:** `shadow-cell` (inset 1px `muted`). It is a box-shadow, not a border, so task-colour fills (child elements) paint over it and the cell stays 40×40 at scale 1. The group border is `shadow-group` for a different reason too: browsers snap real border-widths to whole pixels, which would break the exact-fill maths below.

### Layout

- `App.tsx`: `main` (flex-1, `p-2`) and a 64px `footer` toolbar (`Toolbar.tsx`), each with an inner `max-w-[1440px] mx-auto` wrapper.
- `RenderDateRange.tsx`: blocks panel (flex-1) and task panel (default 375px; drag the 8px divider between them to resize 240–700px, persisted as localStorage `sidebar_width`), each `border rounded-panel` with internal scrolling.
- Day: weekday + day number (`fg`, number's ordinal suffix in `<sup>`) and month/year (`muted`) on the left at 1.875rem; while a cell is hovered, its day's header shows the hovered time range right-aligned on the same line, at title size (start time `fg`, "– end" `muted`). Groups wrap left (4px column gap, 12px row gap); cells 2px apart. Each group's time label hangs from its bottom border (label top 3px above the line) with a `bg-canvas` backing, notching the line like a fieldset legend — the border wraps only the cells.
- **Grid scaling:** every horizontal px dimension in the grid (cell 40, cell gap 2, group padding 3, group border 1, column gap 4, both grid radii) is written as `calc(var(--day-scale, 1) * Npx)`. The vertical space between group rows does NOT scale (12px flex row-gap + the group's 4px bottom margin = fixed 16px) — it holds the unscaled time label. `RenderDateRange` sets `--day-scale` AND `--day-row-base` (unscaled row width: n groups + gaps) on the days wrapper from a ResizeObserver via `computeDayLayout(width, groupWidth, gap, minScale, maxGroups)` (utils): fit as many groups as possible at min scale, then scale that row up to fill the container exactly. The min scale is the toolbar zoom (ToolbarContext `zoom`, default 1, steps of 0.25 within 0.5–3). Shrinking the container shrinks the scale to the min, then the row wraps one fewer group and scales back up. Time labels and day headings do NOT scale. The base-px constants live at the top of `RenderDateRange.tsx` and MUST match the component classes. Three anti-flicker invariants: each `.cell-container`'s width comes from `--day-row-base` (+1px float slack), never from the parent, so a mid-resize frame can't re-wrap the row; the solve uses width-1px of slack; and width is measured with getBoundingClientRect/contentBoxSize because integer-rounded `clientWidth` overshoots fractional widths (browser zoom) and wraps the last group.
- Toolbar: tools on the left, actions (theme, "+ New task" placeholder, account menu with log out) on the right. Shared dropdown behaviour lives in `Popover.tsx`.

## Pending Work

- **Erase tool**: The toggle exists in the toolbar but `handleMouseUp` does not DELETE time blocks when erase mode is active.
- **Task management in sidebar**: `TaskList.tsx` is read-only. Edit/delete task actions have not been implemented.
- **Seeders**: No seeders exist yet. A `DatabaseSeeder` skeleton is at `backend/database/seeders/DatabaseSeeder.php`.
