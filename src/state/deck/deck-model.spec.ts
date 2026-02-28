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
});
