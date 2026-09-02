#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(
  ROOT,
  "skills",
  "governance",
  "skill-release-registry.json",
);

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const noFetch = args.has("--no-fetch");
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
  return text.toLowerCase();
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "ai-library-skills-freshness-check/1.0",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
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

async function main() {
  const errors = [];
  const warnings = [];
  const passes = [];

  let registry;
  try {
    const rawRegistry = await fs.readFile(REGISTRY_PATH, "utf8");
    registry = JSON.parse(rawRegistry);
  } catch (error) {
    console.error(`Failed to read registry at ${REGISTRY_PATH}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  if (!Array.isArray(registry.skills)) {
    console.error("Registry must include a skills array.");
    process.exit(2);
  }

  const changedFiles = changedOnly ? parseChangedFiles() : null;
  const today = new Date();

  for (const entry of registry.skills) {
    const id = entry.id;
    const file = entry.file;
    const cadenceDays = entry.cadenceDays ?? registry.defaultCadenceDays;
    const owner = entry.owner;
    const lastVerified = entry.lastVerified;

    if (!id || !file || !owner) {
      errors.push(`Invalid registry entry: missing id/file/owner (${JSON.stringify(entry)})`);
      continue;
    }

    if (changedFiles && !changedFiles.has(file)) {
      continue;
    }

    const absoluteFile = path.join(ROOT, file);
    let skillContent = "";
    try {
      skillContent = await fs.readFile(absoluteFile, "utf8");
    } catch {
      errors.push(`${id}: skill file not found at ${file}`);
      continue;
    }

    if (!isValidIsoDate(lastVerified)) {
      errors.push(`${id}: lastVerified must be ISO date YYYY-MM-DD`);
    } else {
      const verifiedAt = new Date(`${lastVerified}T00:00:00Z`);
      const ageDays = daysBetween(today, verifiedAt);
      if (ageDays > cadenceDays) {
        const message = `${id}: stale verification (${ageDays} days old, cadence ${cadenceDays})`;
        if (strict) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    if (Array.isArray(entry.fileAssertions)) {
      for (const assertion of entry.fileAssertions) {
        if (!skillContent.includes(assertion)) {
          errors.push(`${id}: expected string not found in ${file}: "${assertion}"`);
        }
      }
    }

    if (!noFetch && Array.isArray(entry.sources)) {
      for (const source of entry.sources) {
        const sourceName = source.name ?? source.url;
        if (!source.url) {
          errors.push(`${id}: source entry missing url (${sourceName})`);
          continue;
        }

        try {
          const page = normalize(await fetchWithTimeout(source.url));
          if (Array.isArray(source.mustContainAny) && source.mustContainAny.length > 0) {
            const found = source.mustContainAny.some((candidate) =>
              page.includes(normalize(candidate)),
            );
            if (!found) {
              errors.push(
                `${id}: none of expected markers found in source "${sourceName}" (${source.url})`,
              );
            }
          }
        } catch (error) {
          const message = `${id}: failed fetching source "${sourceName}" (${source.url}) - ${error instanceof Error ? error.message : String(error)}`;
          if (strict) {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        }
      }
    }

    passes.push(id);
  }

  const summary = [
    "# Skills Freshness Report",
    "",
    `- Checked: ${passes.length} skill entries`,
    `- Errors: ${errors.length}`,
    `- Warnings: ${warnings.length}`,
    `- Strict mode: ${strict ? "yes" : "no"}`,
    `- Fetch mode: ${noFetch ? "disabled" : "enabled"}`,
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
  console.error("Unexpected failure in skills freshness checker");
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(2);
});
