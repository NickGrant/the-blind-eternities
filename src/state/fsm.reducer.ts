import type { CoordKey, ModalDescriptor, SessionState } from "./session.types";
import type { DomainIntent } from "./intents.types";
import { isAdjacentCardinal, neighborsCardinal, parseCoordKey, toCoordKey } from "./map/coord";
import {
  applyDecay,
  createTile,
  ensurePlusBounded,
  stubPlaneIdForCoord,
  withDistancesFromParty,
} from "./map/map-model";
import { drawPlanes } from "./deck/deck-model";

type FsmState = SessionState["fsm"]["state"];
type BootstrapSlot = SessionState["config"]["bootstrapRevealOrder"][number];

function withLastIntent(state: SessionState, intent: DomainIntent): SessionState {
  return {
    ...state,
    fsm: {
      ...state.fsm,
      context: {
        ...(state.fsm.context ?? {}),
        lastIntent: {
          type: intent.type,
          atMs: intent.atMs,
        },
      },
    },
  };
}

function transition(
  state: SessionState,
  nextState: FsmState,
  intent: DomainIntent,
  contextPatch?: Partial<NonNullable<SessionState["fsm"]["context"]>>
): SessionState {
  const base: SessionState = {
    ...state,
    fsm: {
      ...state.fsm,
      state: nextState,
      context: {
        ...(state.fsm.context ?? {}),
        ...(contextPatch ?? {}),
      },
    },
  };

  return withLastIntent(base, intent);
}

function bootstrapSlotToCoordKey(slot: BootstrapSlot): CoordKey {
  switch (slot) {
    case "C":
      return "0,0";
    case "N":
      return "0,-1";
    case "E":
      return "1,0";
    case "S":
      return "0,1";
    case "W":
      return "-1,0";
    default:
      return "0,0";
  }
}

function toModalDescriptor(
  modal: Extract<DomainIntent, { type: "domain/open_modal" }>['modal'],
  resumeToState: FsmState
): ModalDescriptor {
  return {
    id: modal.id,
    type: modal.modalType,
    planeId: modal.planeId,
    title: modal.title,
    body: modal.body,
    resumeToState: modal.resumeToState ?? resumeToState,
  };
}

function enqueueModal(state: SessionState, modal: ModalDescriptor): SessionState {
  if (state.modal.isOpen && state.modal.active) {
    return {
      ...state,
      modal: {
        ...state.modal,
        queue: [...state.modal.queue, modal],
      },
    };
  }

  return {
    ...state,
    modal: {
      ...state.modal,
      active: modal,
      isOpen: true,
    },
  };
}

function closeModal(state: SessionState, intent: Extract<DomainIntent, { type: "domain/close_modal" }>): SessionState {
  const active = state.modal.active;
  if (!state.modal.isOpen || !active) return state;

  if (intent.modalId && intent.modalId !== active.id) {
    return state;
  }

  const [nextActive, ...rest] = state.modal.queue;
  if (nextActive) {
    return withLastIntent(
      {
        ...state,
        modal: {
          ...state.modal,
          active: nextActive,
          queue: rest,
          isOpen: true,
        },
      },
      intent
    );
  }

  const resumeTo = (active.resumeToState as FsmState | undefined) ?? "IDLE";
  const closed = {
    ...state,
    modal: {
      ...state.modal,
      active: undefined,
      queue: [],
      isOpen: false,
    },
  };

  return transition(closed, resumeTo, intent);
}

