import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { EFFECTS_GOAL_CONTRACT } from "../assets/effects-goal-contract.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "scripts/effects-goal-contract.json");
writeFileSync(out, JSON.stringify(EFFECTS_GOAL_CONTRACT, null, 2) + "\n");
console.log(`Wrote ${out}`);