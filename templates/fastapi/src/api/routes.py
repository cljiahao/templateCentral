from fastapi import APIRouter

from api.routers import example
from api.tags import APITags

router = APIRouter()

router.include_router(example.router, tags=[APITags.EXAMPLE])


@router.get(
    "/",
    tags=[APITags.MISC],
    summary="Home Route",
    description="A simple home route returning a welcome message.",
)
def home() -> dict[str, str]:
    """Simple home route."""
    return {"msg": "Hello FastAPI"}


@router.get(
    "/health",
    tags=[APITags.MISC],
    summary="Health Check",
    description="A simple health check returning an OK status.",
)
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "OK"}
