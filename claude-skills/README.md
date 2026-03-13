# Claude Skills

This directory contains SKILL.md files that instruct AI agents on how to scaffold projects and work within them.

Skills are organized by stack. Each stack folder has an `INDEX.md` listing all available skills with descriptions.

## Directory Structure

```
claude-skills/
├── nextjs/                      # Next.js skills (8 skills)
│   ├── AGENT.md                 #   Subagent definition
│   ├── INDEX.md                 #   Skill index
│   ├── scaffold/SKILL.md
│   ├── code-standards/SKILL.md
│   ├── add-feature/SKILL.md
│   ├── add-page/SKILL.md
│   ├── add-api-route/SKILL.md
│   ├── add-component/SKILL.md
│   ├── add-integration/SKILL.md
│   └── add-test/SKILL.md
├── fastapi/                     # FastAPI skills (4 skills)
│   ├── AGENT.md
│   ├── INDEX.md
│   ├── scaffold/SKILL.md
│   ├── code-standards/SKILL.md
│   ├── add-endpoint/SKILL.md
│   └── add-test/SKILL.md
├── vite-react/                  # Vite + React skills (6 skills)
│   ├── AGENT.md
│   ├── INDEX.md
│   ├── scaffold/SKILL.md
│   ├── code-standards/SKILL.md
│   ├── add-feature/SKILL.md
│   ├── add-page/SKILL.md
│   ├── add-component/SKILL.md
│   └── add-integration/SKILL.md
├── nestjs/                      # NestJS skills (4 skills)
│   ├── AGENT.md
│   ├── INDEX.md
│   ├── scaffold/SKILL.md
│   ├── code-standards/SKILL.md
│   ├── add-module/SKILL.md
│   └── add-test/SKILL.md
└── shared/                      # Cross-stack skills (1 skill)
    ├── INDEX.md
    └── task-management/SKILL.md
```

## Skill Format

Each `SKILL.md` file follows the [Agent Skills specification](https://agentskills.io/specification). It starts with YAML frontmatter:

```yaml
---
name: skill-name
description: Use when [observable trigger or situation that tells the agent to use this skill].
---
```

- `name` — Must match the parent directory name. Lowercase letters, numbers, and hyphens only. Max 64 characters.
- `description` — What the skill does and when to use it. Max 1024 characters.

Followed by the full skill content with:
- **Inputs** — What the user needs to provide
- **Steps** — Ordered instructions for the agent
- **Rules** — Conventions and constraints to follow

## Creating a New Skill

1. Find or create the stack directory: `claude-skills/<stack>/`
2. Create a subdirectory: `claude-skills/<stack>/<skill-name>/`
3. Add a `SKILL.md` with frontmatter (`name`, `description`) and skill content
4. Add the skill to the stack's `INDEX.md`
5. Update the "Available Skills" section in the root `README.md` — add the skill to the relevant stack's bullet and increment the skill count
