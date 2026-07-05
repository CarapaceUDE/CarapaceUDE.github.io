#!/usr/bin/env python3
"""Run plan verification steps; write evidence to scratch dir."""
import io
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRATCH = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / ".verify-scratch"
IMPLEMENTER_SCRATCH = Path(
    os.environ.get(
        "GROK_IMPLEMENTER_SCRATCH",
        r"C:\Users\STUDIO~1\AppData\Local\Temp\grok-goal-bea63596753a\implementer",
    )
)
REPO_SCRATCH = ROOT / ".verify-scratch"
SCRATCH.mkdir(parents=True, exist_ok=True)
BASE = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8765"

ROUTES = [
    "index.html",
    "business.html",
    "solutions.html",
    "about.html",
    "cortex.html",
    "licensing.html",
    "carapace.html",
]

HERO_ROUTES = [
    "index.html",
    "about.html",
    "business.html",
    "licensing.html",
    "solutions.html",
    "cortex.html",
]

HERO_MODULES = {
    "index.html": "assets/hero-home.js",
    "about.html": "assets/hero-about.js",
    "business.html": "assets/hero-business.js",
    "licensing.html": "assets/hero-licensing.js",
    "solutions.html": "assets/hero-solutions.js",
    "cortex.html": "assets/hero-cortex.js",
}

INNER_HERO = [
    "about.html",
    "business.html",
    "licensing.html",
    "solutions.html",
    "cortex.html",
]

FORBIDDEN_INNER = [
    "carousel-track",
    "about-legacy",
    "data-lightbox",
    "cortex-bloom-bg",
    "pages-craft.css",
]

COPY_STRINGS = [
    "Own Your Intelligence",
    "Book the Discovery Sprint",
    "Carapace",
    "Cortex",
    "Keep leads and clients from slipping",
]

HERO_MARKERS = ["hero-stage", "slide-content", "pinned"]
CAROUSEL_REF = "home-carousel-react"

SCROLL_HERO_ASSETS = [
    "assets/effects-anime.js",
    "assets/hero-constants.js",
]

CACHE_TOKEN = "20260705c"

COMPLETION_SLICES = [
    "completion-slice-a",
    "completion-slice-b",
    "completion-slice-c",
    "completion-slice-e",
]


class _Tee:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data):
        for stream in self.streams:
            stream.write(data)

    def flush(self):
        for stream in self.streams:
            stream.flush()


def _licensing_pilot_blocks(lic_text: str) -> tuple[str, str]:
    s4 = lic_text.find('eyebrow: "Commercial Deploy"')
    s5 = lic_text.find('eyebrow: "Support Additive"')
    s6 = lic_text.find('eyebrow: "Agreements"')
    if s4 < 0 or s5 < 0 or s6 < 0:
        return "", ""
    return lic_text[s4:s5], lic_text[s5:s6]


def _hsla_count(text: str) -> int:
    return text.count("hsla(")


def _rgba_count(text: str) -> int:
    return text.count("rgba(")


def _backdrop_non_none_count(css: str) -> int:
    count = 0
    for line in css.splitlines():
        if "backdrop-filter" not in line:
            continue
        if re.search(r"backdrop-filter:\s*none", line):
            continue
        count += 1
    return count


def _evidence_patterns() -> tuple[str, ...]:
    return ("*.log", "*.png")


def _evidence_extra_files() -> tuple[str, ...]:
    return (
        "CHANGED_FILES",
        "effects-goal.patch",
        "effects-goal-changed-files.log",
        "worktree-out-of-scope.log",
    )


def clear_evidence_dirs(*dirs: Path) -> None:
    """Remove prior run artifacts so evidence reflects a single verify pass."""
    for d in dirs:
        d = d.resolve()
        if not d.exists():
            continue
        for pattern in _evidence_patterns():
            for f in d.glob(pattern):
                f.unlink(missing_ok=True)


def mirror_evidence(src: Path, dest: Path) -> None:
    """Copy src evidence to dest and delete dest files absent from src."""
    src = src.resolve()
    dest = dest.resolve()
    if dest == src:
        return
    dest.mkdir(parents=True, exist_ok=True)
    src_names: set[str] = set()
    for pattern in _evidence_patterns():
        for f in src.glob(pattern):
            src_names.add(f.name)
            shutil.copy2(f, dest / f.name)
    for name in _evidence_extra_files():
        extra = src / name
        if extra.is_file():
            src_names.add(name)
            shutil.copy2(extra, dest / name)
    for pattern in _evidence_patterns():
        for f in dest.glob(pattern):
            if f.name not in src_names:
                f.unlink(missing_ok=True)
    for name in _evidence_extra_files():
        if name not in src_names and (dest / name).exists():
            (dest / name).unlink(missing_ok=True)


def sync_evidence(src: Path) -> None:
    src = src.resolve()
    synced = []
    for dest in (REPO_SCRATCH, IMPLEMENTER_SCRATCH):
        mirror_evidence(src, dest)
        if dest.resolve() != src:
            synced.append(str(dest))
    if synced:
        print(f"Synced evidence to {', '.join(synced)}")
    else:
        print(f"Evidence in {src}")


def fetch(url: str) -> tuple[int, str]:
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return 0, str(e)


def craft_unification_gate() -> tuple[bool, list[str]]:
    lines = []
    ok = True

    site_css = (ROOT / "assets/site.css").read_text(encoding="utf-8")
    for pat in [r"Roboto Mono", r"Manrope"]:
        if re.search(pat, site_css):
            lines.append(f"FAIL site.css contains {pat}")
            ok = False
        else:
            lines.append(f"PASS site.css no {pat}")
    rgba_site = len(re.findall(r"rgba\(", site_css))
    if rgba_site:
        lines.append(f"FAIL site.css hardcoded rgba(): {rgba_site}")
        ok = False
    else:
        lines.append("PASS site.css no hardcoded rgba()")
    for rel in SCROLL_HERO_ASSETS:
        path = ROOT / rel
        if not path.exists():
            lines.append(f"FAIL {rel}: missing")
            ok = False
            continue
        text = path.read_text(encoding="utf-8")
        if rel.endswith("effects-anime.js"):
            hsla = _hsla_count(text)
            rgba = _rgba_count(text)
            if hsla or rgba:
                lines.append(f"FAIL {rel}: hsla()={hsla} rgba()={rgba}")
                ok = False
            elif "readToken" not in text and "colorAtHue" not in text:
                lines.append(f"FAIL {rel}: missing craft color helper")
                ok = False
            else:
                lines.append(f"PASS {rel}: craft token colors")
        else:
            lines.append(f"PASS {rel}: present")

    if any(
        "cortex-bloom-bg" in (ROOT / p).read_text(encoding="utf-8")
        for p in INNER_HERO
        if (ROOT / p).exists()
    ):
        lines.append("FAIL inner pages: cortex-bloom-bg.js still referenced")
        ok = False
    else:
        lines.append("PASS inner pages: no cortex-bloom-bg.js reference")

    pages_css = ROOT / "assets/pages.css"
    if pages_css.exists():
        pc = pages_css.read_text(encoding="utf-8")
        rgba_hero = len(re.findall(r"background-image:[^;]*rgba\(", pc))
        if rgba_hero:
            lines.append(f"FAIL pages.css rgba hero backgrounds: {rgba_hero}")
            ok = False
        else:
            lines.append("PASS pages.css no rgba hero backgrounds")

    for name in HERO_ROUTES:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        if "hero-stage" not in text:
            lines.append(f"FAIL {name}: missing hero-stage")
            ok = False
        if "hero-home.css" not in text:
            lines.append(f"FAIL {name}: missing hero-home.css")
            ok = False
        mod = HERO_MODULES.get(name)
        if mod and mod not in text:
            lines.append(f"FAIL {name}: missing {mod}")
            ok = False
        if name in INNER_HERO:
            for bad in FORBIDDEN_INNER:
                if bad in text:
                    lines.append(f"FAIL {name}: contains forbidden {bad}")
                    ok = False
        if not any(l.startswith(f"FAIL {name}") for l in lines):
            lines.append(f"PASS {name}: scroll-hero contract")

    carapace = (ROOT / "carapace.html").read_text(encoding="utf-8")
    if "cortex.html" not in carapace:
        lines.append("FAIL carapace.html: no redirect to cortex.html")
        ok = False
    else:
        lines.append("PASS carapace.html: redirects to cortex.html")

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "craft-unification-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote craft-unification-check.log")
    return ok, lines


