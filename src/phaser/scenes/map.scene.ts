import Phaser from "phaser";
import type { CoordKey, SessionState } from "../../state/session.types";
import { coordToWorld, isSelectableTile, type ViewportConfig } from "./map-rendering";

type SceneDeps = {
  onSelectPlane: (coordKey: CoordKey) => void;
};

export class MapScene extends Phaser.Scene {
  private readonly deps: SceneDeps;
  private lastState: SessionState | null = null;
  private lastPartyCoord: CoordKey | null = null;
  private cameraOffset = { x: 0, y: 0 };
  private dragPointerId: number | null = null;
  private dragLast = { x: 0, y: 0 };
  private dragDistance = 0;
  private readonly renderObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly viewport: ViewportConfig = {
    originX: 0,
    originY: 0,
    tileWidth: 130,
    tileHeight: 78,
    gapX: 22,
    gapY: 16,
  };

  constructor(deps: SceneDeps) {
    super({ key: "MapScene" });
    this.deps = deps;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x111111);
    this.setupCameraControls();
    this.renderFromState();
    this.centerCameraOnParty();
  }

  setSessionState(state: SessionState): void {
    if (this.lastState === state) return;
    const partyChanged = this.lastPartyCoord !== (state.map.partyCoord ?? null);
    if (partyChanged) {
      this.cameraOffset = { x: 0, y: 0 };
    }
    this.lastPartyCoord = state.map.partyCoord ?? null;
    this.lastState = state;
    this.renderFromState();
    this.centerCameraOnParty();
  }

  private renderFromState(): void {
    if (!this.sys?.isActive()) return;

    this.clearRenderedObjects();

    this.addStaticLegend();

    const state = this.lastState;
    if (!state) return;

    const partyCoord = state.map.partyCoord;
    const entries = Object.entries(state.map.tilesByCoord);
    if (entries.length === 0) {
      this.renderObjects.push(
        this.add.text(14, 44, "Start a session to render map tiles.", {
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          color: "#b8c0cc",
        })
      );
      return;
    }

    entries.forEach(([coordKey, tile]) => {
      const world = coordToWorld(tile.coord, this.viewport);
      const isParty = coordKey === partyCoord;
      const isFaceUp = tile.isFaceUp;
      const selectable = isSelectableTile(state, coordKey);

      const fill = isParty ? 0x2f6fed : isFaceUp ? 0x1f2937 : 0x3c4453;
      const stroke = selectable ? 0xffd166 : 0x76839a;
      const alpha = selectable ? 0.95 : 0.85;

      const rect = this.add
        .rectangle(world.x, world.y, this.viewport.tileWidth, this.viewport.tileHeight, fill, alpha)
        .setStrokeStyle(selectable ? 3 : 2, stroke, 1);

      const label = this.add.text(world.x, world.y, this.shortLabel(tile.planeId), {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#f5f7fb",
        align: "center",
      });
      label.setOrigin(0.5);

      const coordLabel = this.add.text(
        world.x,
        world.y + this.viewport.tileHeight / 2 - 13,
        coordKey,
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: selectable ? "#ffd166" : "#c5cedb",
          align: "center",
        }
      );
      coordLabel.setOrigin(0.5);

      if (selectable) {
        rect.setInteractive({ useHandCursor: true });
        rect.on("pointerup", () => {
          if (this.dragDistance > 6) return;
          this.deps.onSelectPlane(coordKey);
        });
      }

      this.renderObjects.push(rect, label, coordLabel);
    });
  }

  private setupCameraControls(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragPointerId = pointer.id;
      this.dragLast = { x: pointer.x, y: pointer.y };
      this.dragDistance = 0;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      if (this.dragPointerId !== pointer.id) return;

      const dx = pointer.x - this.dragLast.x;
      const dy = pointer.y - this.dragLast.y;
      if (dx === 0 && dy === 0) return;

      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      this.dragLast = { x: pointer.x, y: pointer.y };
      this.cameraOffset.x -= dx;
      this.cameraOffset.y -= dy;
      this.centerCameraOnParty();
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.dragPointerId !== pointer.id) return;
      this.dragPointerId = null;
      this.dragLast = { x: 0, y: 0 };
      this.dragDistance = 0;
    });
  }

  private centerCameraOnParty(): void {
    const state = this.lastState;
    const partyCoord = state?.map.partyCoord;
    if (!state || !partyCoord) return;

    const partyTile = state.map.tilesByCoord[partyCoord];
    if (!partyTile) return;

    const world = coordToWorld(partyTile.coord, this.viewport);
    this.cameras.main.centerOn(world.x + this.cameraOffset.x, world.y + this.cameraOffset.y);
  }

  private shortLabel(planeId: string): string {
    if (!planeId) return "(empty)";
    const rest = planeId.includes("-") ? planeId.split("-").slice(1).join("-") : planeId;
    return rest.length > 16 ? `${rest.slice(0, 16)}...` : rest;
  }

  private addStaticLegend(): void {
    this.renderObjects.push(
      this.add.text(12, 12, "Blind Eternities - Milestone 5", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#ffffff",
      })
    );
    this.renderObjects.push(
      this.add.text(12, 30, "Blue: party | Gold border: selectable move", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#a7b2c2",
      })
    );
  }

  private clearRenderedObjects(): void {
    while (this.renderObjects.length > 0) {
      const obj = this.renderObjects.pop();
      obj?.destroy();
    }
  }
}
