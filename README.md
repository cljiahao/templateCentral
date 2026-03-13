# templateCentral

A repository of production-ready project templates and Claude skills for scaffolding new projects using AI agents and subagents.

## Repository Structure

```
templateCentral/
├── AGENTS.md                       # Agent orchestration guide
├── README.md
├── claude-skills/                  # Claude skills (organized by stack)
│   ├── nextjs/                     # All Next.js skills
│   │   ├── scaffold/               #   Scaffold a new project
│   │   ├── code-standards/         #   Coding standards & conventions
│   │   ├── add-feature/            #   Add a feature module
│   │   ├── add-page/               #   Add a page/route
│   │   ├── add-api-route/          #   Add an API route handler
│   │   ├── add-component/          #   Add a component
│   │   ├── add-integration/        #   Add a third-party integration
│   │   └── add-test/               #   Add API route tests (Vitest)
│   ├── fastapi/                    # All FastAPI skills
│   │   ├── scaffold/               #   Scaffold a new project
│   │   ├── code-standards/         #   Python/FastAPI coding standards
│   │   ├── add-endpoint/           #   Add a FastAPI endpoint
│   │   └── add-test/               #   Add pytest tests
│   ├── vite-react/                 # All Vite + React skills
│   │   ├── scaffold/               #   Scaffold a new project
│   │   ├── code-standards/         #   Coding standards & conventions
│   │   ├── add-feature/            #   Add a feature module
│   │   ├── add-page/               #   Add a page/route
│   │   ├── add-component/          #   Add a component
│   │   └── add-integration/        #   Add an external API integration
│   ├── nestjs/                     # All NestJS skills
│   │   ├── scaffold/               #   Scaffold a new project
│   │   ├── code-standards/         #   Coding standards & conventions
│   │   ├── add-module/             #   Add a feature module with CRUD
│   │   └── add-test/               #   Add unit/e2e tests
│   └── shared/                     # Cross-stack skills
│       └── task-management/        #   Opt-in structured task management
└── templates/                      # Project templates
    ├── nextjs/                     # Next.js 16 + React 19 + shadcn/ui + Tailwind
    ├── fastapi/                    # FastAPI + layered architecture + Pydantic v2
    ├── vite-react/                 # Vite 8 + React 19 + React Router + TanStack Query
    └── nestjs/                     # NestJS 11 + Fastify + Zod + Swagger
```

## Available Templates

| Template | Stack | Status |
|----------|-------|--------|
| **nextjs** | Next.js 16, React 19, shadcn/ui, Tailwind CSS 4, React Query, React Hook Form, Framer Motion, Docker | Ready |
| **fastapi** | FastAPI 0.116, Pydantic v2 (camelCase schemas), layered architecture, Ruff, pytest, Docker | Ready |
| **vite-react** | Vite 8, React 19, React Router 7, TanStack Query, Tailwind CSS 4, Docker | Ready |
| **nestjs** | NestJS 11, Fastify, Zod + nestjs-zod, Swagger, TypeScript 5.9, Jest, Docker | Ready |

## Available Skills

Skills are organized by stack. Each skill has YAML frontmatter (`name`, `description`) per the [Agent Skills spec](https://agentskills.io/specification). See each stack's index for the full listing:

- [Next.js skills](claude-skills/nextjs/INDEX.md) — 8 skills (scaffold, code-standards, add-feature, add-page, add-api-route, add-component, add-integration, add-test)
- [FastAPI skills](claude-skills/fastapi/INDEX.md) — 4 skills (scaffold, code-standards, add-endpoint, add-test)
- [Vite + React skills](claude-skills/vite-react/INDEX.md) — 6 skills (scaffold, code-standards, add-feature, add-page, add-component, add-integration)
- [NestJS skills](claude-skills/nestjs/INDEX.md) — 4 skills (scaffold, code-standards, add-module, add-test)
- [Shared skills](claude-skills/shared/INDEX.md) — 1 skill (task-management)

## Getting Started

### With Cursor

1. Open the `templateCentral` folder in Cursor
2. Open the agent (Cmd+L or Ctrl+L) and describe what you want:
   > "Scaffold a new Next.js project at ~/Desktop/my-app called MyApp"
3. The agent reads `AGENTS.md`, detects the stack, and delegates to the right subagent
4. The subagent copies the template, renames it, installs dependencies, and verifies the dev server — all automatically

This works the same way for any stack — just describe what you need and the orchestrator handles routing.

### With Claude Code (CLI)

1. `cd` into the `templateCentral` directory
2. Run `claude` — it automatically picks up `AGENTS.md`
3. Describe what you want:
   > "Create a FastAPI project at ~/projects/my-api"
4. The agent follows the same orchestration flow as Cursor

### With Other AI Tools

Any AI tool that reads `AGENTS.md` (Codex, Copilot, Windsurf, etc.) can use templateCentral. Open or point the tool at this repository and give it a natural language instruction. The orchestrator in `AGENTS.md` handles the rest.

### Manual (No AI)

Copy a template directory to your target location and customize:

```bash
# Next.js
cp -r templates/nextjs /path/to/my-new-project
cd /path/to/my-new-project
pnpm install && pnpm dev

# Vite + React
cp -r templates/vite-react /path/to/my-new-project
cd /path/to/my-new-project
pnpm install && pnpm dev

# NestJS
cp -r templates/nestjs /path/to/my-new-project
cd /path/to/my-new-project
pnpm install && pnpm start:dev

# FastAPI
cp -r templates/fastapi /path/to/my-new-project
cd /path/to/my-new-project
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cd src && python main.py
```

## Adding a New Template

See the "Adding a New Stack" section in `AGENTS.md` for the full process, including creating the subagent definition (`AGENT.md`), skill index (`INDEX.md`), scaffold skill, detection table entry, and updating this README.
