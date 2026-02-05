import { describe, expect, it } from "vitest";
import type { SessionState } from "./session.types";
import { createNewSessionState } from "./session.factory";
import { reduceSessionState } from "./fsm.reducer";

const at = (ms: number) => ms;

describe("reduceSessionState (FSM)", () => {
  it("SETUP + start_session -> BOOTSTRAP_REVEAL", () => {
    const s0 = createNewSessionState({ atMs: at(1000), sessionId: "s1" });
    const { next, handled } = reduceSessionState(s0, { type: "domain/start_session", atMs: at(1100) });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("BOOTSTRAP_REVEAL");
  });

  it("rejects invalid transition (IDLE + start_session ignored)", () => {
    const s0 = createNewSessionState({ atMs: at(1000), sessionId: "s1" });
    const sIdle: SessionState = { ...s0, fsm: { ...s0.fsm, state: "IDLE" } };

    const { next, handled } = reduceSessionState(sIdle, { type: "domain/start_session", atMs: at(1100) });

    expect(handled).toBe(false);
    expect(next).toBe(sIdle);
  });

  it("IDLE + roll_die -> ROLLING and increments rollCount", () => {
    const s0 = createNewSessionState({ atMs: at(1000) });
    const sIdle: SessionState = { ...s0, fsm: { ...s0.fsm, state: "IDLE" }, rng: { ...s0.rng, rollCount: 2 } };

    const { next, handled } = reduceSessionState(sIdle, { type: "domain/roll_die", atMs: at(1200) });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("ROLLING");
    expect(next.rng.rollCount).toBe(3);
  });

  it("ROLLING + roll_resolved(blank) -> IDLE", () => {
    const s0 = createNewSessionState({ atMs: at(1000) });
    const sRolling: SessionState = { ...s0, fsm: { ...s0.fsm, state: "ROLLING" } };

    const { next, handled } = reduceSessionState(sRolling, {
      type: "domain/roll_resolved",
      atMs: at(1300),
      outcome: "blank",
    });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("IDLE");
  });

  it("ROLLING + roll_resolved(chaos) -> MODAL_OPEN", () => {
    const s0 = createNewSessionState({ atMs: at(1000) });
    const sRolling: SessionState = { ...s0, fsm: { ...s0.fsm, state: "ROLLING" } };

    const { next, handled } = reduceSessionState(sRolling, {
      type: "domain/roll_resolved",
      atMs: at(1300),
      outcome: "chaos",
    });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.modal.isOpen).toBe(true);
    expect(next.modal.active?.type).toBe("PLANE");
    expect(next.modal.active?.resumeToState).toBe("IDLE");
  });

  it("AWAIT_MOVE + select_plane -> CONFIRM_MOVE with pendingMove", () => {
    const s0 = createNewSessionState({ atMs: at(1000) });
    const sAwait: SessionState = { ...s0, fsm: { ...s0.fsm, state: "AWAIT_MOVE" }, map: { ...s0.map, partyCoord: "1,1" } };

    const { next, handled } = reduceSessionState(sAwait, {
      type: "domain/select_plane",
      atMs: at(1400),
      toCoord: "1,2",
    });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("CONFIRM_MOVE");
    expect(next.fsm.context?.pendingMove).toEqual({ fromCoord: "1,1", toCoord: "1,2" });
    expect(next.ui.selections?.selectedCoord).toBe("1,2");
  });

  it("MODAL_OPEN + close_modal -> resumeToState", () => {
    const s0 = createNewSessionState({ atMs: at(1000) });
    const sModal: SessionState = {
      ...s0,
      fsm: { ...s0.fsm, state: "MODAL_OPEN" },
      modal: {
        isOpen: true,
        queue: [],
        active: { id: "m1", type: "PLANE", resumeToState: "IDLE" },
      },
    };

    const { next, handled } = reduceSessionState(sModal, { type: "domain/close_modal", atMs: at(1500) });

    expect(handled).toBe(true);
    expect(next.fsm.state).toBe("IDLE");
    expect(next.modal.isOpen).toBe(false);
    expect(next.modal.active).toBeUndefined();
  });
});
