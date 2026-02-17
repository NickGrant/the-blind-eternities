import type { CoordKey, MapTile } from "../session.types";
import { manhattanDistance, neighborsCardinal, parseCoordKey, toCoordKey } from "./coord";

export type TilesByCoord = Record<CoordKey, MapTile>;

/**
 * Deterministic placeholder plane id generator.
 *
 * Milestone 2 note:
 * - The true source of plane IDs comes from DeckService (Milestone 3).
 * - Until then, we must still be able to place unique tiles deterministically
 *   for map invariants + tests.
 */
export const stubPlaneIdForCoord = (coordKey: CoordKey): string => `plane@${coordKey}`;

export const createTile = (args: {
  coordKey: CoordKey;
  planeId: string;
  atMs: number;
  isFaceUp?: boolean;
}): MapTile => {
  const coord = parseCoordKey(args.coordKey);
  return {
    coord,
    planeId: args.planeId,
    revealedAtMs: args.atMs,
    isFaceUp: args.isFaceUp ?? true,
  };
};

export const withDistancesFromParty = (tilesByCoord: TilesByCoord, partyCoord: CoordKey): TilesByCoord => {
  const party = parseCoordKey(partyCoord);
  const next: TilesByCoord = {};

  for (const [coordKey, tile] of Object.entries(tilesByCoord)) {
    const d = manhattanDistance(tile.coord, party);
    next[coordKey] = { ...tile, distanceFromParty: d };
  }

  return next;
};

/**
 * Ensure-Plus (bounded)
 *
 * For each tile within `radius` of the party, ensure C/N/E/S/W neighbors exist.
 * Missing neighbors are created by calling `drawPlaneId`.
 */
export const ensurePlusBounded = (args: {
  tilesByCoord: TilesByCoord;
  partyCoord: CoordKey;
  radius: number;
  atMs: number;
  drawPlaneId?: (coordKey: CoordKey) => string;
}): { tilesByCoord: TilesByCoord; placed: CoordKey[] } => {
  const party = parseCoordKey(args.partyCoord);
  const drawPlaneId = args.drawPlaneId ?? stubPlaneIdForCoord;

  const next: TilesByCoord = { ...args.tilesByCoord };
  const placed: CoordKey[] = [];

  const entries = Object.entries(args.tilesByCoord);
  for (const [, tile] of entries) {
    const d = manhattanDistance(tile.coord, party);
    if (d > args.radius) continue;

    for (const n of neighborsCardinal(tile.coord)) {
      const nk = toCoordKey(n);
      if (next[nk]) continue;
      next[nk] = createTile({
        coordKey: nk,
        planeId: drawPlaneId(nk),
        atMs: args.atMs,
        isFaceUp: false,
      });
      placed.push(nk);
    }
  }

  return { tilesByCoord: next, placed };
};

/**
 * Decay
 *
 * Discard planes whose Manhattan distance from the party exceeds `decayDistance`.
 */
export const applyDecay = (args: {
  tilesByCoord: TilesByCoord;
  partyCoord: CoordKey;
  decayDistance: number;
}): { tilesByCoord: TilesByCoord; removed: CoordKey[] } => {
  const party = parseCoordKey(args.partyCoord);

  const next: TilesByCoord = {};
  const removed: CoordKey[] = [];

  for (const [coordKey, tile] of Object.entries(args.tilesByCoord)) {
    const d = manhattanDistance(tile.coord, party);
    if (d > args.decayDistance) {
      removed.push(coordKey);
      continue;
    }
    next[coordKey] = tile;
  }

  return { tilesByCoord: next, removed };
};