#!/usr/bin/env python3
import json
from pathlib import Path

base = Path(r"C:\Users\Studio TM87\.grok\sessions\C%3A%5CUsers%5CStudio%20TM87%5C.grok%5Cworktrees%5Cgithub-carapaceudegithubio%5Ccarapacesite")
routes = ["index.html", "about.html", "business.html", "licensing.html", "solutions.html", "cortex.html"]

for rp in sorted(base.glob("*/rewind_points.jsonl")):
    for i, line in enumerate(rp.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        snaps = obj.get("file_snapshots") or {}
        hits = []
        for r in routes:
            for k, v in snaps.items():
                if k.replace("\\", "/").endswith(r):
                    c = v.get("content", "")
                    if "hero-stage" in c and "hero-home" in c:
                        hits.append(r)
                    break
        if hits:
            print(f"{rp.parent.name} line{i} prompt={obj.get('prompt_index')} at={obj.get('created_at')} routes={hits} total={len(snaps)}")