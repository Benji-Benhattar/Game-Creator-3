#!/usr/bin/env python3
"""Download a free asset from the Unity Asset Store.

Authentication is required. Provide one of:
  - UNITY_SESSION_COOKIE  (the `kharma_session` cookie from a logged-in browser)
  - UNITY_EMAIL + UNITY_PASSWORD  (the script will perform the login flow)

The script:
  1. Resolves the package id (from a URL or a numeric id)
  2. Adds the asset to the user's library if not already there (free only)
  3. Fetches the signed download URL
  4. Streams the .unitypackage to disk
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

ASSETSTORE = "https://assetstore.unity.com"
PACKAGE_INFO_URL = f"{ASSETSTORE}/api/aapi/asset/{{id}}"
ADD_TO_LIBRARY_URL = f"{ASSETSTORE}/api/account/license/{{id}}.json"
DOWNLOAD_INFO_URL = (
    "https://kharma.unity3d.com/api/en-US/account/downloads/start.json?package_id={id}"
)

HEADERS = {
    "User-Agent": "claude-code-unity-skill/1.0 (+https://claude.ai/code)",
    "Accept": "application/json",
}

LOGIN_INSTRUCTIONS = """\
Unity Asset Store downloads require authentication. Set ONE of:

  export UNITY_SESSION_COOKIE='<kharma_session cookie value>'
      (open assetstore.unity.com in a logged-in browser, copy the
       'kharma_session' cookie value from devtools)

  export UNITY_EMAIL='you@example.com'
  export UNITY_PASSWORD='...'
      (the script will log in for you)

