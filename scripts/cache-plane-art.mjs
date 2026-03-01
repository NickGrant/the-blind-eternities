#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const cardsPath = path.join(root, "src", "assets", "cards.json");
const cacheDir = path.join(root, "src", "assets", "plane-art");

const run = async () => {
  await fs.mkdir(cacheDir, { recursive: true });

  const cardsText = await fs.readFile(cardsPath, "utf8");
  const cards = JSON.parse(cardsText);
  const planes = Array.isArray(cards.planes) ? cards.planes : [];

  let alreadyCached = 0;
  let updatedFromDisk = 0;
  let fetched = 0;
  let failed = 0;
  /** @type {{id: string, name: string, reason: string}[]} */
  const failedEntries = [];

  for (const plane of planes) {
    if (!plane || typeof plane.id !== "string") continue;
    const fileName = `${plane.id}.jpg`;
    const diskPath = path.join(cacheDir, fileName);
    const appPath = `assets/plane-art/${fileName}`;
    const exists = await fileExists(diskPath);

    if (exists) {
      alreadyCached += 1;
      if (plane.artUrl !== appPath) {
        plane.artUrl = appPath;
        updatedFromDisk += 1;
      }
      continue;
    }

    if (!args.fetch || fetched >= args.max) {
      continue;
    }

    const queryName = typeof plane.name === "string" && plane.name.trim().length > 0
      ? plane.name.trim()
      : humanizePlaneId(plane.id);

    try {
      const card = await fetchScryfallCard(queryName);
      if (!card) {
        failed += 1;
        failedEntries.push({ id: plane.id, name: queryName, reason: "Card lookup returned no result." });
        continue;
      }
      if (card?.oracle_text && typeof card.oracle_text === "string") {
        plane.rulesText = card.oracle_text.trim();
      }
      const uris = card?.image_uris ?? {};
      const imageUrl = uris.art_crop ?? uris.normal ?? uris.large ?? undefined;
      if (!imageUrl) {
        failed += 1;
        failedEntries.push({ id: plane.id, name: queryName, reason: "Card record did not include a usable image URL." });
        continue;
      }

      if (!args.dryRun) {
        const image = await fetchBinary(imageUrl);
        await fs.writeFile(diskPath, image);
      }
      plane.artUrl = appPath;
      fetched += 1;

      if (args.delayMs > 0) {
        await sleep(args.delayMs);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      failedEntries.push({ id: plane.id, name: queryName, reason: message });
    }
  }

  if (!args.dryRun) {
    await fs.writeFile(cardsPath, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
  }

  console.log("[art-cache] Done.");
  console.log(`[art-cache] Cached on disk: ${alreadyCached}`);
  console.log(`[art-cache] Metadata updated from disk: ${updatedFromDisk}`);
  console.log(`[art-cache] Newly fetched this run: ${fetched}`);
  console.log(`[art-cache] Failed lookups/downloads: ${failed}`);
  if (failedEntries.length > 0) {
    console.log("[art-cache] Failure details:");
    for (const entry of failedEntries) {
      console.log(`  - ${entry.id} (${entry.name}): ${entry.reason}`);
    }
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[art-cache] Fatal: ${message}`);
  process.exitCode = 1;
});

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    fetch: false,
    max: 2,
    delayMs: 1500,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--fetch") opts.fetch = true;
    else if (arg.startsWith("--max=")) opts.max = clampInt(arg.split("=")[1], 0, 100, 2);
    else if (arg.startsWith("--delay-ms=")) opts.delayMs = clampInt(arg.split("=")[1], 0, 60000, 1500);
  }

  return opts;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchScryfallCard(exactName) {
  const response = await fetch(
    `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(exactName)}`
  );
  if (!response.ok) return undefined;
  return response.json();
}

async function fetchBinary(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed with ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function humanizePlaneId(id) {
  const base = id.startsWith("plane-") ? id.slice("plane-".length) : id;
  return base
    .split("-")
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