def craft_effects_gate() -> tuple[bool, list[str]]:
    """Effects-goal craft checks — scroll-hero assets + harness only (site.css out of scope)."""
    lines = ["craft effects gate", f"scratch={SCRATCH.resolve()}", ""]
    ok = True

    hero_css = ROOT / "assets/hero-home.css"
    if hero_css.exists():
        lines.append("PASS assets/hero-home.css present")
    else:
        lines.append("FAIL assets/hero-home.css missing")
        ok = False

    for rel in SCROLL_HERO_ASSETS:
        path = ROOT / rel
        if not path.exists():
            lines.append(f"FAIL {rel}: missing")
            ok = False
            continue
        text = path.read_text(encoding="utf-8")
        if rel.endswith("effects-anime.js"):
            hsla = _hsla_count(text)
            rgba = _rgba_count(text)
            if hsla or rgba:
                lines.append(f"FAIL {rel}: hsla()={hsla} rgba()={rgba}")
                ok = False
            elif "readToken" not in text and "colorAtHue" not in text:
                lines.append(f"FAIL {rel}: missing craft color helper")
                ok = False
            else:
                lines.append(f"PASS {rel}: craft token colors")
        else:
            lines.append(f"PASS {rel}: present")

    harness_dir = ROOT / "scripts/effects-hero-harness"
    if not harness_dir.is_dir():
        lines.append("FAIL scripts/effects-hero-harness missing")
        ok = False
    else:
        expected_pages = [
            "index.html", "about.html", "business.html",
            "licensing.html", "solutions.html", "cortex.html",
        ]
        harness_pages = sorted(p.name for p in harness_dir.glob("*.html"))
        if harness_pages != sorted(expected_pages):
            lines.append(f"FAIL harness pages: {harness_pages}")
            ok = False
        else:
            lines.append(f"PASS harness pages: {len(harness_pages)} routes")
        for name in expected_pages:
            text = (harness_dir / name).read_text(encoding="utf-8")
            if "hero-stage" not in text or 'id="field"' not in text:
                lines.append(f"FAIL harness {name}: missing hero-stage/field")
                ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "craft-unification-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote craft-unification-check.log")
    return ok, lines


def structural_gate() -> tuple[bool, list[str]]:
    lines = []
    ok = True

    core = ROOT / "assets/hero-core.js"
    if not core.exists():
        lines.append("FAIL assets/hero-core.js missing")
        ok = False
    else:
        core_text = core.read_text(encoding="utf-8")
        if "initScrollHero" not in core_text:
            lines.append("FAIL hero-core.js: initScrollHero missing")
            ok = False
        else:
            lines.append("PASS hero-core.js exists")

    home = (ROOT / "assets/hero-home.js").read_text(encoding="utf-8")
    if "hero-core.js" not in home:
        lines.append("FAIL hero-home.js: does not import hero-core")
        ok = False
    else:
        lines.append("PASS hero-home.js imports hero-core")

    for route, mod in HERO_MODULES.items():
        if route == "index.html":
            continue
        p = ROOT / mod
        if not p.exists():
            lines.append(f"FAIL {mod}: missing")
            ok = False
        elif "hero-core.js" not in p.read_text(encoding="utf-8"):
            lines.append(f"FAIL {mod}: does not import hero-core")
            ok = False
        else:
            lines.append(f"PASS {mod}")

    hero_html = [f for f in ROOT.glob("*.html") if "hero-stage" in f.read_text(encoding="utf-8")]
    hero_names = sorted(p.name for p in hero_html)
    expected = sorted(HERO_ROUTES)
    if hero_names != expected:
        lines.append(f"FAIL hero-stage files: {hero_names} (expected {expected})")
        ok = False
    else:
        lines.append(f"PASS hero-stage on {len(expected)} routes")

    effects = (ROOT / "assets/effects-anime.js").read_text(encoding="utf-8")
    effect_ids = [
        "shield", "cascade", "mesh", "stack", "magnet", "signal", "chrono", "ping",
        "flowchart", "pcb", "topology", "pipeline", "constellation", "vault", "schematic",
        "isograph", "sonar", "ledger", "weave", "orbit", "relay", "seal", "glyph",
    ]
    for eid in effect_ids:
        if f'id === "{eid}"' not in effects:
            lines.append(f"FAIL effects-anime.js: missing {eid}")
            ok = False
    if all(f'id === "{eid}"' in effects for eid in effect_ids):
        lines.append(f"PASS effects-anime.js: {len(effect_ids)} effect ids present")

    hero_core = (ROOT / "assets/hero-core.js").read_text(encoding="utf-8")
    try:
        contract = load_effects_contract()
        interactive = contract["INTERACTIVE_EFFECTS"]
        if "effects-goal-contract.js" in hero_core:
            lines.append(f"PASS hero-core.js: INTERACTIVE_EFFECTS via contract ({len(interactive)})")
        else:
            lines.append("FAIL hero-core.js: INTERACTIVE_EFFECTS contract import missing")
            ok = False
        if len(interactive) < 8:
            lines.append(f"FAIL contract: INTERACTIVE_EFFECTS count {len(interactive)} < 8")
            ok = False
        for eid in interactive:
            if f'id === "{eid}"' not in effects:
                lines.append(f"FAIL effects-anime.js: interactive id {eid} missing")
                ok = False
    except Exception as e:
        lines.append(f"FAIL contract load: {e}")
        ok = False

    reassign_lines = []
    adj_ok = True
    for mod in HERO_MODULES.values():
        text = (ROOT / mod).read_text(encoding="utf-8")
        effects_seq = re.findall(r'effect:\s*"([a-z]+)"', text)
        file_ok = True
        for i in range(len(effects_seq) - 1):
            if effects_seq[i] == effects_seq[i + 1]:
                reassign_lines.append(
                    f"FAIL {mod}: adjacent duplicate {effects_seq[i]} at slides {i + 1}-{i + 2}"
                )
                file_ok = False
                adj_ok = False
        if file_ok:
            reassign_lines.append(f"PASS {mod}: {len(effects_seq)} slides, no adjacent dup")
    if adj_ok:
        lines.append("PASS hero slides: no adjacent duplicate effects")
    else:
        ok = False
    (SCRATCH / "reassignment-check.log").write_text("\n".join(reassign_lines) + "\n", encoding="utf-8")

    about_js = (ROOT / "assets/hero-about.js").read_text(encoding="utf-8")
    founder_checks = [
        ("triphosphate", "triphosphate"),
        ("ascendism", "ascendism"),
        ("github.com/triphosphatedev", "triphosphatedev GitHub source"),
        ("github.com/ascendism", "ascendism GitHub source"),
        ("business systems", "founder field-analysis role"),
        ("Co-Founders", "co-founder title"),
    ]
    about_lower = about_js.lower()
    for pat, label in founder_checks:
        hay = about_lower if pat == "business systems" else about_js
        needle = pat.lower() if pat == "business systems" else pat
        if needle not in hay:
            lines.append(f"FAIL hero-about.js: missing {label}")
            ok = False
    if all(
        (pat.lower() if pat == "business systems" else pat)
        in (about_lower if pat == "business systems" else about_js)
        for pat, _ in founder_checks
    ):
        lines.append("PASS hero-about.js: founder handles + GitHub sources")

    home_js = (ROOT / "assets/hero-home.js").read_text(encoding="utf-8")
    home_source_checks = [
        ("anatomy-of-work-global-index", False, "broken Asana 404 URL removed"),
        ("asana.com/resources/anatomy-of-work", True, "Asana index source"),
        ("asana.com/resources/why-work-about-work-is-bad", True, "Asana 664 hrs source"),
        ("idcs-2024-ai-opportunity-study", True, "IDC 2024 ROI source"),
        ("adeccogroup.com/future-of-work/latest-insights/working-through-change", True, "Adecco GWOF 2024 source"),
        ("lse.ac.uk/news/ai-boosts-productivity", True, "LSE / Protiviti source"),
    ]
    for pat, should_exist, label in home_source_checks:
        present = pat in home_js or pat in (ROOT / "assets/hero-constants.js").read_text(encoding="utf-8")
        if present != should_exist:
            lines.append(f"FAIL hero-home sources: {label}")
            ok = False
    if all(
        (pat in home_js or pat in (ROOT / "assets/hero-constants.js").read_text(encoding="utf-8")) == should_exist
        for pat, should_exist, _ in home_source_checks
    ):
        lines.append("PASS hero-home.js: third-party stat sources wired")

    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    if "footer-sources" not in index_html or "asana.com/resources/why-work-about-work-is-bad" not in index_html:
        lines.append("FAIL index.html: linked stat sources footer missing")
        ok = False
    else:
        lines.append("PASS index.html: footer stat source links")

    cortex_js = (ROOT / "assets/hero-cortex.js").read_text(encoding="utf-8")
    if 'effect: "schematic"' not in cortex_js:
        lines.append("FAIL hero-cortex.js: slide 2 missing schematic effect")
        ok = False
    else:
        lines.append("PASS hero-cortex.js: slide 2 uses schematic")

    vis = ROOT / "docs/visual-assets.md"
    if vis.exists() and "schematic" in vis.read_text(encoding="utf-8").lower():
        lines.append("PASS visual-assets.md: schematic Phase 1 documented")
    else:
        lines.append("FAIL visual-assets.md: schematic Phase 1 note missing")
        ok = False

    ocr = ROOT / "docs/site-copy-ocr.md"
    if ocr.exists():
        ocr_text = ocr.read_text(encoding="utf-8")
        for pat in ["slide-08-team", "triphosphate", "ascendism", "slide-05"]:
            if pat not in ocr_text.lower():
                lines.append(f"FAIL site-copy-ocr.md: missing {pat}")
                ok = False
        if all(p in ocr_text.lower() for p in ["slide-08-team", "triphosphate", "ascendism"]):
            lines.append("PASS site-copy-ocr.md: slide-08-team + handles present")
    else:
        lines.append("FAIL site-copy-ocr.md missing")
        ok = False

    if not (ROOT / "docs/visual-assets.md").exists():
        lines.append("FAIL docs/visual-assets.md missing")
        ok = False
    else:
        lines.append("PASS docs/visual-assets.md exists")

    biz = (ROOT / "assets/hero-business.js").read_text(encoding="utf-8")
    lic = (ROOT / "assets/hero-licensing.js").read_text(encoding="utf-8")
    if not re.search(r"pilotNote:\s*true", biz):
        lines.append("FAIL hero-business.js: pilotNote missing")
        ok = False
    if len(re.findall(r"pilotNote:\s*true", lic)) < 2:
        lines.append("FAIL hero-licensing.js: pilotNote slides 4-5 missing")
        ok = False
    else:
        lines.append("PASS pilotNote on business slide 8 and licensing slides 4-5")

    block4, block5 = _licensing_pilot_blocks(lic)
    pilot_ok = True
    if "pilotNote: true" not in block4 or "$499" not in block4 or "$399" not in block4:
        lines.append("FAIL hero-licensing.js: slide 4 pilotNote tier figures ($499/$399)")
        pilot_ok = False
        ok = False
    if "pilotNote: true" not in block5 or "$199" not in block5 or "$399" not in block5:
        lines.append("FAIL hero-licensing.js: slide 5 pilotNote tier figures ($199/$399)")
        pilot_ok = False
        ok = False
    if pilot_ok:
        lines.append("PASS hero-licensing.js: pilotNote slides 4-5 tier figures $499/$399/$199")

    slide_counts = {
        "hero-about.js": 7,
        "hero-business.js": 8,
        "hero-licensing.js": 6,
    }
    for mod, count in slide_counts.items():
        text = (ROOT / "assets" / mod).read_text(encoding="utf-8")
        n = len(re.findall(r"eyebrow:", text))
        if n != count:
            lines.append(f"FAIL {mod}: {n} slides (expected {count})")
            ok = False
    for mod, min_count in [("hero-solutions.js", 10), ("hero-cortex.js", 10)]:
        n = len(re.findall(r"eyebrow:", (ROOT / "assets" / mod).read_text(encoding="utf-8")))
        if n < min_count:
            lines.append(f"FAIL {mod}: {n} slides (expected >={min_count})")
            ok = False

    cache_ok = True
    for name in HERO_ROUTES:
        text = (ROOT / name).read_text(encoding="utf-8")
        refs = re.findall(r"\?v=(\d+[a-z])", text)
        if not refs or any(v != CACHE_TOKEN for v in refs):
            lines.append(f"FAIL {name}: cache-bust not unified to {CACHE_TOKEN} ({refs})")
            cache_ok = False
            ok = False
    if cache_ok:
        lines.append(f"PASS cache-bust unified: {CACHE_TOKEN} on hero routes")

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "structural-legacy-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote structural-legacy-check.log")
    return ok, lines


