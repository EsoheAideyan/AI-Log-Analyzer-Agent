"""Pytest fixtures: isolated temp DB/uploads and a fake embedding index (no HF model load)."""

from __future__ import annotations

import os
import sys

import pytest


class FakeEmbeddingIndex:
    """Minimal stand-in so importing `app` does not load SentenceTransformer."""

    def __init__(self, *args, **kwargs) -> None:
        self.index = type("Idx", (), {"ntotal": 0})()

    def add_chunks(self, chunks) -> None:
        return None

    def search(self, *args, **kwargs):
        return []


@pytest.fixture
def client(monkeypatch, tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True)
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir(parents=True)
    os.environ["DB_PATH"] = str(data_dir / "metadata.db")
    os.environ["UPLOAD_DIR"] = str(upload_dir)

    monkeypatch.setattr("embeddings.EmbeddingIndex", FakeEmbeddingIndex)

    for mod in ("app", "db"):
        sys.modules.pop(mod, None)

    import app as app_module

    from fastapi.testclient import TestClient

    return TestClient(app_module.app)
