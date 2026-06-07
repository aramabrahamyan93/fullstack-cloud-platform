from fastapi.testclient import TestClient

from app.db.database import Base
from app.db.database import engine
from app.main import app


client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_response_includes_generated_request_id():
    response = client.get("/health")

    request_id = response.headers.get("x-request-id")

    assert response.status_code == 200
    assert request_id is not None
    assert len(request_id) > 0


def test_response_reuses_incoming_request_id():
    request_id = "test-request-id-123"

    response = client.get(
        "/health",
        headers={
            "X-Request-ID": request_id,
        },
    )

    assert response.status_code == 200
    assert response.headers.get("x-request-id") == request_id


def test_error_response_includes_request_id():
    request_id = "test-error-request-id-123"

    response = client.get(
        "/tasks/999",
        headers={
            "X-Request-ID": request_id,
        },
    )

    assert response.status_code == 404
    assert response.headers.get("x-request-id") == request_id

    error = response.json()["error"]

    assert error["code"] == "task_not_found"
    assert error["message"] == "Task with id=999 was not found."
    assert error["requestId"] == request_id