def load_effects_contract() -> dict:
    """Load canonical IDs from scripts/effects-goal-contract.json (exported from JS contract)."""
    json_path = ROOT / "scripts/effects-goal-contract.json"
    export_script = ROOT / "scripts/export-effects-contract.mjs"
    if not export_script.exists():
        raise FileNotFoundError("scripts/export-effects-contract.mjs missing")
    needs_export = not json_path.exists()
    if json_path.exists() and export_script.stat().st_mtime > json_path.stat().st_mtime:
        needs_export = True
    contract_src = ROOT / "assets/effects-goal-contract.js"
    if json_path.exists() and contract_src.exists() and contract_src.stat().st_mtime > json_path.stat().st_mtime:
        needs_export = True
    if needs_export:
        subprocess.run(["node", str(export_script)], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(json_path.read_text(encoding="utf-8"))


def run_export_effects_contract() -> bool:
    try:
        load_effects_contract()
        print("Wrote effects-goal-contract.json")
        return True
    except Exception as e:
        (SCRATCH / "contract-export.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def run_stage_effects_goal() -> bool:
    script = ROOT / "scripts/stage-effects-goal.mjs"
    if not script.exists():
        (SCRATCH / "effects-goal-changed-files.log").write_text("stage script missing\n", encoding="utf-8")
        return False
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        return r.returncode == 0
    except Exception as e:
        (SCRATCH / "effects-goal.patch").write_text(str(e) + "\n", encoding="utf-8")
        return False


FORBIDDEN_SCOPE_SHELLS = [
    "about.html",
    "business.html",
    "index.html",
    "licensing.html",
    "solutions.html",
    "carapace.html",
    "cortex.html",
    "assets/site.css",
    "assets/text-anime.js",
]


def _git_porcelain_path(line: str) -> str:
    raw = line[3:].strip().strip('"')
    return raw.split(" -> ")[-1].strip() if " -> " in raw else raw


def check_worktree_scope() -> tuple[bool, list[str]]:
    """Hard FAIL when tracked edits exist outside manifest or forbidden shells differ from HEAD."""
    lines = ["worktree scope gate", f"root={ROOT.resolve()}", ""]
    ok = True
    manifest = ROOT / "scripts/goal-effects-scope.txt"
    expected = {
        p.strip()
        for p in manifest.read_text(encoding="utf-8").splitlines()
        if p.strip() and not p.strip().startswith("#")
    }
    try:
        status = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
        porcelain = status.stdout.splitlines()
    except Exception as e:
        lines.append(f"FAIL git status: {e}")
        ok = False
        porcelain = []

    tracked_outside: list[str] = []
    for line in porcelain:
        if not line.strip():
            continue
        xy = line[:2]
        if "?" in xy:
            continue
        path = _git_porcelain_path(line)
        if path and path not in expected:
            tracked_outside.append(path)
    if tracked_outside:
        lines.append(f"FAIL tracked modifications outside manifest: {tracked_outside[:8]}")
        if len(tracked_outside) > 8:
            lines.append(f"  ... and {len(tracked_outside) - 8} more")
        ok = False
    else:
        lines.append(f"PASS tracked modifications limited to manifest ({len(expected)} paths)")

    forbidden_dirty: list[str] = []
    for rel in FORBIDDEN_SCOPE_SHELLS:
        p = ROOT / rel
        if not p.exists():
            continue
        try:
            diff = subprocess.run(
                ["git", "diff", "HEAD", "--", rel],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=15,
            )
            if diff.stdout.strip():
                forbidden_dirty.append(rel)
        except Exception as e:
            lines.append(f"FAIL git diff {rel}: {e}")
            ok = False
    if forbidden_dirty:
        lines.append(f"FAIL forbidden shells differ from HEAD: {forbidden_dirty}")
        ok = False
    else:
        lines.append(f"PASS forbidden shells match HEAD ({len(FORBIDDEN_SCOPE_SHELLS)} checked)")

    quarantine = SCRATCH / "quarantine-revert.log"
    if quarantine.exists():
        lines.append("PASS quarantine-revert.log present")
    else:
        lines.append("FAIL quarantine-revert.log missing (run stage-effects-goal.mjs)")
        ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "worktree-scope-gate.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return ok, lines


def check_stage_artifacts() -> tuple[bool, list[str]]:
    lines = []
    ok = True
    files_log = SCRATCH / "effects-goal-changed-files.log"
    patch = SCRATCH / "effects-goal.patch"
    if not files_log.exists():
        lines.append("FAIL effects-goal-changed-files.log missing")
        ok = False
    else:
        staged = [l.strip() for l in files_log.read_text(encoding="utf-8").splitlines() if l.strip()]
        lines.append(f"PASS staged files: {len(staged)}")
        manifest = ROOT / "scripts/goal-effects-scope.txt"
        if manifest.exists():
            expected = [
                p.strip()
                for p in manifest.read_text(encoding="utf-8").splitlines()
                if p.strip() and not p.strip().startswith("#")
            ]
            extra = sorted(set(staged) - set(expected))
            missing = sorted(set(expected) - set(staged))
            if extra:
                lines.append(f"FAIL staged extra: {extra}")
                ok = False
            if missing:
                lines.append(f"FAIL staged missing: {missing}")
                ok = False
            if not extra and not missing:
                lines.append(f"PASS staged matches manifest ({len(expected)} paths)")
    if not patch.exists() or len(patch.read_text(encoding="utf-8").strip()) < 200:
        lines.append("FAIL effects-goal.patch missing or too small")
        ok = False
    else:
        pt = patch.read_text(encoding="utf-8")
        for req in ("effects-anime.js", "hero-core.js", "effects-audit.md"):
            if req not in pt:
                lines.append(f"FAIL effects-goal.patch: no diff for {req}")
                ok = False
        if all(r in pt for r in ("effects-anime.js", "hero-core.js", "effects-audit.md")):
            lines.append("PASS effects-goal.patch: core file diffs present")
        patch_paths = re.findall(r"^diff --git a/(.+?) b/", pt, re.MULTILINE)
        manifest = ROOT / "scripts/goal-effects-scope.txt"
        if manifest.exists():
            expected = {
                p.strip()
                for p in manifest.read_text(encoding="utf-8").splitlines()
                if p.strip() and not p.strip().startswith("#")
            }
            patch_extra = sorted(set(patch_paths) - expected)
            if patch_extra:
                lines.append(f"FAIL effects-goal.patch: paths outside manifest {patch_extra}")
                ok = False
            else:
                lines.append(f"PASS effects-goal.patch: {len(patch_paths)} paths all in manifest")
        if not pt.lstrip().startswith("diff --git a/assets/effects-anime.js"):
            lines.append("FAIL effects-goal.patch: must start with assets/effects-anime.js")
            ok = False
        else:
            lines.append("PASS effects-goal.patch: starts with assets/effects-anime.js")
    classifier = SCRATCH / "goal-classifier.patch"
    if classifier.exists():
        cpt = classifier.read_text(encoding="utf-8")
        if cpt.lstrip().startswith("diff --git a/assets/effects-anime.js"):
            lines.append("PASS goal-classifier.patch: starts with assets/effects-anime.js")
        else:
            lines.append("FAIL goal-classifier.patch: wrong first diff (PDF/broad patch)")
            ok = False
    else:
        lines.append("FAIL goal-classifier.patch missing")
        ok = False
    worktree_ok, worktree_lines = check_worktree_scope()
    lines.extend(worktree_lines[3:-2])
    if not worktree_ok:
        ok = False
    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "goal-scope-enforcement.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return ok, lines


def effects_structural_gate() -> tuple[bool, list[str]]:
    """Effects-goal-only structural checks (no prior-goal founder/pilot/cache gates)."""
    contract = load_effects_contract()
    shipped = contract["SHIPPED_EFFECT_IDS"]
    interactive = contract["INTERACTIVE_EFFECTS"]
    wired = contract["WIRED_SLIDES"]

    lines = ["effects structural gate", f"scratch={SCRATCH.resolve()}", ""]
    ok = True

    contract_path = ROOT / "assets/effects-goal-contract.js"
    if contract_path.exists():
        lines.append("PASS assets/effects-goal-contract.js present")
    else:
        lines.append("FAIL assets/effects-goal-contract.js missing")
        ok = False

    if len(wired) != len(interactive):
        lines.append(f"FAIL contract: WIRED_SLIDES {len(wired)} != INTERACTIVE {len(interactive)}")
        ok = False
    else:
        lines.append(f"PASS contract: WIRED_SLIDES covers all {len(interactive)} interactive IDs")
    wired_ids = {w["id"] for w in wired}
    if wired_ids != set(interactive):
        lines.append(f"FAIL contract: wired id mismatch {sorted(wired_ids ^ set(interactive))}")
        ok = False

    effects_path = ROOT / "assets/effects-anime.js"
    hero_core = ROOT / "assets/hero-core.js"
    if not effects_path.exists():
        lines.append("FAIL assets/effects-anime.js missing")
        ok = False
    if not hero_core.exists():
        lines.append("FAIL assets/hero-core.js missing")
        ok = False
    else:
        core = hero_core.read_text(encoding="utf-8")
        if "initScrollHero" in core:
            lines.append("PASS hero-core.js: initScrollHero")
        else:
            lines.append("FAIL hero-core.js: initScrollHero missing")
            ok = False

    for route, mod in HERO_MODULES.items():
        p = ROOT / mod
        if not p.exists():
            lines.append(f"FAIL {mod}: missing")
            ok = False
        elif "hero-core.js" not in p.read_text(encoding="utf-8"):
            lines.append(f"FAIL {mod}: does not import hero-core")
            ok = False
        else:
            lines.append(f"PASS {mod}")

    if effects_path.exists():
        effects = effects_path.read_text(encoding="utf-8")
        for eid in shipped:
            if f'id === "{eid}"' not in effects:
                lines.append(f"FAIL effects-anime.js: missing {eid}")
                ok = False
        if all(f'id === "{eid}"' in effects for eid in shipped):
            lines.append(f"PASS effects-anime.js: {len(shipped)} effect ids")

    if hero_core.exists():
        core = hero_core.read_text(encoding="utf-8")
        if "effects-goal-contract.js" in core and "INTERACTIVE_EFFECTS" in core:
            lines.append("PASS hero-core.js: imports INTERACTIVE_EFFECTS from contract")
        else:
            lines.append("FAIL hero-core.js: must import INTERACTIVE_EFFECTS from effects-goal-contract.js")
            ok = False
        if len(interactive) >= 8:
            lines.append(f"PASS contract: INTERACTIVE_EFFECTS count {len(interactive)}")
        else:
            lines.append(f"FAIL contract: INTERACTIVE_EFFECTS count {len(interactive)} < 8")
            ok = False

    adj_ok = True
    for mod in HERO_MODULES.values():
        text = (ROOT / mod).read_text(encoding="utf-8")
        effects_seq = re.findall(r'effect:\s*"([a-z]+)"', text)
        file_ok = True
        for i in range(len(effects_seq) - 1):
            if effects_seq[i] == effects_seq[i + 1]:
                lines.append(
                    f"FAIL {mod}: adjacent duplicate {effects_seq[i]} at slides {i + 1}-{i + 2}"
                )
                file_ok = False
                adj_ok = False
                ok = False
        if file_ok:
            lines.append(f"PASS {mod}: {len(effects_seq)} slides, no adjacent dup")
    if adj_ok:
        lines.append("PASS hero slides: no adjacent duplicate effects")

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "structural-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote structural-check.log")
    return ok, lines


def check_audit_docs() -> tuple[bool, list[str]]:
    """Verification plan step 1 — audit + replacement plan structure."""
    contract = load_effects_contract()
    prerequisite = contract.get("PREREQUISITE_DRAW_IDS") or contract["ORIGINAL_GOAL_IDS"]
    enum_rows = contract.get("GOAL_ENUMERATION_ROW_COUNT", 16)
    shipped = contract["SHIPPED_EFFECT_IDS"]
    lines = []
    ok = True
    audit = ROOT / "docs/effects-audit.md"
    plan = ROOT / "docs/effects-replacement-plan.md"

    if not audit.exists():
        lines.append("FAIL docs/effects-audit.md missing")
        ok = False
    else:
        text = audit.read_text(encoding="utf-8")
        for section in [
            "§Inventory",
            "§Slide matrix",
            "§Similarity matrix",
            "§Research",
            "§Original 16 goal enumeration",
            "§Replacement candidates",
            "§ID retire / merge decisions",
        ]:
            if section in text:
                lines.append(f"PASS effects-audit.md: {section}")
            else:
                lines.append(f"FAIL effects-audit.md: missing {section}")
                ok = False
        orig_sections = text.count("## §Original 16 goal enumeration")
        if orig_sections == 1:
            lines.append("PASS effects-audit.md: single §Original 16 section")
        else:
            lines.append(f"FAIL effects-audit.md: duplicate §Original sections ({orig_sections})")
            ok = False
        orig_block = text.split("## §Original 16 goal enumeration", 1)[-1].split("##", 1)[0]
        numbered_rows = len(re.findall(r"^\| \d+ \|", orig_block, re.MULTILINE))
        if numbered_rows >= enum_rows:
            lines.append(f"PASS effects-audit.md: goal enumeration rows {numbered_rows} (expected {enum_rows})")
        else:
            lines.append(
                f"FAIL effects-audit.md: goal enumeration rows {numbered_rows} (expected {enum_rows})"
            )
            ok = False
        if "| 16 |" in orig_block:
            lines.append("PASS effects-audit.md: row 16 (stack-assignment-debt) present")
        else:
            lines.append("FAIL effects-audit.md: missing row 16 activation debt")
            ok = False
        for eid in prerequisite:
            if f"| `{eid}` |" not in orig_block:
                lines.append(f"FAIL effects-audit.md: prerequisite ID {eid} missing from §Original table")
                ok = False
        if all(f"| `{eid}` |" in orig_block for eid in prerequisite):
            lines.append(
                f"PASS effects-audit.md: all {len(prerequisite)} prerequisite draw IDs in §Original table"
            )
        inv_start = text.find("## §Inventory")
        inv_end = text.find("## §", inv_start + 1) if inv_start >= 0 else -1
        inv_block = text[inv_start:inv_end] if inv_start >= 0 else ""
        inv_missing = []
        for eid in prerequisite:
            if not re.search(rf"^\| `{eid}` \|", inv_block, re.MULTILINE):
                inv_missing.append(eid)
        if inv_missing:
            lines.append(f"FAIL effects-audit.md: §Inventory missing prerequisite rows {inv_missing}")
            ok = False
        else:
            lines.append(f"PASS effects-audit.md: §Inventory rows for all {len(prerequisite)} prerequisite IDs")
        for eid in shipped:
            if not re.search(rf"^\| `{eid}` \|", inv_block, re.MULTILINE):
                lines.append(f"FAIL effects-audit.md: shipped ID {eid} missing from §Inventory")
                ok = False
        if all(re.search(rf"^\| `{eid}` \|", inv_block, re.MULTILINE) for eid in shipped):
            lines.append(f"PASS effects-audit.md: all {len(shipped)} shipped IDs in §Inventory")
        retire_block = text.split("## §ID retire / merge decisions", 1)[-1].split("##", 1)[0]
        for eid in prerequisite:
            if f"| `{eid}` |" not in retire_block:
                lines.append(f"FAIL effects-audit.md: retire/merge row missing for {eid}")
                ok = False
        if all(f"| `{eid}` |" in retire_block for eid in prerequisite):
            lines.append(f"PASS effects-audit.md: per-ID retire/merge rows for {len(prerequisite)} prerequisite IDs")
        if "Effect IDs merged" in retire_block and "none" in retire_block.lower():
            lines.append("PASS effects-audit.md: explicit ID merge (none)")
        else:
            lines.append("FAIL effects-audit.md: missing explicit ID merge section")
            ok = False
        if "Effect IDs retired" in retire_block and "none" in retire_block.lower():
            lines.append("PASS effects-audit.md: explicit ID retirement (none)")
        else:
            lines.append("FAIL effects-audit.md: missing explicit ID retirement section")
            ok = False
        cand_block = text.split("## §Replacement candidates", 1)[-1].split("##", 1)[0]
        if "Shipped resolution" in cand_block and cand_block.count("P0") >= 3:
            lines.append("PASS effects-audit.md: replacement candidates table present")
        else:
            lines.append("FAIL effects-audit.md: replacement candidates table incomplete")
            ok = False
        matrix_block = text.split("## §Slide matrix", 1)[-1].split("##", 1)[0]
        audit_rows = re.findall(
            r"^\| (home|about|business|licensing|solutions|cortex) \| (\d+) \| [^|]+ \| `?([a-z]+)`? \|",
            matrix_block,
            re.MULTILINE,
        )
        route_map = {
            "index.html": "home",
            "about.html": "about",
            "business.html": "business",
            "licensing.html": "licensing",
            "solutions.html": "solutions",
            "cortex.html": "cortex",
        }
        code_rows: list[tuple[str, int, str]] = []
        for route, mod in HERO_MODULES.items():
            rname = route_map[route]
            effects_seq = re.findall(r'effect:\s*"([a-z]+)"', (ROOT / mod).read_text(encoding="utf-8"))
            for i, eid in enumerate(effects_seq):
                code_rows.append((rname, i + 1, eid))
        audit_set = {(r, int(n), e) for r, n, e in audit_rows}
        code_set = set(code_rows)
        if len(audit_rows) >= 49 and audit_set == code_set:
            lines.append(f"PASS effects-audit.md: slide matrix {len(audit_rows)} rows match hero-*.js")
        else:
            missing = sorted(code_set - audit_set)[:5]
            extra = sorted(audit_set - code_set)[:5]
            lines.append(
                f"FAIL effects-audit.md: slide matrix mismatch rows={len(audit_rows)} "
                f"missing={missing} extra={extra}"
            )
            ok = False
        research_rows = len(re.findall(r"^\| \d+ \| \[", text, re.MULTILINE))
        if research_rows >= 8:
            lines.append(f"PASS effects-audit.md: research entries {research_rows}")
        else:
            lines.append(f"FAIL effects-audit.md: research entries {research_rows} (expected >=8)")
            ok = False
        new_effects = [
            "isograph", "sonar", "ledger", "weave", "orbit", "relay", "seal", "glyph"
        ]
        code_assignments: dict[str, list[tuple[str, int]]] = {eid: [] for eid in new_effects}
        for route, mod in HERO_MODULES.items():
            rname = route_map[route]
            effects_seq = re.findall(
                r'effect:\s*"([a-z]+)"', (ROOT / mod).read_text(encoding="utf-8")
            )
            for i, eid in enumerate(effects_seq):
                if eid in code_assignments:
                    code_assignments[eid].append((rname, i + 1))
        deploy_missing = [eid for eid in new_effects if not code_assignments[eid]]
        if deploy_missing:
            lines.append(f"FAIL effects-audit.md: P0 new IDs not deployed in hero-*.js {deploy_missing}")
            ok = False
        else:
            for eid in new_effects:
                slots = ", ".join(f"{r}#{n}" for r, n in code_assignments[eid])
                lines.append(f"PASS effects-audit.md: P0 {eid} deployed at {slots}")
        for eid in new_effects:
            matrix_hits = [
                (r, int(n))
                for r, n, eff in audit_rows
                if eff == eid
            ]
            if set(matrix_hits) != set(code_assignments[eid]):
                lines.append(
                    f"FAIL effects-audit.md: P0 {eid} matrix/code mismatch "
                    f"matrix={matrix_hits} code={code_assignments[eid]}"
                )
                ok = False

    if not plan.exists():
        lines.append("FAIL docs/effects-replacement-plan.md missing")
        ok = False
    else:
        ptext = plan.read_text(encoding="utf-8")
        for label in ["New effect IDs", "Retire / merge", "Per-route reassignment", "INTERACTIVE_EFFECTS"]:
            if label in ptext:
                lines.append(f"PASS effects-replacement-plan.md: {label}")
            else:
                lines.append(f"FAIL effects-replacement-plan.md: missing {label}")
                ok = False
        for eid in prerequisite:
            if f"| `{eid}` |" not in ptext:
                lines.append(f"FAIL effects-replacement-plan.md: retire/merge row missing for {eid}")
                ok = False
        if all(f"| `{eid}` |" in ptext for eid in prerequisite):
            lines.append(f"PASS effects-replacement-plan.md: per-ID retire/merge for {len(prerequisite)} IDs")
        if "Assumed scope" in ptext:
            lines.append("PASS effects-replacement-plan.md: Assumed scope section present")
        else:
            lines.append("FAIL effects-replacement-plan.md: missing Assumed scope section")
            ok = False
        manifest = ROOT / "scripts/goal-effects-scope.txt"
        if manifest.exists():
            scope_paths = [
                p.strip()
                for p in manifest.read_text(encoding="utf-8").splitlines()
                if p.strip() and not p.strip().startswith("#")
            ]
            if f"{len(scope_paths)} manifest paths" in ptext and "effects-hero-harness" in ptext:
                lines.append(
                    f"PASS effects-replacement-plan.md: Assumed scope documents {len(scope_paths)} manifest paths"
                )
            else:
                lines.append("FAIL effects-replacement-plan.md: Assumed scope count/harness note missing")
                ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "audit-docs-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote audit-docs-check.log")
    return ok, lines


