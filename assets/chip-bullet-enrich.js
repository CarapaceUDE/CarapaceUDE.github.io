/**
 * Contextual second/third lines for proof-chip dropdowns (from site copy).
 * Used when a chip has no explicit `nodes` array.
 */
import { sanitizeCopyText } from "./copy-sanitize.js?v=20260706b";
export const CHIP_LABEL_EXTRAS = {
  Private: ["Your data stays inside your boundary.", "Not a shared multi-tenant layer."],
  "Model-independent": ["Route across frontier, local, and private cloud.", "No rewrite when providers change."],
  "No lock-in": ["Own the workflow path and data custody.", "Portable automations across vendors."],
  Asana: ["60% of time spent on work about work.", "Surveyed 10,000+ knowledge workers globally."],
  "664 hrs/yr": ["103 hrs in unnecessary meetings.", "209 hrs on duplicative work.", "352 hrs talking about work."],
  "Less routing": ["Connect email, files, and portals once.", "Governed execution instead of inbox babysitting."],
  "Less copy/paste": ["Humans stay on judgment and craft.", "Systems absorb repeatable glue work."],
  "Your workflows": ["Encoded as reusable operational intelligence.", "Compounds inside your organization."],
  "Your knowledge": ["Grounded in your systems, not the public web.", "Private boundary by default."],
  Consolidation: ["Replace overlapping SaaS overhead.", "One automation layer across tools."],
  Automation: ["Savings compound as workflows reuse patterns.", "Measure wins before you scale."],
  "IDC / Microsoft": ["IDC 2024 Business Opportunity of AI study.", "$3.70 return per $1 invested in generative AI."],
  Adecco: ["Global Workforce of the Future 2024.", "~1 hour per day saved by workers already using AI."],
  "LSE / Protiviti": ["Bridging the Generational AI Gap report.", "Trained users save up to 11 hrs/wk vs. 5 untrained."],
  LSE: ["Bridging the Generational AI Gap report.", "Trained users save up to 11 hrs/wk vs. 5 untrained."],
  "Discovery Sprint": ["One wedge. One measurable outcome.", "Prove value before production scale."],
  "Measurable wins": ["Pilot in a controlled environment first.", "Expand only what already works."],
  Carapace: ["Human infrastructure partner & implementation.", "Scope, deploy, and govern Cortex in your environment."],
  Cortex: ["Open-core control plane software.", "Model-independent routing under your policies."],
  "Human-centered": ["Judgment, care, and craft stay human.", "Technology in service of human capability."],
  "Owner-operators": ["Serious tools without enterprise overhead.", "Access beyond the enterprise tier."],
  "Human capability": ["Offload repeatable work, not judgment.", "Useful systems make teams more capable."],
  "Access beyond enterprise": ["Practical AI for lean teams.", "Owner-operators deserve serious tooling."],
  "Practical over performative": ["Real operations are the test.", "No AI theater required."],
  "Value that compounds": ["Reusable integrations and packages.", "Patterns improve with every deployment."],
  "Your World": ["People, tools, and operating context.", "The living map of how work actually runs."],
  "Your Processes": ["Repeatable operational flows.", "Not a folder system, a process layer."],
  "Your Decisions": ["Judgment points and policy gates.", "Explicit human checkpoints."],
  "Your Actions": ["Approved execution paths only.", "Governed automation after review."],
  "Your Boundaries": ["Custody, privacy, and governance.", "Data rules you can inspect."],
  "Your Feedback": ["Learning loop improves the system.", "Operational memory that compounds."],
  "Private boundary": ["Runs locally or inside your VPC.", "Intelligence stays close to you."],
  Inspectable: ["Policies, routing, and audit trails stay visible.", "Trust you can inspect every automated step."],
  "@triphosphatedev": ["Field systems and client solution paths.", "Maps how businesses contact the real world."],
  "@ascendism": ["UI craft and product-facing implementation.", "Builds the interfaces and software behind it."],
  "How We Help": ["Engagement path from discovery to deploy.", "See business.html for intake and sprint."],
  "Human API": ["Email, files, and portals into one intake.", "Signals become governed work items."],
  "Your boundary": ["Runs inside your environment.", "Not extracted into someone else's platform."],
  Scope: ["Map workflows and quick wins first.", "Prioritize friction that compounds."],
  Connect: ["Bridge tools and data paths.", "Unified context for routing."],
  Build: ["Deploy governed automations.", "Prove one wedge before scaling."],
  "Small business": ["Access beyond enterprise pricing.", "Serious capability for lean teams."],
  "Lean ops": ["No AI theater. Practical operations.", "Human judgment stays in the loop."],
  "Measured wins": ["Prove value before you scale.", "Pilot-phase outcomes you can inspect."],
  Governed: ["Policy, custody, and inspectability.", "Trust is a feature, not a promise."],
  Pilot: ["Controlled deployment and measurement.", "Validate fit in your environment."],
  Package: ["Scale patterns that already work.", "Reusable packages across workflows."],
  Discover: ["Map friction and prioritize wedges.", "Quick wins before broad rollout."],
  Deploy: ["Secure, isolated, governed automation.", "Runs close to your operations."],
  Measure: ["Track time, quality, and value.", "Expand what proves out."],
  Expand: ["Multiply proven wins across teams.", "Compound operational intelligence."],
  "Open core": ["Inspectable software boundary.", "Community path for personal learning."],
  Capture: ["Fling and signal intake.", "Structured work items with context."],
  Route: ["Intent-aware dispatch.", "Policy picks the right destination."],
  Approve: ["Human checkpoints on sensitive steps.", "Nothing critical runs unreviewed."],
  Execute: ["Governed automation after approval.", "Audit trail for every handoff."],
  Segmentation: ["Custody-first context design.", "Models receive only what the task needs."],
  Masking: ["Credentials and secrets isolated.", "The model cannot leak what it never got."],
  Aliases: ["Intent maps to capability names.", "Summarize, extract, draft, route."],
  Policy: ["Cost, latency, and risk rules.", "Routing you can explain."],
  Roster: ["Frontier APIs, local, and private cloud.", "Multi-provider without lock-in."],
  Portable: ["Workflows survive provider churn.", "No strategic rewrite on vendor shifts."],
  "Audit trail": ["Inspectable and reversible decisions.", "Every route and approval logged."],
  Approvals: ["Explicit human gates.", "Sensitive steps wait for review."],
  Intake: ["Structured capture surface.", "Drop files, links, and snippets once."],
  Context: ["Attached to the work item.", "Segmented until execution."],
  "Email & chat": ["Inbound signal routing.", "Not another inbox to babysit."],
  Workflows: ["Automated handoffs between stages.", "Processes, not disconnected chats."],
  Processes: ["Living operational map.", "Inquiry → quote → job → invoice."],
  Compounding: ["Reusable intelligence over time.", "Packages that improve with use."],
  GitHub: ["Open-core releases and downloads.", "Evaluate Cortex on your timeline."],
  "Open-core": ["Inspectable agreements and software boundary.", "Read terms before you deploy."],
  "Personal free": ["Community edition for learning.", "No sales conversation to start."],
  "Community edition": ["Read and download the license.", "Self-host and evaluate fit."],
  Evaluate: ["Assess fit in your environment.", "Under $100K revenue: continuous evaluation."],
  "Platform license": ["$499/mo Cortex commercial access.", "Pilot-phase figure, subject to change."],
  "Strategy retainer": ["$399/mo, up to 10 hours support.", "Additive to platform license."],
  "Commercial license": ["Business use agreement for live ops.", "Order form structures the engagement."],
  "Extended support": ["$199/mo, 15 hours add-on.", "Optional; not a forced dependency."],
  "Retainer terms": ["Ongoing refinements and help.", "Support stays additive to the product."],
  "No forced dependency": ["Support is optional after implementation.", "You control the deployment path."],
  "PDF grid": ["Downloadable agreements below.", "Inspectable boundaries for counsel and ops."],
  "Capability aliases": ["Intent maps to governed capabilities.", "Aliases keep prompts portable across models."],
  "Policy layer": ["Data rules and access control.", "Custody-first by design."],
  "Staged path": ["Intro → value → next step.", "Land, convert, and expand in sequence."],
  "Human checkpoint": ["Approve before send or execute.", "Judgment stays explicit."],
  "Context pull": ["Files, CRM, and notes unified.", "One intake path for the task."],
  "Draft & route": ["Human review before send.", "AI drafts; humans approve."],
  Checkpoint: ["Review, approve, choose channel.", "Sensitive outputs wait for you."],
  "Auto-ingest": ["Pull from systems of record.", "Less copy/paste between tabs."],
  Summarize: ["Draft insights for human review.", "Not auto-send without approval."],
  "Living map": ["Processes, not folders.", "How the business actually works."],
  Reusable: ["Packages and patterns compound.", "Operational memory improves over time."],
  "Repeat work": ["Automate the glue between tools.", "Free humans for judgment."],
  "Human judgment": ["Decisions stay explicit.", "AI assists; humans govern."],
  "Follow-up": ["Leads and client touchpoints.", "Keep work from slipping."],
  Intake: ["Signal-to-work routing.", "Email, chat, and portal signals."],
  Ops: ["Admin drag reduction.", "Handoffs without babysitting."],
  "Production path": ["Expand governed workflows.", "From pilot to live operations."]
};

