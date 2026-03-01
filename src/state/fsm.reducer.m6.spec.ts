import { describe, expect, it } from "vitest";
import { reduceSessionState } from "./fsm.reducer";
import type { SessionState } from "./session.types";

describe("reduceSessionState (Milestone 6 hardening/logging)", () => {
  it("logs die roll and reveal events in human-readable form", () => {
    const rolling = buildState("ROLLING");
    rolling.deck.currentPlaneId = "plane-akoum";

    const chaos = reduceSessionState(rolling, {
      type: "domain/roll_resolved",
      atMs: 11,
      outcome: "chaos",
    });

    expect(chaos.log.entries.length).toBe(1);
    expect(chaos.log.entries[0].message).toContain("Die roll resolved: chaos");
    expect(chaos.log.entries[0].level).toBe("info");
  });

  it("transitions to ERROR and logs fatal_error from any state", () => {
    const idle = buildState("IDLE");

    const next = reduceSessionState(idle, {
      type: "domain/fatal_error",
      atMs: 33,
      code: "CARD_DATA_INIT_FAILED",
      detail: "cards catalog missing",
    });

    expect(next.fsm.state).toBe("ERROR");
    expect(next.fsm.context?.error?.code).toBe("CARD_DATA_INIT_FAILED");
    expect(next.log.entries.at(-1)?.level).toBe("error");
    expect(next.log.entries.at(-1)?.message).toContain("Fatal error");
  });

  it("keeps log size bounded to avoid unbounded growth", () => {
    let state = buildState("IDLE");

    for (let i = 0; i < 250; i += 1) {
      state = reduceSessionState(state, {
        type: "domain/fatal_error",
        atMs: i,
        code: `ERR_${i}`,
      });
      // bounce back so each next fatal_error is still processed from non-terminal state.
      state = reduceSessionState(state, {
        type: "domain/restart_session",
        atMs: i + 1000,
      });
      state = { ...state, fsm: { ...state.fsm, state: "IDLE" } };
    }

    expect(state.log.entries.length).toBeLessThanOrEqual(200);
  });
});

function buildState(fsmState: SessionState["fsm"]["state"]): SessionState {
  return {
    meta: { version: 1, createdAtMs: 0, sessionId: "test" },
    fsm: { state: fsmState, context: {} },
    config: {
      decayDistance: 3,
      bootstrapRevealOrder: ["C", "N", "E", "S", "W"],
      ensurePlusEnabled: true,
      gameMode: "BLIND_ETERNITIES",
      fogOfWarDistance: 1,
    },
    rng: { rollCount: 0, seed: "seed-1" },
    deck: { drawPile: [], discardPile: [] },
    map: { tilesByCoord: {}, partyCoord: "0,0", highlights: { eligibleMoveCoords: [] } },
    modal: { queue: [], isOpen: false },
    log: { entries: [] },
    ui: { selections: {} },
  };
}
