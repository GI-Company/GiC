import json
import re

from pyscript import document, when

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was",
    "what", "when", "where", "which", "who", "why", "with",
}


def terms(value):
    return {
        token
        for token in re.findall(r"[a-z0-9]+", (value or "").lower())
        if len(token) > 1 and token not in STOP_WORDS
    }


def canonical_key(source):
    url = (source.get("url") or "").strip().lower().split("#", 1)[0].rstrip("/")
    if url:
        return url
    return (source.get("title") or "").strip().lower()


@when("click", "#gic-search-enrichment-run")
def enrich(_event):
    input_el = document.querySelector("#gic-search-enrichment-input")
    output_el = document.querySelector("#gic-search-enrichment-output")

    try:
        payload = json.loads(input_el.value or "{}")
        query_terms = terms(payload.get("query", ""))
        sources = payload.get("sources", [])
        seen = set()
        ranked = []

        for index, source in enumerate(sources):
            if not isinstance(source, dict):
                continue

            key = canonical_key(source)
            if key and key in seen:
                continue
            if key:
                seen.add(key)

            title_terms = terms(source.get("title", ""))
            snippet_terms = terms(source.get("snippet", ""))
            title_overlap = len(query_terms & title_terms)
            snippet_overlap = len(query_terms & snippet_terms)

            score = (title_overlap * 4) + snippet_overlap
            if query_terms and query_terms <= (title_terms | snippet_terms):
                score += 3

            ranked.append((score, -index, index))

        ranked.sort(reverse=True)
        order = [index for _score, _neg_index, index in ranked]
        output_el.value = json.dumps({"order": order})
        output_el.dataset.requestId = str(payload.get("request_id", ""))
    except Exception:
        output_el.value = json.dumps({"order": []})
        output_el.dataset.requestId = ""

run_el = document.querySelector("#gic-search-enrichment-run")
run_el.dataset.pyscriptReady = "1"
