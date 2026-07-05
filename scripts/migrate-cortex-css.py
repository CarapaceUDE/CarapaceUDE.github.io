#!/usr/bin/env python3
"""Extract cortex.html inline CSS, retokenize, scope under .page-cortex, append to pages-craft.css."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORTEX = ROOT / "cortex.html"
CRAFT = ROOT / "assets" / "pages-craft.css"

SKIP_PREFIXES = (
    ":root",
    "html",
    "body",
    "* ",
    "*{",
    "*{",
    ".nav",
    ".nav-inner",
    ".brand",
    ".links",
    ".dropdown",
    ".dropbtn",
    ".dropdown-menu",
    "footer",
    "footer ",
    ".btn",
    ".btn.",
    "a {",
    ".wrap {",
)

REPLACEMENTS = [
    (r"Inter,\s*Segoe UI[^;]+", "var(--font-body)"),
    (r'"Roboto Mono"[^;]+', "var(--font-mono)"),
    (r"Roboto Mono[^;]+", "var(--font-mono)"),
    (r"var\(--text\)", "var(--fg)"),
    (r"var\(--blue\)", "var(--accent)"),
    (r"var\(--blue-2\)", "var(--accent-dim)"),
    (r"var\(--copper\)", "var(--warn)"),
    (r"var\(--green\)", "var(--success)"),
    (r"var\(--quiet\)", "var(--meta)"),
    (r"#dfe8f7", "var(--fg-2)"),
    (r"#d8e6ff", "var(--fg-2)"),
    (r"#d8e9ff", "var(--fg-2)"),
    (r"#dce8ff", "var(--fg-2)"),
    (r"#cad8ee", "var(--muted)"),
    (r"#fff3ea", "var(--fg)"),
    (r"#f5a56f", "var(--warn)"),
    (r"#ffd7be", "var(--warn)"),
    (r"#9fb0d0", "var(--muted)"),
    (r"#d7e6ff", "var(--fg-2)"),
    (r"backdrop-filter:\s*[^;]+;?", ""),
    (r"box-shadow:\s*[^;]+;?", ""),
    (r"border-radius:\s*var\(--radius\)", "border-radius: 0"),
    (r"border-radius:\s*\d+px", "border-radius: 0"),
    (r"border-radius:\s*999px", "border-radius: 0"),
    (r"border-radius:\s*26px", "border-radius: 0"),
    (r"border-radius:\s*30px", "border-radius: 0"),
    (r"border-radius:\s*24px", "border-radius: 0"),
    (r"border-radius:\s*22px", "border-radius: 0"),
    (r"border-radius:\s*18px", "border-radius: 0"),
    (r"border-radius:\s*16px", "border-radius: 0"),
    (r"border-radius:\s*14px", "border-radius: 0"),
    (r"border-radius:\s*12px", "border-radius: 0"),
    (r"border-radius:\s*10px", "border-radius: 0"),
    (r"background:\s*linear-gradient\(180deg,\s*#6e8ed0[^;]+;", "background: var(--accent);"),
    (r"background:\s*linear-gradient\(145deg[^;]+;", "background: var(--surface);"),
    (r"background:\s*linear-gradient\(180deg,\s*rgba\(16,\s*31,\s*55[^;]+;", "background: var(--surface);"),
    (r"rgba\(118,\s*151,\s*190[^)]+\)", "var(--border)"),
    (r"rgba\(124,\s*215,\s*255[^)]+\)", "color-mix(in oklch, var(--accent) 25%, transparent)"),
    (r"rgba\(242,\s*139,\s*73[^)]+\)", "color-mix(in oklch, var(--warn) 20%, transparent)"),
    (r"rgba\(9,\s*17,\s*31[^)]+\)", "var(--surface)"),
    (r"rgba\(18,\s*34,\s*58[^)]+\)", "var(--surface)"),
    (r"rgba\(11,\s*21,\s*39[^)]+\)", "var(--surface)"),
    (r"rgba\(4,\s*10,\s*20[^)]+\)", "var(--surface)"),
    (r"rgba\(2,\s*7,\s*17[^)]+\)", "var(--surface)"),
    (r"rgba\(3,\s*8,\s*17[^)]+\)", "var(--surface)"),
    (r"rgba\(8,\s*17,\s*31[^)]+\)", "var(--surface)"),
    (r"rgba\(14,\s*27,\s*49[^)]+\)", "var(--surface)"),
    (r"rgba\(17,\s*32,\s*56[^)]+\)", "var(--surface)"),
    (r"rgba\(7,\s*13,\s*26[^)]+\)", "var(--surface)"),
]


def extract_style(html: str) -> str:
    m = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
    return m.group(1).strip() if m else ""


def retokenize(css: str) -> str:
    for pat, repl in REPLACEMENTS:
        css = re.sub(pat, repl, css)
    return css


def should_skip_selector(sel: str) -> bool:
    sel = sel.strip()
    for p in SKIP_PREFIXES:
        if sel.startswith(p):
            return True
    if sel in ("a", "h1", "h2", "h3", "p"):
        return True
    if re.match(r"^h[123],\s*h[123]", sel):
        return True
    return False


def scope_css(css: str) -> str:
    out = []
    i = 0
    while i < len(css):
        if css[i:].startswith("@media"):
            m = re.match(r"@media[^{]+\{", css[i:])
            if not m:
                break
            header = m.group(0)
            start = i + len(header)
            depth = 1
            j = start
            while j < len(css) and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            inner = css[start : j - 1]
            out.append(header + scope_css(inner) + "}")
            i = j
            continue

        m = re.match(r"([^{]+)\{", css[i:])
        if not m:
            i += 1
            continue
        selector = m.group(1).strip()
        start = i + len(m.group(0))
        depth = 1
        j = start
        while j < len(css) and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        body = css[start : j - 1]
        if not should_skip_selector(selector):
            scoped = ", ".join(
                f".page-cortex {s.strip()}" if not s.strip().startswith(".page-cortex") else s.strip()
                for s in selector.split(",")
            )
            out.append(f"{scoped} {{{body}}}")
        i = j
    return "\n".join(out)


def main():
    html = CORTEX.read_text(encoding="utf-8")
    raw = extract_style(html)
    if not raw:
        print("No style block found")
        return
    css = scope_css(retokenize(raw))
    block = "\n/* --- cortex.html (migrated, scoped) --- */\n" + css + "\n"
    existing = CRAFT.read_text(encoding="utf-8") if CRAFT.exists() else ""
    if "cortex.html (migrated" in existing:
        existing = re.sub(
            r"/\* --- cortex\.html \(migrated.*?\*/.*?(?=/\* --- |\Z)",
            "",
            existing,
            flags=re.DOTALL,
        )
    CRAFT.write_text(existing.rstrip() + "\n" + block, encoding="utf-8")
    print(f"Appended cortex CSS to {CRAFT} ({len(css)} chars)")

    # Strip style from cortex.html
    new_html = re.sub(r"\s*<style>.*?</style>\s*", "\n", html, count=1, flags=re.DOTALL)
    # Normalize head links
    new_html = re.sub(
        r'<link rel="stylesheet" href="assets/site\.css[^"]*" />\s*<link rel="stylesheet" href="assets/pages\.css[^"]*" />',
        "",
        new_html,
    )
    head_insert = (
        '  <link rel="stylesheet" href="assets/site.css?v=20260704c" />\n'
        '  <link rel="stylesheet" href="assets/pages.css?v=20260704c" />\n'
        '  <link rel="stylesheet" href="assets/pages-craft.css?v=20260704c" />\n'
    )
    new_html = new_html.replace("</head>", head_insert + "</head>", 1)
    CORTEX.write_text(new_html, encoding="utf-8")
    print(f"Updated {CORTEX}")


if __name__ == "__main__":
    main()