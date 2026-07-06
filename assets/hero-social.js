/**
 * Hero chrome social links — Patreon, X, Discord (left) · GitHub, YouTube, TikTok (right).
 */
(function () {
  const LEFT = [
    {
      href: "https://www.patreon.com/cw/CarapaceAI",
      label: "Patreon",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h4v18H2V3zm7 0c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z"/></svg>'
    },
    {
      href: "https://x.com/CarapaceAI",
      label: "X",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2.25h3.37L13.89 11.1l9.58 10.65h-7.55l-5.9-7.72-6.75 7.72H.58l8.86-10.13L.22 2.25h7.75l5.33 7.05 5.6-7.05zm-1.18 17.52h1.87L7.02 4.68H5.02l12.7 15.09z"/></svg>'
    },
    {
      href: "https://discord.gg/VgDchHUHm3",
      label: "Discord",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.51.08.08 0 0 0-.08.04 13.5 13.5 0 0 0-.61 1.25 18.3 18.3 0 0 0-5.49 0 12.5 12.5 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.51.07.07 0 0 0-.03.03C1.69 8.68.96 12.8 1.28 16.87a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03 14 14 0 0 0 1.23-2 .08.08 0 0 0-.04-.11 13 13 0 0 1-1.87-.89.08.08 0 0 1 .01-.13c.12-.09.24-.18.36-.27a.08.08 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.08.08 0 0 1 .08.01c.12.1.25.19.37.28a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.08.08 0 0 0-.04.11c.36.69.77 1.35 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.41-4.66-.7-8.76-3.64-12.5a.06.06 0 0 0-.03-.03zM8.52 14.1c-1.18 0-2.16-1.08-2.16-2.4s.95-2.4 2.16-2.4 2.18 1.08 2.16 2.4-.95 2.4-2.16 2.4zm7.06 0c-1.18 0-2.16-1.08-2.16-2.4s.95-2.4 2.16-2.4 2.18 1.08 2.16 2.4-.96 2.4-2.16 2.4z"/></svg>'
    }
  ];

  const RIGHT = [
    {
      href: "https://github.com/CarapaceUDE",
      label: "GitHub",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>'
    },
    {
      href: "https://www.youtube.com/@carapaceai",
      label: "YouTube",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6 3.5-6 3.5z"/></svg>'
    },
    {
      href: "https://www.tiktok.com/@carapaceai",
      label: "TikTok",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/></svg>'
    }
  ];

  function buildSocialNav(side, links) {
    const nav = document.createElement("nav");
    nav.className = "chrome-social chrome-social--" + side;
    nav.setAttribute("aria-label", "Social media");
    links.forEach(function (item) {
      const a = document.createElement("a");
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.setAttribute("aria-label", item.label);
      a.innerHTML = item.icon;
      nav.appendChild(a);
    });
    return nav;
  }

  function mountInChromeBottom(bottom) {
    if (bottom.dataset.socialMounted === "1") return;
    const cursorBlock = bottom.querySelector("#meta-cursor")?.closest(".meta-block");
    if (!cursorBlock) return;

    cursorBlock.classList.add("meta-block--center");

    const hub = document.createElement("div");
    hub.className = "chrome-bottom-hub";
    bottom.insertBefore(hub, cursorBlock);

    const leftNav = buildSocialNav("left", LEFT);
    const rightNav = buildSocialNav("right", RIGHT);
    hub.appendChild(leftNav);
    hub.appendChild(cursorBlock);
    hub.appendChild(rightNav);

    bottom.dataset.socialMounted = "1";
  }

  function mountMinimalChrome() {
    if (document.querySelector(".hero-chrome") || document.body.dataset.socialMounted === "1") return;

    const chrome = document.createElement("div");
    chrome.className = "hero-chrome hero-chrome--minimal";

    const bottom = document.createElement("div");
    bottom.className = "chrome-bottom chrome-bottom--social-only";
    bottom.dataset.socialMounted = "1";
    bottom.appendChild(buildSocialNav("left", LEFT));
    bottom.appendChild(buildSocialNav("right", RIGHT));

    chrome.appendChild(bottom);
    document.body.appendChild(chrome);
    document.body.dataset.socialMounted = "1";
  }

  function setupChromeSocial() {
    if (!document.body.className.match(/page-/)) return;

    const bottom = document.querySelector(".hero-chrome .chrome-bottom");
    if (bottom) {
      mountInChromeBottom(bottom);
      return;
    }

    mountMinimalChrome();
  }

  window.setupChromeSocial = setupChromeSocial;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupChromeSocial);
  } else {
    setupChromeSocial();
  }
})();