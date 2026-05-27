"""API smoke tests with fake embedding index (see conftest.py)."""

import io


def test_anomalies_returns_json(client):
    r = client.get("/api/anomalies")
    assert r.status_code == 200
    data = r.json()
    assert "anomalies" in data
    assert isinstance(data["anomalies"], list)


def test_timeline_returns_json(client):
    r = client.get("/api/timeline")
    assert r.status_code == 200
    data = r.json()
    assert "events" in data


def test_search_requires_query(client):
    r = client.post("/api/search", json={})
    assert r.status_code == 400


def test_search_empty_index_returns_empty_results(client):
    r = client.post("/api/search", json={"query": "error"})
    assert r.status_code == 200
    data = r.json()
    assert data["results"] == []
    assert data["total_count"] == 0


def test_file_status_unknown_file(client):
    r = client.get("/api/file/00000000-0000-0000-0000-000000000000/status")
    assert r.status_code == 200
    assert r.json()["status"]["found"] is False


def test_ask_without_openai_key_returns_500(client):
    r = client.post("/api/ask", json={"query": "what happened?"})
    assert r.status_code == 500


def test_upload_plain_text_creates_file(client):
    content = b"plain line one\nplain line two\n"
    r = client.post(
        "/api/upload",
        files={"file": ("test.log", io.BytesIO(content), "text/plain")},
    )
    assert r.status_code == 200
    file_id = r.json()["file_id"]
    st = client.get(f"/api/file/{file_id}/status")
    assert st.status_code == 200
    assert st.json()["status"]["found"] is True
