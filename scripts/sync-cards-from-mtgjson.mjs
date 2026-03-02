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
  const phenomena = Array.isArray(catalog.phenomena) ? catalog.phenomena : [];

  const setCodes = await readSyncSetCodes();
  const allCards = [];
  for (const code of setCodes) {
    const cards = await fetchPlanarCardsFromSet(code);
    allCards.push(...cards);
  }

  const byKey = new Map();
  for (const card of allCards) {
    const kind = classifyCardKind(card);
    if (!kind) continue;
    const nameKey = String(card.name || "").toLowerCase();
    if (!nameKey) continue;
    const key = `${kind}:${nameKey}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        ...card,
        kind,
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

  const planeStats = syncGroup({
    target: planes,
    source: byKey,
    kind: "PLANE",
    toId: toPlaneId,
    fallbackSetCode: "OPCA",
  });
  const phenomenonStats = syncGroup({
    target: phenomena,
    source: byKey,
    kind: "PHENOMENON",
    toId: toPhenomenonId,
    fallbackSetCode: "OPCA",
  });

  catalog.planes = planes;
  catalog.phenomena = phenomena;

  await fs.writeFile(cardsPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[cards-sync] planes updated=${planeStats.updated} added=${planeStats.added}; phenomena updated=${phenomenonStats.updated} added=${phenomenonStats.added}; sets=${setCodes.join(", ")}`
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
 * Fetches a set payload from MTGJSON and returns only planar cards.
 * @param {string} setCode MTGJSON set code.
 * @returns {Promise<object[]>} Plane/phenomenon card records from the set.
 */
async function fetchPlanarCardsFromSet(setCode) {
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

  return cards.filter((card) => classifyCardKind(card));
}

/**
 * Determines whether a card is a plane or phenomenon.
 * @param {object} card MTGJSON card.
 * @returns {"PLANE"|"PHENOMENON"|undefined} Normalized planar kind.
 */
function classifyCardKind(card) {
  const type = typeof card?.type === "string" ? card.type.toLowerCase() : "";
  if (type.includes("phenomenon")) return "PHENOMENON";
  if (type.includes("plane")) return "PLANE";
  return undefined;
}

/**
 * Synchronizes a single card-kind collection in-place.
 * @param {object} args Sync arguments.
 * @returns {{updated:number, added:number}} Update statistics.
 */
function syncGroup(args) {
  const existing = args.target;
  const source = args.source;
  const existingByName = new Map();
  existing.forEach((item) => {
    const name = typeof item?.name === "string" ? item.name.trim().toLowerCase() : "";
    if (!name) return;
    existingByName.set(name, item);
  });

  let updated = 0;
  for (const sourceCard of source.values()) {
    if (sourceCard.kind !== args.kind) continue;
    const key = String(sourceCard.name || "").toLowerCase();
    const current = existingByName.get(key);
    if (!current) continue;
    applyCardData(current, sourceCard, args.fallbackSetCode);
    updated += 1;
  }

  const existingIds = new Set(
    existing
      .filter((item) => item && typeof item.id === "string")
      .map((item) => item.id)
  );
  let added = 0;
  for (const sourceCard of source.values()) {
    if (sourceCard.kind !== args.kind) continue;
    const id = args.toId(sourceCard.name);
    if (!id || existingIds.has(id)) continue;

    const next = {
      id,
      name: sourceCard.name,
      rulesText: sourceCard.text || undefined,
      chaosText: extractChaosText(sourceCard.text) || undefined,
      typeLine: sourceCard.type || undefined,
      types: Array.isArray(sourceCard.types) ? sourceCard.types : undefined,
      subtypes: Array.isArray(sourceCard.subtypes) ? sourceCard.subtypes : undefined,
      setCode: sourceCard.setCode || undefined,
      setCodes: Array.from(sourceCard.setCodes || []),
      number: sourceCard.number || undefined,
      mtgjsonId: sourceCard.uuid || undefined,
      scryfallId: sourceCard.identifiers?.scryfallId || undefined,
    };
    existing.push(next);
    existingIds.add(id);
    added += 1;
  }

  return { updated, added };
}

/**
 * Applies source data to existing card record.
 * @param {object} target Existing catalog entry.
 * @param {object} source Source MTGJSON entry.
 * @param {string} fallbackSetCode Default set code fallback.
 */
function applyCardData(target, source, fallbackSetCode) {
  target.name = source.name;
  target.rulesText = source.text || target.rulesText;
  target.chaosText = extractChaosText(source.text) || target.chaosText;
  target.typeLine = source.type || target.typeLine;
  target.types = Array.isArray(source.types) ? source.types : target.types;
  target.subtypes = Array.isArray(source.subtypes) ? source.subtypes : target.subtypes;
  target.setCode = source.setCode || target.setCode || fallbackSetCode;
  target.setCodes = Array.from(source.setCodes || []);
  target.number = source.number || target.number;
  target.mtgjsonId = source.uuid || target.mtgjsonId;

  const scryfallId = source.identifiers?.scryfallId;
  if (typeof scryfallId === "string" && scryfallId.length > 0) {
    target.scryfallId = scryfallId;
  }
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
 * Converts a card name into canonical plane ID format.
 * @param {string | undefined} name Card name.
 * @returns {string | undefined} Plane ID slug with `plane-` prefix.
 */
function toPlaneId(name) {
  const slug = slugify(name);
  if (!slug) return undefined;
  return `plane-${slug}`;
}

/**
 * Converts a card name into canonical phenomenon ID format.
 * @param {string | undefined} name Card name.
 * @returns {string | undefined} Phenomenon ID slug with `phenomenon-` prefix.
 */
function toPhenomenonId(name) {
  const slug = slugify(name);
  if (!slug) return undefined;
  return `phenomenon-${slug}`;
}

/**
 * Converts arbitrary card names into slug format.
 * @param {string | undefined} name Input name.
 * @returns {string | undefined} Normalized slug.
 */
function slugify(name) {
  if (typeof name !== "string") return undefined;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || undefined;
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[cards-sync] ${message}`);
  process.exitCode = 1;
});
