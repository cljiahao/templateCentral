---
name: scaffold
description: Use when the user wants a lightweight React SPA without SSR, or needs a Vite + React + TypeScript starter with React Router and TanStack Query.
---

# Scaffold Vite + React Project

Scaffold a new Vite + React SPA from the templateCentral Vite React template.

## Inputs

- **Project name** — The name for the new project (e.g., `my-app`). If not provided, ask the user.
- **Target directory** — Where to create the project (e.g., `~/projects/my-app`). If not provided, default to `./<project-name>` and confirm with the user.

## Steps

### 1. Copy the Template

```bash
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.env' <repo-root>/templates/vite-react/ <target-directory>/
```

### 2. Update Project Name

In `package.json`, replace the `"name"` field with the new project name (lowercase, kebab-case):

```json
{
  "name": "my-app",
  ...
}
```

### 3. Update HTML Title

In `index.html`, update the `<title>` tag:

```html
<title>My App</title>
```

### 4. Update Branding

In `src/components/layout/navbar.tsx`:
- Replace `templateCentral` with the project name
- Keep `NAV_LINKS` defaults unless the user specifies custom navigation. If unclear, ask the user

In `src/components/layout/site-footer.tsx`:
- Update the `creditText` default

### 5. Update Routes

In `src/lib/constants/routes.ts`:
- Keep `PAGE_ROUTES` and `API_ROUTES` defaults unless the user specifies custom routes. If unclear, ask the user

In `src/router.tsx`:
- Keep the example `<Routes>` unless the user specifies custom pages

### 6. Update Theme Colors (Optional)

In `src/styles/globals.css`, update the CSS custom properties under `:root`:
- `--primary` / `--primary-hover` — Main action color
- `--secondary` / `--secondary-hover` — Secondary color
- `--accent` / `--accent-hover` — Accent color

### 7. Set Up Environment

```bash
cp .env.example .env
```

### 8. Install Dependencies

```bash
cd <target-directory>
pnpm install
```

**Checkpoint**: Verify installation completed without errors. If dependency conflicts occur, resolve them before proceeding.

### 9. Verify

```bash
pnpm dev
```

Confirm the dev server starts at `http://localhost:3000`. **Do not proceed until the home page renders successfully.** If the dev server fails, check the terminal output for errors and fix before continuing.

Optionally run tests to verify the template is healthy:

```bash
pnpm test
```

### 10. Generate Project AGENTS.md (MANDATORY)

**This step is NOT optional. Do NOT skip it. Scaffolding is incomplete without a project AGENTS.md.**

Create `AGENTS.md` in the project root. This gives any AI agent (Cursor, Codex, Copilot, Windsurf, etc.) permanent context about this specific project.

```markdown
# <Project Name>

## Identity
- **Stack**: Vite 8, React 19, TypeScript, shadcn/ui, Tailwind CSS 4, React Router 7, TanStack React Query 5, React Hook Form + Zod, AuthProvider
- **Scaffolded from**: templateCentral/templates/vite-react
- **Created**: <date>
- **Type**: Client-side SPA (no SSR, no API route handlers)

## Architecture Decisions
- Routes defined in `src/router.tsx`, not by filesystem convention
- Auth via `AuthProvider` context + `ProtectedRoute` guard; dev bypass when `ENV.IS_DEV`
- Feature modules under `src/features/<name>/`
- Barrel exports (`index.ts`) for all shared folders
- shadcn/ui primitives in `src/components/ui/` (managed by CLI, `components.json` with `rsc: false`)
- Reusable composed widgets in `src/components/widgets/`
- Env vars via `import.meta.env.VITE_*`, centralized in `src/lib/constants/env.ts`

## Key Conventions
- Named exports only — no exceptions
- `function` declarations for components; `const` arrows for hooks/utilities
- kebab-case filenames, PascalCase exports
- Static data in `constants.ts`, never inline in components
- Pages are thin — compose from `features/` and `components/`

## Project-Specific Notes
<!-- Add decisions, custom patterns, and context as the project evolves -->
```

Update the Identity section with the actual project name and creation date. Add any user-specified customizations under "Project-Specific Notes".

### 11. Task Management (Optional)

Ask the user: *"Do you want structured task management for complex features?"*

If yes, append this section to the project's `AGENTS.md`:

```markdown
## Task Management

For complex, multi-step tasks (3+ files, architectural decisions), follow the task management protocol at `claude-skills/shared/task-management/SKILL.md` in templateCentral.

Protocol summary: Plan → Verify → Track → Explain → Document → Capture Lessons.

Skip for simple changes (single-file edits, scaffolding, quick fixes).
```

## Template Details

| Feature | Value |
|---------|-------|
| Build | Vite 8 |
| UI | React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4, tw-animate-css |
| UI | shadcn/ui (new-york), Radix UI, Lucide icons |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Routing | React Router 7 |
| State | TanStack React Query 5 |
| Auth | AuthProvider context with dev bypass |
| Toasts | Sonner |
| Testing | Vitest, Testing Library |
| Linting | ESLint 9, Prettier (organize-imports + tailwind) |
| Docker | Multi-stage (Vite build → Nginx) |

## Files to Customize

| File | What to Change |
|------|----------------|
| `package.json` | `name`, `version`, add dependencies |
| `index.html` | `<title>`, favicon |
| `src/styles/globals.css` | Theme colors (CSS custom properties) |
| `src/router.tsx` | Add/remove routes |
| `src/components/layout/navbar.tsx` | Brand text, navigation links |
| `src/components/layout/site-footer.tsx` | Credit text |
| `src/lib/constants/routes.ts` | Page and API route definitions |
| `components.json` | shadcn/ui style and color preferences |
| `.env.example` / `.env` | Environment variables |

## Architecture Patterns

- **Feature modules**: `src/features/<name>/` for self-contained domain areas
- **Thin pages**: `src/pages/` composes from features, handles no business logic
- **Barrel exports**: `index.ts` files for clean imports (`@/lib/utils`, `@/lib/errors`, `@/features/example`)
- **Layout composition**: `RootLayout` wraps `Navbar` + `<Outlet>` + `SiteFooter`
- **Lib structure**: `utils/`, `constants/`, `errors/` under `src/lib/`
- **Widgets**: Reusable composed components in `src/components/widgets/`
- **UI primitives**: shadcn/ui components in `src/components/ui/` (managed via `npx shadcn@latest add`, `components.json` with `rsc: false`)

## Rules

- Always update `package.json` name before installing dependencies
- Always copy `.env.example` to `.env` before first run
- Always update `index.html` title — it's the browser tab name (NEVER skip)
- Routes are defined in `src/router.tsx`, not by filesystem convention
- Verify the dev server starts and the home page renders before handing off to the user
- Remove example code only after the user confirms the project runs
- NEVER copy `node_modules/` or `dist/` when scaffolding
- NEVER scaffold into a non-empty directory without confirming with the user
- NEVER consider scaffolding complete without a project `AGENTS.md` — verify it exists before handing off to the user
- NEVER add server-side code (RSC, API route handlers, SSR) — this is a client-only SPA
- NEVER use `process.env` — use `import.meta.env.VITE_*` for environment variables
