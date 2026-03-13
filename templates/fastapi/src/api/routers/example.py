from fastapi import APIRouter

from api.schemas.request.example import ExampleRequest
from api.schemas.response.example import ExampleResponse
from api.services.example import run_example

router = APIRouter()


@router.post(
    "/example",
    response_model=ExampleResponse,
    summary="Example endpoint",
    description="An example endpoint demonstrating the router → service → logic flow.",
)
def example_endpoint(body: ExampleRequest) -> ExampleResponse:
    """Process an example request."""
    return run_example(body)
