"""Unit tests for keyword search helpers (no FastAPI / FAISS)."""

from keyword_helpers import filter_sort_keyword_hits, keyword_match_score, search_terms


def test_search_terms_skips_short_tokens():
    assert search_terms("a bc def") == ["bc", "def"]


def test_keyword_match_score_counts_distinct_terms():
    text = "error timeout error"
    terms = ["error", "timeout"]
    assert keyword_match_score(text, terms) == 2


def test_filter_sort_keyword_hits_keeps_only_matching_rows():
    pool = [
        {"text": "all good", "distance": 0.1},
        {"text": "disk error on sda", "distance": 0.5},
        {"text": "error", "distance": 0.9},
    ]
    out = filter_sort_keyword_hits(pool, "error disk")
    assert len(out) == 2
    assert out[0]["text"] == "disk error on sda"
    assert out[1]["text"] == "error"


def test_filter_sort_keyword_hits_empty_terms_returns_pool():
    pool = [{"text": "x", "distance": 1.0}]
    assert filter_sort_keyword_hits(pool, "a") == pool
