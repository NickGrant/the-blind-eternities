#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const cardsPath = path.join(root, "src", "assets", "cards.json");
const planeSetConfigPath = path.join(root, "src", "assets", "plane-set-config.json");

async function run() {
  const cardsRaw = await fs.readFile(cardsPath, "utf8");
  const catalog = JSON.parse(cardsRaw);
  const planes = Array.isArray(catalog.planes) ? catalog.planes : [];

  const setCodes = await readSyncSetCodes();
  const allCards = [];
  for (const code of setCodes) {
    const cards = await fetchPlaneCardsFromSet(code);
    allCards.push(...cards);
  }

  const byName = new Map();
  for (const card of allCards) {
    const key = String(card.name || "").toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        ...card,
        setCodes: new Set(card.setCode ? [card.setCode] : []),
      });
      continue;
    }
    if (card.setCode) existing.setCodes.add(card.setCode);
    if (!existing.text && card.text) existing.text = card.text;
    if (!existing.type && card.type) existing.type = card.type;
    if (!existing.number && card.number) existing.number = card.number;
    if (!existing.uuid && card.uuid) existing.uuid = card.uuid;
    if (!existing.identifiers?.scryfallId && card.identifiers?.scryfallId) {
      existing.identifiers = { ...(existing.identifiers || {}), scryfallId: card.identifiers.scryfallId };
    }
  }

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
    plane.setCodes = Array.from(card.setCodes || []);
    plane.number = card.number || plane.number;
    plane.mtgjsonId = card.uuid || plane.mtgjsonId;

    const scryfallId = card.identifiers?.scryfallId;
    if (typeof scryfallId === "string" && scryfallId.length > 0) {
      plane.scryfallId = scryfallId;
    }
    matched += 1;
  }

  let added = 0;
  const existingIds = new Set(
    planes
      .filter((plane) => plane && typeof plane.id === "string")
      .map((plane) => plane.id)
  );
  for (const card of byName.values()) {
    const id = toPlaneId(card.name);
    if (!id || existingIds.has(id)) continue;
    planes.push({
      id,
      name: card.name,
      rulesText: card.text || undefined,
      chaosText: extractChaosText(card.text) || undefined,
      typeLine: card.type || undefined,
      types: Array.isArray(card.types) ? card.types : undefined,
      subtypes: Array.isArray(card.subtypes) ? card.subtypes : undefined,
      setCode: card.setCode || undefined,
      setCodes: Array.from(card.setCodes || []),
      number: card.number || undefined,
      mtgjsonId: card.uuid || undefined,
      scryfallId: card.identifiers?.scryfallId || undefined,
    });
    existingIds.add(id);
    added += 1;
  }

  catalog.planes = planes;

  await fs.writeFile(cardsPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[cards-sync] Updated ${matched} existing and added ${added} new plane entries from MTGJSON (${setCodes.join(", ")}).`
  );
}

/**
 * Reads normalized set codes used for MTGJSON sync.
 * @returns {Promise<string[]>} Uppercased MTGJSON set codes.
 */
async function readSyncSetCodes() {
  const configRaw = await fs.readFile(planeSetConfigPath, "utf8");
  const config = JSON.parse(configRaw);
  const fromConfig = Array.isArray(config?.syncSetCodes) ? config.syncSetCodes : [];
  return fromConfig
    .map((code) => String(code).trim().toUpperCase())
    .filter((code) => code.length > 0);
}

/**
 * Fetches a set payload from MTGJSON and returns only Plane cards.
 * @param {string} setCode MTGJSON set code.
 * @returns {Promise<object[]>} Plane card records from the set.
 */
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

/**
 * Extracts standardized chaos reminder text from card rules text.
 * @param {string | undefined} rulesText Full rules text from card source.
 * @returns {string | undefined} Normalized chaos text prefixed for runtime display.
 */
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

/**
 * Converts a plane ID slug into a title-cased display name.
 * @param {string} id Plane ID slug.
 * @returns {string} Human-readable name.
 */
function humanizePlaneId(id) {
  const base = id.startsWith("plane-") ? id.slice("plane-".length) : id;
  return base
    .split("-")
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

/**
 * Converts a card name into canonical plane ID format.
 * @param {string | undefined} name Card name.
 * @returns {string | undefined} Plane ID slug with `plane-` prefix.
 */
function toPlaneId(name) {
  if (typeof name !== "string") return undefined;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return undefined;
  return `plane-${slug}`;
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[cards-sync] ${message}`);
  process.exitCode = 1;
});
