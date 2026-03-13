---
name: add-test
description: Use when adding tests to a FastAPI project, test coverage is missing for endpoints or logic, or the user asks to write unit/integration tests.
---

# Add Tests (pytest)

Guide for writing tests in a FastAPI project scaffolded from templateCentral.

## Test Structure

Tests mirror `src/`:

```
test/
├── conftest.py           # Shared fixtures (TestClient)
├── factories/            # Factory functions for test data
│   └── models.py
├── test_api/             # API endpoint tests
│   └── test_<endpoint>.py
├── test_logic/           # Business logic tests
│   └── test_<module>.py
├── test_models/          # Domain model tests
│   └── test_<model>.py
└── test_utils/           # Utility function tests
    └── test_<util>.py
```

## Test File Layout

1. Module docstring
2. Imports (stdlib → third-party → local)
3. File-local fixtures
4. Test functions

## Naming

- Functions: `test_<subject>_<scenario>`
- Always provide a one-line docstring describing expected behavior.

```python
@pytest.mark.unit
def test_withdrawal_raises_below_55(client: TestClient) -> None:
    """Withdrawal before age 55 raises InvalidInputError."""
    response = client.post("/withdraw", json={"age": 50, "amount": 1000})
    assert response.status_code == 422
    assert "age" in response.json()["detail"].lower()
```

## Factories

Create factory functions in `test/factories/` with sensible defaults:

```python
def create_member(
    name: str = "Alice",
    age: int = 30,
) -> dict:
    """Create a member request payload with camelCase keys (matching API contract)."""
    return {"name": name, "age": age}
```

> **Why camelCase keys**: `BaseSchema` uses `alias_generator=to_camel`, so the API expects camelCase JSON. Factory return values must use camelCase keys (e.g., `"repeatCount"`) even though Python params use snake_case.

Rules:
- Sensible defaults; composable; use real constants where appropriate.
- Create new factories when objects have many fields or are reused with variations.
- Always use **camelCase keys** in factory dicts — they represent the API's JSON contract.

## Assertions

- One main concept per test.
- Assert before and after when testing mutations.
- Use `pytest.raises(..., match="...")` for exceptions — always include `match`.

## Parametrize

Use for tests that differ only by input/output:

```python
@pytest.mark.parametrize(
    "age, expected",
    [(54, False), (55, True), (65, True)],
    ids=["below-55", "at-55", "at-65"],
)
def test_is_eligible(age: int, expected: bool) -> None:
    """Eligibility check based on age."""
    assert is_eligible(age) == expected
```

## Mocking

- **Prefer real objects** via factories.
- Use `monkeypatch` over `unittest.mock.patch`.
- Mock only for uncontrollable side effects (network, filesystem, time).

## Running Tests

```bash
pytest test/                    # All tests
pytest test/ -m unit            # Unit tests only
pytest test/ -m end_to_end      # E2E tests only
pytest test/test_api/           # API tests only
```

## Independence

- No shared mutable state; each test constructs its own data.
- Tests should pass in any order or in isolation.

## Rules

- NEVER share mutable state between tests — each test constructs its own data
- NEVER use `unittest.mock.patch` when `monkeypatch` is available — prefer pytest idioms
- NEVER mock what you own — use real objects via factories; mock only external side effects
- NEVER omit `match` in `pytest.raises()` — always assert the error message pattern
- NEVER skip test docstrings — every test function needs a one-line description of expected behavior
- NEVER depend on test execution order — tests must pass in any order or in isolation
