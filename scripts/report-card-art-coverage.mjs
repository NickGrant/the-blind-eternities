#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const cardsPath = path.join(root, "src", "assets", "cards.json");
const artDir = path.join(root, "src", "assets", "plane-art");

const run = async () => {
  const cards = JSON.parse(await fs.readFile(cardsPath, "utf8"));
  const artFileNames = await listFilesSafe(artDir);
  const cachedIds = new Set(
    artFileNames
      .filter((name) => name.toLowerCase().endsWith(".jpg"))
      .map((name) => name.slice(0, -4))
  );

  const entries = [
    ...normalizeEntries(cards.planes, "PLANE"),
    ...normalizeEntries(cards.phenomena, "PHENOMENON"),
  ];

  const bySet = new Map();
  const byKind = new Map();
  const missingPlayableArtIds = [];

  for (const card of entries) {
    const isPlayable = card.rulesText.length > 0;
    const hasCachedArt = cachedIds.has(card.id);
    const hasArtUrl = card.artUrl.length > 0;
    const setCodes = card.setCodes.length > 0 ? card.setCodes : ["UNKNOWN"];

    for (const code of setCodes) {
      const next = bySet.get(code) ?? createBucket();
      next.total += 1;
      if (isPlayable) next.playable += 1;
      if (hasCachedArt) next.cached += 1;
      if (hasArtUrl) next.withArtUrl += 1;
      bySet.set(code, next);
    }

    const kindBucket = byKind.get(card.kind) ?? createBucket();
    kindBucket.total += 1;
    if (isPlayable) kindBucket.playable += 1;
    if (hasCachedArt) kindBucket.cached += 1;
    if (hasArtUrl) kindBucket.withArtUrl += 1;
    byKind.set(card.kind, kindBucket);

    if (isPlayable && !hasCachedArt) {
      missingPlayableArtIds.push(card.id);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    totalCards: entries.length,
    totalCachedArtFiles: cachedIds.size,
    missingPlayableArtCount: missingPlayableArtIds.length,
    missingPlayableArtIds: missingPlayableArtIds.sort(),
    byKind: mapToObject(byKind),
    bySet: mapToObject(new Map([...bySet.entries()].sort(([a], [b]) => a.localeCompare(b)))),
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  console.log("[art-coverage] Card art coverage report");
  console.log(`[art-coverage] Total cards: ${output.totalCards}`);
  console.log(`[art-coverage] Cached art files: ${output.totalCachedArtFiles}`);
  console.log(`[art-coverage] Missing playable art: ${output.missingPlayableArtCount}`);
  console.log("[art-coverage] By kind:");
  for (const [kind, bucket] of Object.entries(output.byKind)) {
    console.log(`  - ${kind}: total=${bucket.total}, playable=${bucket.playable}, cached=${bucket.cached}, artUrl=${bucket.withArtUrl}`);
  }
  console.log("[art-coverage] By set:");
  for (const [code, bucket] of Object.entries(output.bySet)) {
    console.log(`  - ${code}: total=${bucket.total}, playable=${bucket.playable}, cached=${bucket.cached}, artUrl=${bucket.withArtUrl}`);
  }
  if (output.missingPlayableArtIds.length > 0) {
    console.log("[art-coverage] Missing playable card IDs:");
    output.missingPlayableArtIds.forEach((id) => console.log(`  - ${id}`));
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[art-coverage] Fatal: ${message}`);
  process.exitCode = 1;
});

function parseArgs(argv) {
  return { json: argv.includes("--json") };
}

function normalizeEntries(rawEntries, defaultKind) {
  if (!Array.isArray(rawEntries)) return [];
  return rawEntries
    .filter((entry) => entry && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id,
      kind: resolveKind(entry, defaultKind),
      setCodes: normalizeSetCodes(entry),
      rulesText: typeof entry.rulesText === "string" ? entry.rulesText.trim() : "",
      artUrl: typeof entry.artUrl === "string" ? entry.artUrl.trim() : "",
    }));
}

function resolveKind(entry, fallback) {
  const fromTypes = Array.isArray(entry.types) ? entry.types : [];
  const normalizedLine = typeof entry.typeLine === "string" ? entry.typeLine.toUpperCase() : "";
  if (fromTypes.some((type) => String(type).toUpperCase() === "PHENOMENON") || normalizedLine.includes("PHENOMENON")) {
    return "PHENOMENON";
  }
  if (fromTypes.some((type) => String(type).toUpperCase() === "PLANE") || normalizedLine.includes("PLANE")) {
    return "PLANE";
  }
  return fallback;
}

function normalizeSetCodes(entry) {
  if (Array.isArray(entry.setCodes) && entry.setCodes.length > 0) {
    return entry.setCodes.map((code) => String(code).trim()).filter((code) => code.length > 0);
  }
  if (typeof entry.setCode === "string" && entry.setCode.trim().length > 0) {
    return [entry.setCode.trim()];
  }
  return [];
}

function createBucket() {
  return { total: 0, playable: 0, cached: 0, withArtUrl: 0 };
}

function mapToObject(map) {
  return Object.fromEntries(map.entries());
}

async function listFilesSafe(dirPath) {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}
