from typing import Any, Sequence

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status

from core.exceptions import InvalidInputError, NoResultsFound
from core.logging import logger

INTERNAL_SERVER_ERROR_DETAIL = "Internal Server Error"


def _sanitize_errors(errors: Sequence[Any]) -> list[dict]:
    """Make Pydantic validation errors JSON-safe.

    exc.errors() can contain raw exception objects in the 'ctx' dict
    which are not JSON serializable. Convert them to strings.
    """
    safe = []
    for err in errors:
        clean = {**err}
        if "ctx" in clean:
            clean["ctx"] = {
                k: (
                    str(v)
                    if not isinstance(v, (str, int, float, bool, type(None)))
                    else v
                )
                for k, v in clean["ctx"].items()
            }
        safe.append(clean)
    return safe


def configure_exceptions(app: FastAPI) -> None:
    """Register exception handlers so all errors are handled in one place."""

    @app.exception_handler(InvalidInputError)
    async def invalid_input_handler(
        request: Request, exc: InvalidInputError
    ) -> JSONResponse:
        logger.info(
            "Invalid input",
            extra={"path": request.url.path, "detail": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    @app.exception_handler(NoResultsFound)
    async def no_results_handler(
        request: Request, exc: NoResultsFound
    ) -> JSONResponse:
        logger.info(
            "No results found",
            extra={"path": request.url.path, "detail": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        safe_errors = _sanitize_errors(exc.errors())
        logger.info(
            "Request validation error",
            extra={"path": request.url.path, "errors": safe_errors},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": safe_errors},
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled exception", extra={"path": request.url.path})
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": INTERNAL_SERVER_ERROR_DETAIL},
        )
