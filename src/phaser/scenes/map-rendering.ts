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

