"""
Pytest configuration and fixtures.
Sets up in-memory SQLite database and client overrides for authentication.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.main import app
from app.core.security import get_current_active_user, TokenData

# Test database
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Function-level test database session."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Function-level test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    async def override_current_user():
        return TokenData(
            user_id="test-user-id",
            username="testuser",
            email="testuser@example.com",
            role="admin",  # Admin role to pass all verification decorators
            is_active=True
        )
        
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_current_user
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()
