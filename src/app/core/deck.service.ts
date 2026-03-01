import { Injectable } from "@angular/core";
import cardsCatalog from "../../assets/cards.json";
import { createShuffledDeck } from "../../state/deck/deck-model";
import { DEFAULT_SELECTABLE_PLANE_SET_CODES, PLANE_SET_LABELS } from "./plane-set-config";

export type PlaneCard = {
  id: string;
  name: string;
  setCode?: string;
  setCodes?: string[];
  rulesText?: string;
  chaosText?: string;
  artUrl?: string;
};

type CardsCatalog = {
  planes?: Array<{
    id: string;
    name?: string;
    rulesText?: string;
    chaosText?: string;
    artUrl?: string;
    setCode?: string;
    setCodes?: string[];
  }>;
};

export type PlaneSetOption = {
  code: string;
  label: string;
  count: number;
  isPlanechaseDefault: boolean;
};

const DEFAULT_PLANECHASE_SET_CODES = new Set(DEFAULT_SELECTABLE_PLANE_SET_CODES);
const MIN_PLANES_PER_SESSION = 5;

/**
 * Indicates a user-correctable deck selection/configuration issue.
 */
export class DeckValidationError extends Error {}

/**
 * Reads local plane metadata and provides deterministic deck/set operations.
 */
@Injectable({ providedIn: "root" })
export class DeckService {
  private readonly planes: PlaneCard[] = ((cardsCatalog as CardsCatalog).planes ?? [])
    .filter((p) => typeof p.id === "string" && p.id.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name?.trim() || this.humanizePlaneId(p.id),
      setCode: p.setCode?.trim() || undefined,
      setCodes: Array.isArray(p.setCodes)
        ? p.setCodes.map((code) => String(code).trim()).filter((code) => code.length > 0)
        : p.setCode?.trim()
          ? [p.setCode.trim()]
          : [],
      rulesText: p.rulesText?.trim() || undefined,
      chaosText: p.chaosText?.trim() || undefined,
      artUrl: p.artUrl?.trim() || undefined,
    }));

  private readonly planesById = new Map(this.planes.map((p) => [p.id, p] as const));
  private readonly playablePlanes = this.planes.filter(
    (p) => typeof p.rulesText === "string" && p.rulesText.length > 0
  );

  /**
   * Returns all known planes from local catalog.
   */
  listPlanes(): readonly PlaneCard[] {
    return this.planes;
  }

  /**
   * Returns the minimum number of playable planes required to start a session.
   */
  getMinimumSessionPlanes(): number {
    return MIN_PLANES_PER_SESSION;
  }

  /**
   * Counts playable planes that match at least one selected set code.
   */
  countPlayablePlanesForSets(includedSetCodes: readonly string[]): number {
    const include = new Set(includedSetCodes.map((code) => code.trim()).filter((code) => code.length > 0));
    if (include.size === 0) return this.playablePlanes.length;

    return this.playablePlanes.filter((plane) => {
      const codes = this.resolvePlaneSetCodes(plane);
      return codes.some((code) => include.has(code));
    }).length;
  }

  /**
   * Returns selectable set options with playable counts and default flags.
   */
  listPlaneSetOptions(): readonly PlaneSetOption[] {
    const counts = new Map<string, number>();
    this.playablePlanes.forEach((plane) => {
      const codes = this.resolvePlaneSetCodes(plane);
      const uniqueCodes = [...new Set(codes)];
      uniqueCodes.forEach((code) => {
        counts.set(code, (counts.get(code) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .map(([code, count]) => ({
        code,
        label: PLANE_SET_LABELS[code] ?? code,
        count,
        isPlanechaseDefault: DEFAULT_PLANECHASE_SET_CODES.has(code),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Returns metadata for a plane id.
   */
  getPlane(id: string | undefined): PlaneCard | undefined {
    if (!id) return undefined;
    return this.planesById.get(id);
  }

  /**
   * Returns display name for a plane id.
   */
  getPlaneName(id: string | undefined): string | undefined {
    const plane = this.getPlane(id);
    if (plane?.name) return plane.name;
    if (!id) return undefined;
    return this.humanizePlaneId(id);
  }

  /**
   * Returns chaos text for a plane if present.
   */
  getPlaneChaosText(id: string | undefined): string | undefined {
    return this.getPlane(id)?.chaosText;
  }

  /**
   * Returns rules text for modals, falling back to chaos text when needed.
   */
  getPlaneRulesText(id: string | undefined): string | undefined {
    const plane = this.getPlane(id);
    if (!plane) return undefined;
    if (plane.rulesText) return plane.rulesText;
    return plane.chaosText;
  }

  /**
   * Returns card art URL for a plane if present.
   */
  getPlaneArtUrl(id: string | undefined): string | undefined {
    const art = this.getPlane(id)?.artUrl;
    return art?.trim() || undefined;
  }

  /**
   * Creates deterministic draw/discard piles for a new session.
   */
  createInitialDeck(args: {
    atMs: number;
    seed?: string;
    includedSetCodes?: readonly string[];
  }): { drawPile: string[]; discardPile: string[] } {
    const include = new Set((args.includedSetCodes ?? []).map((code) => code.trim()).filter((code) => code.length > 0));
    const sourcePlanes =
      include.size > 0
        ? this.playablePlanes.filter((plane) => {
            const codes = this.resolvePlaneSetCodes(plane);
            return codes.some((code) => include.has(code));
          })
        : this.playablePlanes;

    if (include.size > 0 && sourcePlanes.length === 0) {
      throw new DeckValidationError("No playable cards matched the selected set filters.");
    }
    if (sourcePlanes.length < MIN_PLANES_PER_SESSION) {
      throw new DeckValidationError(`At least ${MIN_PLANES_PER_SESSION} playable planes are required to start a session.`);
    }

    if (this.playablePlanes.length === 0) {
      throw new Error("No playable plane cards available in cards catalog.");
    }

    return createShuffledDeck({
      planeIds: sourcePlanes.map((p) => p.id),
      atMs: args.atMs,
      seed: args.seed,
    });
  }

  /**
   * Resolves all set codes associated with a plane entry.
   */
  private resolvePlaneSetCodes(plane: PlaneCard): string[] {
    return (plane.setCodes ?? []).length > 0 ? (plane.setCodes as string[]) : [plane.setCode?.trim() || "UNKNOWN"];
  }

  /**
   * Converts a slug id into a human-readable title.
   */
  private humanizePlaneId(id: string): string {
    const base = id.startsWith("plane-") ? id.slice("plane-".length) : id;
    return base
      .split("-")
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }
}
