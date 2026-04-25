#!/usr/bin/env python3
"""Import a .unitypackage into a Unity project using batch mode.

Runs:
    <unity> -batchmode -nographics -quit -projectPath <project> \
            -importPackage <package> -logFile -

Unity must be installed locally. The path is auto-detected from
$UNITY_PATH or common install locations; override with --unity.
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

COMMON_UNITY_PATHS = {
    "Darwin": [
        "/Applications/Unity/Hub/Editor/*/Unity.app/Contents/MacOS/Unity",
        "/Applications/Unity/Unity.app/Contents/MacOS/Unity",
    ],
    "Linux": [
        "/opt/unity/Editor/Unity",
        "/opt/Unity/Editor/Unity",
        "~/Unity/Hub/Editor/*/Editor/Unity",
    ],
    "Windows": [
        r"C:\Program Files\Unity\Hub\Editor\*\Editor\Unity.exe",
        r"C:\Program Files\Unity\Editor\Unity.exe",
    ],
}


def find_unity() -> str | None:
    env = os.environ.get("UNITY_PATH")
    if env and Path(env).expanduser().exists():
        return str(Path(env).expanduser())

    on_path = shutil.which("Unity") or shutil.which("unity")
    if on_path:
        return on_path

    import glob

    for pattern in COMMON_UNITY_PATHS.get(platform.system(), []):
        matches = sorted(glob.glob(str(Path(pattern).expanduser())))
        if matches:
            # Prefer the highest-versioned install (lexicographic sort is fine
            # for typical "20XX.Y.Z" version directories).
            return matches[-1]
    return None


def import_package(unity: str, project: Path, package: Path, quit_after: bool) -> int:
    if not project.exists():
        print(f"Project path does not exist: {project}", file=sys.stderr)
        return 2
    if not package.exists():
        print(f"Package not found: {package}", file=sys.stderr)
        return 2

    cmd = [
        unity,
        "-batchmode",
        "-nographics",
        "-projectPath",
        str(project.resolve()),
        "-importPackage",
        str(package.resolve()),
        "-logFile",
        "-",
    ]
    if quit_after:
        cmd.append("-quit")

    print(f"Running: {' '.join(cmd)}", file=sys.stderr)
    try:
        result = subprocess.run(cmd, check=False)
    except FileNotFoundError:
        print(f"Unity executable not runnable: {unity}", file=sys.stderr)
        return 2
    return result.returncode


def main() -> int:
    p = argparse.ArgumentParser(description="Import a .unitypackage into a Unity project.")
    p.add_argument("package", help="Path to the .unitypackage file")
    p.add_argument("--project", required=True, help="Path to the Unity project")
    p.add_argument(
        "--unity",
        help="Path to the Unity executable (overrides $UNITY_PATH and auto-detect)",
    )
    p.add_argument(
        "--no-quit",
        action="store_true",
        help="Do not pass -quit (leaves Unity running; useful for debugging)",
    )
    args = p.parse_args()

    unity = args.unity or find_unity()
    if not unity:
        print(
            "Could not locate the Unity executable. "
            "Set $UNITY_PATH or pass --unity <path>.",
            file=sys.stderr,
        )
        return 2

    return import_package(
        unity=unity,
        project=Path(args.project).expanduser(),
        package=Path(args.package).expanduser(),
        quit_after=not args.no_quit,
    )


if __name__ == "__main__":
    sys.exit(main())
