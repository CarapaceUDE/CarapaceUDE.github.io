#!/usr/bin/env python3
"""Remove em/en clause dashes from site-facing source files."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
EM = "\u2014"
EN = "\u2013"
CLAUSE_DASHES = (EM, EN, "\u2015", "\u2212")

GLOBS = [
    "assets/*.js",
    "assets/*.css",
    "assets/*.html",
    "*.html",
    "scripts/effects-hero-harness/*.html",
    "newhero/*.html",
    "newhero/*.css",
    "newhero/*.js",
    "newhero/*.md",
    "newhero/*.txt",
    "scripts/*.txt",
    "ideas/*.html",
    "ideas/*.md",
    "ideas/*.txt",
    "docs/*.md",
    "docs/*.txt",
    "baseline/**/*.md",
    "loi-thank-you.html",
]

# Prefer phrasing that reads naturally without em dashes.
PHRASE_REPLACEMENTS = [
    ("behind Cortex — we build", "behind Cortex. We build"),
    ("is leverage — a stronger", "is leverage: a stronger"),
    ("more capable — not more dependent", "more capable, not more dependent"),
    ("folder system — a private", "folder system, a private"),
    ("Trust you can inspect — policies", "Trust you can inspect: policies"),
    ("close to you — locally", "close to you, locally"),
    ("developer — interfaces", "developer: interfaces"),
    ("infrastructure team — the human API", "infrastructure team: the human API"),
    ("where it matters — building", "where it matters; building"),
    ("guides adoption — Cortex", "guides adoption; Cortex"),
    ("figures — subject", "figures, subject"),
    ("effect — see docs/visual-assets.md.", "effect (see docs/visual-assets.md)."),
    ("execution — models receive", "execution; models receive"),
    (
        "aliases — summarize, extract, classify, draft, route — then",
        "aliases (summarize, extract, classify, draft, route), then",
    ),
    ("tools — route elsewhere", "tools; route elsewhere"),
    ("inspected — trust is", "inspected. Trust is"),
    ("intake path — structured", "intake path, structured"),
    ("workflows — not another", "workflows, not another"),
    (
        "processes — customer inquiry to quote to job to invoice — not just",
        "processes (customer inquiry to quote to job to invoice), not just",
    ),
    ("software — test", "software; test"),
    ("before you talk to us — every", "before you talk to us. Every"),
    (
        "community edition license — no sales",
        "community edition license with no sales",
    ),
    ("evaluation — not a forced", "evaluation, not a forced"),
    ("evaluation – not a forced", "evaluation, not a forced"),
    ("Continuous evaluation — not", "Continuous evaluation, not"),
    ("Continuous evaluation – not", "Continuous evaluation, not"),
    ("$499/mo — Cortex", "$499/mo for Cortex"),
    ("$399/mo — up to", "$399/mo, up to"),
    ("$199/mo — 15 hours", "$199/mo, 15 hours"),
    (
        "after implementation — without becoming",
        "after implementation, without becoming",
    ),
    ("pricing — subject", "pricing, subject"),
    (
        "commercial licenses — all downloadable",
        "commercial licenses, all downloadable",
    ),
    ("draft responses — route", "draft responses, then route"),
    ("checkpoints — inspectable", "checkpoints: inspectable"),
    ("on judgment — not copy", "on judgment, not copy"),
    (
        "reusable intelligence — not scattered",
        "reusable intelligence, not scattered notes",
    ),
    (
        "workflow wedge — follow-up, intake routing, or internal ops — then",
        "workflow wedge (follow-up, intake routing, or internal ops), then",
    ),
    ("your boundary — not a shared", "your boundary, not a shared"),
    ("your systems — not the public", "your systems, not the public"),
    ("repeatable work — not judgment", "repeatable work, not judgment"),
    ("No AI theater — practical", "No AI theater. Practical"),
    ("Under $100K revenue — continuous", "Under $100K revenue: continuous"),
    ("Pilot-phase figure — subject", "Pilot-phase figure, subject"),
    ("AI assists — humans govern", "AI assists; humans govern"),
    ("path forward—without", "path forward without"),
    ("Carapace — Own Your Intelligence", "Carapace | Own Your Intelligence"),
    ("Carapace / Cortex — Pitch Deck", "Carapace / Cortex Pitch Deck"),
    ("Carapace / Cortex — Fullscreen Pitch Deck", "Carapace / Cortex Fullscreen Pitch Deck"),
    (" — Carapace / Cortex", " | Carapace / Cortex"),
    ("Carapace LLC</strong> — Makers", "Carapace LLC</strong> · Makers"),
    ("no problem — we still", "no problem. We still"),
    ("business strategy — all of that", "business strategy: all of that"),
    (
        "Cortex environment — local, cloud, or hybrid — with security",
        "Cortex environment (local, cloud, or hybrid) with security",
    ),
    ("and energy — and what should", "and energy, and what should"),
]

COMMENT_EM_RE = re.compile(rf"(\s){re.escape(EM)}(\s)")


SKIP_FILES = {"copy-sanitize.js", "remove-em-dashes.py"}


def targets() -> list[pathlib.Path]:
    out: list[pathlib.Path] = []
    seen: set[pathlib.Path] = set()
    for pattern in GLOBS:
        for path in ROOT.glob(pattern):
            if path.is_file() and path not in seen and path.name not in SKIP_FILES:
                seen.add(path)
                out.append(path)
    return sorted(out)


def transform(text: str, path: pathlib.Path) -> str:
    for old, new in PHRASE_REPLACEMENTS:
        text = text.replace(old, new)

    # HUD placeholders
    text = text.replace(f"{EM} , {EM}", "- , -")
    text = re.sub(rf"(?<=>){EM}(?=<)", "-", text)
    text = text.replace(f"id=\"meta-time\">{EM}<", 'id="meta-time">-<')
    text = text.replace(f"id=\"meta-cursor\">{EM} , {EM}<", 'id="meta-cursor">- , -<')

    # Code comments / CSS section headers: em dash to ASCII hyphen
    text = COMMENT_EM_RE.sub(r"\1-\2", text)

    # Remaining spaced em dashes in prose → comma
    text = text.replace(f" {EM} ", ", ")

    # Windows-1252 dash bytes in legacy files (not UTF-8 multiply sign bytes)
    text = text.replace("\x96", ", ")
    text = text.replace("\x97", ", ")

    for dash in CLAUSE_DASHES:
        text = text.replace(f" {dash} ", ", ")
        text = text.replace(dash, ", ")

    # Spaced ASCII hyphen used as a clause separator (prose only — skip code/math)
    if path.suffix in {".md", ".txt", ".html"} or "copy" in path.name.lower():
        text = re.sub(r"\s+-\s+(?=[A-Za-z\"'])", ", ", text)

    return text


def read_text(path: pathlib.Path) -> str:
    raw = path.read_bytes()
    for encoding in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1")


def main() -> int:
    changed = 0
    for path in targets():
        try:
            original = read_text(path)
        except OSError as err:
            print(f"skip: {path.relative_to(ROOT)} ({err})")
            continue
        updated = transform(original, path)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed += 1
            print(f"updated: {path.relative_to(ROOT)}")
    print(f"\n{changed} file(s) updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())