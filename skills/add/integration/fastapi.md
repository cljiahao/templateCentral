<!-- ref: add/integration/fastapi.md
     loaded-by: add/SKILL.md
     prereq: Stack = fastapi. Do not invoke this file directly — it is loaded at runtime by the templatecentral:add skill. -->
## FastAPI

Create a new third-party API integration in a FastAPI project scaffolded from templateCentral.

### Prerequisites

Requires a project scaffolded with `templatecentral:scaffold`. See Step 0.

### Architecture

```
config → client → schemas → service → dependency injection → router
```

- **client** — Async HTTP client using `httpx`
- **schemas** — Pydantic models for validating external API responses
- **service** — Business logic wrapping the client
- **dependency** — FastAPI dependency for injecting the service

### Dependencies

Add to `requirements.txt`:
- `httpx` — Async HTTP client

### Steps

#### Step 0 — Verify context

Look for `<!-- templateCentral: fastapi@` on line 1 of `AGENTS.md`.

If found → proceed to Step 1.

If not found → invoke `templatecentral:migrate`. Once complete, re-check for
the marker.
- Marker now present → proceed to Step 1.
- Still absent (user chose to stop) → exit. Do not generate any files.

#### 1. Create Integration Directories

The base template does not include `src/integrations/` or `src/api/dependencies/`. Create them now:

```bash
mkdir -p src/integrations src/api/dependencies
touch src/integrations/__init__.py src/api/dependencies/__init__.py
```

#### 2. Create the Client

**`src/integrations/<name>_client.py`**:

```python
from typing import Any
from urllib.parse import quote

import httpx


class GithubClient:
    """HTTP client for the GitHub API."""

    def __init__(self, base_url: str, token: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )

    async def get_repos(self) -> list[dict[str, Any]]:
        """Fetch the authenticated user's repositories."""
        response = await self._client.get("/user/repos")
        response.raise_for_status()
        return response.json()

    async def get_repo(self, owner: str, repo: str) -> dict[str, Any]:
        """Fetch a specific repository."""
        # quote(safe="") escapes "/" and "." too — caller-supplied segments
        # would otherwise let "../" traverse to an unintended upstream path.
        response = await self._client.get(f"/repos/{quote(owner, safe='')}/{quote(repo, safe='')}")
        response.raise_for_status()
        return response.json()

    async def close(self) -> None:
        await self._client.aclose()
```

#### 3. Define Response Schemas

**`src/integrations/<name>_schemas.py`**:

Integration schemas must NOT inherit from `BaseResponseSchema` — it has `extra="forbid"` (rejects unknown fields from external APIs) and `alias_generator=to_camel` (transforms field names). Use plain `BaseModel` with `extra="ignore"` instead:

```python
from pydantic import BaseModel, ConfigDict, Field


class GithubRepo(BaseModel):
    """GitHub repository response — uses plain BaseModel to preserve external API field names."""

    model_config = ConfigDict(extra="ignore")

    id: int = Field(description="Repository ID.")
    full_name: str = Field(description="Full repository name (owner/repo).")
    description: str | None = Field(default=None, description="Repository description.")
    html_url: str = Field(description="URL to the repository.")
    stargazers_count: int = Field(default=0, description="Star count.")
```

#### 4. Create the Service

**`src/integrations/<name>_service.py`**:

The service is the layer that turns upstream transport failures into domain errors. Without this, `raise_for_status()` lets `httpx.HTTPStatusError` escape to the catch-all handler and an upstream 404 or timeout reaches the client as a generic 500.

```python
import httpx
from fastapi import HTTPException, status

from core.exceptions import NoResultsFound
from integrations.github_client import GithubClient
from integrations.github_schemas import GithubRepo


class GithubService:
    """Business logic for GitHub integration."""

    def __init__(self, client: GithubClient) -> None:
        self._client = client

    async def list_repos(self) -> list[GithubRepo]:
        """Fetch and validate all repos."""
        raw = await self._client.get_repos()
        return [GithubRepo.model_validate(r) for r in raw]

    async def get_repo(self, owner: str, repo: str) -> GithubRepo:
        """Fetch and validate a single repo."""
        try:
            raw = await self._client.get_repo(owner, repo)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == status.HTTP_404_NOT_FOUND:
                raise NoResultsFound(f"Repository {owner}/{repo} not found.") from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Upstream GitHub API returned an error.",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Upstream GitHub API is unreachable.",
            ) from exc
        return GithubRepo.model_validate(raw)
```

> `NoResultsFound` (from `src/core/exceptions.py`) already maps to a 404 via the scaffold's exception handler in `src/app.py`. Transport and non-404 upstream failures map to 504/502 so a broken dependency is never reported as a bug in this service.

#### 5. Add Config

Add the API token to `APISettings` in **`src/core/config.py`**:

```python
class APISettings(BaseSettings):
    # ... existing fields ...
    GITHUB_API_URL: str = Field(default="https://api.github.com")
    GITHUB_TOKEN: str
```

Ask the user to add `GITHUB_TOKEN` to `src/.env` (real token — never commit; agent edits to `.env` files are hook-blocked by design):
```
GITHUB_TOKEN=
```

Document in `src/.env.default`:
```
GITHUB_TOKEN=your_github_token_here
```

#### 6. Create a Dependency

**`src/api/dependencies/<name>.py`**:

```python
from collections.abc import AsyncGenerator

from fastapi import Depends

from core.config import api_settings
from integrations.github_client import GithubClient
from integrations.github_service import GithubService


async def get_github_service() -> AsyncGenerator[GithubService, None]:
    """Provide a GithubService instance with managed client lifecycle."""
    client = GithubClient(base_url=api_settings.GITHUB_API_URL, token=api_settings.GITHUB_TOKEN)
    try:
        yield GithubService(client)
    finally:
        await client.close()
```

#### 7. Create the Router

First, add a tag to `src/api/tags.py`:

```python
class APITags(StrEnum):
    # ... existing tags ...
    GITHUB = "github"
```

Then create **`src/api/routers/<name>.py`**:

```python
from fastapi import APIRouter, Depends

from api.dependencies.github import get_github_service
from api.tags import APITags
from integrations.github_schemas import GithubRepo
from integrations.github_service import GithubService

router = APIRouter(prefix="/github", tags=[APITags.GITHUB])


@router.get("/repos", response_model=list[GithubRepo])
async def list_repos(service: GithubService = Depends(get_github_service)) -> list[GithubRepo]:
    """List authenticated user's GitHub repos."""
    return await service.list_repos()
```

#### 8. Register the Router

Add the router to **`src/api/routes.py`**:

```python
from api.routers import example, github  # add the new import

# in the router registration block:
router.include_router(github.router)
```

The router will not be reachable until it is registered here — this step is mandatory.

### Rules

- Use `httpx.AsyncClient` for async HTTP — not `requests`.
- Validate all external responses with Pydantic schemas before returning to callers.
- Client handles HTTP only — no business logic. Service handles business logic.
- URL-encode every caller-supplied path segment with `quote(value, safe="")` — unencoded segments allow path injection into the upstream API.
- Catch `httpx.HTTPStatusError` and `httpx.RequestError` in the service — never let them reach the catch-all handler as a 500.
- Use FastAPI dependencies for lifecycle management (create → yield → close).
- Keep API tokens in environment variables / config — never hardcode.
- Place integration files in `src/integrations/` — not in `api/`.

### Validate

```bash
python -m pytest test/ -v     # tests pass
ruff check src/     # zero lint errors
```

### After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate the server starts and tests pass
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards