#!/usr/bin/env python3
"""Remove first inline <style> block; ensure shared head links on primary pages."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["business.html", "about.html", "solutions.html", "licensing.html", "carapace.html", "cortex.html"]

FONT = """  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />"""

SITE = '  <link rel="stylesheet" href="assets/site.css?v=20260704" />'
PAGES_CSS = '  <link rel="stylesheet" href="assets/pages.css?v=20260704" />'


def patch(path: Path):
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"<html lang=\"en\">", '<html lang="en" data-theme="dark">', text, count=1)
    text = re.sub(r'content="#090c18"', 'content="#1a1c24"', text)
    text = re.sub(r'content="#030711"', 'content="#1a1c24"', text)
    # Remove first inline style block only on pages that moved to pages.css
    if path.name in {"business.html", "about.html", "solutions.html", "licensing.html"}:
        text = re.sub(r"\s*<style>.*?</style>", "", text, count=1, flags=re.DOTALL)
    if FONT not in text:
        text = text.replace("<head>", "<head>\n" + FONT, 1)
    if SITE not in text:
        pass
    else:
        text = text.replace(SITE, SITE + "\n" + PAGES_CSS)
    if path.name in {"business.html", "about.html", "solutions.html", "licensing.html"}:
        if PAGES_CSS not in text:
            text = text.replace(SITE, SITE + "\n" + PAGES_CSS)
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path.name}")


for name in PAGES:
    patch(ROOT / name)