def check_perf_caps() -> tuple[bool, list[str]]:
    """Verification plan step 7 — particle caps, grid drawables ≤80, timer frameRate."""
    lines = []
    ok = True
    effects_path = ROOT / "assets/effects-anime.js"
    if not effects_path.exists():
        lines.append("FAIL effects-anime.js missing")
        (SCRATCH / "perf-caps.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
        return False, lines

    text = effects_path.read_text(encoding="utf-8")
    if "frameRate: this.reducedMotion ? 30 : 60" in text:
        lines.append("PASS effects-anime.js: reducedMotion frameRate 30/60")
    else:
        lines.append("FAIL effects-anime.js: frameRate branch missing")
        ok = False

    cap_hits = re.findall(r"reducedMotion \? (\d+) : (\d+)", text)
    particle_caps = [
        (a, b)
        for a, b in cap_hits
        if int(a) <= 100 and int(b) <= 100 and (int(a) > 80 or int(b) > 80)
    ]
    if particle_caps:
        lines.append(f"FAIL effects-anime.js: particle caps >80 found {particle_caps[:5]}")
        ok = False
    else:
        lines.append(
            f"PASS effects-anime.js: particle cap branches {len(cap_hits)} (none >80 in count range)"
        )

    create_start = text.find("_createState(id)")
    create_end = (
        text.find("  _bootLoops(id, state) {", create_start)
        if create_start >= 0
        else -1
    )
    create_body = text[create_start:create_end] if create_start >= 0 and create_end > create_start else ""
    grid_violations: list[str] = []
    for m in re.finditer(
        r'if \(id === "([a-z]+)"\)[^{]*\{[^}]*const cols = (\d+);\s*const rows = (\d+)',
        create_body,
        re.DOTALL,
    ):
        eid, cols, rows = m.group(1), int(m.group(2)), int(m.group(3))
        product = cols * rows
        if product > 80:
            grid_violations.append(f"{eid} cols×rows={cols}×{rows}={product}")
    if "Math.min(80," in text and "Math.floor(w / 26)" in text:
        lines.append("PASS effects-anime.js: cascade column cap ≤80")
    else:
        lines.append("FAIL effects-anime.js: cascade column cap missing")
        ok = False
    if grid_violations:
        lines.append(f"FAIL effects-anime.js: grid drawables >80: {grid_violations}")
        ok = False
    else:
        lines.append("PASS effects-anime.js: hardcoded grid drawables ≤80")

    iso_m = re.search(
        r'if \(id === "isograph"\)\s*\{[\s\S]*?const cols = this\.reducedMotion \? (\d+) : (\d+);\s*const rows = this\.reducedMotion \? (\d+) : (\d+)',
        create_body,
    )
    if iso_m:
        rm_prod = int(iso_m.group(1)) * int(iso_m.group(3))
        fm_prod = int(iso_m.group(2)) * int(iso_m.group(4))
        if rm_prod <= 40 and fm_prod <= 80:
            lines.append(f"PASS effects-anime.js: isograph RM {rm_prod} FM {fm_prod}")
        else:
            lines.append(f"FAIL effects-anime.js: isograph caps RM={rm_prod} FM={fm_prod}")
            ok = False
    else:
        lines.append("FAIL effects-anime.js: isograph reducedMotion grid branches missing")
        ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "perf-caps.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote perf-caps.log")
    return ok, lines


