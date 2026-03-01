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
    expect(service.getPlaneName("plane-missing-plane")).toBe("Missing Plane");
  });

  it("returns chaos text when available", () => {
    const service = new DeckService();

    expect(service.getPlaneChaosText("plane-akoum")).toContain("CHAOS");
    expect(service.getPlaneChaosText("plane-missing-plane")).toBeUndefined();
  });

  it("returns modal rules text for known cards", () => {
    const service = new DeckService();

    expect(service.getPlaneRulesText("plane-akoum")).toContain("Whenever chaos ensues");
  });

  it("creates deterministic initial deck from catalog", () => {
    const service = new DeckService();

    const a = service.createInitialDeck({ atMs: 123, seed: "seed-1" });
    const b = service.createInitialDeck({ atMs: 123, seed: "seed-1" });

    expect(a.drawPile.length).toBe(service.countPlayablePlanesForSets([]));
    expect(a).toEqual(b);
  });

  it("lists available set options from playable cards", () => {
    const service = new DeckService();
    const sets = service.listPlaneSetOptions();

    expect(sets.length).toBeGreaterThan(0);
    expect(sets[0].code.length).toBeGreaterThan(0);
  });

  it("filters deck creation by selected set codes", () => {
    const service = new DeckService();
    const selected = ["OPCA"];
    const deck = service.createInitialDeck({ atMs: 1, seed: "seed-1", includedSetCodes: selected });
    const byId = new Map(service.listPlanes().map((plane) => [plane.id, plane] as const));

    expect(deck.drawPile.length).toBeGreaterThan(0);
    expect(
      deck.drawPile.every((id) => {
        const plane = byId.get(id);
        if (!plane) return false;
        const codes = plane.setCodes?.length ? plane.setCodes : plane.setCode ? [plane.setCode] : [];
        return codes.includes("OPCA");
      })
    ).toBe(true);
  });

  it("counts playable planes for selected sets", () => {
    const service = new DeckService();
    const count = service.countPlayablePlanesForSets(["OPCA"]);
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it("enforces minimum deck size for selected sets", () => {
    const service = new DeckService();
    expect(() =>
      service.createInitialDeck({ atMs: 1, seed: "seed-1", includedSetCodes: ["PHOP"] })
    ).toThrowError(/At least 5 playable planes/);
  });

  it("excludes set options that have zero playable cards", () => {
    const service = new DeckService();
    const sets = service.listPlaneSetOptions();

    expect(sets.length).toBeGreaterThan(0);
    expect(sets.every((set) => set.count > 0)).toBe(true);
  });

  it("includes Doctor Who set options when plane data exists", () => {
    const service = new DeckService();
    const sets = service.listPlaneSetOptions();

    const who = sets.find((set) => set.code === "WHO");
    expect(who).toBeDefined();
    expect(who!.count).toBeGreaterThan(0);
  });
});
