---
name: add-database
description: Use when the user wants to add a database, set up SQLAlchemy ORM, configure Alembic migrations, or create database models in a FastAPI project.
---

# Add Database to FastAPI

Add SQLAlchemy ORM and Alembic migrations to a FastAPI project scaffolded from templateCentral.

> **Opt-in only**: Do not add database support unless the user explicitly requests it. The base template is intentionally database-free.

## Dependencies

Add to `requirements.txt`:
- `sqlalchemy` — ORM and query builder
- `alembic` — Database migrations
- A driver for your database (e.g., `psycopg2-binary` for PostgreSQL, `aiosqlite` for SQLite async)

## Steps

### 1. Create Database Base

**`src/database/base.py`** — SQLAlchemy declarative base:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass
```

### 2. Create Database Session

**`src/database/session.py`** — Engine, session factory, and FastAPI dependency:

```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3. Add Configuration

Add `DATABASE_URL` to `src/core/config.py` (or `settings`):

```python
DATABASE_URL: str = "sqlite:///./app.db"  # Default for local dev
```

And add to `.env`:
```
DATABASE_URL=sqlite:///./app.db
```

### 4. Initialize Alembic

Run from the project root:

```bash
alembic init alembic
```

Then edit `alembic/env.py`:
- Import your `Base` and `engine`:

```python
from database.base import Base
from database.session import engine

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

Update `alembic.ini`:
```ini
sqlalchemy.url = sqlite:///./app.db
```

### 5. Create a Model

**`src/models/user.py`** (example):

```python
from sqlalchemy import Column, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
```

### 6. Generate First Migration

```bash
alembic revision --autogenerate -m "create users table"
alembic upgrade head
```

### 7. Use in Routers

Inject the database session via FastAPI's dependency injection:

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from database.session import get_db

@router.get("/users")
async def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()
```

## Rules

- **Opt-in only** — the base template has no database. Only add when explicitly requested.
- Place ORM models in `src/models/` (not in `api/` or `logic/`).
- `database/` holds infrastructure only (Base, session, engine) — no business logic.
- Always use Alembic for schema changes — never call `Base.metadata.create_all()` in production.
- The `get_db` dependency ensures sessions are properly closed after each request.
- For async support, use `create_async_engine` + `AsyncSession` from `sqlalchemy.ext.asyncio` and an async driver.
- Keep `DATABASE_URL` in `.env` — never hardcode production credentials.
