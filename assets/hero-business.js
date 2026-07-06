import { initScrollHero } from "./hero-core.js";

export const HERO_SLIDES = [
  {
    eyebrow: "How We Help",
    title: "Your Private AI Team",
    sub: "Carapace becomes your private AI infrastructure team — the human API between your business and the models, tools, and environments that should serve it.",
    note: "Start with one real workflow. Prove the value. Build outward from evidence.",
    proof: [
      { label: "Human API", detail: "Email, files, portals → governed execution." },
      { label: "Your boundary", detail: "Runs inside your environment." }
    ],
    oklch: { L: 0.52, h: 275, rel: 0.32 },
    effect: "topology",
    bokeh: 0.31
  },
  {
    eyebrow: "What We Do",
    title: "Scope Connect Build",
    sub: "We map friction, connect systems, and encode workflows as reusable operational intelligence inside Cortex.",
    note: "Consulting where it matters — building where it compounds.",
    proof: [
      { label: "Scope", detail: "Map workflows & quick wins." },
      { label: "Connect", detail: "Bridge tools & data paths." },
      { label: "Build", detail: "Deploy governed automations." }
    ],
    oklch: { L: 0.5, h: 230, rel: 0.3 },
    effect: "lattice",
    bokeh: 0.32
  },
  {
    eyebrow: "Who It's For",
    title: "Teams That Need Leverage",
    sub: "Owner-operators, lean teams, and growing businesses that need serious AI infrastructure without an internal AI department.",
    note: "Especially when work spans email, CRM, files, and human checkpoints.",
    proof: [
      { label: "Small business", detail: "Access beyond the enterprise." },
      { label: "Lean ops", detail: "No AI theater required." }
    ],
    oklch: { L: 0.54, h: 230, rel: 0.31 },
    effect: "cellscan",
    bokeh: 0.3
  },
  {
    eyebrow: "Why Hire Us",
    title: "Evidence Over Theater",
    sub: "A working system that reduces drag matters more than a flashy demo. Real operations are the test.",
    note: "We stay involved where implementation expertise turns pilots into durable systems.",
    proof: [
      { label: "Measured wins", detail: "Prove value before you scale." },
      { label: "Governed", detail: "Policy, custody, inspectability." }
    ],
    oklch: { L: 0.53, h: 300, rel: 0.3 },
    effect: "signal",
    bokeh: 0.29
  },
  {
    eyebrow: "How We Engage",
    title: "Consult Pilot Package",
    sub: "Begin with a focused Discovery Sprint, prove one or two automations, then expand into a production package when the evidence is clear.",
    note: "No giant transformation project on faith.",
    proof: [
      { label: "Discovery Sprint", detail: "One wedge, one outcome." },
      { label: "Pilot", detail: "Controlled deployment & measurement." },
      { label: "Package", detail: "Scale what already works." }
    ],
    oklch: { L: 0.55, h: 45, rel: 0.28 },
    effect: "branch",
    bokeh: 0.31
  },
  {
    eyebrow: "The Path",
    title: "Discover Deploy Expand",
    sub: "Map work, deploy safely inside your boundary, measure impact, then expand with governance intact.",
    note: "Carapace guides adoption — Cortex carries the workflow layer.",
    proof: [
      { label: "Discover", detail: "Map friction & prioritize." },
      { label: "Deploy", detail: "Secure, isolated, governed." },
      { label: "Measure", detail: "Track time & value." },
      { label: "Expand", detail: "Multiply proven wins." }
    ],
    oklch: { L: 0.51, h: 195, rel: 0.32 },
    effect: "relay",
    bokeh: 0.33
  },
  {
    eyebrow: "Why Carapace",
    title: "Not One Tool",
    sub: "Do not buy one product and hope it fits every job. Route work by capability, cost, speed, privacy, and policy.",
    note: "If a provider changes, your workflows and strategic direction do not have to change with it.",
    proof: [
      { label: "Model-independent", detail: "Frontier, local, private cloud." },
      { label: "No lock-in", detail: "Own the workflow path." }
    ],
    oklch: { L: 0.56, h: 250, rel: 0.34 },
    effect: "hashwave",
    bokeh: 0.3
  },
  {
    eyebrow: "Commercial Path",
    title: "$12K → $24K+",
    sub: "Discovery Sprint entry, then pilot deployment and production package as value is proven.",
    note: "Pilot-phase figures — subject to change after validation.",
    pilotNote: true,
    proof: [
      { label: "Discovery Sprint", detail: "Focused scoping & first automations." },
      { label: "Production path", detail: "Expand governed workflows." }
    ],
    oklch: { L: 0.57, h: 280, rel: 0.3 },
    effect: "telemetry",
    bokeh: 0.31
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-business", ctaSectionId: "contact" });
}