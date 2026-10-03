# LooseMouth research contract

The GIC web app keeps the legacy `search: true` flag for compatibility and also sends a structured `research` object to `POST /v1/chat`.

## Request

```json
{
  "message": "user question",
  "model": "native",
  "session_id": null,
  "search": true,
  "research": {
    "enabled": true,
    "depth": "deep",
    "max_queries": 4,
    "results_per_query": 5,
    "max_pages": 6,
    "max_chunks_per_page": 3,
    "max_hops": 2,
    "max_sources": 12,
    "fetch_timeout_ms": 8000
  },
  "max_tokens": 100
}
```

The serving backend should clamp these values to server-owned limits. Never trust browser/proxy depth values as authorization to perform unbounded crawling.

## Suggested backend pipeline

1. Decompose the user question into up to `max_queries` search queries.
2. Search each query and merge/deduplicate candidate URLs.
3. Fetch no more than `max_pages` pages total.
4. Extract and rank no more than `max_chunks_per_page` relevant chunks from each page.
5. If evidence is incomplete and `max_hops > 1`, derive one second-hop query set from discovered evidence.
6. Stop when the evidence target is satisfied or any hard limit is reached.
7. Supply compact evidence to the selected model for synthesis.
8. Return the final source set plus research diagnostics.

## Response

Existing fields remain required:

```json
{
  "session_id": "uuid",
  "answer": "answer text",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "snippet": "Relevant evidence excerpt or summary.",
      "date": "2026-10-02"
    }
  ],
  "warning": null,
  "mode": "search"
}
```

A research-capable server may additionally return:

```json
{
  "research": {
    "depth": "deep",
    "queries": 4,
    "fetched_pages": 6,
    "hops": 2,
    "sources_considered": 12,
    "elapsed_ms": 8421
  }
}
```

The UI renders these diagnostics when present and continues to work when they are omitted.

## Current profiles

### Quick
- max queries: 2
- results/query: 4
- fetched pages: 3
- chunks/page: 2
- hops: 1
- final sources: 6
- page fetch timeout: 6 seconds

### Deep
- max queries: 4
- results/query: 5
- fetched pages: 6
- chunks/page: 3
- hops: 2
- final sources: 12
- page fetch timeout: 8 seconds

PyScript remains a client-side source deduplication/reranking layer. It does not fetch pages, hold search-provider keys, or perform model orchestration.
