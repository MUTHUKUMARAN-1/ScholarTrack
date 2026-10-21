import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.services.auth import get_password_hash
from app.models.admin_user import AdminUser
from app.collectors.pipeline import seed_approved_sources

# Test In-Memory SQLite database with StaticPool so all connections share the same memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed admin user
    test_admin = AdminUser(
        username="testadmin",
        hashed_password=get_password_hash("testpassword123"),
        role="admin",
        created_at=datetime.now(timezone.utc)
    )
    session.add(test_admin)
    session.commit()

    # Seed sources
    seed_approved_sources(session)

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_token(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "testadmin", "password": "testpassword123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
