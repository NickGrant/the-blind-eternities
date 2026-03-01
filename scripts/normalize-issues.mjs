#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const issuesPath = path.join(root, "ISSUES.md");

const HEADER = `# ISSUES FILE
----

## Purpose
- \`ISSUES.md\` tracks active work only.
- Keep this file small and current for day-to-day execution context.
- Historical completed issues are moved to \`ISSUES_ARCHIVE.md\`.

## How to Use
- Valid statuses for active items:
  - \`unstarted\`
  - \`in-progress\`
  - \`reopened\`
- When an issue is resolved:
  - set \`status: complete\`
  - append \`Resolution:\` (1-2 sentences)
  - move the full completed entry to \`ISSUES_ARCHIVE.md\`
  - remove the completed entry from this active file

## Active Issues

### Functional
`;

run().catch((error) => {
  console.error(`[issues:normalize] Fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

async function run() {
  const raw = await fs.readFile(issuesPath, "utf8");
  const entries = parseEntries(raw);
  const normalized = `${HEADER}\n\n${entries.join("\n\n---\n\n")}\n`;
  await fs.writeFile(issuesPath, normalized, "utf8");
  console.log(`[issues:normalize] Normalized ${entries.length} active issue entries.`);
}

function parseEntries(content) {
  const start = content.indexOf("title:");
  if (start < 0) return [];
  const blocks = content
    .slice(start)
    .split(/\n---\s*\n/gm)
    .map((part) => part.trim())
    .filter(Boolean);

  return blocks
    .map((block) => normalizeBlock(block))
    .filter((block) => block.length > 0);
}

function normalizeBlock(block) {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const title = readField(lines, "title:");
  const status = readField(lines, "status:");
  const description = readField(lines, "description:");
  if (!title || !status || !description) return "";

  return [`title: ${title}`, `status: ${status}`, `description: ${description}`].join("\n");
}

function readField(lines, prefix) {
  const line = lines.find((entry) => entry.toLowerCase().startsWith(prefix));
  if (!line) return "";
  return line.slice(prefix.length).trim();
}
