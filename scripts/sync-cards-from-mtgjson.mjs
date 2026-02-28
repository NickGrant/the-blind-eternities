#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const cardsPath = path.join(root, "src", "assets", "cards.json");

async function run() {
  const cardsRaw = await fs.readFile(cardsPath, "utf8");
  const catalog = JSON.parse(cardsRaw);
  const planes = Array.isArray(catalog.planes) ? catalog.planes : [];

  const setCodes = ["OPCA", "OPC2", "OHOP", "HOP", "PHOP"];
  const allCards = [];
  for (const code of setCodes) {
    const cards = await fetchPlaneCardsFromSet(code);
    allCards.push(...cards);
  }

  const deduped = [];
  const seenNames = new Set();
  for (const card of allCards) {
    const key = String(card.name || "").toLowerCase();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    deduped.push(card);
  }

  const byName = new Map(deduped.map((card) => [card.name.toLowerCase(), card]));

  let matched = 0;
  for (const plane of planes) {
    if (!plane || typeof plane.id !== "string") continue;
    const displayName = (typeof plane.name === "string" && plane.name.trim()) || humanizePlaneId(plane.id);
    const card = byName.get(displayName.toLowerCase());
    if (!card) continue;

    plane.name = card.name;
    plane.rulesText = card.text || plane.rulesText;
    plane.chaosText = extractChaosText(card.text) || plane.chaosText;
    plane.typeLine = card.type || plane.typeLine;
    plane.types = Array.isArray(card.types) ? card.types : plane.types;
    plane.subtypes = Array.isArray(card.subtypes) ? card.subtypes : plane.subtypes;
    plane.setCode = card.setCode || plane.setCode || "OPCA";
    plane.number = card.number || plane.number;
    plane.mtgjsonId = card.uuid || plane.mtgjsonId;

    const scryfallId = card.identifiers?.scryfallId;
    if (typeof scryfallId === "string" && scryfallId.length > 0) {
      plane.scryfallId = scryfallId;
    }
    matched += 1;
  }

  await fs.writeFile(cardsPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[cards-sync] Updated ${matched}/${planes.length} plane entries from MTGJSON (${setCodes.join(", ")}).`
  );
}

async function fetchPlaneCardsFromSet(setCode) {
  const url = `https://mtgjson.com/api/v5/${setCode}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed MTGJSON fetch for ${setCode}: ${response.status}`);
  }

  const payload = await response.json();
  const cards = payload?.data?.cards;
  if (!Array.isArray(cards)) {
    throw new Error(`Invalid MTGJSON payload for ${setCode}.`);
  }

  return cards.filter((card) => {
    const type = typeof card?.type === "string" ? card.type : "";
    return type.toLowerCase().includes("plane");
  });
}

function extractChaosText(rulesText) {
  if (typeof rulesText !== "string" || rulesText.length === 0) return undefined;
  const lines = rulesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const chaosLine = lines.find((line) => /whenever chaos ensues/i.test(line) || /when you roll \{chaos\}/i.test(line));
  if (!chaosLine) return undefined;

  const normalized = chaosLine
    .replace(/^whenever chaos ensues,?\s*/i, "")
    .replace(/^when you roll \{chaos\},?\s*/i, "")
    .trim();
  return normalized.length > 0 ? `CHAOS - ${normalized}` : undefined;
}

function humanizePlaneId(id) {
  const base = id.startsWith("plane-") ? id.slice("plane-".length) : id;
  return base
    .split("-")
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[cards-sync] ${message}`);
  process.exitCode = 1;
});
