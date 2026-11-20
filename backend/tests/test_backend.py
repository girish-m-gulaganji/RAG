import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.core.database import Base, get_db
from app.services.youtube_service import extract_video_id
from app.services.chunking_service import create_chunks_from_segments

# Test database
TEST_DB_URL = "sqlite:///./test_app.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_module():
    Base.metadata.create_all(bind=test_engine)


def teardown_module():
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
    test_db_file = Path("./test_app.db")
    try:
        if test_db_file.exists():
            test_db_file.unlink(missing_ok=True)
    except Exception:
        pass


def test_youtube_url_extraction():
    urls = [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ]
    for url, expected in urls:
        assert extract_video_id(url) == expected


def test_chunking_service():
    segments = [
        {"start": 0.0, "end": 10.0, "text": "Welcome to this introduction to dynamic programming."},
        {"start": 10.0, "end": 25.0, "text": "Today we discuss the difference between memoization and tabulation."},
        {"start": 25.0, "end": 40.0, "text": "Memoization is a top-down approach utilizing recursion and caching."},
        {"start": 40.0, "end": 60.0, "text": "Tabulation is an iterative bottom-up approach that fills a DP table."},
        {"start": 60.0, "end": 80.0, "text": "Let us analyze the time and space complexity of both techniques."},
    ]
    chunks = create_chunks_from_segments(
        video_id="test1234567",
        title="DP Lecture",
        segments=segments,
        window_seconds=50,
        overlap_seconds=15,
        min_words=5,
    )
    assert len(chunks) >= 2
    assert chunks[0]["video_id"] == "test1234567"
    assert "start_sec" in chunks[0]
    assert "end_sec" in chunks[0]
    assert "timestamp" in chunks[0]


def test_auth_workflow():
    # 1. Register
    reg_payload = {
        "email": "student@example.com",
        "password": "Password123!",
        "full_name": "Girish Student",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "student@example.com"
    token = reg_data["access_token"]

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Bad password should fail
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # 5. Access protected route /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "student@example.com"

    # 6. Access protected route without token should fail
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
