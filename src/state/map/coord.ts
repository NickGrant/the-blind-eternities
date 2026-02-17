import type { CoordKey } from "../session.types";

export type Coord = { x: number; y: number };

// Canonical CoordKey format for this project: "x,y" (integers, base-10)
export const toCoordKey = (coord: Coord): CoordKey => `${coord.x},${coord.y}`;

export const parseCoordKey = (key: CoordKey): Coord => {
  const idx = key.indexOf(",");
  if (idx === -1) {
    throw new Error(`Invalid CoordKey: "${key}" (expected \"x,y\")`);
  }

  const xStr = key.slice(0, idx).trim();
  const yStr = key.slice(idx + 1).trim();

  const x = Number.parseInt(xStr, 10);
  const y = Number.parseInt(yStr, 10);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Invalid CoordKey: "${key}" (x/y must be integers)`);
  }

  return { x, y };
};

export const manhattanDistance = (a: Coord, b: Coord): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const neighborsCardinal = (coord: Coord): Coord[] => [
  { x: coord.x, y: coord.y - 1 }, // N
  { x: coord.x + 1, y: coord.y }, // E
  { x: coord.x, y: coord.y + 1 }, // S
  { x: coord.x - 1, y: coord.y }, // W
];

export const isAdjacentCardinal = (a: Coord, b: Coord): boolean =>
  manhattanDistance(a, b) === 1;