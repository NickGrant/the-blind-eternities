import type { CoordKey, SessionState } from "../../state/session.types";

export type ViewportConfig = {
  originX: number;
  originY: number;
  tileWidth: number;
  tileHeight: number;
  gapX: number;
  gapY: number;
};

export function coordToWorld(
  coord: { x: number; y: number },
  viewport: ViewportConfig
): { x: number; y: number } {
  return {
    x: viewport.originX + coord.x * (viewport.tileWidth + viewport.gapX),
    y: viewport.originY + coord.y * (viewport.tileHeight + viewport.gapY),
  };
}

export function isSelectableTile(state: SessionState, coordKey: CoordKey): boolean {
  if (state.fsm.state !== "AWAIT_MOVE") return false;
  const eligible = state.map.highlights?.eligibleMoveCoords ?? [];
  return eligible.includes(coordKey);
}

export function isConfirmSelectionTile(state: SessionState, coordKey: CoordKey): boolean {
  if (state.fsm.state !== "CONFIRM_MOVE") return false;
  return state.ui.selections?.selectedCoord === coordKey;
}

export function canInspectTiles(state: SessionState): boolean {
  return state.fsm.state !== "AWAIT_MOVE" && state.fsm.state !== "CONFIRM_MOVE" && state.fsm.state !== "MOVING";
}

export function isInteractiveTile(state: SessionState, coordKey: CoordKey, isFaceUp: boolean): boolean {
  if (isSelectableTile(state, coordKey) || isConfirmSelectionTile(state, coordKey)) return true;
  if (!isFaceUp) return false;
  return canInspectTiles(state);
}