function initMapForSession(
  state: SessionState,
  intent: Extract<DomainIntent, { type: "domain/start_session" }>
): SessionState {
  const centerKey = toCoordKey({ x: 0, y: 0 });
  const deck = intent.initialDeck ?? {
    drawPile: [...state.deck.drawPile],
    discardPile: [...state.deck.discardPile],
  };

  // Seed center tile first, then ensure-plus to create C/N/E/S/W coordinates.
  const tilesSeeded = {
    [centerKey]: createTile({
      coordKey: centerKey,
      planeId: stubPlaneIdForCoord(centerKey),
      atMs: intent.atMs,
      isFaceUp: false,
    }),
  };

  const ensured = state.config.ensurePlusEnabled
    ? ensurePlusBounded({
        tilesByCoord: tilesSeeded,
        partyCoord: centerKey,
        radius: state.config.decayDistance,
        atMs: intent.atMs,
      }).tilesByCoord
    : tilesSeeded;

  // Assign initial 5 planes deterministically in configured bootstrap reveal order.
  const bootstrapCount = state.config.bootstrapRevealOrder.length;
  const dealt = drawPlanes(deck.drawPile, bootstrapCount);
  const withAssignedPlanes = { ...ensured };

  state.config.bootstrapRevealOrder.forEach((slot, index) => {
    const coordKey = bootstrapSlotToCoordKey(slot);
    const tile = withAssignedPlanes[coordKey];
    if (!tile) return;

    withAssignedPlanes[coordKey] = {
      ...tile,
      planeId: dealt.drawn[index] ?? stubPlaneIdForCoord(coordKey),
      isFaceUp: false,
    };
  });

  const withDistances = withDistancesFromParty(withAssignedPlanes, centerKey);

  return {
    ...state,
    deck: {
      ...state.deck,
      drawPile: [...dealt.drawPile],
      discardPile: [...deck.discardPile],
      currentPlaneId: undefined,
    },
    map: {
      ...state.map,
      tilesByCoord: withDistances,
      partyCoord: centerKey,
      highlights: { eligibleMoveCoords: [] },
    },
  };
}

function applyBootstrapReveal(state: SessionState, atMs: number): SessionState {
  const centerKey = bootstrapSlotToCoordKey("C");
  const revealedTiles = { ...state.map.tilesByCoord };

  state.config.bootstrapRevealOrder.forEach((slot, idx) => {
    const coordKey = bootstrapSlotToCoordKey(slot);
    const tile = revealedTiles[coordKey];
    if (!tile) return;

    revealedTiles[coordKey] = {
      ...tile,
      isFaceUp: true,
      revealedAtMs: atMs + idx,
    };
  });

  const withDistances = withDistancesFromParty(revealedTiles, centerKey);

  return {
    ...state,
    deck: {
      ...state.deck,
      currentPlaneId: withDistances[centerKey]?.planeId,
    },
    map: {
      ...state.map,
      tilesByCoord: withDistances,
      partyCoord: centerKey,
      highlights: { eligibleMoveCoords: [] },
    },
  };
}

function setEligibleMoves(state: SessionState): SessionState {
  const partyCoord = state.map.partyCoord;
  if (!partyCoord) return state;
  const party = parseCoordKey(partyCoord);
  const candidates = neighborsCardinal(party).map(toCoordKey);
  const eligible = candidates.filter((k) => Boolean(state.map.tilesByCoord[k]));

  return {
    ...state,
    map: {
      ...state.map,
      highlights: { eligibleMoveCoords: eligible },
    },
  };
}

function applyMapPostMove(state: SessionState, atMs: number): SessionState {
  const pending = state.fsm.context?.pendingMove;
  if (!pending) return state;

  const partyCoord = pending.toCoord;

  // Ensure-plus bounded by decayDistance (keeps growth controlled).
  const ensuredOnce = state.config.ensurePlusEnabled
    ? ensurePlusBounded({
        tilesByCoord: state.map.tilesByCoord,
        partyCoord,
        radius: state.config.decayDistance,
        atMs,
      }).tilesByCoord
    : state.map.tilesByCoord;

  const decayed = applyDecay({
    tilesByCoord: ensuredOnce,
    partyCoord,
    decayDistance: state.config.decayDistance,
  }).tilesByCoord;

  // Ensure-plus again to restore plus-invariant after removals.
  const ensuredTwice = state.config.ensurePlusEnabled
    ? ensurePlusBounded({
        tilesByCoord: decayed,
        partyCoord,
        radius: state.config.decayDistance,
        atMs,
      }).tilesByCoord
    : decayed;

  const withDistances = withDistancesFromParty(ensuredTwice, partyCoord);
  const currentPlaneId = withDistances[partyCoord]?.planeId;

  return {
    ...state,
    deck: {
      ...state.deck,
      currentPlaneId,
    },
    map: {
      ...state.map,
      tilesByCoord: withDistances,
      partyCoord,
      highlights: { eligibleMoveCoords: [] },
    },
    ui: {
      ...state.ui,
      selections: {
        ...(state.ui.selections ?? {}),
        selectedCoord: undefined,
      },
    },
  };
}

