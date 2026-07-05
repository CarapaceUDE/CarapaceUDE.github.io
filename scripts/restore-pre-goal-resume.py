#!/usr/bin/env python3
"""Restore scroll-hero + effects-goal state from Grok rewind_points.jsonl snapshots."""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SESSIONS = Path(
    r"C:\Users\Studio TM87\.grok\sessions"
    r"\C%3A%5CUsers%5CStudio%20TM87%5C.grok%5Cworktrees%5Cgithub-carapaceudegithubio%5Ccarapacesite"
)
HERO_SESSION = SESSIONS / "019f30dc-5cfb-7572-bbec-75d9d4d323ab"
EFFECTS_SESSION = SESSIONS / "019f3128-864b-7411-be37-3ebd1d90983b"
SNAPSHOT = Path(
    r"C:\Users\Studio TM87\AppData\Local\Temp\grok-goal-d9702c3cfe59\implementer\snapshot"
)

HTML_LINE = 15  # all 6 routes + site.css + site.js + nav-snippet @ 07:05
CSS_LINE = 16   # hero-home.css @ 07:10
EFFECTS_LINE = 0  # effects goal assets @ 07:23 (pre goal-resume)

ROUTES = [
    "index.html",
    "about.html",
    "business.html",
    "licensing.html",
    "solutions.html",
    "cortex.html",
]

OVERLAY_SKIP_PREFIXES = (
    "scripts/effects-hero-harness/",
    "scripts/effects-hero-harness\\",
)
OVERLAY_SKIP_FILES = {
    "scripts/build-effects-harness.mjs",
    "assets/effects-goal-contract.js",  # fixed separately
}


def load_rewind(path: Path, line_index: int) -> dict[str, dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    obj = json.loads(lines[line_index])
    return obj.get("file_snapshots") or {}


def write_snap(key: str, entry: dict, restored: list[str]) -> None:
    content = entry.get("content")
    if content is None:
        return
    dest = ROOT / key.replace("\\", "/")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8", newline="\n")
    rel = str(dest.relative_to(ROOT)).replace("\\", "/")
    if rel not in restored:
        restored.append(rel)


def fix_effects_contract(text: str) -> str:
    """Replace harness routes with production routes (pre-harness contract)."""
    text = re.sub(
        r"/\*\* Minimal scroll-hero pages.*?\*/\s*"
        r"export const EFFECTS_HARNESS_PREFIX = [^;]+;\s*",
        "",
        text,
        flags=re.DOTALL,
    )
    text = text.replace("${EFFECTS_HARNESS_PREFIX}/", "")
    text = re.sub(
        r"/\*\* One hero slide per interactive ID.*?\*/\s*"
        r"/\*\* One hero slide per shipped effect.*?\*/\s*",
        "/** One hero slide per shipped effect — route-based draw smoke via hero-core (E7). */\n",
        text,
        flags=re.DOTALL,
    )
    if "EFFECTS_HARNESS_PREFIX" in text:
        text = re.sub(r"\s*EFFECTS_HARNESS_PREFIX,\n", "\n", text)
    return text.rstrip() + "\n"


def main() -> int:
    restored: list[str] = []

    hero_rewind = HERO_SESSION / "rewind_points.jsonl"
    effects_rewind = EFFECTS_SESSION / "rewind_points.jsonl"
    if not hero_rewind.exists():
        print(f"FAIL missing {hero_rewind}")
        return 1
    if not effects_rewind.exists():
        print(f"FAIL missing {effects_rewind}")
        return 1

    # 1. Production HTML shells + shared site assets (latest hero migration)
    for key, entry in load_rewind(hero_rewind, HTML_LINE).items():
        write_snap(key, entry, restored)
    print(f"hero rewind line {HTML_LINE}: wrote route/site files")

    for key, entry in load_rewind(hero_rewind, CSS_LINE).items():
        write_snap(key, entry, restored)
    print(f"hero rewind line {CSS_LINE}: hero-home.css")

    # 2. Effects-goal assets from goal-set rewind (07:23)
    for key, entry in load_rewind(effects_rewind, EFFECTS_LINE).items():
        rel = key.replace("\\", "/")
        if rel.startswith(".verify-scratch/"):
            continue
        write_snap(key, entry, restored)
    print(f"effects rewind line {EFFECTS_LINE}: effects + hero JS")

    # 3. Overlay implementer snapshot (complete effects work), skip harness artifacts
    if SNAPSHOT.exists():
        for src in SNAPSHOT.rglob("*"):
            if not src.is_file():
                continue
            rel = src.relative_to(SNAPSHOT).as_posix()
            if rel in OVERLAY_SKIP_FILES:
                continue
            if any(rel.startswith(p.replace("\\", "/")) for p in OVERLAY_SKIP_PREFIXES):
                continue
            dest = ROOT / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            if rel not in restored:
                restored.append(rel)
        print(f"overlay snapshot: {SNAPSHOT}")

    # 4. Production effects contract (no harness)
    contract_src = SNAPSHOT / "assets" / "effects-goal-contract.js"
    if contract_src.exists():
        contract = fix_effects_contract(contract_src.read_text(encoding="utf-8"))
        (ROOT / "assets/effects-goal-contract.js").write_text(contract, encoding="utf-8", newline="\n")
        print("fixed effects-goal-contract.js -> production routes")

    # 5. Remove harness debris if present
    harness = ROOT / "scripts/effects-hero-harness"
    if harness.exists():
        shutil.rmtree(harness)
        print("removed scripts/effects-hero-harness/")
    for rel in ("scripts/build-effects-harness.mjs",):
        p = ROOT / rel
        if p.exists():
            p.unlink()
            print(f"removed {rel}")

    # 6. Verify
    print("\n=== route check ===")
    ok = True
    for name in ROUTES:
        p = ROOT / name
        if not p.exists():
            print(f"FAIL missing {name}")
            ok = False
            continue
        text = p.read_text(encoding="utf-8")
        hs = "hero-stage" in text
        hc = "home-carousel" in text
        status = "PASS" if hs and not hc else "FAIL"
        print(f"{status} {name}: hero-stage={hs} carousel={hc}")
        if status == "FAIL":
            ok = False

    contract = (ROOT / "assets/effects-goal-contract.js").read_text(encoding="utf-8")
    harness_ok = "EFFECTS_HARNESS" not in contract
    print(f"\n{'PASS' if harness_ok else 'FAIL'} contract: no harness prefix")
    if not harness_ok:
        ok = False

    key_assets = [
        "assets/effects-anime.js",
        "assets/hero-core.js",
        "assets/hero-home.js",
        "assets/hero-home.css",
        "assets/text-anime.js",
        "assets/chip-interactions.js",
        "docs/effects-audit.md",
    ]
    print("\n=== asset check ===")
    for rel in key_assets:
        exists = (ROOT / rel).exists()
        print(f"{'PASS' if exists else 'FAIL'} {rel}")
        if not exists:
            ok = False

    print(f"\n{'OK' if ok else 'INCOMPLETE'} restored {len(restored)} paths")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())