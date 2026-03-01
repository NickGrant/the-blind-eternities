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
type FogOfWarDistance = SessionState["config"]["fogOfWarDistance"];
type Coord = { x: number; y: number };

function getFogOfWarDistance(state: SessionState): FogOfWarDistance {
  return state.config.fogOfWarDistance === 1 ? 1 : 0;
}

function resolveFogOfWarDistance(args: {
  gameMode: SessionState["config"]["gameMode"];
  requested: number | undefined;
  current: number | undefined;
}): FogOfWarDistance {
  if (args.gameMode === "REGULAR_PLANECHASE") return 0;
  if (args.requested === 1) return 1;
  if (args.requested === 0) return 0;
  if (args.current === 1) return 1;
  return 0;
}

function revealOrderForDistance(distance: FogOfWarDistance): SessionState["config"]["bootstrapRevealOrder"] {
  if (distance === 1) return ["C", "N", "E", "S", "W"];
  return ["C"];
}

function neighborsDiagonal(coord: Coord): Coord[] {
  return [
    { x: coord.x - 1, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y + 1 },
    { x: coord.x - 1, y: coord.y + 1 },
  ];
}

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

  const fogOfWarDistance = resolveFogOfWarDistance({
    gameMode,
    requested: intent.fogOfWarDistance,
    current: state.config.fogOfWarDistance,
  });
  const bootstrapRevealOrder = revealOrderForDistance(fogOfWarDistance);
  const bootstrapCount = bootstrapRevealOrder.length;
  const dealt = drawPlanes(deck.drawPile, bootstrapCount);
  const withAssignedPlanes = { ...ensured };

  bootstrapRevealOrder.forEach((slot, index) => {
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

  const mapped = {
    ...state,
    config: {
      ...state.config,
      gameMode,
      fogOfWarDistance,
      bootstrapRevealOrder,
      enableHellride: gameMode === "BLIND_ETERNITIES",
      enableAntiStall: intent.enableAntiStall ?? state.config.enableAntiStall ?? false,
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
      previousPartyCoord: undefined,
      highlights: { eligibleMoveCoords: [], hellrideMoveCoords: [] },
    },
  };

  return appendLog(mapped, {
    atMs: intent.atMs,
    level: "info",
    message: "Session setup complete.",
    meta: {
      gameMode,
      fogOfWarDistance,
      selectedSetCount: intent.includedSetCodes?.length ?? 0,
      selectedSetCodes: intent.includedSetCodes?.join(",") ?? null,
    },
  });
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
      highlights: { eligibleMoveCoords: [], hellrideMoveCoords: [] },
    },
  };

  return appendLog(revealed, {
    atMs,
    level: "info",
    message: "Bootstrap reveal complete.",
    meta: {
      currentPlaneId: withDistances[centerKey]?.planeId ?? null,
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
      revealedCount: state.config.bootstrapRevealOrder.length,
    },
  });
}

export function setEligibleMoves(state: SessionState): SessionState {
  const partyCoord = state.map.partyCoord;
  if (!partyCoord) return state;
  const party = parseCoordKey(partyCoord);
  const antiStallBlockedCoord = state.config.enableAntiStall ? state.map.previousPartyCoord : undefined;
  const candidates = neighborsCardinal(party).map(toCoordKey);
  const eligible = candidates.filter((k) => Boolean(state.map.tilesByCoord[k]) && k !== antiStallBlockedCoord);
  const enableHellride = state.config.gameMode === "BLIND_ETERNITIES";
  const hellride: CoordKey[] = [];
  let tilesByCoord = state.map.tilesByCoord;

  if (enableHellride) {
    const nextTilesByCoord = { ...tilesByCoord };
    neighborsDiagonal(party).forEach((coord) => {
      const coordKey = toCoordKey(coord);
      const tile = tilesByCoord[coordKey];
      if (coordKey === antiStallBlockedCoord) return;
      if (tile?.isFaceUp) return;
      hellride.push(coordKey);
      if (tile) return;
      nextTilesByCoord[coordKey] = createTile({
        coordKey,
        planeId: stubPlaneIdForCoord(coordKey),
        atMs: state.fsm.context?.lastIntent?.atMs ?? state.meta.createdAtMs,
        isFaceUp: false,
      });
    });
    tilesByCoord = nextTilesByCoord;
  }

  return {
    ...state,
    map: {
      ...state.map,
      tilesByCoord,
      highlights: { eligibleMoveCoords: eligible, hellrideMoveCoords: hellride },
    },
  };
}

