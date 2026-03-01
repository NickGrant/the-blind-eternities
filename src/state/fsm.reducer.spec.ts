import { describe, it, expect } from "vitest";
import { reduceSessionState } from "./fsm.reducer";
import type { SessionState } from "./session.types";

describe("reduceSessionState (Option A: ignore = no change)", () => {
  it("ignores invalid intents without changing state reference", () => {
    const sIdle = buildState("IDLE");

    const next = reduceSessionState(sIdle, {
      type: "domain/roll_resolved",
      atMs: 1,
      outcome: "blank",
    });

    expect(next).toBe(sIdle);
  });

  it("records lastIntent only when intent is handled", () => {
    const sIdle = buildState("IDLE");

    const ignored = reduceSessionState(sIdle, {
      type: "domain/roll_resolved",
      atMs: 2,
      outcome: "blank",
    });

    expect(ignored).toBe(sIdle);
    expect(ignored.fsm.context?.lastIntent).toBeUndefined();

    const next = reduceSessionState(sIdle, {
      type: "domain/roll_die",
      atMs: 10,
    });

    expect(next).not.toBe(sIdle);
    expect(next.fsm.state).toBe("ROLLING");
    expect(next.fsm.context?.lastIntent?.type).toBe("domain/roll_die");
    expect(next.fsm.context?.lastIntent?.atMs).toBe(10);
  });
});

function buildState(fsmState: SessionState["fsm"]["state"]): SessionState {
  return {
    meta: { version: 1, createdAtMs: 0, sessionId: "test" },
    fsm: { state: fsmState },
    config: {
      decayDistance: 3,
      bootstrapRevealOrder: ["C", "N", "E", "S", "W"],
      ensurePlusEnabled: true,
      gameMode: "BLIND_ETERNITIES",
      fogOfWarDistance: 1,
    },
    rng: { rollCount: 0 },
    deck: { drawPile: [], discardPile: [] },
    map: { tilesByCoord: {}, partyCoord: "0,0" },
    modal: { queue: [], isOpen: false },
    log: { entries: [] },
    ui: {},
  };
}