export function normalizeBulletKey(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDuplicateBullet(a, b) {
  const na = normalizeBulletKey(a);
  const nb = normalizeBulletKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const short = na.length <= nb.length ? na : nb;
  const long = na.length > nb.length ? na : nb;
  if (short.length < 4) return false;
  return long.includes(short);
}

export function dedupeBullets(bullets) {
  const out = [];
  for (const bullet of bullets) {
    const text = bullet?.trim();
    if (!text) continue;

    let merged = false;
    for (let i = 0; i < out.length; i++) {
      if (!isDuplicateBullet(out[i], text)) continue;
      if (text.length > out[i].length) out[i] = text;
      merged = true;
      break;
    }
    if (!merged) out.push(text);
  }
  return out;
}

export function enrichProofChip(chip, slide, index) {
  if (chip.nodes?.length) return chip;
  const extras = CHIP_LABEL_EXTRAS[chip.label];
  const nodes = extras ? [...extras] : [];

  if (!nodes.length) {
    const next = slide.proof[index + 1];
    const prev = slide.proof[index - 1];
    if (next?.detail) nodes.push(next.detail);
    else if (prev?.detail) nodes.push(prev.detail);
    else if (slide.note) nodes.push(sanitizeCopyText(slide.note));
    else if (slide.sub) nodes.push(sanitizeCopyText(slide.sub));
  }

  const expanded = expandDetailLines(chip.detail);
  const detailKey = normalizeBulletKey(chip.detail);
  const filtered = dedupeBullets(
    nodes.filter((n) => {
      const key = normalizeBulletKey(n);
      if (key === detailKey) return false;
      return !expanded.some((line) => isDuplicateBullet(line, n));
    })
  );
  if (!filtered.length) return chip;
  const maxNodes = expanded.length >= 2 ? 1 : 3;
  return { ...chip, nodes: filtered.slice(0, maxNodes) };
}

function cleanListPart(s) {
  return s.replace(/^and\s+/i, "").replace(/\.\s*$/, "").trim();
}

function looksLikeListItem(part) {
  const p = cleanListPart(part);
  if (!p || p.length > 36) return false;
  const words = p.split(/\s+/).length;
  if (words > 4) return false;
  if (words > 2 && /\b(stay|becomes|receive|keeps|wait|maps|route|runs|fits|scans|ties)\b/i.test(p)) return false;
  return true;
}

export function expandDetailLines(detail) {
  if (!detail) return [];
  const text = sanitizeCopyText(detail.trim());
  if (text.includes("; ")) {
    return text.split("; ").map(cleanListPart).filter(Boolean);
  }
  if (text.includes(" → ")) {
    return text.split(" → ").map(cleanListPart).filter(Boolean);
  }
  if (text.includes(" / ")) {
    return text.split(" / ").map(cleanListPart).filter(Boolean);
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) return sentences.map((s) => s.trim());

  if (text.includes(" & ") && !text.includes(", ")) {
    const parts = text.split(/\s+&\s+/).map(cleanListPart).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length <= 32)) return parts;
  }

  if (text.includes(", ")) {
    const raw = text.split(/,\s+/).map(cleanListPart).filter(Boolean);
    const tail = raw[raw.length - 1] ?? "";
    if (tail.toLowerCase().startsWith("and ") && tail.split(/\s+/).length > 3) {
      return [text.replace(/\.\s*$/, "")];
    }
    if (raw.length >= 2 && raw.every(looksLikeListItem)) return raw;
    if (raw.length >= 3 && raw.every((p) => cleanListPart(p).length < 40)) return raw;
  }

  return [text];
}