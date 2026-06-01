#!/usr/bin/env python3
"""Create a Windows-friendly release zip with UTF-8 filenames."""

from __future__ import annotations

import argparse
import os
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEFAULT_NAME = "NGR-AI-AutoName-Tool-V2.3-Windows.zip"

EXCLUDE_DIRS = {
    ".git",
    "__pycache__",
}

EXCLUDE_FILES = {
    ".DS_Store",
    DEFAULT_NAME,
}

SECRET_FILES = {
    "local-config.js",
}


def should_skip(path: Path, include_local_config: bool) -> bool:
    rel_parts = path.relative_to(ROOT).parts
    if any(part in EXCLUDE_DIRS for part in rel_parts):
        return True
    if path.name in EXCLUDE_FILES:
        return True
    if not include_local_config and path.name in SECRET_FILES:
        return True
    if path.suffix == ".zip":
        return True
    return False


def iter_files(include_local_config: bool):
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and not should_skip(path, include_local_config):
            yield path


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a Windows-friendly release zip.")
    parser.add_argument(
        "--output",
        default=str(ROOT / DEFAULT_NAME),
        help="Output zip path. Defaults to project root release zip.",
    )
    parser.add_argument(
        "--include-local-config",
        action="store_true",
        help="Include API配置文件/local-config.js. Only use this for your own trusted devices.",
    )
    args = parser.parse_args()

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file_path in iter_files(args.include_local_config):
            arcname = file_path.relative_to(ROOT).as_posix()
            info = zipfile.ZipInfo.from_file(file_path, arcname)
            info.flag_bits |= 0x800
            with file_path.open("rb") as source:
                archive.writestr(info, source.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    print(f"Windows release zip created: {output}")
    if not args.include_local_config:
        print("Note: local-config.js was excluded to avoid leaking API keys.")


if __name__ == "__main__":
    main()
