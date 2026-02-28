import type { DomainIntent } from "../intents.types";
import type { CoordKey, SessionState } from "../session.types";
import { neighborsCardinal, parseCoordKey, toCoordKey } from "../map/coord";
import {
  applyDecay,
  createTile,
  ensurePlusBounded,
  stubPlaneIdForCoord,
  withDistancesFromParty,
} from "../map/map-model";
import { drawPlanes } from "../deck/deck-model";
import { appendLog } from "./logging";

type BootstrapSlot = SessionState["config"]["bootstrapRevealOrder"][number];

export function bootstrapSlotToCoordKey(slot: BootstrapSlot): CoordKey {
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

export function initMapForSession(
  state: SessionState,
  intent: Extract<DomainIntent, { type: "domain/start_session" }>
): SessionState {
  const centerKey = toCoordKey({ x: 0, y: 0 });
  const deck = intent.initialDeck ?? {
    drawPile: [...state.deck.drawPile],
    discardPile: [...state.deck.discardPile],
  };

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

export function applyBootstrapReveal(state: SessionState, atMs: number): SessionState {
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

  const revealed = {
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

  return appendLog(revealed, {
    atMs,
    level: "info",
    message: "Bootstrap reveal complete (C/N/E/S/W).",
    meta: { currentPlaneId: withDistances[centerKey]?.planeId ?? null },
  });
}

export function setEligibleMoves(state: SessionState): SessionState {
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

export function applyMapPostMove(state: SessionState, atMs: number): SessionState {
  const pending = state.fsm.context?.pendingMove;
  if (!pending) return state;

  const partyCoord = pending.toCoord;

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
  });

  const ensuredTwice = state.config.ensurePlusEnabled
    ? ensurePlusBounded({
        tilesByCoord: decayed.tilesByCoord,
        partyCoord,
        radius: state.config.decayDistance,
        atMs,
      }).tilesByCoord
    : decayed.tilesByCoord;

  const withDistances = withDistancesFromParty(ensuredTwice, partyCoord);
  const currentPlaneId = withDistances[partyCoord]?.planeId;

  const mapped = {
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

  return appendLog(mapped, {
    atMs,
    level: "info",
    message: "Movement completed.",
    meta: {
      toCoord: partyCoord,
      decayRemoved: decayed.removed.length,
    },
  });
}

