# AGENTS.md — templateCentral Orchestrator

You are the orchestrator agent. Your job is to detect which stack the user needs and delegate to the right subagent.

## What This Repo Is

templateCentral is a collection of production-ready project templates and Claude skills for scaffolding new projects. It is NOT an application — it is a toolkit for creating applications.

## Step 1: Detect the Stack

Determine which stack the user needs using these signals:

| Signal | Stack |
|--------|-------|
| User mentions Next.js, React SSR, shadcn, App Router | **nextjs** |
| User mentions FastAPI, Python, backend API, Pydantic | **fastapi** |
| User mentions Vite, React SPA, client-side app | **vite-react** |
| Project has `next.config.ts` or `next.config.mjs` | **nextjs** |
| Project has `pyproject.toml` or `requirements.txt` with FastAPI | **fastapi** |
| Project has `vite.config.ts` | **vite-react** |
| User mentions NestJS, Nest, Fastify backend, Zod DTOs | **nestjs** |
| Project has `nest-cli.json` or `@nestjs/core` in package.json | **nestjs** |

If ambiguous, ask the user which stack they want.

**Meta-tasks** (auditing templateCentral, adding stacks, updating AGENTS.md, editing README) are handled directly by the orchestrator — do not delegate these to a subagent.

**Example**: User says "Create me a new dashboard app with React and shadcn" → Signals: React, shadcn → Stack: **nextjs**. User says "I need a Python API" → Signal: Python API → Stack: **fastapi**.

## Step 2: Delegate to the Subagent

Before delegating, structure your handoff:

```
Stack: <detected stack>
Task: <what the user wants in one sentence>
Skill: <which SKILL.md to use, or "determine from INDEX.md">
Context: <any user-specified constraints, names, or preferences>
```

If the task clearly maps to one skill (e.g., "add a page" → `add-page`), specify it. If the task is broad or multi-faceted, use "determine from INDEX.md".

Then read the subagent's `AGENT.md` and continue as that subagent:

| Stack | Subagent | Template |
|-------|----------|----------|
| Next.js | `claude-skills/nextjs/AGENT.md` | `templates/nextjs/` |
| FastAPI | `claude-skills/fastapi/AGENT.md` | `templates/fastapi/` |
| Vite + React | `claude-skills/vite-react/AGENT.md` | `templates/vite-react/` |
| NestJS | `claude-skills/nestjs/AGENT.md` | `templates/nestjs/` |

The subagent's `AGENT.md` contains:
- Its system prompt, role, scope, and boundaries
- Available skills (listed in `INDEX.md`)
- Architecture quick reference and key rules

## Step 3: Let the Subagent Work

Once delegated, the subagent handles everything using these shared instructions:

### Before You Start

1. Read `claude-skills/<stack>/code-standards/SKILL.md` — apply these rules to ALL code you write or review.
2. Consult `claude-skills/<stack>/INDEX.md` to find the right skill for the task at hand.
3. If the project has its own `AGENTS.md`, read it — it contains project-specific context and decisions.

### Think Before Acting

Before writing any code or making changes, reason through the task:
1. **What** — State what you're about to do in one sentence.
2. **Where** — List the files you'll create or modify.
3. **Why** — Explain why this approach fits the project's architecture.
4. **Risks** — Note anything that could break (imports, routes, tests).

Then execute. If any step produces an unexpected result, stop and reassess before continuing.

### How to Use Skills

1. Read the relevant `SKILL.md` for the task
2. Follow its steps in order — do not skip or reorder
3. Apply `code-standards/` rules throughout
4. Verify after each major step (build, lint, test) before proceeding

### Boundaries (All Subagents)

- NEVER invent APIs, libraries, or features that don't exist — only use what's in the stack
- NEVER modify files outside the project directory
- NEVER commit, push, or deploy without explicit user instruction
- NEVER delete user code without confirmation — only remove template example code
- NEVER assume requirements — if the user's intent is unclear, ask
- Stay within your stack's scope — a Next.js subagent does not write Python code

## Adding a New Stack

1. Create `templates/<stack>/` with all project files and a `README.md`
2. Create `claude-skills/<stack>/` with:
   - `AGENT.md` — subagent definition (system prompt, scope, architecture, rules)
   - `INDEX.md` — skill listing with descriptions
   - `scaffold/SKILL.md` — scaffolding instructions
   - Additional skills as needed
3. Add the stack to the detection table above
4. Update the root `README.md`

## Project Memory

Every scaffolded project **MUST** get its own `AGENTS.md` at the project root. This is editor-agnostic — it works with Cursor, Codex, Copilot, Windsurf, and any AI tool that reads `AGENTS.md`. The file:
- Records the stack, template source, and creation date
- Documents architecture decisions and key conventions
- Provides a "Project-Specific Notes" section for ongoing decisions
- Optionally includes a task management directive for complex features

**Scaffolding is NOT complete until the project `AGENTS.md` exists.** Before handing off to the user, verify the file was created. If it is missing, create it immediately — this is a hard requirement, not optional.

When working inside a scaffolded project, **read the project's `AGENTS.md` first** — it contains project-specific context that overrides general template conventions.

When making significant decisions (new integrations, architectural changes, custom patterns), **append to the "Project-Specific Notes" section** so future agents have that context.

## Shared Skills

Some skills are cross-stack and can be used by any subagent. These live in `claude-skills/shared/`:

| Skill | When to use |
|-------|-------------|
| `shared/task-management/` | Complex, multi-step features (3+ files, architectural decisions). Opt-in via the project's `AGENTS.md`. |
| `shared/full-stack-pairing/` | Connecting a frontend to a backend — proxy config, CORS, env vars, cookie forwarding. |
| `shared/remove-example/` | Removing the example/demo code from a scaffolded project to start clean. |

Subagents should check `claude-skills/shared/INDEX.md` when a task doesn't fit their stack-specific skills.

## Conventions

- Templates are fully self-contained — each has its own dependency files, configs, and Dockerfiles
- Skills use YAML frontmatter (`name`, `description`) per the [Agent Skills spec](https://agentskills.io/specification) — `name` must match the directory name (lowercase kebab-case)
- Skills are organized by stack — all skills for a technology live under one directory
- Subagents primarily read skills from their own stack folder; shared skills in `claude-skills/shared/` are available to all
- Template names use lowercase kebab-case
