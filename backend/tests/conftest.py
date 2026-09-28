import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Establish isolated test database path
BACKEND_DIR = Path(__file__).resolve().parent.parent
TEST_DB_FILE = BACKEND_DIR / "test_krishinet.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_FILE.as_posix()}"

# 2. Set environment variable BEFORE importing app or settings
os.environ["DATABASE_URL"] = TEST_DB_URL

# Ensure backend root is on sys.path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
settings.DATABASE_URL = TEST_DB_URL

from app.core.database import (
    rebind_engine,
    engine,
    SessionLocal,
    get_db,
    is_production_database,
    assert_not_production_during_test,
    Base
)
from app.services.database_service import init_db
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_database_session():
    """
    Test session lifecycle:
    1. Verify strictly that tests do NOT run against krishinet.db.
    2. Clean up any leftover test database files.
    3. Rebind engine to test_krishinet.db and initialize tables & demo data.
    4. Override FastAPI get_db dependency.
    5. Clean up test database files at session teardown.
    """
    # Defensive check: strictly refuse if pointing to production krishinet.db
    assert_not_production_during_test(settings.DATABASE_URL)
    assert_not_production_during_test(str(engine.url))
    if is_production_database(settings.DATABASE_URL):
        raise RuntimeError(
            "Refusing to run tests against the production database.\n"
            "Configure a separate test database."
        )

    # Clean pre-existing test DB files if present
    for f in [TEST_DB_FILE, BACKEND_DIR / "test_krishinet.db-wal", BACKEND_DIR / "test_krishinet.db-shm"]:
        if f.exists():
            try:
                f.unlink()
            except Exception:
                pass

    # Rebind engine and SessionLocal to test database
    rebind_engine(TEST_DB_URL)

    # Initialize tables and demo records in test DB
    init_db()

    # Override FastAPI get_db dependency to always use test database session
    def _get_test_db():
        assert_not_production_during_test(str(engine.url))
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db

    yield

    # Teardown
    app.dependency_overrides.clear()
    try:
        engine.dispose()
    except Exception:
        pass

    for f in [TEST_DB_FILE, BACKEND_DIR / "test_krishinet.db-wal", BACKEND_DIR / "test_krishinet.db-shm"]:
        if f.exists():
            try:
                f.unlink()
            except Exception:
                pass

@pytest.fixture(scope="function", autouse=True)
def verify_test_db_isolation():
    """Ensure before each test function that the session is NOT targeting production DB."""
    assert_not_production_during_test(settings.DATABASE_URL)
    assert_not_production_during_test(str(engine.url))

@pytest.fixture
def db_session():
    """Provides an isolated SQLAlchemy session for testing."""
    assert_not_production_during_test(str(engine.url))
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
