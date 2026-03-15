---
name: scaffold
description: Use when the user wants to start a new NestJS backend project, create a new API, or scaffold a project with modular architecture and Docker support.
---

# Scaffold NestJS Project

Scaffold a new NestJS backend project from the templateCentral NestJS template.

## Inputs

- **Project name** — The name for the new project (e.g., `my-api`). If not provided, ask the user.
- **Target directory** — Where to create the project (e.g., `~/projects/my-api`). If not provided, default to `./<project-name>` and confirm with the user.

## Steps

### 1. Copy the Template

Copy the entire `templates/nestjs/` directory from this repository to the target directory. Exclude `node_modules/`, `dist/`, and `.env`.

```bash
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.env' <repo-root>/templates/nestjs/ <target-directory>/
```

### 2. Update Project Settings

In `package.json`, update:
- `name` — Set to the project name

In `src/config/env.config.ts`, update the defaults:

```typescript
export const appConfig = {
  PROJECT_NAME: process.env.PROJECT_NAME || 'My Project',
  PROJECT_DESCRIPTION:
    process.env.PROJECT_DESCRIPTION || 'API built with [NestJS](https://nestjs.com/) + Fastify',
  // ...
};
```

In `.env.example`, update:

```env
PROJECT_NAME=my-api
PORT=3000
```

### 3. Create Environment File

```bash
cp .env.example .env
```

### 4. Install Dependencies

```bash
pnpm install
```

**Checkpoint**: Verify installation completed without errors. If dependency conflicts occur, resolve them before proceeding.

### 5. Verify

```bash
pnpm start:dev
```

Confirm the API starts at `http://localhost:3000` and Swagger docs are available at `http://localhost:3000/docs`. **Do not proceed until the API responds.**

Run tests:

```bash
pnpm test
pnpm test:e2e
```

**Checkpoint**: All tests must pass. If any fail, fix before proceeding.

### 6. Generate Project AGENTS.md (MANDATORY)

**This step is NOT optional. Do NOT skip it. Scaffolding is incomplete without a project AGENTS.md.**

Create `AGENTS.md` in the project root. This gives any AI agent (Cursor, Codex, Copilot, Windsurf, etc.) permanent context about this specific project.

```markdown
# <Project Name>

## Identity
- **Stack**: NestJS 11, Fastify, Zod + nestjs-zod, Swagger, TypeScript, Jest
- **Scaffolded from**: templateCentral/templates/nestjs
- **Created**: <date>

## Architecture Decisions
- One module per feature under `src/modules/`
- Controller → Service → Repository dependency flow
- DTOs use `createZodDto` from `nestjs-zod` (no class-validator)
- Global providers (pipes, filters, guards) in `app.module.ts`
- Setup functions (Swagger, security) in `src/config/setups/`

## Key Conventions
- kebab-case filenames (dot-separated), PascalCase classes, camelCase methods
- Named exports only — no `export default`
- Swagger `@ApiTags()` + `@ApiOperation()` on every endpoint
- Barrel exports at `src/modules/index.ts`

## Project-Specific Notes
<!-- Add decisions, custom patterns, and context as the project evolves -->
```

Update the Identity section with the actual project name and creation date.

### 7. Task Management (Optional)

Ask the user: *"Do you want structured task management for complex features?"*

If yes, append this section to the project's `AGENTS.md`:

```markdown
## Task Management

For complex, multi-step tasks (3+ files, architectural decisions), follow the task management protocol at `claude-skills/shared/task-management/SKILL.md` in templateCentral.

Protocol summary: Plan → Verify → Track → Explain → Document → Capture Lessons.

Skip for simple changes (single-file edits, scaffolding, quick fixes).
```

### 8. Remove Example Code (Optional)

Once the project is verified, remove the example module:
- Delete `src/modules/example/` directory
- Remove `ExampleModule` import and reference from `src/modules/index.ts`
- Remove `ExampleModule` from the `imports` array in `src/app.module.ts`
- Delete `test/modules/example.controller.spec.ts`

## Architecture

See `AGENT.md` for the full architecture diagram and dependency flow rules.

## Template Details

| Feature | Value |
|---------|-------|
| Framework | NestJS 11 |
| HTTP Adapter | Fastify |
| Validation | Zod + nestjs-zod |
| API Docs | Swagger (available at `/docs`) |
| Security | Helmet, CORS |
| Testing | Jest |
| Linting | ESLint 9 flat config, Prettier |
| Docker | Multi-stage build (dev / stage / prod) |

## Files to Customize

| File | What to Change |
|------|----------------|
| `src/config/env.config.ts` | Add typed env variables |
| `.env.example` | Add environment variable defaults |
| `src/app.module.ts` | Register new modules, add global providers |
| `src/modules/index.ts` | Export new modules |
| `src/common/constants/` | Add shared constants |
| `src/database/` | Add database connection (Prisma, TypeORM, MongoDB) |

## Rules

- Always update `package.json` name before installing dependencies
- Always copy `.env.example` to `.env` before first run
- One module per feature — keep modules self-contained under `src/modules/`
- Global providers (pipes, filters, guards) go in `app.module.ts`, not in individual modules
- Verify the API starts and Swagger docs at `/docs` render before handing off to the user
- Remove example code only after the user confirms the project runs
- NEVER copy `node_modules/`, `dist/`, or `.env` when scaffolding
- NEVER scaffold into a non-empty directory without confirming with the user
- NEVER consider scaffolding complete without a project `AGENTS.md` — verify it exists before handing off to the user
- NEVER remove the `base/` module — it provides the health check endpoint
- NEVER install packages globally — always use pnpm/npm within the project
- NEVER remove `test/` directory structure when cleaning up example code
