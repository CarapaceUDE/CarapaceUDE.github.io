import { initScrollHero } from "./hero-core.js?v=20260706b";

export const HERO_SLIDES = [
  {
    eyebrow: "Licensing",
    title: "Clarity Not Mystery",
    sub: "Cortex stays free for personal use. Carapace provides the commercial path, implementation help, and optional support when work goes live.",
    note: "Read the terms before you talk to us. Every agreement is downloadable below.",
    proof: [
      { label: "Open-core", detail: "Inspectable software boundary." },
      { label: "Personal free", detail: "Community edition path." }
    ],
    oklch: { L: 0.52, h: 275, rel: 0.32 },
    effect: "shield",
    bokeh: 0.3
  },
  {
    eyebrow: "Personal Lane",
    title: "Free For Personal Use",
    sub: "Explore Cortex directly under the community edition license with no sales conversation required to start learning.",
    note: "Download agreements and evaluate fit on your own timeline.",
    proof: [
      { label: "Community edition", detail: "Read & download the license." },
      { label: "GitHub", detail: "Open-core releases.", source: "https://github.com/CarapaceUDE/carapace" }
    ],
    oklch: { L: 0.5, h: 230, rel: 0.28 },
    effect: "branch",
    bokeh: 0.31
  },
  {
    eyebrow: "Evaluation Lane",
    title: "Under $100K Revenue",
    sub: "Smaller businesses can keep evaluating Cortex inside real operations before stepping into a broader commercial structure.",
    note: "Continuous evaluation, not a forced conversion moment.",
    proof: [
      { label: "Evaluate", detail: "Assess fit in your environment." },
      { label: "Inspectable", detail: "Agreements you can scan." }
    ],
    oklch: { L: 0.54, h: 230, rel: 0.3 },
    effect: "topology",
    bokeh: 0.32
  },
  {
    eyebrow: "Commercial Deploy",
    title: "Live Operations Path",
    sub: "When Cortex becomes part of business work, the commercial license governs deployment, internal workflows, and production use.",
    note: "Tier figures reflect our current pilot testing phase.",
    pilotNote: true,
    proof: [
      { label: "Platform license", detail: "$499/mo for Cortex commercial access." },
      { label: "Strategy retainer", detail: "$399/mo, up to 10 hours support." },
      { label: "Commercial license", detail: "Business use agreement." }
    ],
    oklch: { L: 0.55, h: 45, rel: 0.28 },
    effect: "parcel",
    bokeh: 0.3
  },
  {
    eyebrow: "Support Additive",
    title: "Optional Retainer",
    sub: "Strategy and support help that can be added after implementation, without becoming a disguised product requirement.",
    note: "Pilot-phase pricing, subject to change after validation.",
    pilotNote: true,
    proof: [
      { label: "Extended support", detail: "$199/mo, 15 hours add-on." },
      { label: "Retainer terms", detail: "$399/mo strategy & support." },
      { label: "No forced dependency", detail: "Support is additive." }
    ],
    oklch: { L: 0.53, h: 300, rel: 0.3 },
    effect: "ledger",
    bokeh: 0.31
  },
  {
    eyebrow: "Agreements",
    title: "Inspectable Boundaries",
    sub: "NDAs, data segregation, sprint agreements, and commercial licenses, all downloadable for counsel and operators.",
    note: "Control should survive growth.",
    proof: [
      { label: "PDF grid", detail: "Current agreements below." },
      { label: "Cortex", detail: "Explore the product.", source: "cortex.html" }
    ],
    oklch: { L: 0.48, h: 280, rel: 0.28 },
    effect: "checksum",
    bokeh: 0.29
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-licensing", ctaSectionId: "agreements" });
}