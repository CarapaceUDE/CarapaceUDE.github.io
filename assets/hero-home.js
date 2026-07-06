import { initScrollHero } from "./hero-core.js";
import { SOURCE_LINKS } from "./hero-constants.js";

export const HERO_SLIDES = [
  {
    eyebrow: "Carapace Cortex",
    title: "Own Your Intelligence",
    sub: "Build a private AI layer around your business.",
    note: "Your data. Your workflows. Your control.",
    proof: [
      { label: "Private", detail: "Runs inside your boundary — not a shared tenant." },
      { label: "Model-independent", detail: "Route across providers without rewrites." },
      { label: "No lock-in", detail: "Own the workflows and the data path." }
    ],
    oklch: { L: 0.55, h: 275, rel: 0.35 },
    effect: "shield",
    bokeh: 0.28
  },
  {
    eyebrow: "The Hidden Tax",
    title: "60% of Team Time",
    sub: "Knowledge workers spend most of their day on “work about work.”",
    note: "Hundreds of hours per person, per year.",
    proof: [
      { label: "Asana", detail: "Anatomy of Work Index", source: SOURCE_LINKS.asanaIndex, stat: true },
      {
        label: "664 hrs/yr",
        detail: "103+209+352 hrs/yr in meetings, dupes, status",
        source: SOURCE_LINKS.asanaWorkAboutWork,
        stat: true
      }
    ],
    oklch: { L: 0.48, h: 280, rel: 0.28 },
    effect: "cascade",
    bokeh: 0.34
  },
  {
    eyebrow: "The Problem",
    title: "Let Humans Do Human Work",
    sub: "Your best people shouldn't spend their days connecting tools.",
    note: "Automate handoffs so teams can focus on judgment and craft.",
    proof: [
      { label: "Less routing", detail: "Automate handoffs between tools." },
      { label: "Less copy/paste", detail: "Keep humans on judgment, not glue work." }
    ],
    oklch: { L: 0.52, h: 230, rel: 0.3 },
    effect: "orbit",
    bokeh: 0.32
  },
  {
    eyebrow: "The Layer",
    title: "Private AI Infrastructure",
    sub: "A business-owned automation layer that connects tools.",
    note: "Reusable operational intelligence.",
    proof: [
      { label: "Your workflows", detail: "Encoded as reusable operational intelligence." },
      { label: "Your knowledge", detail: "Grounded in your systems — not the public web." }
    ],
    oklch: { L: 0.5, h: 230, rel: 0.32 },
    effect: "hexpulse",
    bokeh: 0.33
  },
  {
    eyebrow: "The Business Case",
    title: "Replace SaaS Waste",
    sub: "Build workflows that compound inside your organization.",
    note: "Savings from reduced overhead.",
    proof: [
      { label: "Consolidation", detail: "Replace overlapping SaaS overhead." },
      { label: "Automation", detail: "Compound savings inside the org." }
    ],
    oklch: { L: 0.54, h: 45, rel: 0.26 },
    effect: "magnet",
    bokeh: 0.3
  },
  {
    eyebrow: "The ROI Signal",
    title: "3.7× Average ROI",
    sub: "IDC reported $3.70 return per $1 invested in AI.",
    note: "Stronger when connected to real workflows.",
    proof: [
      {
        label: "IDC / Microsoft",
        detail: "$3.70 return per $1 on AI spend",
        source: SOURCE_LINKS.idcAiRoi,
        stat: true
      }
    ],
    oklch: { L: 0.56, h: 300, rel: 0.3 },
    effect: "telemetry",
    bokeh: 0.31
  },
  {
    eyebrow: "The Time Dividend",
    title: "5–7+ Hours Back",
    sub: "Meaningful weekly time savings with trained AI.",
    note: "Focus on summaries, routing, and repetitive decisions.",
    proof: [
      {
        label: "Adecco",
        detail: "Workers using AI save ~1 hr/day",
        source: SOURCE_LINKS.adeccoGwof2024,
        stat: true
      },
      {
        label: "LSE / Protiviti",
        detail: "7.5 hrs/wk saved with AI on average",
        source: SOURCE_LINKS.lseProtiviti,
        stat: true
      }
    ],
    oklch: { L: 0.53, h: 195, rel: 0.34 },
    effect: "chrono",
    bokeh: 0.29
  },
  {
    eyebrow: "The Entry Point",
    title: "Start Small. Prove Value.",
    sub: "Begin with a focused Discovery Sprint.",
    note: "One measurable wedge at a time.",
    proof: [
      { label: "Discovery Sprint", detail: "One wedge. One measurable outcome." },
      { label: "Measurable wins", detail: "Prove value before you scale." }
    ],
    oklch: { L: 0.57, h: 250, rel: 0.38 },
    effect: "beacon",
    bokeh: 0.3
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-home" });
}