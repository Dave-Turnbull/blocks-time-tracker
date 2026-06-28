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
│   │   │       ├── TaskController.php      ← CRUD for tasks (scoped to authed user)
│   │   │       └── TimeBlockController.php ← CRUD + date-range index with grouped response
│   │   ├── Models/
│   │   │   ├── User.php        ← HasApiTokens (Sanctum), hasMany Task + TimeBlock
│   │   │   ├── Task.php        ← belongsTo User, hasMany TimeBlock; fillable: user_id, name, description, color
│   │   │   └── TimeBlock.php   ← belongsTo Task + User; fillable: task_id, user_id, date, start_time, end_time
│   │   └── Policies/
│   │       ├── TaskPolicy.php       ← update/delete: user_id must match
│   │       └── TimeBlockPolicy.php  ← update/delete: user_id must match
│   ├── database/
│   │   ├── factories/
│   │   │   ├── TaskFactory.php       ← generates random name/description/color (#rrggbb hex)
│   │   │   └── TimeBlockFactory.php  ← has forUser(User) state that creates consistent task+user_id
│   │   └── migrations/
│   │       ├── 2026_06_28_200000_create_tasks_table.php
│   │       └── 2026_06_28_200001_create_time_blocks_table.php
│   ├── routes/
│   │   ├── api.php  ← All JSON API routes (prefixed /api automatically)
│   │   └── web.php  ← Single catch-all: returns app.blade.php for SPA routing
│   ├── resources/
│   │   ├── views/app.blade.php       ← Root HTML; @viteReactRefresh + @vite(['resources/js/main.tsx'])
│   │   └── js/                       ← All React/TypeScript source
│   │       ├── main.tsx              ← Entry point; BrowserRouter, AuthProvider, route guards
│   │       ├── App.tsx               ← Root component; ToolbarProvider → SelectedCellsProvider → RenderDateRange + Toolbar
│   │       ├── lib/api.ts            ← Axios instance (baseURL /api); attaches Bearer token; redirects /login on 401
│   │       ├── contexts/
│   │       │   ├── AuthContext.tsx         ← User state; login/register/logout; fetches /api/auth/user on mount
│   │       │   ├── ToolbarContext.tsx      ← Global toolbar state + fetches /api/tasks on mount
│   │       │   └── SelectCellsContext.tsx  ← Mouse drag state; fetches /api/time-blocks per date range; exposes refreshTimeBlocks, pendingSelection, submitTimeBlock, clearPendingSelection
│   │       ├── pages/
│   │       │   ├── Login.tsx     ← Guest-only; calls AuthContext.login
│   │       │   └── Register.tsx  ← Guest-only; calls AuthContext.register
│   │       ├── components/
│   │       │   ├── Toolbar.tsx             ← Controls: date range, cell size, theme toggle, logout
│   │       │   ├── RenderDateRange.tsx     ← Iterates startDate→endDate, renders SingleDay per day
│   │       │   ├── SingleDay.tsx           ← Renders one column of Cell components for a date
│   │       │   ├── TaskList.tsx            ← Sidebar task list (uses tasks from ToolbarContext)
│   │       │   ├── TaskPickerModal.tsx     ← Modal after drag-select; pick task or create new; POSTs time block
│   │       │   └── Cell/
│   │       │       ├── Cell.tsx                          ← Single time cell; renders task overlay if occupied
│   │       │       └── components/SelectedCellOverlay.tsx ← Fixed blue highlight shown during mouse drag
│   │       ├── utils/
│   │       │   ├── timesToCells.tsx  ← Converts TimeEntry[] to CellObject[] (one per cell-slot in the day)
│   │       │   ├── utils.ts          ← readableDate(dateString), readableTime(minutes)
│   │       │   └── updateData.ts     ← (legacy helper, not currently used by API-backed flow)
│   │       └── __tests__/
│   │           ├── setup.ts                               ← imports @testing-library/jest-dom
│   │           ├── utils/timesToCells.test.ts             ← 15 tests for timesToCells
│   │           ├── utils/utils.test.ts                    ← 16 tests for readableTime + readableDate
│   │           ├── pages/Login.test.tsx                   ← 7 component tests (mocks AuthContext + react-router)
│   │           ├── pages/Register.test.tsx                ← 7 component tests
│   │           └── components/TaskPickerModal.test.tsx    ← 10 component tests
│   ├── tests/Feature/Api/
│   │   ├── AuthTest.php       ← 14 tests: register, login, logout, /auth/user
│   │   ├── TaskTest.php       ← 16 tests: CRUD + 401/403 isolation
│   │   └── TimeBlockTest.php  ← 22 tests: CRUD + date range + grouped response shape
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
| `db` | mysql:8.0 | 3306 | MySQL; health-checked before `app` starts |
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
| POST | `/api/time-blocks` | `{task_id, date, start_time, end_time}` — times in minutes from midnight (0–1440) |
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
3. **Time block loading** (`SelectCellsContext`): `fetchTimeBlocks` runs whenever `startDate`, `endDate`, or `minuteinput` changes → GET `/api/time-blocks?start=&end=` → builds `cellsData` (CellObject[][]) and `currentTimeData` (TimeEntry[][]) for every date in range, including empty days.
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
- **52 tests, all passing**

### Frontend (Vitest) — run from `backend/`:
```bash
cd backend && npx vitest run
# watch mode:
cd backend && npx vitest
```
- Environment: jsdom with `@testing-library/react`
- Setup: `backend/resources/js/__tests__/setup.ts` imports `@testing-library/jest-dom`
- **55 tests, all passing**

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

### Architecture

- **`backend/resources/js/index.css`** — single source of truth for all design tokens as CSS custom properties. Edit `:root` for the light theme and `.dark` for dark.
- **`backend/tailwind.config.js`** — maps CSS variables to Tailwind utility classes via `theme.extend.colors`, `fontFamily`, and `boxShadow`. No raw Tailwind colour names (e.g. `slate-700`) appear in components; they all use semantic tokens.
- **`darkMode: 'class'`** — dark mode is toggled by adding/removing the `dark` class on `<html>` (see `ToolbarContext.tsx`). No `dark:` prefixed classes exist in components; both themes are handled entirely by the CSS variables.

### Token categories

**Solid colours** — stored as bare `R G B` channels in CSS vars so Tailwind's opacity modifier syntax (e.g. `bg-surface/50`) works:

| CSS var | Tailwind class | Purpose |
|---------|----------------|---------|
| `--color-page` | `bg-page` | Outer app background |
| `--color-surface` | `bg-surface` | Panels, toolbar, cards, modals |
| `--color-surface-input` | `bg-surface-input` | Form inputs |
| `--color-surface-btn` | `bg-surface-btn` | Default button background |
| `--color-surface-btn-hover` | `hover:bg-surface-btn-hover` | Default button hover |
| `--color-surface-hover` | `bg-surface-hover` | List-item hover state |
| `--color-fg` | `text-fg` | Primary text |
| `--color-fg-secondary` | `text-fg-secondary` | Secondary text, labels |
| `--color-fg-muted` | `text-fg-muted` | Supporting text |
| `--color-fg-subtle` | `text-fg-subtle` | Hints, empty-state copy |
| `--color-line` | `border-line` | Default borders |
| `--color-line-strong` | `border-line-strong` | Input / button borders |
| `--color-accent` | `bg-accent` | Primary action buttons |
| `--color-accent-hover` | `hover:bg-accent-hover` | Primary button hover |
| `--color-accent-fg` | `text-accent-fg` | Text on accent backgrounds |
| `--color-accent-text` | `text-accent-text` | Link / accent-coloured text |
| `--color-accent-line` | `border-accent-line` | Borders on accent-tinted items |
| `--color-ring` | `ring-ring` | Focus rings |
| `--color-danger-fg` | `text-danger-fg` | Text on danger backgrounds |
| `--color-danger-line` | `border-danger-line` | Danger/erase button border |
| `--color-danger-note` | `text-danger-note` | Error message text |
| `--color-cell` | `bg-cell` | Empty time-grid cells |
| `--color-task-group` | `border-task-group` | Task-group grouping border |

**Full-value tokens (opacity baked in)** — Tailwind can't wrap these in its `rgb()` system, so components consume them as `bg-[var(--color-...)]` arbitrary values:

| CSS var | Used for |
|---------|---------|
| `--color-danger-bg` | Erase-tool button background |
| `--color-danger-bg-hover` | Erase-tool button hover |
| `--color-danger-subtle` | Error-message background (Login/Register) |
| `--color-surface-active` | Selected/hovered list-item background |
| `--color-cell-label` | Time-group label text (opacity on black/white) |

**Unchanged Tailwind utilities** (functional, same in both themes, not part of the token system):
- `bg-black/50` — modal backdrop
- `bg-blue-500/60` — drag-selection overlay on cells
- `bg-yellow-300/50` — sidebar-hover overlay on cells

### Typography & shadows

- `--font-sans` — override to change the typeface (e.g. set to `'Inter'` after importing from Google Fonts).
- `--shadow-panel` — used via `shadow-panel` Tailwind class on modals and dropdowns.

### Adding a new theme

1. Add a new class selector (e.g. `.theme-forest`) in `index.css` alongside `.dark`.
2. Override any CSS vars you want to change.
3. Apply the selector to `<html>` instead of / in addition to `dark` (update `ToolbarContext.tsx`).

---

## Pending Work

- **Erase tool**: The toggle exists in the toolbar but `handleMouseUp` does not DELETE time blocks when erase mode is active.
- **Task management in sidebar**: `TaskList.tsx` is read-only. Edit/delete task actions have not been implemented.
- **Seeders**: No seeders exist yet. A `DatabaseSeeder` skeleton is at `backend/database/seeders/DatabaseSeeder.php`.
