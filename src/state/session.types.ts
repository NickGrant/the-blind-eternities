export type CoordKey = string;

export type SessionState = {
  meta: {
    version: number;
    createdAtMs: number;
    sessionId: string;
  };

  fsm: {
    state:
      | "SETUP"
      | "BOOTSTRAP_REVEAL"
      | "IDLE"
      | "ROLLING"
      | "AWAIT_MOVE"
      | "CONFIRM_MOVE"
      | "MOVING"
      | "MODAL_OPEN"
      | "ERROR";

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
  };

  rng: {
    seed?: string;
    rollCount: number;
  };

  deck: {
    drawPile: string[];
    discardPile: string[];
    currentPlaneId?: string;

    phenomenonGate?: {
      isResolving: boolean;
      sourcePlaneId?: string;
    };
  };

  map: {
    tilesByCoord: Record<CoordKey, MapTile>;
    partyCoord?: CoordKey;

    highlights?: {
      eligibleMoveCoords: CoordKey[];
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
  resumeToState?: SessionState["fsm"]["state"];
};

export type LogEntry = {
  id: string;
  atMs: number;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};
