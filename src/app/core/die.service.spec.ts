import { describe, expect, it } from "vitest";

import { DieService } from "./die.service";

describe("DieService", () => {
  it("returns deterministic result for same inputs", () => {
    const die = new DieService();

    const a = die.roll({ atMs: 1000, seed: "seed-a", rollCount: 2 });
    const b = die.roll({ atMs: 1000, seed: "seed-a", rollCount: 2 });

    expect(a).toBe(b);
  });

  it("returns only valid outcomes", () => {
    const die = new DieService();
    const seen = new Set<string>();

    for (let i = 0; i < 200; i += 1) {
      const outcome = die.roll({ atMs: 1000 + i, seed: "seed-a", rollCount: i });
      seen.add(outcome);
      expect(["blank", "chaos", "planeswalk"]).toContain(outcome);
    }

    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});

