import { describe, expect, it } from "vitest";

import { DeckService } from "./deck.service";

describe("DeckService", () => {
  it("loads plane cards from local cards catalog", () => {
    const service = new DeckService();

    const planes = service.listPlanes();
    expect(planes.length).toBeGreaterThanOrEqual(10);
    expect(planes.every((p) => p.id.startsWith("plane-"))).toBe(true);
  });

  it("returns plane name by id", () => {
    const service = new DeckService();

    expect(service.getPlaneName("plane-akoum")).toBe("Akoum");
    expect(service.getPlaneName("missing-plane")).toBeUndefined();
  });

  it("creates deterministic initial deck from catalog", () => {
    const service = new DeckService();

    const a = service.createInitialDeck({ atMs: 123, seed: "seed-1" });
    const b = service.createInitialDeck({ atMs: 123, seed: "seed-1" });

    expect(a.drawPile.length).toBeGreaterThanOrEqual(10);
    expect(a).toEqual(b);
  });
});
