---
name: add-endpoint
description: Use when the user asks to create a new API route, add a POST/GET/PUT/DELETE endpoint, or wire up a new resource in a FastAPI project.
---

# Add a FastAPI Endpoint

Guide for adding a new API endpoint following the router → service → logic architecture.

> **Placeholder names**: All examples use `my_endpoint`, `MyRequest`, `my_service`, etc. Replace these with your actual resource name throughout (e.g., for a `tasks` resource: `tasks.py`, `TaskRequest`, `run_task_service`). The import name must match the filename (e.g., `tasks.py` → `from api.routers import tasks`).

## Steps

### 1. Define Request/Response Schemas

Create Pydantic schemas in `src/api/schemas/`. Request schemas inherit from `BaseRequestSchema` and response schemas from `BaseResponseSchema` (both defined in `src/api/schemas/base.py`). They share common config from `BaseSchema` — see the file for the full `ConfigDict`. Key behaviors: `extra="forbid"` rejects unknown fields, `alias_generator=to_camel` converts snake_case to camelCase, and `from_attributes=True` enables ORM-style attribute access. `BaseResponseSchema` additionally sets `serialize_by_alias=True` so responses serialize using camelCase.

> **Why schemas first**: Defining the contract before implementation forces you to think about the API surface. `extra="forbid"` rejects unexpected fields at validation time, catching client bugs early. `to_camel` ensures the API speaks camelCase JSON while Python code uses snake_case.

**Request** (`src/api/schemas/request/<name>.py`):
```python
from pydantic import Field

from api.schemas.base import BaseRequestSchema


class MyRequest(BaseRequestSchema):
    """Request schema for the new endpoint."""

    field_name: str = Field(description="Description of the field.")
```

**Response** (`src/api/schemas/response/<name>.py`):
```python
from pydantic import Field

from api.schemas.base import BaseResponseSchema


class MyResponse(BaseResponseSchema):
    """Response schema for the new endpoint."""

    result: str = Field(description="Description of the result.")
```

### 2. Add Service Function

Create the orchestration function in `src/api/services/<name>.py`. Services sit between the router and the logic layer — they parse schemas into domain models, call business logic, and serialize results back.

> **Why a service layer**: Routers handle HTTP concerns (request/response). Logic handles business rules. The service bridges them, keeping both clean and independently testable.

For simple endpoints, the service can process directly:

```python
from api.schemas.request.my_request import MyRequest
from api.schemas.response.my_response import MyResponse


def run_my_service(request: MyRequest) -> MyResponse:
    """Orchestrate: parse → process → return."""
    processed = request.field_name.strip().upper()
    return MyResponse(result=processed)
```

For non-trivial endpoints with business logic, follow the full router → service → logic flow. The service converts Pydantic schemas to domain models, calls the logic layer, and serializes back:

```python
from api.schemas.request.my_request import MyRequest
from api.schemas.response.my_response import MyResponse
from logic.my_logic import process_item
from models.my_model import MyItem


def run_my_service(request: MyRequest) -> MyResponse:
    """Parse schema → call logic with domain model → serialize result."""
    item = MyItem(field_name=request.field_name)
    result = process_item(item)
    return MyResponse(result=result.value)
```

> **When to use the logic layer**: If the endpoint has business rules, data transformations, or external interactions beyond simple field mapping, put that logic in `logic/` with plain Python domain models. The service bridges schemas and logic — it should never contain business rules itself.

### 3. Add Router

Create the endpoint handler in `src/api/routers/<name>.py`:

```python
from fastapi import APIRouter

from api.schemas.request.my_request import MyRequest
from api.schemas.response.my_response import MyResponse
from api.services.my_service import run_my_service

router = APIRouter()


@router.post(
    "/my-endpoint",
    response_model=MyResponse,
    summary="Short description for OpenAPI docs",
)
def my_endpoint(body: MyRequest) -> MyResponse:
    """One-line docstring."""
    return run_my_service(body)
```

### 4. Register the Router

In `src/api/tags.py`, add the new tag:

```python
class APITags(StrEnum):
    # ... existing tags
    MY_TAG = "my-tag"
```

In `src/api/routes.py`, import the router module and register it on the root `router`:

```python
from api.routers import my_endpoint
from api.tags import APITags

# `router` is the root APIRouter defined at the top of this file
router.include_router(my_endpoint.router, tags=[APITags.MY_TAG])
```

Note: `my_endpoint.router` refers to the `router = APIRouter()` instance inside `src/api/routers/my_endpoint.py`. The import name matches the filename (e.g., `example.py` → `from api.routers import example`).

### 5. Add Tests

Create `test/test_api/test_my_endpoint.py`:

```python
import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_my_endpoint_success(client: TestClient) -> None:
    """POST /my-endpoint returns expected result."""
    response = client.post("/my-endpoint", json={"fieldName": "value"})
    assert response.status_code == 200
    assert response.json()["result"] == "VALUE"
```

### 6. Validate

After creating all files:
1. Start the server from `src/` (`cd src && python main.py`) — confirm no import errors
2. Open Swagger docs — verify the new endpoint appears under its tag
3. Run tests from the project root (`pytest test/test_api/test_my_endpoint.py`) — confirm tests pass
4. Run `ruff check src/` — confirm no lint errors

## Rules

- **Routers are thin** — accept body, call service, return result. NEVER put business logic in routers.
- **Services orchestrate** — parse schemas → call logic → serialize response.
- **Schemas use camelCase** — `BaseSchema` converts `snake_case` ↔ `camelCase` automatically.
- **No Pydantic in logic layer** — services convert to domain models via parsers. NEVER pass Pydantic schemas into the logic layer.
- **One service function per endpoint**.
- NEVER use raw `dict` or unvalidated data in services — always use Pydantic schemas or domain models
- NEVER skip `response_model` on route decorators — always declare the response schema
- NEVER forget to register the router in `src/api/routes.py` and add the tag to `src/api/tags.py`
