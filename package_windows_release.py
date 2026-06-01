#!/usr/bin/env python3
"""Create a Windows-friendly release zip with UTF-8 filenames."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
APP_DIR = "app"
LAUNCHER_NAME = "点击启动服务.html"
DEFAULT_NAME = "NGR-AI-AutoName-Tool-V2.4-Windows.zip"

EXCLUDE_DIRS = {
    ".git",
    "__pycache__",
}

EXCLUDE_FILES = {
    ".DS_Store",
    ".gitignore",
    DEFAULT_NAME,
    LAUNCHER_NAME,
    "package_windows_release.py",
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


def write_utf8_file(archive: zipfile.ZipFile, arcname: str, data: bytes) -> None:
    info = zipfile.ZipInfo(arcname)
    info.flag_bits |= 0x800
    archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def write_file_from_disk(archive: zipfile.ZipFile, file_path: Path, arcname: str) -> None:
    info = zipfile.ZipInfo.from_file(file_path, arcname)
    info.flag_bits |= 0x800
    with file_path.open("rb") as source:
        archive.writestr(info, source.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def build_launcher() -> bytes:
    html = f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>启动 NGRAI辅助UI切图命名工具 V2.4</title>
    <meta http-equiv="refresh" content="0; url={APP_DIR}/index.html" />
  </head>
  <body>
    <script>
      window.location.replace("{APP_DIR}/index.html");
    </script>
    <p>正在启动 NGRAI辅助UI切图命名工具 V2.4，请稍候。</p>
    <p>如果没有自动打开，请点击 <a href="{APP_DIR}/index.html">这里启动</a>。</p>
  </body>
</html>
"""
    return html.encode("utf-8")


def archive_name_for(file_path: Path) -> str:
    rel = file_path.relative_to(ROOT).as_posix()
    return f"{APP_DIR}/{rel}"


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
        write_utf8_file(archive, LAUNCHER_NAME, build_launcher())
        for file_path in iter_files(args.include_local_config):
            write_file_from_disk(archive, file_path, archive_name_for(file_path))

    print(f"Windows release zip created: {output}")
    print(f"Release root contains only: {LAUNCHER_NAME}")
    if not args.include_local_config:
        print("Note: local-config.js was excluded to avoid leaking API keys.")


if __name__ == "__main__":
    main()
