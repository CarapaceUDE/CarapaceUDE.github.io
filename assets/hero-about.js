import { initScrollHero } from "./hero-core.js";

export const HERO_SLIDES = [
  {
    eyebrow: "Who We Are",
    title: "Builders First",
    sub: "Carapace is the company behind Cortex — we build the software, deploy it into real workflows, and turn proven patterns into durable systems a business can own.",
    note: "Technology in service of human capability. No AI theater required.",
    proof: [
      { label: "Carapace", detail: "Infrastructure partner & implementation." },
      { label: "Cortex", detail: "Open-core control plane software." }
    ],
    oklch: { L: 0.54, h: 275, rel: 0.32 },
    effect: "filament",
    bokeh: 0.3
  },
  {
    eyebrow: "Our Mission",
    title: "Leverage Not Replacement",
    sub: "Put practical AI within reach of everyday businesses without surrendering control of data, workflows, or strategy.",
    note: "The goal is leverage — a stronger team supported by systems that absorb work people should not carry.",
    proof: [
      { label: "Human-centered", detail: "Judgment, care, and craft stay human." },
      { label: "Owner-operators", detail: "Serious tools without enterprise overhead." }
    ],
    oklch: { L: 0.52, h: 230, rel: 0.3 },
    effect: "magnet",
    bokeh: 0.31
  },
  {
    eyebrow: "What We Believe",
    title: "Four Durable Principles",
    sub: "Our technical and commercial choices follow beliefs that compound over time.",
    note: "Useful technology should make people more capable — not more dependent.",
    proof: [
      { label: "Human capability", detail: "Offload repeatable work." },
      { label: "Access beyond enterprise", detail: "Tools for lean teams." },
      { label: "Practical over performative", detail: "Real operations are the test." },
      { label: "Value that compounds", detail: "Reusable integrations & packages." }
    ],
    oklch: { L: 0.5, h: 300, rel: 0.28 },
    effect: "lattice",
    bokeh: 0.32
  },
  {
    eyebrow: "Cortex Ontology",
    title: "Six Intelligence Layers",
    sub: "Cortex organizes information into a living map of how your business actually works.",
    note: "Not a folder system — a private operating layer for real processes.",
    proof: [
      { label: "Your World", detail: "People, tools, and context." },
      { label: "Your Processes", detail: "Repeatable operational flows." },
      { label: "Your Decisions", detail: "Judgment points & policy." },
      { label: "Your Actions", detail: "Approved execution paths." },
      { label: "Your Boundaries", detail: "Custody, privacy, governance." },
      { label: "Your Feedback", detail: "Learning that improves the system." }
    ],
    oklch: { L: 0.55, h: 250, rel: 0.34 },
    effect: "constellation",
    bokeh: 0.33
  },
  {
    eyebrow: "Why We Exist",
    title: "Intelligence Sovereignty",
    sub: "Your data, workflows, business memory, and operational knowledge should not be extracted into someone else's platform just to make AI useful.",
    note: "Trust you can inspect — policies, routing, and audit trails stay visible.",
    proof: [
      { label: "Private boundary", detail: "Runs close to you — locally or in your VPC." },
      { label: "Inspectable", detail: "No mystery-box governance." }
    ],
    oklch: { L: 0.48, h: 280, rel: 0.28 },
    effect: "seal",
    bokeh: 0.3
  },
  {
    eyebrow: "Team",
    title: "Co-Founders",
    sub: "A small multidisciplinary team shipping open-core software and practical deployments.",
    note: "Field-level systems analysis and client solutions paired with UI craft and development.",
    proof: [
      {
        label: "@triphosphatedev",
        detail: "Business systems on the ground, real-world contact points, and communicating solutions.",
        source: "https://github.com/triphosphatedev"
      },
      {
        label: "@ascendism",
        detail: "UI expert and developer — interfaces, product craft, and implementation.",
        source: "https://github.com/ascendism"
      }
    ],
    oklch: { L: 0.53, h: 195, rel: 0.3 },
    effect: "orbit",
    bokeh: 0.29
  },
  {
    eyebrow: "Company + Software",
    title: "Carapace → Cortex",
    sub: "Carapace scopes, installs, and governs. Cortex routes, automates, and keeps decisions inspectable as providers change.",
    note: "One partnership path from discovery through governed automation.",
    proof: [
      { label: "Carapace", detail: "Human infrastructure partner." },
      { label: "Cortex", detail: "Model-independent control plane." },
      { label: "How We Help", detail: "See the engagement path.", source: "business.html" }
    ],
    oklch: { L: 0.56, h: 45, rel: 0.26 },
    effect: "relay",
    bokeh: 0.31
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-about" });
}