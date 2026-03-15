---
name: scaffold
description: Use when the user wants to start a new Python backend project, create a new FastAPI API, or scaffold a project with layered architecture and Docker support.
---

# Scaffold FastAPI Project

Scaffold a new FastAPI backend project from the templateCentral FastAPI template.

## Inputs

- **Project name** — The name for the new project (e.g., `my-api`). If not provided, ask the user.
- **Target directory** — Where to create the project (e.g., `~/projects/my-api`). If not provided, default to `./<project-name>` and confirm with the user.

## Steps

### 1. Copy the Template

Copy the entire `templates/fastapi/` directory from this repository to the target directory. Exclude `__pycache__/` and `log/`.

```bash
rsync -av --exclude='__pycache__' --exclude='log' <repo-root>/templates/fastapi/ <target-directory>/
```

### 2. Update Project Settings

In `src/core/config.py`, update the `CommonSettings` defaults:
- `PROJECT_NAME` — Set to the project name
- `PROJECT_DESCRIPTION` — Set to a relevant description
- `PROJECT_VERSION` — Set to `"v0.1.0"` or the user's preferred version

### 3. Create Environment Files

Copy `.env.default` to create `src/.env`:

```bash
cp src/.env.default src/.env
```

Update values as needed (project name, port, etc.).

### 4. Set Up Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

**Checkpoint**: Verify all packages installed without errors. Run `pip check` to detect dependency conflicts.

### 5. Verify

```bash
cd src
python main.py
```

Confirm the API starts at `http://localhost:8000` and Swagger docs are available. **Do not proceed until the API responds.**

Run tests (from the project root, not from `src/`):

```bash
cd ..
pytest test/
```

**Checkpoint**: All tests must pass. If any fail, fix before proceeding.

### 6. Generate Project AGENTS.md (MANDATORY)

**This step is NOT optional. Do NOT skip it. Scaffolding is incomplete without a project AGENTS.md.**

Create `AGENTS.md` in the project root. This gives any AI agent (Cursor, Codex, Copilot, Windsurf, etc.) permanent context about this specific project.

```markdown
# <Project Name>

## Identity
- **Stack**: FastAPI 0.116, Python 3.12, Pydantic v2, Uvicorn, Ruff, pytest
- **Scaffolded from**: templateCentral/templates/fastapi
- **Created**: <date>

## Architecture Decisions
- Layered dependency flow: `api/` → `logic/` → `models/`
- Pydantic schemas with camelCase aliases (`BaseSchema`)
- Structured JSON logging with timed rotating file handler
- Centralized exception → HTTP response mapping in `error_handler.py`

## Key Conventions
- snake_case for files/functions/variables; PascalCase for classes; UPPER_SNAKE_CASE for constants
- Type annotations on all public function parameters and return types
- Routers are thin — accept body, call service, return result
- Services orchestrate — parse → process → return
- Absolute imports only; no wildcards; stdlib → third-party → local

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

Once the project is verified, remove the example endpoint:
- Delete `src/api/routers/example.py`
- Delete `src/api/schemas/request/example.py`
- Delete `src/api/schemas/response/example.py`
- Delete `src/api/services/example.py`
- Delete `test/test_api/test_example.py`
- Remove the `example` import and `include_router` line from `src/api/routes.py`
- Update `APITags` in `src/api/tags.py` to remove `EXAMPLE`

## Architecture

See `AGENT.md` for the full architecture diagram and dependency flow rules.

## Template Details

| Feature | Value |
|---------|-------|
| Framework | FastAPI 0.116 |
| Server | Uvicorn (auto-reload in dev) |
| Settings | Pydantic Settings with `.env` support |
| Logging | JSON structured, timed rotating file handler |
| Validation | Pydantic v2 with camelCase aliases |
| Linting | Ruff (line-length 88, Python 3.12) |
| Testing | pytest with importlib mode |
| Docker | Multi-stage build (dev + prod targets) |

## Files to Customize

| File | What to Change |
|------|----------------|
| `src/core/config.py` | Project name, description, add settings |
| `src/core/exceptions.py` | Add domain-specific exceptions |
| `src/core/json/logging.json` | Log levels, handlers, formatters |
| `src/api/tags.py` | Add API tag groups |
| `src/api/routes.py` | Register new routers |
| `src/requirements.txt` | Add project dependencies |
| `src/.env.default` | Environment variables |
| `pyproject.toml` | Ruff rules, pytest markers |

## Rules

- Always create a virtual environment before installing dependencies; NEVER install packages globally
- Always copy `.env.default` to `.env` before first run
- Maintain the layered dependency flow: `api/` → `logic/` → `models/`; logic/ NEVER imports from api/, models/ NEVER imports from logic/
- Verify the API starts and Swagger docs render before handing off to the user
- Remove example code only after the user confirms the project runs
- NEVER copy `__pycache__/`, `log/`, `.env`, or `.venv/` when scaffolding
- NEVER scaffold into a non-empty directory without confirming with the user
- NEVER consider scaffolding complete without a project `AGENTS.md` — verify it exists before handing off to the user
- NEVER remove `conftest.py` or `factories/` when cleaning up example code — they're shared test infrastructure