Then re-run download_asset.py.
"""


def parse_asset_id(arg: str) -> str:
    """Accept a numeric id or an Asset Store URL and return the numeric id."""
    if arg.isdigit():
        return arg
    parsed = urlparse(arg)
    # URLs look like /packages/<category>/<slug>-<id> or /packages/slug/<id>
    m = re.search(r"-(\d+)/?$", parsed.path)
    if m:
        return m.group(1)
    m = re.search(r"/(\d+)/?$", parsed.path)
    if m:
        return m.group(1)
    raise ValueError(f"Could not extract asset id from: {arg!r}")


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)

    cookie = os.environ.get("UNITY_SESSION_COOKIE")
    if cookie:
        s.cookies.set("kharma_session", cookie, domain=".unity.com")
        s.cookies.set("kharma_session", cookie, domain=".unity3d.com")
        return s

    email = os.environ.get("UNITY_EMAIL")
    password = os.environ.get("UNITY_PASSWORD")
    if email and password:
        login(s, email, password)
        return s

    print(LOGIN_INSTRUCTIONS, file=sys.stderr)
    sys.exit(3)


def login(session: requests.Session, email: str, password: str) -> None:
    """Best-effort Unity ID login.

    Unity's auth flow goes through id.unity.com with CSRF tokens. We fetch
    the login page to pick up the token, then post credentials. This is
    the brittle path — UNITY_SESSION_COOKIE is preferred.
    """
    login_page = session.get("https://id.unity.com/en/conversations/new", timeout=20)
    login_page.raise_for_status()
    csrf = re.search(
        r'name="csrf-token"\s+content="([^"]+)"', login_page.text
    ) or re.search(
        r'name="authenticity_token"\s+value="([^"]+)"', login_page.text
    )
    if not csrf:
        raise RuntimeError(
            "Could not find CSRF token on Unity login page. "
            "Use UNITY_SESSION_COOKIE instead."
        )
    payload = {
        "authenticity_token": csrf.group(1),
        "conversation[email]": email,
        "conversation[password]": password,
    }
    resp = session.post(
        "https://id.unity.com/en/conversations",
        data=payload,
        headers={"X-CSRF-Token": csrf.group(1)},
        timeout=20,
        allow_redirects=True,
    )
    resp.raise_for_status()
    if "kharma_session" not in session.cookies.get_dict(domain=".unity.com") and \
       "kharma_session" not in session.cookies.get_dict():
        raise RuntimeError(
            "Login did not produce a kharma_session cookie. "
            "Verify UNITY_EMAIL/UNITY_PASSWORD or use UNITY_SESSION_COOKIE."
        )


def get_package_info(session: requests.Session, asset_id: str) -> dict[str, Any]:
    resp = session.get(PACKAGE_INFO_URL.format(id=asset_id), timeout=20)
    resp.raise_for_status()
    return resp.json()


def ensure_in_library(session: requests.Session, asset_id: str) -> None:
    """Add a free asset to the account library if not already there."""
    resp = session.put(ADD_TO_LIBRARY_URL.format(id=asset_id), timeout=20)
    if resp.status_code in (200, 201, 204):
        return
    if resp.status_code == 409:
        # Already in library.
        return
    raise RuntimeError(
        f"Failed to add asset {asset_id} to library "
        f"(HTTP {resp.status_code}): {resp.text[:300]}"
    )


def get_download_info(session: requests.Session, asset_id: str) -> dict[str, Any]:
    resp = session.get(DOWNLOAD_INFO_URL.format(id=asset_id), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    # Response shape: {"download": {"url": "...", "filename_safe_package_name": "..."}}
    if "download" not in data:
        raise RuntimeError(
            f"Unexpected download-info response for {asset_id}: {data}"
        )
    return data["download"]


def stream_download(session: requests.Session, url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with session.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        total = int(r.headers.get("Content-Length") or 0)
        written = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 16):
                if not chunk:
                    continue
                f.write(chunk)
                written += len(chunk)
                if total:
                    pct = written * 100 // total
                    print(f"\r  {pct:3d}%  {written:>10} / {total} bytes", end="", file=sys.stderr)
        if total:
            print("", file=sys.stderr)
    return dest


def safe_filename(info: dict[str, Any], asset_id: str) -> str:
    name = (
        info.get("filename_safe_package_name")
        or info.get("filename")
        or f"asset-{asset_id}"
    )
    if not name.endswith(".unitypackage"):
        name += ".unitypackage"
    return name


def main() -> int:
    p = argparse.ArgumentParser(description="Download a free Unity Asset Store asset.")
    p.add_argument("asset", help="Asset id (numeric) or Asset Store URL")
    p.add_argument(
        "--out", default="./assets-cache", help="Output directory (default ./assets-cache)"
    )
    p.add_argument(
        "--filename",
        help="Override output filename (defaults to publisher-provided name)",
    )
    args = p.parse_args()

    try:
        asset_id = parse_asset_id(args.asset)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        return 2

    session = make_session()

    try:
        info = get_package_info(session, asset_id)
        title = (
            (info.get("aaContent") or {}).get("title")
            or info.get("title")
            or f"asset-{asset_id}"
        )
        price = (
            (info.get("productRatings") or {}).get("price")
            or info.get("price")
            or "0"
        )
        if str(price) not in {"0", "0.00", "Free", "free"}:
            print(
                f"Asset {asset_id} ({title!r}) is not free (price={price}). "
                "This tool only downloads free assets.",
                file=sys.stderr,
            )
            return 4

        print(f"Adding {title!r} (id {asset_id}) to library...", file=sys.stderr)
        ensure_in_library(session, asset_id)

        print("Requesting download URL...", file=sys.stderr)
        dl = get_download_info(session, asset_id)

        out_dir = Path(args.out)
        filename = args.filename or safe_filename(dl, asset_id)
        dest = out_dir / filename

        print(f"Downloading to {dest}", file=sys.stderr)
        stream_download(session, dl["url"], dest)
        print(str(dest))  # stdout = path, easy to pipe
        return 0
    except requests.HTTPError as e:
        print(f"HTTP error: {e}", file=sys.stderr)
        return 2
    except RuntimeError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
