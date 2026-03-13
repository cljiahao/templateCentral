---
name: code-standards
description: Use when writing or reviewing Python code in a FastAPI project — covers naming, types, imports, error handling, and layer dependency rules.
---

# FastAPI / Python Code Standards

Coding standards for Python FastAPI projects scaffolded from templateCentral.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | `PascalCase` | `InterestSettings` |
| Functions | `snake_case` | `get_limits` |
| Constants | `UPPER_SNAKE_CASE` | `INTEREST_RATES` |
| Variables | `snake_case` | `age_in_months` |
| Type aliases | `PascalCase` | `DatedSchedules` |
| Private helpers | `_leading_underscore` | `_coerce_account` |
| Files | `snake_case.py` | `tiered_interest.py` |
| Directories | `snake_case` | `cpf_data/` |
| Tests | `test_<function>_<scenario>` | `test_withdrawal_raises_below_55` |

## Type Annotations

- Annotate all public function parameters and return types.
- Use Python 3.10+ union syntax: `int | None` (not `Optional[int]`).
- Use built-in generics: `list[str]`, `dict[str, int]`.
- Use `TypeAlias` for complex reusable types.

## Dataclasses

- Immutable: `@dataclass(frozen=True, slots=True)` — config, lookup data, parameters.
- Mutable: `@dataclass(slots=True)` — state that changes during processing.
- Use `__post_init__` for invariants; fail fast with clear `ValueError`.

## Function Design

- Prefer pure functions: inputs → outputs, no side effects.
- Isolate side effects; keep mutation in functions with `-> None`.
- Keep functions small and single-purpose.
- Use dict dispatch instead of long `if/elif` for key-based branching.

## Error Handling

- Use built-in exceptions with descriptive messages.
- `ValueError` for invalid values; `TypeError` for wrong types.
- Chain exceptions with `from` to preserve traceback.
- Avoid bare `except:` or broad `except Exception:` except at boundaries.
- Custom exceptions (`InvalidInputError`, `NoResultsFound`) for crossing layer boundaries.

## Imports

- Order: stdlib → third-party → local (separated by blank lines, enforced by Ruff).
- Use absolute imports only: `from models.data import Tier`.
- Import specific names, not modules.
- No wildcard imports (`from module import *`).
- Avoid barrel re-exports in `__init__.py` unless stable public API.

## Docstrings

- One-line for simple functions; short paragraph for complex ones.
- Focus on *what*, not *how*; inline comments explain *why*.

## Constants

- Include units when helpful (e.g. `HARD_LIMIT_CENTS`).
- Use underscores in numeric literals: `1_000_000`.
- Keep related constants grouped.

## Tooling

- **Ruff** — linting + isort (line-length 88, Python 3.12).
- **pytest** — testing framework.
- **Pydantic v2** — API schemas with `BaseSchema` (camelCase aliases, `extra="forbid"`).

## Dependency Rules

```
core/  (standalone — app infrastructure)
api/  →  logic/  →  models/
                       ↑
              constants/  ←  utils/
```

- `logic/` **never** imports from `api/`.
- `models/` **never** imports from `logic/` or `api/`.
- `core/` is **not** imported by `logic/` or `models/`.

## Rules

- **snake_case** for files/functions/variables, **PascalCase** for classes, **UPPER_SNAKE_CASE** for constants
- **Type annotations** on all public function parameters and return types
- **Pure functions** preferred — inputs → outputs, no side effects
- **Absolute imports** only — `from models.data import Tier`; NEVER use wildcard imports
- **Layered dependency flow** — `api/` → `logic/` → `models/`, never reversed; logic/ and models/ NEVER import from api/
- **Routers are thin** — accept body, call service, return result
- NEVER use `Optional[X]` — use `X | None` (Python 3.10+ syntax)
- NEVER use `List`, `Dict`, `Tuple` from `typing` — use built-in `list`, `dict`, `tuple`
- NEVER use bare `except:` or broad `except Exception:` except at application boundaries
- NEVER catch and silently ignore exceptions — always log or re-raise