export function reduceSessionState(state: SessionState, intent: DomainIntent): SessionState {
  if (intent.type === "domain/open_modal") {
    const resumeTo = state.fsm.state === "MODAL_OPEN"
      ? ((state.modal.active?.resumeToState as FsmState | undefined) ?? "IDLE")
      : state.fsm.state;

    const withModal = enqueueModal(state, toModalDescriptor(intent.modal, resumeTo));

    if (state.modal.isOpen && state.fsm.state === "MODAL_OPEN") {
      return withLastIntent(withModal, intent);
    }

    return transition(withModal, "MODAL_OPEN", intent);
  }

  switch (state.fsm.state) {
    case "SETUP": {
      if (intent.type === "domain/start_session") {
        const seeded = initMapForSession(state, intent);
        return transition(seeded, "BOOTSTRAP_REVEAL", intent);
      }
      return state;
    }

    case "BOOTSTRAP_REVEAL": {
      if (intent.type === "domain/bootstrap_reveal_complete") {
        const revealed = applyBootstrapReveal(state, intent.atMs);
        return transition(revealed, "IDLE", intent);
      }
      return state;
    }

    case "IDLE": {
      if (intent.type === "domain/roll_die") {
        return transition(state, "ROLLING", intent);
      }
      return state;
    }

    case "ROLLING": {
      if (intent.type === "domain/roll_resolved") {
        if (intent.outcome === "blank") {
          return transition(state, "IDLE", intent);
        }
        if (intent.outcome === "planeswalk") {
          const next = transition(state, "AWAIT_MOVE", intent);
          return setEligibleMoves(next);
        }
        if (intent.outcome === "chaos") {
          const withModal = enqueueModal(
            state,
            {
              id: `chaos_${intent.atMs}`,
              type: "PLANE",
              planeId: state.deck.currentPlaneId,
              title: "Current Plane",
              resumeToState: "IDLE",
            }
          );
          return transition(withModal, "MODAL_OPEN", intent);
        }
      }
      return state;
    }

    case "AWAIT_MOVE": {
      if (intent.type === "domain/select_plane") {
        const from = state.map.partyCoord;
        if (!from) return state;
        if (!state.map.tilesByCoord[intent.toCoord]) return state;

        const fromCoord = parseCoordKey(from);
        const toCoord = parseCoordKey(intent.toCoord);
        if (!isAdjacentCardinal(fromCoord, toCoord)) return state;

        const next = transition(state, "CONFIRM_MOVE", intent, {
          pendingMove: { fromCoord: from, toCoord: intent.toCoord },
        });

        return {
          ...next,
          ui: {
            ...next.ui,
            selections: {
              ...(next.ui.selections ?? {}),
              selectedCoord: intent.toCoord,
            },
          },
        };
      }
      if (intent.type === "domain/cancel_move") {
        return transition(state, "IDLE", intent);
      }
      return state;
    }

    case "CONFIRM_MOVE": {
      if (intent.type === "domain/confirm_move") {
        return transition(state, "MOVING", intent);
      }
      if (intent.type === "domain/cancel_move") {
        return transition(state, "AWAIT_MOVE", intent);
      }
      return state;
    }

    case "MOVING": {
      if (intent.type === "domain/movement_complete") {
        const mapped = applyMapPostMove(state, intent.atMs);
        return transition(mapped, "IDLE", intent, { pendingMove: undefined });
      }
      return state;
    }

    case "MODAL_OPEN": {
      if (intent.type === "domain/close_modal") {
        return closeModal(state, intent);
      }
      return state;
    }

    case "ERROR": {
      if (intent.type === "domain/restart_session") {
        return transition(state, "SETUP", intent);
      }
      return state;
    }

    default:
      return state;
  }
}
