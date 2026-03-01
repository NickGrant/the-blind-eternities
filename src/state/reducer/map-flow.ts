import { DOMAIN_INTENT, type DomainIntent } from "../intents.types";
import type { CoordKey, SessionState } from "../session.types";
import { neighborsCardinal, parseCoordKey, toCoordKey } from "../map/coord";
import {
  applyDecay,
  createTile,
  ensurePlusBounded,
  stubPlaneIdForCoord,
  withDistancesFromParty,
} from "../map/map-model";
import { drawPlanes, shuffleDeterministic } from "../deck/deck-model";
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
  intent: Extract<DomainIntent, { type: typeof DOMAIN_INTENT.START_SESSION }>
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

  const gameMode = intent.gameMode ?? state.config.gameMode;
  const ensured = state.config.ensurePlusEnabled && gameMode === "BLIND_ETERNITIES"
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
    config: {
      ...state.config,
      gameMode,
    },
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

  const center = revealedTiles[centerKey];
  if (center) {
    revealedTiles[centerKey] = {
      ...center,
      isFaceUp: true,
      revealedAtMs: atMs,
    };
  }

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
    message: "Bootstrap reveal complete (center tile only).",
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
        radius: 0,
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
        radius: 0,
        atMs,
      }).tilesByCoord
    : decayed.tilesByCoord;

  const revealedDestination = { ...ensuredTwice };
  const destinationTile = revealedDestination[partyCoord];
  if (destinationTile) {
    revealedDestination[partyCoord] = {
      ...destinationTile,
      isFaceUp: true,
      revealedAtMs: atMs,
    };
  }

  const placeholders = Object.entries(revealedDestination)
    .filter(([, tile]) => tile.planeId.startsWith("plane@"))
    .map(([coordKey]) => coordKey)
    .sort(compareCoordKeys);
  const dealt = drawPlanesWithRecycle({
    drawPile: state.deck.drawPile,
    discardPile: state.deck.discardPile,
    count: placeholders.length,
    atMs,
    seed: state.rng.seed,
  });
  const withAssignedPlanes = { ...revealedDestination };
  placeholders.forEach((coordKey, index) => {
    const tile = withAssignedPlanes[coordKey];
    const assigned = dealt.drawn[index];
    if (!tile || !assigned) return;
    withAssignedPlanes[coordKey] = {
      ...tile,
      planeId: assigned,
    };
  });

  const withDistances = withDistancesFromParty(withAssignedPlanes, partyCoord);
  const currentPlaneId = withDistances[partyCoord]?.planeId;
  const discardedByDecay = decayed.removed
    .map((coordKey) => state.map.tilesByCoord[coordKey]?.planeId)
    .filter((planeId): planeId is string => typeof planeId === "string" && planeId.length > 0);

  const mapped = {
    ...state,
    deck: {
      ...state.deck,
      drawPile: [...dealt.drawPile],
      discardPile: [...dealt.discardPile, ...discardedByDecay],
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

export function applyRegularPlaneswalk(state: SessionState, atMs: number): SessionState {
  const current = state.deck.currentPlaneId;
  const nextDeck = drawPlanesWithRecycle({
    drawPile: state.deck.drawPile,
    discardPile: current ? [...state.deck.discardPile, current] : state.deck.discardPile,
    count: 1,
    atMs,
    seed: state.rng.seed,
  });
  const nextPlaneId = nextDeck.drawn[0] ?? current;
  if (!nextPlaneId) return state;

  const centerKey = "0,0";
  const center = state.map.tilesByCoord[centerKey] ?? createTile({
    coordKey: centerKey,
    planeId: nextPlaneId,
    atMs,
    isFaceUp: true,
  });

  const tilesByCoord = {
    [centerKey]: {
      ...center,
      planeId: nextPlaneId,
      isFaceUp: true,
      revealedAtMs: atMs,
    },
  };

  const mapped = {
    ...state,
    deck: {
      ...state.deck,
      drawPile: [...nextDeck.drawPile],
      discardPile: [...nextDeck.discardPile],
      currentPlaneId: nextPlaneId,
    },
    map: {
      ...state.map,
      tilesByCoord,
      partyCoord: centerKey,
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
    message: "Regular Planechase planeswalk resolved.",
    meta: {
      currentPlaneId: nextPlaneId,
    },
  });
}

function compareCoordKeys(a: CoordKey, b: CoordKey): number {
  const ca = parseCoordKey(a);
  const cb = parseCoordKey(b);
  if (ca.y !== cb.y) return ca.y - cb.y;
  return ca.x - cb.x;
}

function drawPlanesWithRecycle(args: {
  drawPile: readonly string[];
  discardPile: readonly string[];
  count: number;
  atMs: number;
  seed?: string;
}): { drawn: string[]; drawPile: string[]; discardPile: string[] } {
  const needed = Math.max(0, args.count);
  let drawPile = [...args.drawPile];
  let discardPile = [...args.discardPile];
  const drawn: string[] = [];

  while (drawn.length < needed) {
    const take = drawPlanes(drawPile, needed - drawn.length);
    drawn.push(...take.drawn);
    drawPile = [...take.drawPile];
    if (drawn.length >= needed) break;
    if (discardPile.length === 0) break;

    drawPile = shuffleDeterministic(
      discardPile,
      `${args.seed ?? ""}|recycle|${args.atMs}|${drawn.length}`
    );
    discardPile = [];
  }

  return { drawn, drawPile, discardPile };
}
