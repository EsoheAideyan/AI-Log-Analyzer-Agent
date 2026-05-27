"""Pure helpers for keyword filtering of semantic search results (testable without FAISS)."""


def search_terms(query: str) -> list[str]:
    """Lowercased tokens (length >= 2) used for substring match in log lines."""
    return [t.lower() for t in query.split() if len(t) >= 2]


def keyword_match_score(text: str, terms: list[str]) -> int:
    if not text or not terms:
        return 0
    blob = text.lower()
    return sum(1 for w in terms if w in blob)


def filter_sort_keyword_hits(pool: list, query: str) -> list:
    """Keep only rows whose text contains at least one query term; best matches first."""
    terms = search_terms(query)
    if not terms:
        return pool
    scored = []
    for r in pool:
        text = r.get("text") or ""
        s = keyword_match_score(text, terms)
        if s > 0:
            scored.append((r, s))
    scored.sort(key=lambda x: (-x[1], x[0].get("distance", 0)))
    return [r for r, _ in scored]
