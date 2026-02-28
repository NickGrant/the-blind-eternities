import { Injectable } from "@angular/core";
import cardsCatalog from "../../assets/cards.json";
import { createShuffledDeck } from "../../state/deck/deck-model";

export type PlaneCard = {
  id: string;
  name: string;
};

type CardsCatalog = {
  planes?: Array<{
    id: string;
    name?: string;
  }>;
};

@Injectable({ providedIn: "root" })
export class DeckService {
  private readonly planes: PlaneCard[] = ((cardsCatalog as CardsCatalog).planes ?? [])
    .filter((p) => typeof p.id === "string" && p.id.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name?.trim() || p.id,
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
    return this.getPlane(id)?.name;
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
}
