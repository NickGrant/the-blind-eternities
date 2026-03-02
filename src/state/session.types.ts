export type CoordKey = string;

export type FsmState =
  | "SETUP"
  | "BOOTSTRAP_REVEAL"
  | "IDLE"
  | "ROLLING"
  | "AWAIT_MOVE"
  | "CONFIRM_MOVE"
  | "MOVING"
  | "MODAL_OPEN"
  | "ERROR";

export type GameMode = "BLIND_ETERNITIES" | "REGULAR_PLANECHASE";
export type RulesProfile = "BLIND_FOG_OF_WAR" | "BLIND_CLASSIC_PLUS" | "REGULAR_STANDARD";
export type FogOfWarDistance = 0 | 1;
export type CardKind = "PLANE" | "PHENOMENON" | "UNKNOWN";

export type SessionState = {
  meta: {
    version: number;
    createdAtMs: number;
    sessionId: string;
  };

  fsm: {
    state: FsmState;

    context?: {
      lastIntent?: {
        type: string;
        atMs: number;
      };

      pendingMove?: {
        fromCoord: CoordKey;
        toCoord: CoordKey;
      };

      error?: {
        code: string;
        detail?: string;
      };
    };
  };

  config: {
    decayDistance: number;
    bootstrapRevealOrder: ("C" | "N" | "E" | "S" | "W")[];
    ensurePlusEnabled: boolean;
    gameMode: GameMode;
    fogOfWarDistance: FogOfWarDistance;
    rulesProfile?: RulesProfile;
    enableHellride?: boolean;
    enableAntiStall?: boolean;
  };

  rng: {
    seed?: string;
    rollCount: number;
  };

  deck: {
    drawPile: string[];
    discardPile: string[];
    currentPlaneId?: string;
    cardTypesById?: Record<string, CardKind>;

    phenomenonGate?: {
      isResolving: boolean;
      sourcePlaneId?: string;
    };
  };

  map: {
    tilesByCoord: Record<CoordKey, MapTile>;
    partyCoord?: CoordKey;
    previousPartyCoord?: CoordKey;

    highlights?: {
      eligibleMoveCoords: CoordKey[];
      hellrideMoveCoords?: CoordKey[];
    };
  };

  modal: {
    active?: ModalDescriptor;
    queue: ModalDescriptor[];
    isOpen: boolean;
  };

  log: {
    entries: LogEntry[];
  };

  ui: {
    camera?: {
      zoom: number;
      panX: number;
      panY: number;
    };

    selections?: {
      hoveredCoord?: CoordKey;
      selectedCoord?: CoordKey;
    };
  };
};

export type MapTile = {
  coord: { x: number; y: number };
  planeId: string;
  revealedAtMs: number;
  isFaceUp: boolean;
  distanceFromParty?: number;
};

export type ModalDescriptor = {
  id: string;
  type: "PLANE" | "PHENOMENON" | "ERROR" | "CONFIRM_MOVE";
  planeId?: string;
  title?: string;
  body?: string;
  resumeToState?: FsmState;
};

export type LogEntry = {
  id: string;
  atMs: number;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};
