#!/usr/bin/env python3
"""Remove hardcoded rgba photo-hero backgrounds from pages.css (handled by pages-craft.css)."""
import re
from pathlib import Path

PAGES_CSS = Path(__file__).resolve().parents[1] / "assets" / "pages.css"
text = PAGES_CSS.read_text(encoding="utf-8")
# Drop rgba gradient layers before url(...) in .hero background-image rules
text = re.sub(
    r"background-image:\s*linear-gradient\([^)]*rgba\([^)]+\)[^)]*\)[^;]*,\s*linear-gradient\([^)]*rgba\([^)]+\)[^)]*\)[^,]*,\s*",
    "background-image: ",
    text,
)
text = re.sub(
    r"background-image:\s*linear-gradient\([^)]*rgba\([^)]+\)[^)]*\)[^,]*,\s*linear-gradient\([^)]*rgba\([^)]+\)[^)]*\)[^,]*,\s*",
    "background-image: ",
    text,
)
PAGES_CSS.write_text(text, encoding="utf-8")
print("Stripped rgba hero layers from pages.css")