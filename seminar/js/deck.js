(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDES = window.WORKSHOP_SLIDES || [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function chrome(s) {
    return `<div class="chrome"><div class="mark"><span class="tick"></span> Carapace</div><div>${esc(s.kicker || "")}</div></div>`;
  }

  function foot(n) {
    const pad = String(n).padStart(2, "0");
    return `<div class="foot"><span>carapaceai.org</span><span>${pad} / ${String(SLIDES.length).padStart(2, "0")}</span></div>`;
  }

  function tableHtml(headers, rows) {
    const head = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
    const body = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
    return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

  function render(s) {
    const id = esc(s.id);
    const title = s.title ? `<h1>${esc(s.title).replace(/\n/g, "<br>")}</h1>` : "";
    const sub = s.sub ? `<p class="sub">${esc(s.sub).replace(/\n/g, "<br>")}</p>` : "";
    let body = "";
    switch (s.layout) {
      case "title":
        body = `${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}${title}${sub}${s.gold ? `<p class="sub gold">${esc(s.gold)}</p>` : ""}${s.meta ? `<p class="sub" style="margin-top:48px;color:var(--meta);font-size:18px;letter-spacing:0.08em;text-transform:uppercase">${esc(s.meta).replace(/\n/g, "<br>")}</p>` : ""}`;
        break;
      case "agenda":
      case "table":
        body = `${chrome(s)}${title}${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ""}${tableHtml(s.headers, s.rows)}`;
        break;
      case "list":
        body = `${chrome(s)}${title}${sub}<div class="list">${s.items
          .map((it, i) => {
            const isObj = it && typeof it === "object";
            const n = isObj ? (it.n || String(i + 1).padStart(2, "0")) : String(i + 1).padStart(2, "0");
            let label;
            if (!isObj) label = esc(it);
            else if (it.t) label = `<strong>${esc(it.t)}</strong><span>${esc(it.d)}</span>`;
            else label = esc(it.d || "");
            return `<div class="row"><div class="n">${esc(n)}</div><div class="t">${label}</div></div>`;
          })
          .join("")}</div>`;
        break;
      case "split":
        body = `${chrome(s)}${title}<div class="split"><div class="pane"><h2>${esc(s.left.h)}</h2>${s.left.ps.map((p) => `<p>${esc(p)}</p>`).join("")}</div><div class="pane"><h2>${esc(s.right.h)}</h2>${s.right.ps.map((p) => `<p>${esc(p)}</p>`).join("")}</div></div>`;
        break;
      case "cards-3":
        body = `${chrome(s)}${title}${sub}<div class="cards">${s.cards
          .map(
            (c, i) =>
              `<div class="card${c.hot ? " hot" : ""}"><div class="n">${esc(c.n)}</div><h2>${esc(c.h)}</h2><p>${esc(c.p)}</p></div>`
          )
          .join("")}</div>`;
        break;
      case "spec":
        body = `${chrome(s)}${title}<div class="spec-grid">${s.cells
          .map((c) => `<div class="spec-cell"><div class="n">${esc(c.n)}</div><p>${esc(c.p)}</p></div>`)
          .join("")}</div>`;
        break;
      case "flow-3":
        body = `${chrome(s)}${title}${sub}<div class="flow">${s.boxes
          .map((b, i) => `<div class="box${i === 1 ? " mid" : ""}">${esc(b)}</div>`)
          .join("")}</div>`;
        break;
      case "quote":
        body = `${chrome(s)}<div class="quote"><div class="kicker">${esc(s.kickerLine || "The sentence")}</div><h1>${esc(s.title).replace(/\n/g, "<br>")}</h1>${sub}</div>`;
        break;
      case "close":
        body = `${chrome(s)}${title}${sub}`;
        break;
      default:
        body = `${chrome(s)}${title}${sub}`;
    }
    return `<section class="slide" data-id="${id}">${body}${foot(s.n)}</section>`;
  }

  function fit() {
    const stage = document.getElementById("stage");
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "1")) {
      stage.style.zoom = String(s);
      stage.style.transform = "none";
    } else {
      stage.style.zoom = "";
      stage.style.transform = "scale(" + s + ")";
    }
  }

  let index = 0;
  let busy = false;
  let autoplay = false;
  let autoTimer = 0;
  let notesOn = false;
  const els = {};

  function setHud() {
    document.querySelectorAll("#hud .dot").forEach((d, i) => d.classList.toggle("is-on", i === index));
    document.querySelector("#progress > span").style.width = ((index + 1) / SLIDES.length) * 100 + "%";
    const notes = document.getElementById("notes");
    if (notesOn) {
      notes.classList.add("is-on");
      notes.innerHTML = `<strong>Notes</strong>${esc(SLIDES[index].notes || "No notes.")}`;
    } else {
      notes.classList.remove("is-on");
    }
  }

  function show(i, instant) {
    const next = (i + SLIDES.length) % SLIDES.length;
    els.slides.forEach((el, n) => {
      el.classList.toggle("is-active", n === next);
    });
    index = next;
    location.hash = String(next + 1);
    setHud();
    busy = false;
  }

  function goTo(i) {
    if (busy) return;
    const next = (i + SLIDES.length) % SLIDES.length;
    if (next === index) return;
    busy = !reduced;
    if (reduced) {
      show(next, true);
      return;
    }
    window.setTimeout(() => show(next, false), 40);
    show(next, false);
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function armAuto() {
    clearTimeout(autoTimer);
    if (autoplay) autoTimer = setTimeout(next, 12000);
  }

  function parseHash() {
    const n = parseInt((location.hash || "#1").slice(1), 10);
    if (!n || n < 1) return 0;
    return Math.min(SLIDES.length, n) - 1;
  }

  function init() {
    if (!SLIDES.length) return;
    fit();
    window.addEventListener("resize", fit);

    const root = document.getElementById("slides");
    root.innerHTML = SLIDES.map(render).join("");
    els.slides = Array.from(root.querySelectorAll(".slide"));

    const rail = document.querySelector("#hud .rail");
    rail.innerHTML = SLIDES.map((_, i) => `<button class="dot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");
    rail.addEventListener("click", (e) => {
      const b = e.target.closest(".dot");
      if (!b) return;
      e.stopPropagation();
      goTo(+b.dataset.i);
    });
    document.getElementById("prev-btn").addEventListener("click", (e) => { e.stopPropagation(); prev(); });
    document.getElementById("next-btn").addEventListener("click", (e) => { e.stopPropagation(); next(); });

    show(parseHash(), true);

    document.getElementById("stage").addEventListener("click", (e) => {
      if (e.target.closest("#hud")) return;
      next();
    });

    window.addEventListener("hashchange", () => {
      const i = parseHash();
      if (i !== index) goTo(i);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(SLIDES.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen();
      } else if (e.key === "n" || e.key === "N") {
        notesOn = !notesOn;
        setHud();
      } else if (e.key === "p" || e.key === "P") {
        autoplay = !autoplay;
        const hint = document.getElementById("hint");
        hint.textContent = autoplay ? "Autoplay on  ·  P to pause" : "Click or →  ·  F fullscreen  ·  N notes";
        armAuto();
      }
    });

    let sx = 0;
    document.getElementById("stage").addEventListener("touchstart", (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
    document.getElementById("stage").addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
