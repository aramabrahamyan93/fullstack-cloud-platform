from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_version_returns_app_metadata():
    response = client.get("/version")

    assert response.status_code == 200

    data = response.json()

    assert data["app"] == "fullstack-cloud-platform-api"
    assert data["version"] == "0.1.0"