def check_goal_manifest() -> tuple[bool, list[str]]:
    """Ensure every path listed in scripts/goal-effects-scope.txt exists."""
    lines = []
    ok = True
    manifest = ROOT / "scripts/goal-effects-scope.txt"
    if not manifest.exists():
        lines.append("FAIL goal-effects-scope.txt missing")
        (SCRATCH / "goal-manifest.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
        return False, lines

    rel_paths = [
        p.strip()
        for p in manifest.read_text(encoding="utf-8").splitlines()
        if p.strip() and not p.strip().startswith("#")
    ]
    for rel in rel_paths:
        path = ROOT / rel.replace("/", os.sep)
        if path.exists():
            lines.append(f"PASS manifest: {rel}")
        else:
            lines.append(f"FAIL manifest: {rel} missing")
            ok = False
    lines.append(f"manifest entries: {len(rel_paths)}")
    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "goal-manifest.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return ok, lines


def check_interaction_policy_static() -> tuple[bool, list[str]]:
    """Enforce centralized hover policy — no raw interaction.hover in draw paths."""
    lines = []
    ok = True
    effects_path = ROOT / "assets/effects-anime.js"
    interaction_path = ROOT / "assets/effects-interaction.js"
    hero_core = ROOT / "assets/hero-core.js"

    if not interaction_path.exists():
        lines.append("FAIL assets/effects-interaction.js missing")
        ok = False
    else:
        lines.append("PASS assets/effects-interaction.js present")

    if not effects_path.exists():
        lines.append("FAIL assets/effects-anime.js missing")
        ok = False
        (SCRATCH / "interaction-policy.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
        return False, lines

    effects = effects_path.read_text(encoding="utf-8")
    if "effects-interaction.js" not in effects:
        lines.append("FAIL effects-anime.js: missing effects-interaction import")
        ok = False
    else:
        lines.append("PASS effects-anime.js imports effects-interaction.js")

    draw_start = effects.find("_drawEffect(id, state, alpha)")
    draw_body = effects[draw_start:] if draw_start >= 0 else ""
    forbidden = [
        ("interaction.hover &&", "raw interaction.hover && in _drawEffect"),
        ("this.interaction.hover &&", "raw this.interaction.hover && in _drawEffect"),
        ("interaction.hover && !this.reducedMotion", "inline RM guard in _drawEffect"),
    ]
    for pat, label in forbidden:
        if pat in draw_body:
            lines.append(f"FAIL effects-anime.js: {label}")
            ok = False
        else:
            lines.append(f"PASS effects-anime.js: no {label}")

    if hero_core.exists():
        core = hero_core.read_text(encoding="utf-8")
        contract = load_effects_contract()
        n = len(contract["INTERACTIVE_EFFECTS"])
        if "effects-goal-contract.js" in core:
            lines.append(f"PASS hero-core.js: INTERACTIVE_EFFECTS from contract ({n})")
        else:
            lines.append("FAIL hero-core.js: must import INTERACTIVE_EFFECTS from contract")
            ok = False
        if n < 8:
            lines.append(f"FAIL contract: INTERACTIVE_EFFECTS={n} < 8")
            ok = False
        if "!prefersReducedMotion && INTERACTIVE_EFFECTS.includes(effect)" in core:
            lines.append("PASS hero-core.js: bgInteractive gated by prefersReducedMotion")
        else:
            lines.append("FAIL hero-core.js: bgInteractive missing prefersReducedMotion gate")
            ok = False
        if "__carapaceEffectsField" in core:
            lines.append("FAIL hero-core.js: test hook __carapaceEffectsField present")
            ok = False
        else:
            lines.append("PASS hero-core.js: no test hook on window")
    else:
        lines.append("FAIL hero-core.js missing")
        ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "interaction-policy.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return ok, lines


def _effects_e_criteria_checklist(
    *,
    audit_ok: bool,
    perf_ok: bool,
    effects_struct_ok: bool,
    adj_ok: bool,
    smoke_ok: bool,
    wired_ok: bool,
    pw_ok: bool,
) -> list[str]:
    """Map E1–E12 to pass/fail from effects-goal evidence."""
    interactive_n = len(load_effects_contract()["INTERACTIVE_EFFECTS"])
    return [
        f"E1 audit docs: {'PASS' if audit_ok else 'FAIL'}",
        f"E2 research log: {'PASS' if audit_ok else 'FAIL'}",
        f"E3 similarity matrix: {'PASS' if audit_ok else 'FAIL'}",
        f"E4 replacement plan: {'PASS' if audit_ok else 'FAIL'}",
        f"E5 no adjacent dup: {'PASS' if adj_ok and effects_struct_ok else 'FAIL'}",
        f"E6 interactive >=8 ({interactive_n}): {'PASS' if effects_struct_ok else 'FAIL'}",
        f"E7 new IDs + smoke: {'PASS' if smoke_ok else 'FAIL'}",
        f"E8 slide reassignment: {'PASS' if effects_struct_ok and adj_ok else 'FAIL'}",
        f"E9 reduced motion (wired E2E): {'PASS' if wired_ok else 'FAIL'}",
        f"E10 verify-revamp: deferred until orchestrator exit 0",
        f"E11 playwright captures: {'PASS' if pw_ok else 'pending'}",
        f"E12 perf caps: {'PASS' if perf_ok else 'FAIL'}",
    ]


def _subgate_pass(path: Path) -> bool:
    if not path.exists():
        return False
    return "GATE: PASS" in path.read_text(encoding="utf-8")


def _smoke_has_interaction_bypass(smoke_text: str) -> bool:
    """Reject isolated AnimeEffectsField draw loops that bypass hero-core."""
    banned = (
        "new mod.AnimeEffectsField",
        "isolated ensureEffect",
        "rm-cascade:",
        "hover-cascade:",
        "draw-unit rm diagnostic",
    )
    return any(b in smoke_text for b in banned)


def run_effects_goal_gate() -> bool:
    """Effects goal summary transcript; detail in per-step logs."""
    contract = load_effects_contract()
    interactive = contract["INTERACTIVE_EFFECTS"]
    gate_lines = [
        "effects goal gate (summary)",
        f"scratch={SCRATCH.resolve()}",
        f"base={BASE}",
        "",
    ]

    stage_ok, _ = check_stage_artifacts()
    effects_struct_ok, _ = effects_structural_gate()
    manifest_ok, _ = check_goal_manifest()
    audit_ok, _ = check_audit_docs()
    perf_ok, _ = check_perf_caps()
    policy_ok, _ = check_interaction_policy_static()

    adj_ok = effects_struct_ok and _subgate_pass(SCRATCH / "structural-check.log")

    smoke_ok = run_effects_smoke()
    smoke_log = SCRATCH / "effects-smoke.log"
    smoke_bypass = False
    if smoke_log.exists():
        st = smoke_log.read_text(encoding="utf-8")
        smoke_bypass = _smoke_has_interaction_bypass(st)
        draw_ok = "route draw smoke" in st and all(
            f"draw-{eid}: OK" in st for eid in load_effects_contract()["SHIPPED_EFFECT_IDS"]
        )
        rm_toggle_ok = "rm-toggle: OK" in st
        rm_isograph_ok = "rm-toggle-isograph: OK" in st
        smoke_ok = (
            smoke_ok
            and not smoke_bypass
            and draw_ok
            and rm_toggle_ok
            and rm_isograph_ok
            and "gating: PASS" in st
        )
        if smoke_bypass:
            gate_lines.append("FAIL effects-smoke.log: isolated AnimeEffectsField bypass detected")
        if not draw_ok:
            gate_lines.append("FAIL effects-smoke.log: route draw smoke incomplete")
        if not rm_toggle_ok:
            gate_lines.append("FAIL effects-smoke.log: live RM media toggle")
        if not rm_isograph_ok:
            gate_lines.append("FAIL effects-smoke.log: isograph grid recreate 80→40")
    else:
        smoke_ok = False

    wired_log = SCRATCH / "wired-rm-e2e.log"
    wired_ok = False
    if wired_log.exists():
        wt = wired_log.read_text(encoding="utf-8")
        per_id_ok = all(f"wired-{eid}: rm=OK fm=OK" in wt for eid in interactive)
        wired_ok = (
            f"slides tested: {len(interactive)}" in wt
            and f"expected {len(interactive)}" in wt
            and per_id_ok
            and "rm pointerHover gated: OK (false)" in wt
            and "rm canvas renders: OK" in wt
            and "fm hover delta (wired): OK" in wt
            and "fm pointerHover live: OK (true)" in wt
            and "gating: PASS" in wt
        )

    sub_logs = [
        ("scope (manifest paths)", "goal-scope-enforcement.log", stage_ok),
        ("structural", "structural-check.log", effects_struct_ok and adj_ok),
        ("manifest", "goal-manifest.log", manifest_ok),
        ("audit docs", "audit-docs-check.log", audit_ok),
        ("perf caps", "perf-caps.log", perf_ok),
        ("interaction policy", "interaction-policy.log", policy_ok),
        ("draw smoke", "effects-smoke.log", smoke_ok),
        ("wired E2E", "wired-rm-e2e.log", wired_ok),
    ]
    for label, fname, passed in sub_logs:
        gate_lines.append(f"{'PASS' if passed else 'FAIL'} {label} → {fname}")
    changed = SCRATCH / "CHANGED_FILES"
    if changed.exists():
        n = len([l for l in changed.read_text(encoding="utf-8").splitlines() if l.strip()])
        gate_lines.append(f"PASS CHANGED_FILES: {n} scoped paths")
    else:
        gate_lines.append("FAIL CHANGED_FILES missing")
        stage_ok = False

    gate_ok = (
        stage_ok
        and manifest_ok
        and audit_ok
        and perf_ok
        and policy_ok
        and effects_struct_ok
        and adj_ok
        and smoke_ok
        and wired_ok
        and changed.exists()
    )
    gate_lines.append("")
    gate_lines.extend(
        _effects_e_criteria_checklist(
            audit_ok=audit_ok,
            perf_ok=perf_ok,
            effects_struct_ok=effects_struct_ok,
            adj_ok=adj_ok,
            smoke_ok=smoke_ok,
            wired_ok=wired_ok,
            pw_ok=False,
        )
    )
    gate_lines.append("")
    gate_lines.append(f"GATE: {'PASS' if gate_ok else 'FAIL'}")
    (SCRATCH / "effects-goal-gate.log").write_text("\n".join(gate_lines) + "\n", encoding="utf-8")
    print("Wrote effects-goal-gate.log")
    return gate_ok


def run_effects_smoke() -> bool:
    script = ROOT / "scripts/test-effects-ids.mjs"
    if not script.exists():
        (SCRATCH / "effects-smoke.log").write_text("script missing\n", encoding="utf-8")
        return False
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH), BASE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=900,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        return r.returncode == 0
    except Exception as e:
        (SCRATCH / "effects-smoke.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def patch_effects_goal_e11(pw_ok: bool) -> None:
    """Append E11 playwright result to effects-goal-gate.log after capture gates."""
    path = SCRATCH / "effects-goal-gate.log"
    if not path.exists():
        return
    lines = path.read_text(encoding="utf-8").splitlines()
    patched = []
    for line in lines:
        if line.startswith("E11 playwright captures:"):
            patched.append(f"E11 playwright captures: {'PASS' if pw_ok else 'FAIL'}")
        else:
            patched.append(line)
    path.write_text("\n".join(patched) + "\n", encoding="utf-8")


def patch_effects_goal_e10(exit_code: int = 0) -> None:
    """Seal E10 in effects-goal-gate.log once verify-revamp completes."""
    path = SCRATCH / "effects-goal-gate.log"
    if not path.exists():
        return
    lines = path.read_text(encoding="utf-8").splitlines()
    patched = []
    for line in lines:
        if line.startswith("E10 verify-revamp:"):
            if exit_code == 0:
                patched.append("E10 verify-revamp: PASS (exit 0)")
            else:
                patched.append(f"E10 verify-revamp: FAIL (exit {exit_code})")
        else:
            patched.append(line)
    path.write_text("\n".join(patched) + "\n", encoding="utf-8")


def _append_verify_run_summary(exit_code: int) -> None:
    """Enrich verify-run.log with gate summaries for skeptic/orchestrator evidence."""
    run_log = SCRATCH / "verify-run.log"
    parts = []
    if run_log.exists():
        parts.append(run_log.read_text(encoding="utf-8").rstrip())
    parts.append("")
    parts.append(f"=== verify summary (exit {exit_code}) ===")
    for fname, label in [
        ("effects-goal-gate.log", "effects goal"),
        ("effects-smoke.log", "smoke"),
        ("wired-rm-e2e.log", "wired E2E"),
        ("audit-docs-check.log", "audit docs"),
        ("goal-scope-enforcement.log", "scope"),
    ]:
        p = SCRATCH / fname
        if not p.exists():
            parts.append(f"{label}: MISSING ({fname})")
            continue
        text = p.read_text(encoding="utf-8")
        gate = "PASS" if "GATE: PASS" in text else ("FAIL" if "GATE: FAIL" in text else "unknown")
        parts.append(f"{label}: {gate}")
        if fname == "effects-goal-gate.log":
            for line in text.splitlines():
                if line.startswith("E") and ":" in line:
                    parts.append(f"  {line}")
        if fname == "effects-smoke.log":
            for token in ("rm-toggle-isograph:", "rm-toggle:", "gating:"):
                for line in text.splitlines():
                    if line.startswith(token):
                        parts.append(f"  {line}")
    parts.append(f"completed: {datetime.now(timezone.utc).isoformat()}")
    parts.append(f"exit: {exit_code}")
    run_log.write_text("\n".join(parts) + "\n", encoding="utf-8")


def run_pilot_note_capture() -> bool:
    script = ROOT / "scripts/capture-pilot-notes.mjs"
    if not script.exists():
        (SCRATCH / "pilot-note-scroll.log").write_text("script missing\n", encoding="utf-8")
        return False
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH), BASE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=180,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        return r.returncode == 0
    except Exception as e:
        (SCRATCH / "pilot-note-scroll.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def run_about_founders_capture() -> bool:
    script = ROOT / "scripts/capture-about-founders.mjs"
    if not script.exists():
        (SCRATCH / "about-founders-load.log").write_text("script missing\n", encoding="utf-8")
        return False
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH), BASE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        return r.returncode == 0
    except Exception as e:
        (SCRATCH / "about-founders-load.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def run_inner_hero_capture() -> bool:
    script = ROOT / "scripts/capture-inner-heroes.mjs"
    if not script.exists():
        return True
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH), BASE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=180,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        return r.returncode == 0
    except Exception as e:
        (SCRATCH / "inner-hero-load.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def run_playwright_capture() -> bool:
    script = ROOT / "scripts/capture-landing-hero.mjs"
    if not script.exists():
        (SCRATCH / "playwright-hero.log").write_text(
            "playwright script missing\n", encoding="utf-8"
        )
        return False
    try:
        r = subprocess.run(
            ["node", str(script), str(SCRATCH), BASE],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if r.stdout.strip():
            print(r.stdout.strip())
        if r.returncode != 0:
            (SCRATCH / "launch-fail.log").write_text(
                (r.stderr or r.stdout or "playwright failed") + "\n",
                encoding="utf-8",
            )
            return False
        fail_log = SCRATCH / "launch-fail.log"
        if fail_log.exists():
            fail_log.unlink()
        return True
    except Exception as e:
        (SCRATCH / "launch-fail.log").write_text(str(e) + "\n", encoding="utf-8")
        return False


def effects_docs_closeout_gate() -> tuple[bool, list[str]]:
    """Effects goal doc closeout — audit/replacement plan only (no production HTML cache)."""
    lines = ["effects docs closeout", ""]
    ok = True
    for doc in ["docs/effects-audit.md", "docs/effects-replacement-plan.md"]:
        if (ROOT / doc).exists():
            lines.append(f"PASS {doc} present")
        else:
            lines.append(f"FAIL {doc} missing")
            ok = False
    plan = ROOT / "docs/effects-replacement-plan.md"
    if plan.exists() and "## Checklist" in plan.read_text(encoding="utf-8"):
        lines.append("PASS effects-replacement-plan.md: checklist section")
    else:
        lines.append("FAIL effects-replacement-plan.md: checklist section missing")
        ok = False
    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "docs-closeout.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote docs-closeout.log")
    return ok, lines


def docs_closeout_gate() -> tuple[bool, list[str]]:
    lines = []
    ok = True

    goal_path = ROOT / "docs/inner-pages-hero-migration-goal.md"
    if goal_path.exists() and "inner-pages-hero-completion-plan" in goal_path.read_text(encoding="utf-8"):
        lines.append("PASS inner-pages-hero-migration-goal.md: links completion plan")
    else:
        lines.append("FAIL inner-pages-hero-migration-goal.md: missing completion plan link")
        ok = False

    plan_path = ROOT / "docs/inner-pages-hero-migration-plan.md"
    plan_text = plan_path.read_text(encoding="utf-8") if plan_path.exists() else ""
    for slice_id in COMPLETION_SLICES:
        pat = f"[x] **{slice_id}**"
        if pat in plan_text:
            lines.append(f"PASS migration-plan: {slice_id} marked done")
        else:
            lines.append(f"FAIL migration-plan: {slice_id} not marked done")
            ok = False

    completion_path = ROOT / "docs/inner-pages-hero-completion-plan.md"
    if completion_path.exists():
        comp = completion_path.read_text(encoding="utf-8")
        for label in ["Slice A", "Slice B", "Slice C", "Slice E"]:
            if f"[x] {label}" in comp:
                lines.append(f"PASS completion-plan: {label} done")
            else:
                lines.append(f"FAIL completion-plan: {label} not done")
                ok = False
    else:
        lines.append("FAIL inner-pages-hero-completion-plan.md missing")
        ok = False

    for name in HERO_ROUTES:
        refs = sorted(set(re.findall(r"\?v=(\d+[a-z])", (ROOT / name).read_text(encoding="utf-8"))))
        if refs == [CACHE_TOKEN]:
            lines.append(f"PASS {name}: cache token {CACHE_TOKEN}")
        else:
            lines.append(f"FAIL {name}: cache tokens {refs}")
            ok = False

    lines.append(f"GATE: {'PASS' if ok else 'FAIL'}")
    (SCRATCH / "docs-closeout.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote docs-closeout.log")
    return ok, lines


def _finalize_stdout(stdout_buf: io.StringIO, exit_code: int = 0) -> None:
    sys.stdout = sys.__stdout__
    log_path = SCRATCH / "verify-revamp.log"
    goal_gate = SCRATCH / "effects-goal-gate.log"
    parts: list[str] = [stdout_buf.getvalue().rstrip(), "", f"exit_code: {exit_code}"]
    if goal_gate.exists():
        parts.append("")
        parts.append("=== effects goal gate summary ===")
        for line in goal_gate.read_text(encoding="utf-8").splitlines():
            if line.startswith("E10 verify-revamp:") and exit_code == 0:
                parts.append("E10 verify-revamp: PASS (exit 0)")
            else:
                parts.append(line)
    log_path.write_text("\n".join(parts) + "\n", encoding="utf-8")
    if exit_code == 0:
        print("Wrote verify-revamp.log")
    sync_evidence(SCRATCH)


def _fail_and_exit(stdout_buf: io.StringIO, code: int = 1) -> None:
    _append_verify_run_summary(code)
    patch_effects_goal_e10(code)
    _finalize_stdout(stdout_buf, code)
    sys.exit(code)


def tails_gate() -> None:
    lines = []
    biz = (ROOT / "business.html").read_text(encoding="utf-8")
    if 'id="contact"' in biz and "intake-form" in biz and "api.carapaceai.org/intake" in biz:
        lines.append("PASS business.html: #contact intake form")
    else:
        lines.append("FAIL business.html: contact form incomplete")

    lic = (ROOT / "licensing.html").read_text(encoding="utf-8")
    if 'id="agreements"' in lic and "doc-link" in lic:
        lines.append("PASS licensing.html: #agreements PDF grid")
    else:
        lines.append("FAIL licensing.html: agreements grid missing")
    if "Pilot program pricing" in lic:
        lines.append("PASS licensing.html: pilot disclaimer near grid")
    else:
        lines.append("FAIL licensing.html: pilot disclaimer missing")

    cortex = (ROOT / "cortex.html").read_text(encoding="utf-8")
    if "github.com/CarapaceUDE/carapace" in cortex:
        lines.append("PASS cortex.html: GitHub/download references")
    else:
        lines.append("FAIL cortex.html: GitHub references missing")

    (SCRATCH / "tails-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote tails-check.log")


def main():
    clear_evidence_dirs(SCRATCH, REPO_SCRATCH, IMPLEMENTER_SCRATCH)
    (SCRATCH / "verify-run.log").write_text(
        f"verify-revamp.py started: {datetime.now(timezone.utc).isoformat()}\n"
        f"scratch={SCRATCH.resolve()}\n"
        f"base={BASE}\n",
        encoding="utf-8",
    )

    stdout_buf = io.StringIO()
    sys.stdout = _Tee(sys.__stdout__, stdout_buf)

    if not run_export_effects_contract():
        print("CONTRACT EXPORT FAILED — see contract-export.log")
        _fail_and_exit(stdout_buf)

    if not run_stage_effects_goal():
        print("STAGE EFFECTS GOAL FAILED — see effects-goal-changed-files.log")
        _fail_and_exit(stdout_buf)

    effects_struct_ok, _ = effects_structural_gate()
    if not effects_struct_ok:
        print("EFFECTS STRUCTURAL GATE FAILED — see structural-check.log")
        _fail_and_exit(stdout_buf)

    craft_ok, _ = craft_effects_gate()
    if not craft_ok:
        print("CRAFT EFFECTS GATE FAILED — see craft-unification-check.log")
        _fail_and_exit(stdout_buf)

    if not run_effects_goal_gate():
        print("EFFECTS GOAL GATE FAILED — see effects-goal-gate.log")
        _fail_and_exit(stdout_buf)

    if not run_playwright_capture():
        print("PLAYWRIGHT GATE FAILED — see launch-fail.log / playwright-hero.log")
        _fail_and_exit(stdout_buf)

    if not run_inner_hero_capture():
        print("INNER HERO GATE FAILED — see inner-hero-load.log")
        _fail_and_exit(stdout_buf)

    patch_effects_goal_e11(True)

    if not run_about_founders_capture():
        print("ABOUT FOUNDERS GATE FAILED — see about-founders-load.log")
        _fail_and_exit(stdout_buf)

    if not run_pilot_note_capture():
        print("PILOT NOTE GATE FAILED — see pilot-note-scroll.log")
        _fail_and_exit(stdout_buf)

    lines = []

    for route in ROUTES:
        status, body = fetch(f"{BASE}/{route}")
        ok = status == 200
        err = "OK" if ok else body[:200]
        lines.append(f"{route}\tHTTP {status}\t{err}")

    (SCRATCH / "routes-check.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Wrote routes-check.log")

    hero_log = []
    harness_routes = [
        "scripts/effects-hero-harness/index.html",
        "scripts/effects-hero-harness/about.html",
        "scripts/effects-hero-harness/business.html",
        "scripts/effects-hero-harness/licensing.html",
        "scripts/effects-hero-harness/solutions.html",
        "scripts/effects-hero-harness/cortex.html",
    ]
    for route in harness_routes:
        _, body = fetch(f"{BASE}/{route}")
        for m in HERO_MARKERS:
            hero_log.append(f"{route}\t{m}\t{'FOUND' if m in body else 'MISSING'}")
    (SCRATCH / "landing-hero-check.log").write_text("\n".join(hero_log) + "\n", encoding="utf-8")
    print("Wrote landing-hero-check.log")

    pw_log = SCRATCH / "playwright-hero.log"
    if pw_log.exists():
        pw_text = pw_log.read_text(encoding="utf-8")
        zero_err = (
            "zero page/console errors: true" in pw_text
            or "page errors after load: 0" in pw_text
        )
        scroll_ok = "scroll indicator changed: YES" in pw_text
        gating_pass = "gating: PASS" in pw_text
        (SCRATCH / "scroll-runtime-check.log").write_text(
            "\n".join([
                "playwright-hero.log present: True",
                f"zero page/console errors: {str(zero_err).lower()}",
                f"scroll advance observed: {str(scroll_ok).lower()}",
                f"gating pass: {str(gating_pass).lower()}",
                f"GATE: {'PASS' if zero_err and scroll_ok and gating_pass else 'FAIL'}",
            ]) + "\n",
            encoding="utf-8",
        )
        if not (zero_err and scroll_ok and gating_pass):
            print("SCROLL RUNTIME GATE FAILED — see scroll-runtime-check.log")
            _fail_and_exit(stdout_buf)
    else:
        (SCRATCH / "scroll-runtime-check.log").write_text(
            "playwright-hero.log missing — run verify-revamp.py (invokes capture automatically)\n",
            encoding="utf-8",
        )
        print("SCROLL RUNTIME GATE FAILED — playwright log missing")
        _fail_and_exit(stdout_buf)

    copy_lines = []
    for route in ROUTES:
        text = (ROOT / route).read_text(encoding="utf-8")
        for s in COPY_STRINGS:
            if s in text:
                copy_lines.append(f"FOUND\t{s}\t{route}")
    (SCRATCH / "copy-spotcheck.log").write_text("\n".join(copy_lines) + "\n", encoding="utf-8")
    print("Wrote copy-spotcheck.log")

    motion_hits = []
    for rel in ["assets/hero-home.css", "assets/hero-home.js", "assets/site.css"]:
        p = ROOT / rel
        if p.exists() and ("reduced-motion" in p.read_text(encoding="utf-8") or "prefers-reduced-motion" in p.read_text(encoding="utf-8")):
            motion_hits.append(f"{rel}: reduced-motion handling present")
    (SCRATCH / "motion-check.log").write_text("\n".join(motion_hits) + "\n", encoding="utf-8")
    print("Wrote motion-check.log")

    site_css = (ROOT / "assets/site.css").read_text(encoding="utf-8")
    token_hits = []
    for pat in [r"oklch\(", r"--hero-stage-height", r"--accent", r"--font-body", r"var\(--font-mono\)"]:
        token_hits.append(f"{pat}: {len(re.findall(pat, site_css))} matches in site.css")
    rgba_site = _rgba_count(site_css)
    token_hits.append(f"site.css hardcoded rgba(): {rgba_site} (expect 0)")
    for rel in SCROLL_HERO_ASSETS:
        path = ROOT / rel
        if path.exists():
            text = path.read_text(encoding="utf-8")
            token_hits.append(f"{rel} hsla(): {_hsla_count(text)} (expect 0)")
            token_hits.append(f"{rel} rgba(): {_rgba_count(text)} (expect 0)")
            token_hits.append(
                f"{rel} craft helper: {'present' if ('readToken' in text or 'colorAtHue' in text) else 'missing'}"
            )
    (SCRATCH / "tokens-check.log").write_text("\n".join(token_hits) + "\n", encoding="utf-8")
    print("Wrote tokens-check.log")

    design = ROOT / "newhero/DESIGN.md"
    (SCRATCH / "design-doc.log").write_text(
        f"DESIGN.md exists: {design.exists()}\npath={design.resolve()}\n",
        encoding="utf-8",
    )
    print("Wrote design-doc.log")

    tails_gate()

    docs_ok, _ = effects_docs_closeout_gate()
    if not docs_ok:
        print("EFFECTS DOCS CLOSEOUT FAILED — see docs-closeout.log")
        _fail_and_exit(stdout_buf)

    patch_effects_goal_e10(0)
    _append_verify_run_summary(0)
    print(f"Evidence in {SCRATCH}")

    _finalize_stdout(stdout_buf)
    if (REPO_SCRATCH / "launch-fail.log").exists():
        print("EVIDENCE INTEGRITY FAIL — launch-fail.log in repo scratch after successful run")
        sys.exit(1)


if __name__ == "__main__":
    main()