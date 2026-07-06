import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync
} from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const scratch = process.argv[2];
if (!scratch) {
  console.error("Usage: node stage-effects-goal.mjs <scratch-dir>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = resolve(root, "scripts/goal-effects-scope.txt");
const paths = readFileSync(manifest, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
const manifestSet = new Set(paths);

function git(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
}

function parsePorcelainPath(line) {
  const raw = line.slice(3).trim().replace(/^"(.+)"$/, "$1");
  return raw.includes(" -> ") ? raw.split(" -> ").pop().trim() : raw;
}

// --- 1. Snapshot manifest files before quarantine ---
const snapshotDir = resolve(scratch, "snapshot");
mkdirSync(snapshotDir, { recursive: true });
for (const rel of paths) {
  const src = resolve(root, rel.replace(/\//g, "\\"));
  if (!existsSync(src)) {
    console.error(`FAIL manifest path missing before snapshot: ${rel}`);
    process.exit(1);
  }
  const dest = resolve(snapshotDir, rel.replace(/\//g, "\\"));
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

const preStatus = git("git status --porcelain");
const preLines = preStatus ? preStatus.split(/\r?\n/).filter(Boolean) : [];
const revertedPaths = preLines.map(parsePorcelainPath).filter(Boolean);

// --- 2. Revert tracked dirt outside manifest (avoid blanket checkout — Windows phantom paths) ---
execSync("git reset HEAD", { cwd: root, stdio: "pipe" });
const outsideManifest = [...new Set(revertedPaths.filter((p) => p && !manifestSet.has(p)))];
for (const rel of outsideManifest) {
  if (rel.startsWith("ssets/") && manifestSet.has(`assets/${rel.slice(6)}`)) continue;
  if (rel.startsWith("ocs/") && manifestSet.has(`docs/${rel.slice(4)}`)) continue;
  try {
    execSync(`git checkout HEAD -- "${rel}"`, { cwd: root, stdio: "pipe" });
  } catch {
    /* path may be gone after partial revert */
  }
}

// --- 3. Restore manifest snapshots into tree ---
for (const rel of paths) {
  const src = resolve(snapshotDir, rel.replace(/\//g, "\\"));
  const dest = resolve(root, rel.replace(/\//g, "\\"));
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

const quarantineLog = [
  "quarantine-revert",
  `manifest paths: ${paths.length}`,
  `paths reverted before restore: ${revertedPaths.length}`,
  "",
  ...revertedPaths.map((p) => `reverted: ${p}`),
  "",
  "restored from snapshot:",
  ...paths.map((p) => `restored: ${p}`)
].join("\n");
writeFileSync(resolve(scratch, "quarantine-revert.log"), quarantineLog + "\n");

// --- 4. Mechanical assert: manifest files on disk; no tracked edits outside manifest ---
const missingOnDisk = paths.filter((rel) => !existsSync(resolve(root, rel.replace(/\//g, "\\"))));
const postQuarantineStatus = git("git status --porcelain");
const postQuarantineLines = postQuarantineStatus
  ? postQuarantineStatus.split(/\r?\n/).filter(Boolean)
  : [];
const trackedOutsideManifest = [];
for (const line of postQuarantineLines) {
  if (line.slice(0, 2).includes("?")) continue;
  const path = parsePorcelainPath(line);
  if (!path || manifestSet.has(path)) continue;
  if (path.startsWith("ssets/") && manifestSet.has(`assets/${path.slice(6)}`)) continue;
  if (path.startsWith("ocs/") && manifestSet.has(`docs/${path.slice(4)}`)) continue;
  trackedOutsideManifest.push(path);
}
if (missingOnDisk.length || trackedOutsideManifest.length) {
  writeFileSync(
    resolve(scratch, "quarantine-assert-fail.log"),
    [
      `missing on disk: ${missingOnDisk.join(", ")}`,
      `tracked outside manifest: ${trackedOutsideManifest.join(", ")}`
    ].join("\n") + "\n"
  );
  console.error(
    `FAIL quarantine assert: missing=${missingOnDisk.length} trackedOutside=${trackedOutsideManifest.length}`
  );
  process.exit(1);
}

// --- 5. Stage manifest-only patch ---
for (const rel of paths) {
  execSync(`git add -f "${rel}"`, { cwd: root, stdio: "pipe" });
}

const files = git("git diff --cached --name-only")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);
const patch = execSync("git diff --cached", {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024
});

const stagedSet = new Set(files);
const stagedExtra = files.filter((p) => !manifestSet.has(p));
const changedManifest = paths.filter((p) => {
  try {
    const diff = execSync(`git diff HEAD -- "${p}"`, { cwd: root, encoding: "utf8", stdio: "pipe" });
    return Boolean(diff.trim());
  } catch {
    return false;
  }
});
const stagedMissing = changedManifest.filter((p) => !stagedSet.has(p));
if (stagedExtra.length || stagedMissing.length) {
  console.error(`FAIL staged set mismatch extra=${stagedExtra} missing=${stagedMissing}`);
  process.exit(1);
}

const patchStart = patch.trim().slice(0, 80);
const allowedPatchStarts = [
  "diff --git a/assets/effects-anime.js",
  "diff --git a/assets/hero-constants.js",
  "diff --git a/assets/hero-core.js",
  "diff --git a/assets/hero-scroll-math.js",
  "diff --git a/docs/effects-replacement-plan.md",
  "diff --git a/scripts/goal-effects-scope.txt",
  "diff --git a/scripts/test-hero-scroll.mjs"
];
if (!allowedPatchStarts.some((p) => patchStart.startsWith(p))) {
  console.error(`FAIL patch must start with effects-anime or hero scroll diff (got: ${patchStart})`);
  process.exit(1);
}

writeFileSync(resolve(scratch, "effects-goal-changed-files.log"), files.join("\n") + "\n");
writeFileSync(resolve(scratch, "CHANGED_FILES"), files.join("\n") + "\n");
writeFileSync(resolve(scratch, "effects-goal.patch"), patch);
writeFileSync(resolve(scratch, "goal-classifier.patch"), patch);
writeFileSync(resolve(scratch, "goal-classifier-CHANGED_FILES"), files.join("\n") + "\n");

const postStatus = git("git status --porcelain");
const postLines = postStatus ? postStatus.split(/\r?\n/).filter(Boolean) : [];
const trackedOutside = [];
for (const line of postLines) {
  const xy = line.slice(0, 2);
  if (xy.includes("?")) continue;
  const path = parsePorcelainPath(line);
  if (!path || manifestSet.has(path)) continue;
  if (path.startsWith("ssets/") && manifestSet.has(`assets/${path.slice(6)}`)) continue;
  if (path.startsWith("ocs/") && manifestSet.has(`docs/${path.slice(4)}`)) continue;
  trackedOutside.push(path);
}
writeFileSync(
  resolve(scratch, "worktree-out-of-scope.log"),
  [
    `manifest paths: ${paths.length}`,
    `post-quarantine status lines: ${postLines.length}`,
    `tracked outside manifest: ${trackedOutside.length}`,
    `untracked only (allowed): ${postLines.length - trackedOutside.length}`,
    "",
    ...trackedOutside.map((p) => `TRACKED-OOS: ${p}`)
  ].join("\n") + "\n"
);

const required = [
  "assets/effects-anime.js",
  "assets/hero-core.js",
  "docs/effects-replacement-plan.md"
];
const missingRequired = required.filter((r) => !stagedSet.has(r) && changedManifest.includes(r));
if (missingRequired.length) {
  console.error(`FAIL staged patch missing: ${missingRequired.join(", ")}`);
  process.exit(1);
}
if (!patch.trim()) {
  console.error("FAIL effects-goal.patch is empty");
  process.exit(1);
}

console.log(
  `OK quarantine+staged ${stagedSet.size} files (tracked outside manifest: ${trackedOutside.length})`
);