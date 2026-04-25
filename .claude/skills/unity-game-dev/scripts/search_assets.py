#!/usr/bin/env python3
"""Search the Unity Asset Store for free assets.

Uses the kharma backend (still serving JSON for the legacy Asset Store
clients) at https://kharma.unity3d.com. The new marketplace UI uses a
client-side Coveo search that requires a bootstrapped token; kharma is
simpler and unauthenticated for read-only search.

Results are filtered to free assets by default. The kharma endpoint
ignores explicit price filters, so we sort by ascending price
(`order_by=price`) and drop non-zero results client-side, paging
forward as needed to fill `--limit`.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import requests

SEARCH_URL = "https://kharma.unity3d.com/api/en-US/search/results.json"
HEADERS = {
    "User-Agent": "claude-code-unity-skill/1.0 (+https://claude.ai/code)",
    "Accept": "application/json",
}

# kharma's order_by values. "relevance" is the implicit default (no param).
SORT_MAP = {
    "relevance": None,
    "popularity": "popularity",
    "rating": "rating",
    "recent": "pubdate",
    "price": "price",
}

FREE_PRICES = {"0", "0.00", "Free", "free", 0, 0.0}
MAX_PAGES = 5  # safety cap when paging for free results


def _is_free(item: dict[str, Any]) -> bool:
    p = item.get("price_usd")
    if p in FREE_PRICES:
        return True
    try:
        return float(p) == 0.0
    except (TypeError, ValueError):
        return False


def _normalise(item: dict[str, Any]) -> dict[str, Any]:
    cat = item.get("category") or {}
    pub = item.get("publisher") or {}
    rating = item.get("rating") or {}
    slug = item.get("slug") or ""
    cat_slug = cat.get("slug_v2") or cat.get("slug") or ""
    url = (
        f"https://assetstore.unity.com/packages/{cat_slug}/{slug}"
        if cat_slug and slug
        else f"https://assetstore.unity.com/packages/slug/{item.get('id', '')}"
    )
    return {
        "id": str(item.get("id") or ""),
        "title": item.get("title") or item.get("title_english") or "",
        "publisher": pub.get("label") or pub.get("label_english") or "",
        "category": cat.get("label") or cat.get("label_english") or "",
        "rating": rating.get("average"),
        "rating_count": rating.get("count"),
        "price": item.get("price_usd") or "0",
        "pubdate": item.get("pubdate"),
        "url": url,
    }


def search(
    query: str,
    *,
    limit: int = 10,
    category: str | None = None,
    sort: str = "relevance",
    free_only: bool = True,
    debug: bool = False,
) -> list[dict[str, Any]]:
    # When filtering for free, force ascending price order so free assets
    # come first; otherwise honour the user's chosen sort.
    effective_sort = "price" if free_only else sort
    order_by = SORT_MAP.get(effective_sort)

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for page in range(1, MAX_PAGES + 1):
        params: dict[str, Any] = {"q": query, "page": page}
        if order_by:
            params["order_by"] = order_by
        if category:
            params["category"] = category

        resp = requests.get(SEARCH_URL, params=params, headers=HEADERS, timeout=20)
        if debug:
            print(f"[debug] GET {resp.url} -> {resp.status_code}", file=sys.stderr)
        resp.raise_for_status()
        data = resp.json()

        raw = data.get("results") or []
        if not raw:
            break

        any_free_in_page = False
        for item in raw:
            if free_only and not _is_free(item):
                continue
            any_free_in_page = True
            asset_id = str(item.get("id") or "")
            if not asset_id or asset_id in seen:
                continue
            seen.add(asset_id)
            out.append(_normalise(item))
            if len(out) >= limit:
                return out

        # If we asked for free and this page had none, stop paging — the
        # ascending-price sort means subsequent pages are all paid too.
        if free_only and not any_free_in_page:
            break
        # If we got a partial last page, stop.
        if len(raw) < 36:
            break

    return out


def format_text(results: list[dict[str, Any]]) -> str:
    if not results:
        return "No results."
    lines = []
    for i, r in enumerate(results, 1):
        title = r["title"] or "(untitled)"
        publisher = r["publisher"] or "?"
        rating = ""
        if r.get("rating"):
            rating = f"  {r['rating']}*"
            if r.get("rating_count"):
                rating += f" ({r['rating_count']})"
        category = f"  [{r['category']}]" if r.get("category") else ""
        lines.append(f"{i:>2}. [{r['id']}] {title} — {publisher}{rating}{category}")
        if r.get("url"):
            lines.append(f"     {r['url']}")
    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser(description="Search the Unity Asset Store for free assets.")
    p.add_argument("query", help="Search query (e.g. 'low poly character')")
    p.add_argument("--limit", type=int, default=10, help="Max results (default 10)")
    p.add_argument("--category", help="Asset Store category path filter")
    p.add_argument(
        "--sort",
        choices=list(SORT_MAP.keys()),
        default="relevance",
        help="Sort order (default relevance)",
    )
    p.add_argument(
        "--include-paid",
        action="store_true",
        help="Include paid assets (default: free only)",
    )
    p.add_argument("--json", action="store_true", help="Output JSON instead of text")
    p.add_argument("--debug", action="store_true", help="Print debug info to stderr")
    args = p.parse_args()

    try:
        results = search(
            args.query,
            limit=args.limit,
            category=args.category,
            sort=args.sort,
            free_only=not args.include_paid,
            debug=args.debug,
        )
    except requests.HTTPError as e:
        print(f"Asset Store search failed: {e}", file=sys.stderr)
        return 2
    except requests.RequestException as e:
        print(f"Network error: {e}", file=sys.stderr)
        return 2

    if args.json:
        json.dump(results, sys.stdout, indent=2)
        sys.stdout.write("\n")
    else:
        print(format_text(results))
    return 0


if __name__ == "__main__":
    sys.exit(main())
