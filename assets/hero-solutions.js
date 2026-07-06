import { initScrollHero } from "./hero-core.js";

export const HERO_SLIDES = [
  {
    eyebrow: "Solutions",
    title: "How Work Gets Routable",
    sub: "People ask for work outcomes; Cortex decides where that work should run based on capability, policy, cost, and context.",
    note: "Carapace builds. Cortex routes.",
    proof: [
      { label: "Capability aliases", detail: "Summarize, extract, draft, route." },
      { label: "Policy layer", detail: "Data rules & access control." }
    ],
    oklch: { L: 0.52, h: 275, rel: 0.32 },
    effect: "topology",
    bokeh: 0.31
  },
  {
    eyebrow: "Adoption Path",
    title: "Discover Deploy Expand",
    sub: "Start small, prove value, then scale deliberately with governance intact.",
    note: "Carapace guides adoption while Cortex carries the workflow layer.",
    proof: [
      { label: "Discover", detail: "Map work & quick wins." },
      { label: "Deploy", detail: "Secure, governed automation." },
      { label: "Expand", detail: "Multiply proven wins." }
    ],
    oklch: { L: 0.54, h: 230, rel: 0.3 },
    effect: "pipeline",
    bokeh: 0.32
  },
  {
    eyebrow: "Customer Follow-Up",
    title: "Keep Leads From Slipping",
    sub: "Cortex watches handoffs, drafts follow-up, and routes the next step through a human checkpoint.",
    note: "Fewer dropped leads. Faster response. Less manual chasing.",
    proof: [
      { label: "Staged path", detail: "Intro → value → next step." },
      { label: "Human checkpoint", detail: "Approve before send." }
    ],
    oklch: { L: 0.5, h: 300, rel: 0.28 },
    effect: "isograph",
    bokeh: 0.3
  },
  {
    eyebrow: "Proposals & Quotes",
    title: "Faster Client Response",
    sub: "Compress proposal assembly from scattered context into a governed draft-ready flow.",
    note: "Pull facts, compare options, draft responses — route for approval.",
    proof: [
      { label: "Context pull", detail: "Files, CRM, notes unified." },
      { label: "Draft & route", detail: "Human review before send." }
    ],
    oklch: { L: 0.53, h: 230, rel: 0.31 },
    effect: "parcel",
    bokeh: 0.31
  },
  {
    eyebrow: "Approvals",
    title: "Governed Handoffs",
    sub: "Sensitive actions pause at explicit approval checkpoints — inspectable, reversible, logged.",
    note: "Policy governs what can run automatically vs. what needs a human.",
    proof: [
      { label: "Checkpoint", detail: "Review, approve, choose channel." },
      { label: "Audit trail", detail: "Every decision logged." }
    ],
    oklch: { L: 0.48, h: 280, rel: 0.28 },
    effect: "trace",
    bokeh: 0.29
  },
  {
    eyebrow: "Reporting",
    title: "Less Manual Assembly",
    sub: "Turn recurring report updates into governed flows that pull, summarize, and route for review.",
    note: "Keep humans on judgment — not copy/paste assembly.",
    proof: [
      { label: "Auto-ingest", detail: "Pull from systems of record." },
      { label: "Summarize", detail: "Draft insights for review." }
    ],
    oklch: { L: 0.55, h: 45, rel: 0.28 },
    effect: "sonar",
    bokeh: 0.3
  },
  {
    eyebrow: "Knowledge Ops",
    title: "Context That Compounds",
    sub: "Capture operational knowledge as reusable intelligence — not scattered notes that evaporate after each project.",
    note: "Your business memory stays inside your boundary.",
    proof: [
      { label: "Living map", detail: "Processes, not folders." },
      { label: "Reusable", detail: "Packages that compound." }
    ],
    oklch: { L: 0.56, h: 195, rel: 0.32 },
    effect: "filament",
    bokeh: 0.31
  },
  {
    eyebrow: "Internal Operations",
    title: "Reduce Admin Drag",
    sub: "Compress email triage, data re-entry, status chasing, and scheduling syncs into governed flows.",
    note: "Without adding chaos to the team.",
    proof: [
      { label: "Repeat work", detail: "Automate the glue." },
      { label: "Human judgment", detail: "Keep decisions human." }
    ],
    oklch: { L: 0.51, h: 250, rel: 0.3 },
    effect: "pipeline",
    bokeh: 0.32
  },
  {
    eyebrow: "Starting Points",
    title: "Common First Wins",
    sub: "Most teams begin with one workflow wedge — follow-up, intake routing, or internal ops — then expand from measured evidence.",
    note: "See How We Help for the engagement path.",
    proof: [
      { label: "Follow-up", detail: "Leads & client touchpoints." },
      { label: "Intake", detail: "Signal-to-work routing." },
      { label: "Ops", detail: "Admin drag reduction." }
    ],
    oklch: { L: 0.54, h: 285, rel: 0.3 },
    effect: "cellscan",
    bokeh: 0.29
  },
  {
    eyebrow: "Next Step",
    title: "Start With One Wedge",
    sub: "Book a Discovery Sprint to map friction, prototype value, and measure savings on a real workflow.",
    note: "One measurable outcome before you scale.",
    proof: [
      { label: "Discovery Sprint", detail: "Book the intake form.", source: "business.html#contact" },
      { label: "Cortex", detail: "Explore the control plane.", source: "cortex.html" }
    ],
    oklch: { L: 0.57, h: 275, rel: 0.34 },
    effect: "beacon",
    bokeh: 0.3
  }
];

if (document.getElementById("hero-stage")) {
  initScrollHero({ slides: HERO_SLIDES, pageClass: "page-solutions" });
}