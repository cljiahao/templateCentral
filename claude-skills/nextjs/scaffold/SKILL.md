---
name: scaffold
description: Use when the user wants to start a new frontend project, create a new Next.js app, or scaffold a React dashboard with shadcn/ui and Docker support.
---

# Scaffold Next.js Project

Scaffold a new Next.js project from the templateCentral Next.js template.

## Inputs

- **Project name** — The name for the new project (e.g., `my-dashboard`). If not provided, ask the user.
- **Target directory** — Where to create the project (e.g., `~/projects/my-dashboard`). If not provided, default to `./<project-name>` and confirm with the user.

## Steps

### 1. Copy the Template

Copy the entire `templates/nextjs/` directory from this repository to the target directory. Do NOT copy `node_modules/` or `.next/`.

```bash
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.env' <repo-root>/templates/nextjs/ <target-directory>/
```

### 2. Update Project Name

In `package.json`, replace the `"name"` field value with the new project name (lowercase, kebab-case).

### 3. Update Metadata

In `src/app/layout.tsx`, update the `metadata` export:
- Set `title` to the project name (title-cased)
- Set `description` to a relevant description

### 4. Update Branding

In `src/components/layout/navbar.tsx`:
- Replace the brand text (`templateCentral`) with the project name
- Keep `defaultNavLinks` defaults unless the user specifies custom navigation. If unclear, ask the user

In `src/components/layout/site-footer.tsx`:
- Update the `creditText` default

### 5. Update Routes

In `src/lib/constants/routes.ts`:
- Keep `PAGE_ROUTES` and `API_ROUTES` defaults unless the user specifies custom routes. If unclear, ask the user

### 6. Update Theme Colors (Optional)

In `src/app/globals.css`, the template uses a neutral palette. Update the CSS custom properties:
- `--primary` and `--primary-hover` — Main action color
- `--secondary` and `--secondary-hover` — Secondary action color
- `--accent` and `--accent-hover` — Accent/highlight color

### 7. Copy `.env.example` to `.env.local`

```bash
cp .env.example .env.local
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

Confirm the dev server starts at `http://localhost:3000`. **Do not proceed until the landing page renders successfully.** If the dev server fails, check the terminal output for errors and fix before continuing.

Then run the test suite:

```bash
pnpm test
```

Confirm all tests pass (there may be zero tests initially — that is expected).

### 10. Generate Project AGENTS.md (MANDATORY)

**This step is NOT optional. Do NOT skip it. Scaffolding is incomplete without a project AGENTS.md.**

Create `AGENTS.md` in the project root. This gives any AI agent (Cursor, Codex, Copilot, Windsurf, etc.) permanent context about this specific project.

```markdown
# <Project Name>

## Identity
- **Stack**: Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS 4, TanStack React Query, NextAuth
- **Scaffolded from**: templateCentral/templates/nextjs
- **Created**: <date>

## Architecture Decisions
- Auth via NextAuth (Auth.js) with `proxy.ts` route protection (Next.js 16 proxy, replaces middleware); dev bypass when `isDev`
- Providers (SessionProvider, QueryClientProvider) in root `layout.tsx` — shared across all route groups
- Route groups: `(public)/` for public pages, `dashboard/` for authenticated — each has its own Navbar + Footer shell
- Feature modules under `src/features/<name>/`
- Barrel exports (`index.ts`) for all shared folders
- shadcn/ui primitives in `src/components/ui/` (managed by CLI)
- Reusable composed widgets in `src/components/widgets/`

## Key Conventions
- Named exports only (except Next.js special files: pages, layouts, route handlers)
- `function` declarations for components; `const` arrows for hooks/utilities
- kebab-case filenames, PascalCase exports
- Static data in `constants.ts`, never inline in components
- Pages are thin — compose from `features/` and `components/`

## Project-Specific Notes
<!-- Add decisions, custom patterns, and context as the project evolves -->
```

Update the Identity section with the actual project name and creation date. Add any user-specified customizations (custom routes, theme colors, navigation) under "Project-Specific Notes".

### 11. Task Management (Optional)

Ask the user: *"Do you want structured task management for complex features? (Recommended for projects with multiple contributors or long-lived features.)"*

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
| Framework | Next.js 16 with Turbopack |
| UI | shadcn/ui (new-york), Tailwind CSS 4, Radix UI |
| Language | TypeScript 5.9 |
| State | React 19 RSC, TanStack React Query |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Theme | next-themes (dark/light) |
| Toasts | Sonner |
| Auth | NextAuth (Auth.js) with dev bypass |
| HTTP | Axios |
| Docker | Multi-stage (dev + prod standalone) |
| Testing | Vitest (API route tests only) |
| Linting | ESLint 9, Prettier (organize-imports + tailwind) |

## Files to Customize

| File | What to Change |
|------|----------------|
| `package.json` | `name`, `version`, add dependencies |
| `src/app/layout.tsx` | `metadata.title`, `metadata.description`, fonts |
| `src/app/(public)/page.tsx` | Landing page content |
| `src/app/globals.css` | Theme colors (CSS custom properties) |
| `src/components/layout/navbar.tsx` | Brand text, navigation links |
| `src/components/layout/site-footer.tsx` | Credit text, footer links |
| `src/lib/constants/routes.ts` | Page and API route definitions |
| `components.json` | shadcn/ui style and color preferences |
| `src/auth.ts` | Auth providers (add SSO providers here) |
| `src/proxy.ts` | Public paths, redirect rules |
| `Dockerfile` | Port, Node version, timezone |
| `.env.example` / `.env.local` | Environment variables |

## Architecture Patterns

This template follows these conventions:

- **Route groups**: `(public)` for public pages, `dashboard` for authenticated
- **Feature folders**: Add `src/features/<name>/` for domain-specific components
- **Barrel exports**: `index.ts` files for clean imports (`@/lib/utils`, `@/features/example`, `@/components/layout`)
- **Layout composition**: Providers (SessionProvider + QueryClient) in root layout; each route group has its own layout with Navbar + Footer
- **Lib structure**: `utils/`, `constants/`, `errors/` under `src/lib/`
- **Widgets**: Reusable composed components in `src/components/widgets/`

## Rules

- Always update `package.json` name before installing dependencies — affects Docker image names and lockfiles
- Always copy `.env.example` to `.env.local` before first run
- Keep the `(public)` and `dashboard` route group structure
- Verify the dev server starts and the landing page renders before handing off to the user
- Remove example code only after the user confirms the project runs
- NEVER copy `node_modules/`, `.next/`, or `.env.local` — these are project-specific
- NEVER scaffold into a non-empty directory without confirming with the user
- NEVER consider scaffolding complete without a project `AGENTS.md` — verify it exists before handing off to the user
