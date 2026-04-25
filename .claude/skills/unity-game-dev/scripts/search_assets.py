#!/usr/bin/env python3
"""Search the Unity Asset Store for free assets.

Uses the public search endpoint at assetstore.unity.com. Results are
filtered to free assets by default. Output is either a human-readable
list or JSON suitable for piping into download_asset.py.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import requests

SEARCH_URL = "https://assetstore.unity.com/api/search"
HEADERS = {
    "User-Agent": "claude-code-unity-skill/1.0 (+https://claude.ai/code)",
    "Accept": "application/json",
}

SORT_MAP = {
    "relevance": "relevance",
    "popularity": "popularity",
    "rating": "rating",
    "recent": "publish_date",
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
    params: dict[str, Any] = {
        "q": query,
        "rows": max(1, min(limit, 100)),
        "start": 0,
        "order_by": SORT_MAP.get(sort, "relevance"),
    }
    if free_only:
        # The asset store accepts both `price=0` and `pricing=Free` depending
        # on the endpoint version; send both for compatibility.
        params["price"] = "0"
        params["pricing"] = "Free"
    if category:
        params["category"] = category

    resp = requests.get(SEARCH_URL, params=params, headers=HEADERS, timeout=20)
    if debug:
        print(f"[debug] GET {resp.url} -> {resp.status_code}", file=sys.stderr)
    resp.raise_for_status()
    data = resp.json()

    # The endpoint returns either {"results": [...]} or {"groups": [...]}
    # depending on which backend serves the request. Normalise to a list.
    raw = data.get("results") or data.get("matches") or []
    if not raw and "groups" in data:
        for group in data["groups"]:
            raw.extend(group.get("results", []))

    out: list[dict[str, Any]] = []
    for item in raw:
        price = item.get("price") or item.get("price_usd") or "0"
        if free_only and str(price) not in {"0", "0.00", "Free", "free"}:
            continue
        asset_id = str(item.get("id") or item.get("packageId") or item.get("slug_id") or "")
        slug = item.get("slug") or ""
        url = item.get("url")
        if not url and asset_id:
            url = f"https://assetstore.unity.com/packages/slug/{asset_id}"
            if slug:
                url = f"https://assetstore.unity.com/packages/{slug}-{asset_id}"
        out.append(
            {
                "id": asset_id,
                "title": item.get("title") or item.get("name") or "",
                "publisher": (item.get("publisher") or {}).get("name")
                if isinstance(item.get("publisher"), dict)
                else item.get("publisher") or "",
                "rating": item.get("rating") or item.get("avg_rating"),
                "price": price,
                "url": url,
                "category": item.get("category") or item.get("category_name") or "",
            }
        )
    return out[:limit]


def format_text(results: list[dict[str, Any]]) -> str:
    if not results:
        return "No results."
    lines = []
    for i, r in enumerate(results, 1):
        title = r["title"] or "(untitled)"
        publisher = r["publisher"] or "?"
        rating = f" {r['rating']}*" if r.get("rating") else ""
        lines.append(f"{i:>2}. [{r['id']}] {title} — {publisher}{rating}")
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
