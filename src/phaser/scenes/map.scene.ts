import Phaser from "phaser";
import type { CoordKey, SessionState } from "../../state/session.types";
import { coordToWorld, isSelectableTile, type ViewportConfig } from "./map-rendering";

type SceneDeps = {
  onSelectPlane: (coordKey: CoordKey) => void;
};

export class MapScene extends Phaser.Scene {
  private readonly deps: SceneDeps;
  private lastState: SessionState | null = null;
  private readonly renderObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly viewport: ViewportConfig = {
    originX: 360,
    originY: 230,
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
    this.renderFromState();
  }

  setSessionState(state: SessionState): void {
    this.lastState = state;
    this.renderFromState();
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
          this.deps.onSelectPlane(coordKey);
        });
      }

      this.renderObjects.push(rect, label, coordLabel);
    });
  }

  private shortLabel(planeId: string): string {
    if (!planeId) return "(empty)";
    const rest = planeId.includes("-") ? planeId.split("-").slice(1).join("-") : planeId;
    return rest.length > 16 ? `${rest.slice(0, 16)}…` : rest;
  }

  private addStaticLegend(): void {
    this.renderObjects.push(
      this.add.text(12, 12, "Blind Eternities — Milestone 5", {
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

