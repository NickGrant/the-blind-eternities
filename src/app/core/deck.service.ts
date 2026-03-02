import { Injectable } from "@angular/core";
import { createShuffledDeck } from "../../state/deck/deck-model";
import type { CardKind } from "../../state/session.types";
import { DEFAULT_SELECTABLE_PLANE_SET_CODES, PLANE_SET_LABELS } from "./plane-set-config";

export type PlaneCard = {
  id: string;
  name: string;
  setCode?: string;
  setCodes?: string[];
  rulesText?: string;
  chaosText?: string;
  artUrl?: string;
  cardKind?: CardKind;
};

type CatalogCard = {
  id: string;
  name?: string;
  rulesText?: string;
  chaosText?: string;
  artUrl?: string;
  setCode?: string;
  setCodes?: string[];
  typeLine?: string;
  types?: string[];
};

type CardsCatalog = {
  planes?: CatalogCard[];
  phenomena?: CatalogCard[];
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
 * Reads local card metadata and provides deterministic deck/set operations.
 */
@Injectable({ providedIn: "root" })
export class DeckService {
  private planes: PlaneCard[] = [];
  private phenomena: PlaneCard[] = [];
  private cards: PlaneCard[] = [];
  private cardsById = new Map<string, PlaneCard>();
  private planesById = new Map<string, PlaneCard>();
  private playablePlanes: PlaneCard[] = [];
  private playableCards: PlaneCard[] = [];

  /**
   * Loads card catalog JSON at runtime to avoid bundling large static metadata.
   */
  async loadCatalog(url = "assets/cards.json"): Promise<void> {
    const response = await fetch(new URL(url, document.baseURI).toString(), { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load cards catalog (${response.status} ${response.statusText})`);
    }
    const catalog = (await response.json()) as CardsCatalog;
    this.hydrateCatalog(catalog);
  }

  /**
   * Replaces in-memory catalog and rebuilds derived indexes.
   */
  hydrateCatalog(catalog: CardsCatalog): void {
    this.initializeCatalog(catalog);
  }

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
   * Returns preferred default set code from shared plane-set config.
   */
  getPreferredDefaultSetCode(): string | undefined {
    return DEFAULT_SELECTABLE_PLANE_SET_CODES[0];
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
    this.playableCards.forEach((card) => {
      const codes = this.resolvePlaneSetCodes(card);
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
    const card = this.getCard(id);
    if (card?.name) return card.name;
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
    return this.getCardRulesText(id);
  }

  /**
   * Returns card art URL for a plane if present.
   */
  getPlaneArtUrl(id: string | undefined): string | undefined {
    const art = this.getCard(id)?.artUrl;
    return art?.trim() || undefined;
  }

  /**
   * Returns metadata for any card id (plane or phenomenon).
   */
  getCard(id: string | undefined): PlaneCard | undefined {
    if (!id) return undefined;
    return this.cardsById.get(id);
  }

  /**
   * Returns rules text for any card type, falling back to chaos text.
   */
  getCardRulesText(id: string | undefined): string | undefined {
    const card = this.getCard(id);
    if (!card) return undefined;
    if (card.rulesText) return card.rulesText;
    return card.chaosText;
  }

  /**
   * Returns art URL for any card type.
   */
  getCardArtUrl(id: string | undefined): string | undefined {
    const art = this.getCard(id)?.artUrl;
    return art?.trim() || undefined;
  }

  /**
   * Creates deterministic draw/discard piles for a new session.
   */
  createInitialDeck(args: {
    atMs: number;
    seed?: string;
    includedSetCodes?: readonly string[];
  }): { drawPile: string[]; discardPile: string[]; cardTypesById: Record<string, CardKind> } {
    this.assertCatalogLoaded();
    const include = new Set((args.includedSetCodes ?? []).map((code) => code.trim()).filter((code) => code.length > 0));

    const sourcePlanes =
      include.size > 0
        ? this.playablePlanes.filter((plane) => {
            const codes = this.resolvePlaneSetCodes(plane);
            return codes.some((code) => include.has(code));
          })
        : this.playablePlanes;
    const sourceCards =
      include.size > 0
        ? this.playableCards.filter((card) => {
            const codes = this.resolvePlaneSetCodes(card);
            return codes.some((code) => include.has(code));
          })
        : this.playableCards;

    if (include.size > 0 && sourceCards.length === 0) {
      throw new DeckValidationError("No playable cards matched the selected set filters.");
    }
    if (sourcePlanes.length < MIN_PLANES_PER_SESSION) {
      throw new DeckValidationError(`At least ${MIN_PLANES_PER_SESSION} playable planes are required to start a session.`);
    }
    if (this.playablePlanes.length === 0) {
      throw new Error("No playable plane cards available in cards catalog.");
    }

    const shuffled = createShuffledDeck({
      planeIds: sourceCards.map((card) => card.id),
      atMs: args.atMs,
      seed: args.seed,
    });
    const cardTypesById: Record<string, CardKind> = {};
    sourceCards.forEach((card) => {
      cardTypesById[card.id] = card.cardKind ?? "UNKNOWN";
    });
    return {
      ...shuffled,
      cardTypesById,
    };
  }

  /**
   * Resolves all set codes associated with a card entry.
   */
  private resolvePlaneSetCodes(card: PlaneCard): string[] {
    return (card.setCodes ?? []).length > 0 ? [...(card.setCodes ?? [])] : [card.setCode?.trim() || "UNKNOWN"];
  }

  /**
   * Maps raw catalog items into normalized runtime card records.
   */
  private buildCards(source: CatalogCard[], defaultKind: CardKind): PlaneCard[] {
    return source
      .filter((card) => typeof card.id === "string" && card.id.length > 0)
      .map((card) => ({
        id: card.id,
        name: card.name?.trim() || this.humanizePlaneId(card.id),
        setCode: card.setCode?.trim() || undefined,
        setCodes: Array.isArray(card.setCodes)
          ? card.setCodes.map((code) => String(code).trim()).filter((code) => code.length > 0)
          : card.setCode?.trim()
            ? [card.setCode.trim()]
            : [],
        rulesText: card.rulesText?.trim() || undefined,
        chaosText: card.chaosText?.trim() || undefined,
        artUrl: card.artUrl?.trim() || undefined,
        cardKind: this.resolveCardKind({
          typeLine: card.typeLine,
          types: Array.isArray(card.types) ? card.types : [],
          defaultKind,
        }),
      }));
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

  /**
   * Derives a normalized card kind from MTGJSON-like type metadata.
   */
  private resolveCardKind(args: { typeLine?: string; types: string[]; defaultKind: CardKind }): CardKind {
    const normalizedTypeLine = (args.typeLine ?? "").replace(/[^a-z0-9]+/gi, " ");
    const tokens = [...args.types, ...normalizedTypeLine.split(" ")]
      .map((token) => token.trim().toUpperCase())
      .filter((token) => token.length > 0);
    if (tokens.includes("PHENOMENON")) return "PHENOMENON";
    if (tokens.includes("PLANE")) return "PLANE";
    return args.defaultKind;
  }

  private assertCatalogLoaded(): void {
    if (this.playablePlanes.length === 0) {
      throw new Error("Card catalog not loaded or has no playable plane cards.");
    }
  }

  private initializeCatalog(catalog: CardsCatalog): void {
    this.planes = this.buildCards(catalog.planes ?? [], "PLANE");
    this.phenomena = this.buildCards(catalog.phenomena ?? [], "PHENOMENON");
    this.cards = [...this.planes, ...this.phenomena];
    this.cardsById = new Map(this.cards.map((card) => [card.id, card] as const));
    this.planesById = new Map(this.planes.map((p) => [p.id, p] as const));
    this.playablePlanes = this.planes.filter((p) => typeof p.rulesText === "string" && p.rulesText.length > 0);
    this.playableCards = this.cards.filter((p) => typeof p.rulesText === "string" && p.rulesText.length > 0);
  }
}
