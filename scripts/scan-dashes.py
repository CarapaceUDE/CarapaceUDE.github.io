#!/usr/bin/env python3
"""Scan user-facing files for unicode clause dashes."""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DASHES = "\u2010\u2011\u2012\u2013\u2014\u2015\u2212"
SKIP_PARTS = {"terminals", "node_modules", ".git", "agent-tools", ".verify-scratch", "__pycache__", "baseline"}
SKIP_FILES = {"remove-em-dashes.py", "scan-dashes.py", "test-hero-copy.mjs", "copy-sanitize.js"}

def should_scan(path: pathlib.Path) -> bool:
    if any(s in path.parts for s in SKIP_PARTS):
        return False
    if path.name in SKIP_FILES:
        return False
    return path.suffix in {".html", ".js", ".css", ".md", ".txt"}

def main() -> int:
    hits_total = 0
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or not should_scan(path):
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        hits = []
        for i, line in enumerate(text.splitlines(), 1):
            if any(d in line for d in DASHES):
                hits.append((i, line.strip()[:140]))
        if hits:
            rel = path.relative_to(ROOT)
            print(f"=== {rel} ({len(hits)} hits) ===")
            for i, line in hits[:12]:
                print(f"  {i}: {line}")
            if len(hits) > 12:
                print(f"  ... +{len(hits) - 12} more")
            hits_total += len(hits)
    print(f"\nTotal dash hits: {hits_total}")
    return 1 if hits_total else 0

if __name__ == "__main__":
    raise SystemExit(main())