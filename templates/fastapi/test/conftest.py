"""Root conftest — shared fixtures available to all tests."""

import pytest
from fastapi.testclient import TestClient

from app import app


@pytest.fixture()
def client() -> TestClient:
    """FastAPI test client."""
    return TestClient(app)
