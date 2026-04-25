---
name: unity-game-dev
description: Use this skill when working on Unity game development tasks that need external resources - searching for, downloading, and importing free Unity Asset Store assets (3D models, textures, sounds, scripts, shaders, particle effects, UI kits) into a Unity project. Trigger on requests like "find a free Unity asset for X", "download asset Y from the Unity Asset Store", "import this .unitypackage", or "add a free 3D character/skybox/sound effect to my Unity project".
---

# Unity Game Development

Tools and workflows for sourcing game-development resources for Unity projects. The current capability is the Unity Asset Store helper: search for free assets, download `.unitypackage` files, and import them into a Unity project.

## Tools

All tools live in `scripts/` next to this file. They are plain Python 3 scripts. Install dependencies once with:

```bash
pip install -r scripts/requirements.txt
```

### 1. Search (`scripts/search_assets.py`)

Search the Unity Asset Store. Always restricted to free assets unless the caller explicitly asks otherwise.

```bash
python scripts/search_assets.py "low poly character" --limit 10
python scripts/search_assets.py "skybox" --category "2D/Textures & Materials/Sky" --json
```

Output (default): a numbered list of `<id> | <title> | <publisher> | <url>`. With `--json`: machine-readable JSON suitable for piping into `download_asset.py`.

Useful flags:
- `--limit N` — number of results (default 10)
- `--category <path>` — Asset Store category path
- `--sort relevance|popularity|rating|recent` (default `relevance`)
- `--json` — emit JSON instead of a text list

### 2. Download (`scripts/download_asset.py`)

Download a free asset by Asset Store ID or URL. Saves a `.unitypackage` file.

```bash
python scripts/download_asset.py 123456 --out ./assets-cache/
python scripts/download_asset.py https://assetstore.unity.com/packages/3d/foo-123456 --out ./assets-cache/
```

Authentication: downloading from the Asset Store requires a Unity ID. Provide it via either:
- `UNITY_SESSION_COOKIE` environment variable (the `kharma_session` cookie from a logged-in browser), **recommended**, or
- `UNITY_EMAIL` and `UNITY_PASSWORD` environment variables (the script will log in for you).

If neither is set, the script prints clear setup instructions and exits non-zero. **Never** prompt the user for credentials in chat — direct them to set the env vars.

### 3. Import (`scripts/import_asset.py`)

Import a `.unitypackage` into a Unity project using Unity's batch-mode CLI.

```bash
python scripts/import_asset.py ./assets-cache/foo.unitypackage --project ./MyUnityProject
```

Flags:
- `--project <path>` — path to the Unity project (required)
- `--unity <path>` — path to the Unity executable; auto-detected from `UNITY_PATH` env var or common install locations if omitted
- `--quit` — quit Unity after import (default: true)

The import runs Unity in batch mode with `-importPackage`, so the project does not need to be open in the editor. Build/import logs go to stdout.

## Typical end-to-end flow

When asked to add a free asset to a Unity project:

1. **Search** with a query that matches the user's request. Show the top 3-5 results so the user can confirm the choice.
2. **Confirm** which asset to use before downloading — asset names can be ambiguous and the user may prefer a specific publisher or version.
3. **Download** the chosen asset by ID. Cache under `./assets-cache/` (or another agreed path) so re-runs are cheap.
4. **Import** into the Unity project at the path the user specifies. If no Unity project exists yet, ask before creating one.
5. Report back with the asset name, where it was placed in the project, and any post-import steps the publisher's docs call out (e.g. enabling a render pipeline, setting input system).

## Notes & limits

- Only **free** assets are supported by the download tool. Paid assets require a purchase flow that this skill does not perform.
- The Asset Store occasionally changes its internal API. If `search_assets.py` returns empty results despite a known-good query, run with `--debug` to see the raw response and report the URL/payload so the script can be updated.
- Unity batch-mode imports do **not** run editor scripts that require a GUI. Some assets that rely on a setup wizard will need a manual step in the editor after import — surface this to the user when applicable.
- This skill is the foundation for a broader Unity game-dev resource toolkit. Future tools (HDRP/URP setup, scene templates, package manager helpers) should live in this same `scripts/` directory and be documented here.
