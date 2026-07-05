#!/usr/bin/env python3
"""Extract site copy from HTML, deck JSON, SVG text, and OCR notes file."""
from __future__ import annotations

import glob
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site-copy-extract.md"


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip = False
        self.skip_tags = {"script", "style", "noscript"}

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in self.skip_tags:
            self.skip = True

    def handle_endtag(self, tag: str) -> None:
        if tag in self.skip_tags:
            self.skip = False

    def handle_data(self, data: str) -> None:
        if self.skip:
            return
        text = data.strip()
        if text:
            self.parts.append(text)


def extract_html(path: Path) -> dict:
    html = path.read_text(encoding="utf-8", errors="ignore")
    title = ""
    description = ""
    m = re.search(r"<title>([^<]+)</title>", html, re.I)
    if m:
        title = m.group(1).strip()
    m = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.I,
    )
    if m:
        description = m.group(1).strip()
    parser = TextExtractor()
    parser.feed(html)
    return {
        "title": title,
        "description": description,
        "body": "\n".join(parser.parts),
    }


def load_deck() -> list[dict]:
    index = ROOT / "ideas" / "index.html"
    if not index.exists():
        return []
    html = index.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r"const slides = (\[.*?\]);", html, re.S)
    if not m:
        return []
    return json.loads(m.group(1))


def extract_svg_text() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for svg in sorted((ROOT / "assets").glob("*.svg")):
        content = svg.read_text(encoding="utf-8", errors="ignore")
        texts = re.findall(r">([^<]{2,})<", content)
        cleaned = []
        for t in texts:
            t = t.strip()
            if t and not t.startswith("http"):
                cleaned.append(t)
        if cleaned:
            out[str(svg.relative_to(ROOT)).replace("\\", "/")] = cleaned
    return out


def load_ocr_sections() -> str:
    ocr = ROOT / "site-copy-ocr.md"
    if ocr.exists():
        return ocr.read_text(encoding="utf-8", errors="ignore")
    return ""


def extract_pdfs() -> list[tuple[str, str]]:
    try:
        import pdfplumber
    except ImportError:
        return []

    sections: list[tuple[str, str]] = []
    for pdf in sorted((ROOT / "assets").glob("*.pdf")):
        chunks: list[str] = []
        try:
            with pdfplumber.open(pdf) as doc:
                for page in doc.pages:
                    text = page.extract_text() or ""
                    if text.strip():
                        chunks.append(text.strip())
        except Exception as exc:
            chunks.append(f"[Could not extract: {exc}]")
        sections.append((pdf.name, "\n\n".join(chunks)))
    return sections


def main() -> None:
    lines: list[str] = [
        "# Carapace Site Copy Extract",
        "",
        "Comprehensive copy capture from HTML pages, pitch deck scripts, SVG assets,",
        "and OCR of image/infographic assets.",
        "",
        f"Generated from repo: `{ROOT.name}`",
        "",
    ]

    # HTML pages
    lines += ["---", "", "## HTML Pages", ""]
    html_pages = sorted(
        p
        for p in glob.glob(str(ROOT / "**" / "*.html"), recursive=True)
        if "node_modules" not in p
    )
    for page in html_pages:
        rel = Path(page).relative_to(ROOT).as_posix()
        data = extract_html(Path(page))
        lines += [f"### {rel}", ""]
        if data["title"]:
            lines += [f"**Title:** {data['title']}", ""]
        if data["description"]:
            lines += [f"**Meta description:** {data['description']}", ""]
        lines += [data["body"], "", "---", ""]

    # Pitch deck (structured)
    deck = load_deck()
    if deck:
        lines += ["## Pitch Deck (ideas/index.html)", ""]
        for slide in deck:
            n = slide.get("n", slide.get("number", "?"))
            title = slide.get("title", "")
            img = slide.get("img", slide.get("image", ""))
            lines += [f"### Slide {n}: {title}", ""]
            if img:
                lines += [f"**Image:** `{img}`", ""]
            for para in slide.get("paras", []):
                lines += [para, ""]
            lines += ["---", ""]

    # Speaker script
    script = ROOT / "ideas" / "pitchdeck1.txt"
    if script.exists():
        lines += ["## Pitch Deck Speaker Script (ideas/pitchdeck1.txt)", "", script.read_text(encoding="utf-8"), "", "---", ""]

    # SVG text
    svg_text = extract_svg_text()
    if svg_text:
        lines += ["## SVG Text", ""]
        for path, texts in svg_text.items():
            lines += [f"### {path}", ""]
            for t in texts:
                lines += [f"- {t}"]
            lines += ["", "---", ""]

    # OCR sections (maintained separately for image copy)
    ocr = load_ocr_sections()
    if ocr:
        lines += [ocr, ""]

    # PDF agreements and feature list
    pdfs = extract_pdfs()
    if pdfs:
        lines += ["## PDF Documents (assets/)", ""]
        for name, text in pdfs:
            lines += [f"### {name}", "", text, "", "---", ""]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()