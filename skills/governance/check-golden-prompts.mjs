#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(
  ROOT,
  "skills",
  "governance",
  "prompt-suite-registry.json",
);

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const changedOnly = args.has("--changed-only");

function daysBetween(dateA, dateB) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((dateA.getTime() - dateB.getTime()) / MS_PER_DAY);
}

function isValidIsoDate(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function normalize(text) {
  return String(text).toLowerCase();
}

function parseChangedFiles() {
  const raw = process.env.CHANGED_FILES;
  if (!raw) return null;
  return new Set(
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasAtLeastOneCheck(checks) {
  const mustIncludeAll = ensureArray(checks?.mustIncludeAll);
  const mustIncludeAny = ensureArray(checks?.mustIncludeAny);
  const mustAvoid = ensureArray(checks?.mustAvoid);
  return mustIncludeAll.length > 0 || mustIncludeAny.length > 0 || mustAvoid.length > 0;
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const errors = [];
  const warnings = [];
  const checked = [];

  let registry;
  try {
    registry = await loadJson(REGISTRY_PATH);
  } catch (error) {
    console.error(`Failed to read prompt suite registry at ${REGISTRY_PATH}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  if (!Array.isArray(registry.suites)) {
    console.error("Prompt suite registry must include a suites array.");
    process.exit(2);
  }

  const changedFiles = changedOnly ? parseChangedFiles() : null;
  const today = new Date();

  for (const suite of registry.suites) {
    const id = suite.id;
    const owner = suite.owner;
    const skillFile = suite.skillFile;
    const casesFile = suite.casesFile;
    const lastReviewed = suite.lastReviewed;

    if (!id || !owner || !skillFile || !casesFile) {
      errors.push(`Invalid suite entry: missing id/owner/skillFile/casesFile (${JSON.stringify(suite)})`);
      continue;
    }

    if (changedFiles && !changedFiles.has(skillFile) && !changedFiles.has(casesFile)) {
      continue;
    }

    const cadenceDays = suite.cadenceDays ?? registry.defaultCadenceDays ?? 30;
    const requiredCaseCount = suite.requiredCaseCount ?? registry.defaultRequiredCaseCount ?? 5;

    if (!isValidIsoDate(lastReviewed)) {
      errors.push(`${id}: lastReviewed must be ISO date YYYY-MM-DD`);
    } else {
      const reviewedAt = new Date(`${lastReviewed}T00:00:00Z`);
      const ageDays = daysBetween(today, reviewedAt);
      if (ageDays > cadenceDays) {
        const message = `${id}: stale prompt suite review (${ageDays} days old, cadence ${cadenceDays})`;
        if (strict) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    const absoluteSkillFile = path.join(ROOT, skillFile);
    const absoluteCasesFile = path.join(ROOT, casesFile);

    let skillContent = "";
    try {
      skillContent = await fs.readFile(absoluteSkillFile, "utf8");
    } catch {
      errors.push(`${id}: skill file not found at ${skillFile}`);
      continue;
    }

    let casesPayload;
    try {
      casesPayload = await loadJson(absoluteCasesFile);
    } catch {
      errors.push(`${id}: cases file is missing or invalid JSON at ${casesFile}`);
      continue;
    }

    const cases = ensureArray(casesPayload.cases);
    if (cases.length < requiredCaseCount) {
      errors.push(
        `${id}: insufficient prompt cases (${cases.length} found, required ${requiredCaseCount})`,
      );
    }

    const normalizedSkill = normalize(skillContent);

    for (const assertion of ensureArray(suite.bestPracticeAssertions)) {
      if (!normalizedSkill.includes(normalize(assertion))) {
        errors.push(`${id}: missing best-practice assertion in skill file: "${assertion}"`);
      }
    }

    const seenCaseIds = new Set();

    for (const promptCase of cases) {
      const caseId = promptCase.id;
      const title = promptCase.title;
      const prompt = promptCase.prompt;
      const checks = promptCase.checks ?? {};

      if (!caseId || !title || !prompt) {
        errors.push(`${id}: every case must include id, title, and prompt`);
        continue;
      }

      if (seenCaseIds.has(caseId)) {
        errors.push(`${id}: duplicate case id detected: ${caseId}`);
      }
      seenCaseIds.add(caseId);

      if (String(prompt).trim().length < 40) {
        warnings.push(`${id}:${caseId}: prompt is too short; add more context for stability`);
      }

      if (!hasAtLeastOneCheck(checks)) {
        errors.push(`${id}:${caseId}: checks must define at least one rule`);
      }

      const mustIncludeAll = ensureArray(checks.mustIncludeAll);
      const mustIncludeAny = ensureArray(checks.mustIncludeAny);
      const mustAvoid = ensureArray(checks.mustAvoid);

      if (mustIncludeAll.length === 0 && mustIncludeAny.length === 0) {
        warnings.push(`${id}:${caseId}: include expected content rules for stronger validation`);
      }

      if (mustAvoid.length === 0) {
        warnings.push(`${id}:${caseId}: add at least one anti-pattern in mustAvoid`);
      }
    }

    checked.push(id);
  }

  const summary = [
    "# Golden Prompt Suite Report",
    "",
    `- Checked suites: ${checked.length}`,
    `- Errors: ${errors.length}`,
    `- Warnings: ${warnings.length}`,
    `- Strict mode: ${strict ? "yes" : "no"}`,
  ];

  if (errors.length > 0) {
    summary.push("", "## Errors", ...errors.map((item) => `- ${item}`));
  }

  if (warnings.length > 0) {
    summary.push("", "## Warnings", ...warnings.map((item) => `- ${item}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    summary.push("", "All checks passed.");
  }

  console.log(summary.join("\n"));

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected failure in golden prompt checker");
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(2);
});
