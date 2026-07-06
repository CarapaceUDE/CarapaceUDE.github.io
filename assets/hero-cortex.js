import { initScrollHero } from "./hero-core.js?v=20260706b";

export const HERO_SLIDES = [
  {
    eyebrow: "Cortex",
    title: "Private Control Plane",
    sub: "A model-independent layer that decides which model, tool, or environment handles each request based on policy, cost, speed, and context.",
    note: "Your intelligence layer should belong to you.",
    proof: [
      { label: "Open core", detail: "Inspectable software boundary." },
      { label: "Governed", detail: "Policy-first execution." }
    ],
    oklch: { L: 0.54, h: 275, rel: 0.34 },
    effect: "shield",
    bokeh: 0.3
  },
  {
    eyebrow: "Core Flow",
    title: "Capture Route Execute",
    sub: "Incoming signals become structured work: capture context, route by intent, approve sensitive steps, then execute.",
    note: "Procedural schematic effect (see docs/visual-assets.md).",
    proof: [
      { label: "Capture", detail: "Fling & signal intake." },
      { label: "Route", detail: "Intent-aware dispatch." },
      { label: "Approve", detail: "Human checkpoints." },
      { label: "Execute", detail: "Governed automation." }
    ],
    oklch: { L: 0.5, h: 230, rel: 0.3 },
    effect: "trace",
    bokeh: 0.32
  },
  {
    eyebrow: "Feature 01",
    title: "Context Management",
    sub: "Sensitive context stays segmented until the exact moment of execution; models receive only what the task requires.",
    note: "The model cannot leak what it never received.",
    proof: [
      { label: "Segmentation", detail: "Custody-first design." },
      { label: "Masking", detail: "Credentials isolated." }
    ],
    oklch: { L: 0.52, h: 230, rel: 0.31 },
    effect: "hexpulse",
    bokeh: 0.31
  },
  {
    eyebrow: "Feature 02",
    title: "Intent Routing",
    sub: "Business intent maps to capability aliases (summarize, extract, classify, draft, route), then dispatches to the best-fit destination.",
    note: "Frontier, local, private cloud, or specialized systems.",
    proof: [
      { label: "Aliases", detail: "Intent → capability map." },
      { label: "Policy", detail: "Cost, latency, risk rules." }
    ],
    oklch: { L: 0.53, h: 300, rel: 0.3 },
    effect: "mesh",
    bokeh: 0.3
  },
  {
    eyebrow: "Feature 03",
    title: "Model Independence",
    sub: "Maintain a roster spanning frontier APIs, local models, private cloud, and specialized tools; route elsewhere when providers change.",
    note: "No strategic rewrite when a vendor shifts.",
    proof: [
      { label: "Roster", detail: "Multi-provider routing." },
      { label: "Portable", detail: "Workflows survive provider churn." }
    ],
    oklch: { L: 0.55, h: 45, rel: 0.28 },
    effect: "signal",
    bokeh: 0.29
  },
  {
    eyebrow: "Feature 04",
    title: "Custody & Governance",
    sub: "Policies, approvals, routing decisions, and audit logs are designed to be inspected. Trust is a feature, not a promise.",
    note: "Explain, govern, and improve how AI work gets done.",
    proof: [
      { label: "Audit trail", detail: "Inspectable & reversible." },
      { label: "Approvals", detail: "Explicit human gates." }
    ],
    oklch: { L: 0.48, h: 280, rel: 0.28 },
    effect: "checksum",
    bokeh: 0.3
  },
  {
    eyebrow: "Feature 05",
    title: "Fling Capture",
    sub: "Drop files, links, and snippets into a governed intake path, structured for routing instead of lost in chat history.",
    note: "Signals become work items with context attached.",
    proof: [
      { label: "Intake", detail: "Structured capture surface." },
      { label: "Context", detail: "Attached to the work item." }
    ],
    oklch: { L: 0.51, h: 195, rel: 0.32 },
    effect: "stack",
    bokeh: 0.31
  },
  {
    eyebrow: "Feature 06",
    title: "Signal To Work",
    sub: "Email, chat, and portal signals route into governed workflows, not another inbox to babysit.",
    note: "Turn incoming noise into actionable execution.",
    proof: [
      { label: "Email & chat", detail: "Inbound signal routing." },
      { label: "Workflows", detail: "Automated handoffs." }
    ],
    oklch: { L: 0.54, h: 250, rel: 0.33 },
    effect: "relay",
    bokeh: 0.32
  },
  {
    eyebrow: "Differentiation",
    title: "Why Not Another Chatbot",
    sub: "Cortex connects processes (customer inquiry to quote to job to invoice), not just summarizes disconnected files.",
    note: "A private operating layer, not a folder with a prompt box.",
    proof: [
      { label: "Processes", detail: "Living operational map." },
      { label: "Compounding", detail: "Reusable intelligence." }
    ],
    oklch: { L: 0.56, h: 285, rel: 0.3 },
    effect: "hashwave",
    bokeh: 0.29
  },
  {
    eyebrow: "Get Started",
    title: "Download Or Deploy",
    sub: "Explore Cortex yourself via GitHub, or use Carapace to deploy it into governed business workflows.",
    note: "Experimental software; test in controlled environments.",
    proof: [
      { label: "GitHub", detail: "Free download & releases.", source: "https://github.com/CarapaceUDE/carapace/releases" },
      { label: "Discovery Sprint", detail: "Guided deployment.", source: "business.html#contact" }
    ],
    oklch: { L: 0.57, h: 275, rel: 0.35 },
    effect: "ping",
    bokeh: 0.3
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-cortex", ctaSectionId: "cortex-tail" });
}