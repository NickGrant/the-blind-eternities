import { describe, expect, it } from "vitest";
import { createShuffledDeck, drawPlanes } from "./deck-model";

describe("deck-model", () => {
  it("initializes deterministically for same seed and timestamp", () => {
    const planeIds = ["a", "b", "c", "d"];
    const a = createShuffledDeck({ planeIds, atMs: 100, seed: "abc" });
    const b = createShuffledDeck({ planeIds, atMs: 100, seed: "abc" });

    expect(a.drawPile).toEqual(b.drawPile);
    expect(a.discardPile).toEqual([]);
  });

  it("drawPlanes removes from front of draw pile", () => {
    const result = drawPlanes(["a", "b", "c", "d"], 3);

    expect(result.drawn).toEqual(["a", "b", "c"]);
    expect(result.drawPile).toEqual(["d"]);
  });

  it("deduplicates plane IDs when building a deck", () => {
    const deck = createShuffledDeck({
      planeIds: ["a", "b", "a", "c", "b"],
      atMs: 100,
      seed: "abc",
    });

    expect(deck.drawPile.length).toBe(3);
    expect(new Set(deck.drawPile).size).toBe(deck.drawPile.length);
  });
});
