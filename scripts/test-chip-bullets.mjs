import { expandDetailLines, enrichProofChip } from "../assets/chip-bullet-enrich.js";
import { readFileSync, readdirSync } from "fs";

const files = readdirSync("./assets").filter((f) => f.startsWith("hero-") && f.endsWith(".js"));
const singles = [];

for (const file of files) {
  const src = readFileSync(`./assets/${file}`, "utf8");
  const slideBlocks = [...src.matchAll(/proof:\s*\[([\s\S]*?)\]/g)];
  for (const block of slideBlocks) {
    const labels = [...block[1].matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
    const details = [...block[1].matchAll(/detail:\s*"([^"]+)"/g)].map((m) => m[1]);
    const proof = labels.map((l, j) => ({ label: l, detail: details[j] }));
    labels.forEach((label, i) => {
      const detail = details[i];
      if (!detail) return;
      const expanded = expandDetailLines(detail);
      const chip = enrichProofChip({ label, detail }, { proof, note: "", sub: "" }, i);
      const nodes = chip.nodes || [];
      const seen = new Set();
      const bullets = [...expanded, ...nodes].filter((b) => {
        const k = b.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (bullets.length < 2) singles.push({ file, label, detail, expanded, nodes, bullets });
    });
  }
}

console.log("Chips with <2 unique bullets:", singles.length);
singles.forEach((s) => console.log(JSON.stringify(s)));

const samples = [
  "Summarize, extract, draft, route.",
  "Policy, custody, inspectability.",
  "Review, approve, choose channel.",
  "Files, CRM, notes unified.",
  "Leads & client touchpoints.",
  "Judgment, care, and craft stay human.",
  "Processes, not folders."
];
console.log("\nSamples:");
for (const s of samples) console.log(s, "→", expandDetailLines(s));