<!-- ref: standards/validation-patterns/fastapi.md
     loaded-by: standards/SKILL.md
     prereq: Stack = fastapi. Do not invoke this file directly — it is loaded at runtime by the templatecentral:standards skill. -->
### FastAPI (Python + Pydantic)

**1. Request Model with Validation**

Schemas live under `src/api/schemas/request/` and `src/api/schemas/response/`, one module per resource.

```python
# src/api/schemas/request/project.py
from pydantic import Field

from api.schemas.base import BaseRequestSchema


class CreateProjectRequest(BaseRequestSchema):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "My Project",
                "description": "A great project",
            }
        }
    }
```

```python
# src/api/schemas/response/project.py
from datetime import datetime

from pydantic import BaseModel


class ProjectResponse(BaseModel):
    # Use BaseModel for responses that go to same-stack Python consumers.
    # Use BaseResponseSchema (from api.schemas.base) when the response goes to a
    # JavaScript frontend — BaseResponseSchema enables camelCase serialization.
    id: str
    name: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

```python
# src/api/schemas/request/auth.py
from pydantic import EmailStr, Field

from api.schemas.base import BaseRequestSchema


class LoginRequest(BaseRequestSchema):
    email: EmailStr
    password: str = Field(..., min_length=12)
```

```python
# src/api/schemas/request/pagination.py
from pydantic import BaseModel, Field


class PaginationQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    sort: str | None = Field(None, pattern=r'^(asc|desc)_\w+$')
```

**2. API Endpoint with Validation**

```python
# src/api/routers/projects.py
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, Query, UploadFile, status

from api.schemas.request.project import CreateProjectRequest
from api.schemas.response.project import ProjectResponse
from core.exceptions import InvalidInputError

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProjectResponse)
async def create_project(req: CreateProjectRequest) -> ProjectResponse:
    """Create a new project.

    Pydantic automatically validates the request body.
    Returns 422 if validation fails.
    """
    # req is guaranteed to be valid
    project = ProjectResponse(
        id="1",
        name=req.name,
        description=req.description,
        created_at=datetime.now(),
    )
    return project


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[ProjectResponse]:
    """List projects with pagination.

    Query parameters are automatically validated and coerced.
    """
    # page and limit are guaranteed to be valid integers
    offset = (page - 1) * limit
    # Your logic: projects = await db.projects.find(skip=offset, limit=limit)
    return []


@router.post("/upload", response_model=dict[str, dict[str, str]])
async def upload_project_file(file: UploadFile = File(...)):
    """Upload a project file with validation."""
    # Validate file type. content_type is the client-supplied Content-Type header —
    # trivially spoofable, so treat this as a cheap first filter only. For anything
    # security-sensitive, follow up with magic-byte sniffing (e.g. python-magic) or
    # server-side re-encoding before the file is stored or served.
    allowed_types = {"image/jpeg", "image/png", "application/pdf"}
    if file.content_type not in allowed_types:
        raise InvalidInputError(
            f"File type {file.content_type} not allowed. "
            f"Allowed: {', '.join(allowed_types)}"
        )

    # Validate file size (max 10MB) — file.size comes from the parsed multipart
    # spool (not the client header): reject based on the parsed spool size before
    # loading the file into memory, then re-check after reading
    max_size = 10 * 1024 * 1024
    if file.size is not None and file.size > max_size:
        raise InvalidInputError("File must be under 10MB")
    contents = await file.read()
    if len(contents) > max_size:
        raise InvalidInputError("File must be under 10MB")

    # Validate filename — may be None, and may contain path components (traversal)
    if not file.filename:
        raise InvalidInputError("Filename is required")
    if Path(file.filename).name != file.filename:
        raise InvalidInputError("Invalid filename")

    # Safe to use: file.filename, contents
    # await storage.save(file.filename, contents)

    return {"data": {"message": "File uploaded successfully"}}
```

**3. Form Data Validation**

Annotate a Pydantic model with `Form()` — FastAPI validates form bodies against the model natively (model form data since 0.113, `extra="forbid"` support since 0.114). No manual parsing, and no risk of echoing the submitted password: a failure raises `RequestValidationError`, which the project's handler in `src/error_handler.py` turns into a sanitized 422.

```python
# src/api/routers/auth.py
from typing import Annotated

from fastapi import APIRouter, Form, status

from api.schemas.request.auth import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=dict[str, dict[str, str]], status_code=status.HTTP_200_OK)
async def login(req: Annotated[LoginRequest, Form()]):
    """Login via form data with validation."""
    # req is guaranteed to be valid — safe to use req.email, req.password
    return {"data": {"message": "Login successful"}}
```

**4. External API Response Validation**

```python
# src/integrations/github_service.py
import httpx
from pydantic import BaseModel, ValidationError, field_validator

from core.exceptions import InvalidInputError

class GitHubUser(BaseModel):
    id: int | str
    login: str
    email: str | None = None

    @field_validator("login", mode="before")
    @classmethod
    def validate_login(cls, v: object):
        if not v or not isinstance(v, str):
            raise ValueError("login is required")
        return v


async def fetch_github_user(username: str) -> GitHubUser:
    """Fetch and validate GitHub user data."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.github.com/users/{username}")

    if response.status_code != 200:
        raise InvalidInputError("GitHub user not found")

    try:
        data = response.json()
        user = GitHubUser.model_validate(data)  # Pydantic v2 idiomatic form; respects mode="before" validators
        return user
    except ValidationError as e:
        # Never interpolate the raw ValidationError — its str() echoes the input values
        # (info disclosure). Log the detail server-side; return a generic message.
        raise InvalidInputError("Invalid GitHub API response") from e
```

## Testing / Verification

```bash
# Test endpoint validation
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'  # Should return 422

python -m pytest test/ -v -s
```

## After Writing Code

Dispatch in order:
1. the build utility — load it with: `cat "<skill-dir>/../build/SKILL.md"` — validate compilation
2. the review utility — load it with: `cat "<skill-dir>/../review/SKILL.md"` — check code standards