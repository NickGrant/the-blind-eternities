import { Injectable } from "@angular/core";
import cardsCatalog from "../../assets/cards.json";
import { createShuffledDeck } from "../../state/deck/deck-model";

export type PlaneCard = {
  id: string;
  name: string;
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
  }>;
};

@Injectable({ providedIn: "root" })
export class DeckService {
  private readonly planes: PlaneCard[] = ((cardsCatalog as CardsCatalog).planes ?? [])
    .filter((p) => typeof p.id === "string" && p.id.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name?.trim() || this.humanizePlaneId(p.id),
      rulesText: p.rulesText?.trim() || undefined,
      chaosText: p.chaosText?.trim() || undefined,
      artUrl: p.artUrl?.trim() || undefined,
    }));

  private readonly planesById = new Map(this.planes.map((p) => [p.id, p] as const));

  listPlanes(): readonly PlaneCard[] {
    return this.planes;
  }

  getPlane(id: string | undefined): PlaneCard | undefined {
    if (!id) return undefined;
    return this.planesById.get(id);
  }

  getPlaneName(id: string | undefined): string | undefined {
    const plane = this.getPlane(id);
    if (plane?.name) return plane.name;
    if (!id) return undefined;
    return this.humanizePlaneId(id);
  }

  getPlaneChaosText(id: string | undefined): string | undefined {
    return this.getPlane(id)?.chaosText;
  }

  getPlaneRulesText(id: string | undefined): string | undefined {
    const plane = this.getPlane(id);
    if (!plane) return undefined;
    if (plane.rulesText) return plane.rulesText;
    return plane.chaosText;
  }

  getPlaneArtUrl(id: string | undefined): string | undefined {
    const art = this.getPlane(id)?.artUrl;
    return art?.trim() || undefined;
  }

  createInitialDeck(args: { atMs: number; seed?: string }): { drawPile: string[]; discardPile: string[] } {
    if (this.planes.length === 0) {
      throw new Error("No plane cards available in cards catalog.");
    }

    return createShuffledDeck({
      planeIds: this.planes.map((p) => p.id),
      atMs: args.atMs,
      seed: args.seed,
    });
  }

  private humanizePlaneId(id: string): string {
    const base = id.startsWith("plane-") ? id.slice("plane-".length) : id;
    return base
      .split("-")
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }
}