export function applyMapPostMove(state: SessionState, atMs: number): SessionState {
  const pending = state.fsm.context?.pendingMove;
  if (!pending) return state;

  const partyCoord = pending.toCoord;
  const wasHellrideMove = (state.map.highlights?.hellrideMoveCoords ?? []).includes(partyCoord);

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
  revealCardinalByFogDistance({
    tilesByCoord: revealedDestination,
    centerCoordKey: partyCoord,
    distance: getFogOfWarDistance(state),
    atMs,
  });

  const placeholders = Object.entries(revealedDestination)
    .filter(([, tile]) => tile.planeId.startsWith("plane@"))
    .map(([coordKey]) => coordKey)
    .sort(compareCoordKeys);
  let drawPile = [...state.deck.drawPile];
  let discardPile = [...state.deck.discardPile];
  const dealtDrawn: string[] = [];
  let phenomenonReplaceCount = 0;
  placeholders.forEach((_, idx) => {
    const take = drawNextPlaneWithPhenomenonReplace({
      drawPile,
      discardPile,
      atMs: atMs + idx,
      seed: state.rng.seed,
    });
    drawPile = take.drawPile;
    discardPile = take.discardPile;
    phenomenonReplaceCount += take.phenomenonReplaceCount;
    if (take.drawnPlaneId) dealtDrawn.push(take.drawnPlaneId);
  });
  const withAssignedPlanes = { ...revealedDestination };
  placeholders.forEach((coordKey, index) => {
    const tile = withAssignedPlanes[coordKey];
    const assigned = dealtDrawn[index];
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
      drawPile: [...drawPile],
      discardPile: [...discardPile, ...discardedByDecay],
      currentPlaneId,
    },
    map: {
      ...state.map,
      tilesByCoord: withDistances,
      partyCoord,
      previousPartyCoord: pending.fromCoord,
      highlights: { eligibleMoveCoords: [], hellrideMoveCoords: [] },
    },
    ui: {
      ...state.ui,
      selections: {
        ...(state.ui.selections ?? {}),
        selectedCoord: undefined,
      },
    },
  };

  let logged = appendLog(mapped, {
    atMs,
    level: "info",
    message: "Phase: move",
    meta: {
      phase: "move",
      phaseIndex: 1,
      toCoord: partyCoord,
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
    },
  });
  logged = appendLog(logged, {
    atMs: atMs + 1,
    level: "info",
    message: "Phase: board_fill",
    meta: {
      phase: "board_fill",
      phaseIndex: 2,
      assignedCount: placeholders.length,
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
    },
  });
  logged = appendLog(logged, {
    atMs: atMs + 2,
    level: "info",
    message: "Phase: phenomenon_resolve",
    meta: {
      phase: "phenomenon_resolve",
      phaseIndex: 3,
      phenomenonReplaceCount,
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
    },
  });
  return appendLog(logged, {
    atMs,
    level: "info",
    message: "Movement completed.",
    meta: {
      toCoord: partyCoord,
      decayRemoved: decayed.removed.length,
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
      phenomenonReplaceCount,
      phase: "finalize",
      phaseIndex: 4,
      antiStallEnabled: state.config.enableAntiStall === true,
      hellrideUsed: wasHellrideMove,
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
      previousPartyCoord: undefined,
      highlights: { eligibleMoveCoords: [], hellrideMoveCoords: [] },
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
      gameMode: state.config.gameMode,
      fogOfWarDistance: getFogOfWarDistance(state),
      hellrideUsed: false,
      phenomenonReplaceCount: 0,
    },
  });
}

function revealCardinalByFogDistance(args: {
  tilesByCoord: Record<CoordKey, SessionState["map"]["tilesByCoord"][CoordKey]>;
  centerCoordKey: CoordKey;
  distance: FogOfWarDistance;
  atMs: number;
}): void {
  if (args.distance <= 0) return;
  const center = parseCoordKey(args.centerCoordKey);
  neighborsCardinal(center).forEach((coord, idx) => {
    const coordKey = toCoordKey(coord);
    const tile = args.tilesByCoord[coordKey];
    if (!tile) {
      args.tilesByCoord[coordKey] = createTile({
        coordKey,
        planeId: stubPlaneIdForCoord(coordKey),
        atMs: args.atMs + idx + 1,
        isFaceUp: true,
      });
      return;
    }
    args.tilesByCoord[coordKey] = {
      ...tile,
      isFaceUp: true,
      revealedAtMs: args.atMs + idx + 1,
    };
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

function isPhenomenonCardId(cardId: string): boolean {
  return cardId.startsWith("phenomenon-");
}

function drawNextPlaneWithPhenomenonReplace(args: {
  drawPile: readonly string[];
  discardPile: readonly string[];
  atMs: number;
  seed?: string;
}): {
  drawnPlaneId?: string;
  drawPile: string[];
  discardPile: string[];
  phenomenonReplaceCount: number;
} {
  let drawPile = [...args.drawPile];
  let discardPile = [...args.discardPile];
  let phenomenonReplaceCount = 0;
  let attempts = 0;
  const attemptLimit = drawPile.length + discardPile.length + 4;

  while (attempts < attemptLimit) {
    attempts += 1;
    const take = drawPlanesWithRecycle({
      drawPile,
      discardPile,
      count: 1,
      atMs: args.atMs + attempts,
      seed: args.seed,
    });
    drawPile = take.drawPile;
    discardPile = take.discardPile;
    const cardId = take.drawn[0];
    if (!cardId) break;
    if (isPhenomenonCardId(cardId)) {
      discardPile = [...discardPile, cardId];
      phenomenonReplaceCount += 1;
      continue;
    }
    return { drawnPlaneId: cardId, drawPile, discardPile, phenomenonReplaceCount };
  }

  return { drawnPlaneId: undefined, drawPile, discardPile, phenomenonReplaceCount };
}
