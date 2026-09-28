import os
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def is_production_database(db_url: str) -> bool:
    """Return True if db_url points to the production database."""
    if not db_url or "sqlite" not in db_url:
        return False
    # Strip sqlite protocol prefixes
    clean = db_url.replace("sqlite:///", "").replace("sqlite://", "")
    filename = Path(clean).name.lower()
    return filename in ("krishinet.db", "krishinet.db.bak")

def assert_not_production_during_test(db_url: str):
    """Defensive guard: Refuse to run tests against the production database."""
    is_testing = "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ
    if is_testing and is_production_database(db_url):
        raise RuntimeError(
            "Refusing to run tests against the production database.\n"
            "Configure a separate test database."
        )

# Defensive check at module import time
assert_not_production_during_test(settings.DATABASE_URL)

# SQLite compatibility arguments
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def rebind_engine(new_url: str):
    """Rebind engine and SessionLocal to a new database URL (for test isolation)."""
    global engine, SessionLocal
    assert_not_production_during_test(new_url)
    settings.DATABASE_URL = new_url
    conn_args = {"check_same_thread": False} if new_url.startswith("sqlite") else {}
    engine = create_engine(new_url, connect_args=conn_args, pool_pre_ping=True)
    SessionLocal.configure(bind=engine)
    return engine

def get_db():
    """Dependency that provides a database session and closes it afterwards."""
    assert_not_production_during_test(str(engine.url))
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

