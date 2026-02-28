import Phaser from "phaser";
import type { CoordKey, SessionState } from "../../state/session.types";
import { coordToWorld, isConfirmSelectionTile, isSelectableTile, type ViewportConfig } from "./map-rendering";

type SceneDeps = {
  onSelectPlane: (coordKey: CoordKey) => void;
  onConfirmMove?: () => void;
  onInspectPlane?: (planeId: string) => void;
  getPlaneName?: (planeId: string | undefined) => string | undefined;
  getPlaneArtUrl?: (planeId: string | undefined) => string | undefined;
};

export class MapScene extends Phaser.Scene {
  private readonly deps: SceneDeps;
  private lastState: SessionState | null = null;
  private lastPartyCoord: CoordKey | null = null;
  private cameraOffset = { x: 0, y: 0 };
  private dragPointerId: number | null = null;
  private dragLast = { x: 0, y: 0 };
  private dragDistance = 0;
  private lastTap = { atMs: 0, coordKey: "" };
  private focusedCoordKey: CoordKey | null = null;
  private readonly renderObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly artTextureByUrl = new Map<string, string>();
  private readonly pendingArtLoads = new Set<string>();
  private background?: Phaser.GameObjects.TileSprite;
  private readonly viewport: ViewportConfig = {
    originX: 0,
    originY: 0,
    tileWidth: 195,
    tileHeight: 117,
    gapX: 22,
    gapY: 16,
  };

  constructor(deps: SceneDeps) {
    super({ key: "MapScene" });
    this.deps = deps;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x111111);
    this.ensureGraniteTexture();
    this.setupBackground();
    this.setupCameraControls();
    this.scale.on("resize", this.onResize, this);
    this.renderFromState();
    this.centerCamera();
  }

  setSessionState(state: SessionState): void {
    if (this.lastState === state) return;
    const partyChanged = this.lastPartyCoord !== (state.map.partyCoord ?? null);
    if (partyChanged) {
      this.cameraOffset = { x: 0, y: 0 };
      this.focusedCoordKey = null;
    }
    this.lastPartyCoord = state.map.partyCoord ?? null;
    this.lastState = state;
    this.renderFromState();
    this.centerCamera();
  }

  private renderFromState(): void {
    if (!this.sys?.isActive()) return;

    this.clearRenderedObjects();
    this.setupBackground();

    const state = this.lastState;
    if (!state) return;

    const partyCoord = state.map.partyCoord;
    const entries = Object.entries(state.map.tilesByCoord);
    if (entries.length === 0) return;

    entries.forEach(([coordKey, tile]) => {
      const world = coordToWorld(tile.coord, this.viewport);
      const isParty = coordKey === partyCoord;
      const isFaceUp = tile.isFaceUp;
      const selectable = isSelectableTile(state, coordKey);
      const confirmSelection = isConfirmSelectionTile(state, coordKey);
      const stroke = selectable || confirmSelection ? 0xffd166 : isParty ? 0x6eb8ff : 0x8b96a8;

      const frame = this.add
        .rectangle(world.x, world.y, this.viewport.tileWidth, this.viewport.tileHeight, 0x0b111b, 0.96)
        .setStrokeStyle(selectable ? 4 : 3, stroke, 1);

      const art = this.renderCardFace({
        x: world.x,
        y: world.y,
        planeId: tile.planeId,
        isFaceUp,
      });

      frame.setInteractive({ useHandCursor: true });
      frame.on("pointerup", () => {
          if (this.dragDistance > 6) return;
          if (confirmSelection) {
            this.deps.onConfirmMove?.();
            return;
          }
          if (selectable) {
            this.deps.onSelectPlane(coordKey);
            return;
          }
          if (tile.isFaceUp && this.shouldInspect(coordKey, state.fsm.state)) {
            this.focusedCoordKey = coordKey;
            this.centerCamera();
            this.deps.onInspectPlane?.(tile.planeId);
          }
      });

      this.renderObjects.push(frame, ...art);
    });
  }

  private renderCardFace(args: {
    x: number;
    y: number;
    planeId: string;
    isFaceUp: boolean;
  }): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const artWidth = this.viewport.tileWidth - 12;
    const artHeight = this.viewport.tileHeight - 28;
    const nameY = args.y + this.viewport.tileHeight / 2 - 12;

    if (!args.isFaceUp) {
      const back = this.add.rectangle(args.x, args.y, artWidth, artHeight, 0x1f2937, 0.9);
      back.setStrokeStyle(1, 0x566178, 1);
      objects.push(back);
      return objects;
    }

    const artTexture = this.resolveArtTexture(args.planeId);
    if (artTexture) {
      objects.push(this.add.image(args.x, args.y - 8, artTexture).setDisplaySize(artWidth, artHeight));
    } else {
      objects.push(this.add.rectangle(args.x, args.y - 8, artWidth, artHeight, 0x2a3444, 0.88));
    }

    const name = this.resolvePlaneName(args.planeId);
    const label = this.add.text(args.x, nameY, name, {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#f5f7fb",
      align: "center",
      wordWrap: { width: artWidth - 10, useAdvancedWrap: true },
    });
    label.setOrigin(0.5, 1);
    objects.push(label);

    return objects;
  }

  private resolvePlaneName(planeId: string): string {
    const fromCatalog = this.deps.getPlaneName?.(planeId)?.trim();
    if (fromCatalog) return fromCatalog;

    const base = planeId.startsWith("plane-") ? planeId.slice("plane-".length) : planeId;
    return base
      .split("-")
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }

  private resolveArtTexture(planeId: string): string | undefined {
    const raw = this.deps.getPlaneArtUrl?.(planeId)?.trim();
    if (!raw) return undefined;

    const candidates = this.expandArtCandidates(raw);
    for (const candidate of candidates) {
      const knownKey = this.artTextureByUrl.get(candidate);
      if (knownKey && this.textures.exists(knownKey)) return knownKey;
    }
    for (const candidate of candidates) {
      if (this.pendingArtLoads.has(candidate)) return undefined;
    }

    const textureKey = `plane-art-${this.artTextureByUrl.size + 1}`;
    this.tryLoadArtCandidate(textureKey, candidates, 0);

    return undefined;
  }

  private tryLoadArtCandidate(textureKey: string, candidates: string[], index: number): void {
    if (index >= candidates.length) return;

    const candidate = candidates[index];
    this.artTextureByUrl.set(candidate, textureKey);
    this.pendingArtLoads.add(candidate);

    const cleanup = () => {
      this.load.off(`filecomplete-image-${textureKey}`, onComplete);
      this.load.off("loaderror", onError);
    };

    const onComplete = () => {
      cleanup();
      this.pendingArtLoads.delete(candidate);
      this.renderFromState();
    };

    const onError = (file: { key?: string }) => {
      if (file?.key !== textureKey) return;
      cleanup();
      this.pendingArtLoads.delete(candidate);
      this.tryLoadArtCandidate(textureKey, candidates, index + 1);
    };

    this.load.on(`filecomplete-image-${textureKey}`, onComplete);
    this.load.on("loaderror", onError);
    this.load.image(textureKey, candidate);
    if (!this.load.isLoading()) this.load.start();
  }

  private expandArtCandidates(url: string): string[] {
    const trimmed = url.trim();
    if (trimmed.length === 0) return [];
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return [trimmed];
    const out: string[] = [];
    const push = (value: string) => {
      if (!value || out.includes(value)) return;
      out.push(value);
    };

    const relative = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    const absoluteFromBase = new URL(relative, document.baseURI).toString();
    push(absoluteFromBase);
    push(relative);
    push(trimmed);

    const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
    if (firstSegment && relative.startsWith("assets/")) {
      push(`/${firstSegment}/${relative}`);
    }

    if (relative.startsWith("assets/")) {
      push(`/${relative}`);
    }

    return out;
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
      this.focusedCoordKey = null;
      this.cameraOffset.x -= dx;
      this.cameraOffset.y -= dy;
      this.centerCamera();
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.dragPointerId !== pointer.id) return;
      this.dragPointerId = null;
      this.dragLast = { x: 0, y: 0 };
      this.dragDistance = 0;
    });
  }

  private centerCamera(): void {
    const state = this.lastState;
    if (!state) return;

    if (this.focusedCoordKey) {
      const focusedTile = state.map.tilesByCoord[this.focusedCoordKey];
      if (focusedTile) {
        const focusedWorld = coordToWorld(focusedTile.coord, this.viewport);
        this.cameras.main.centerOn(focusedWorld.x, focusedWorld.y);
        this.updateBackgroundScroll();
        return;
      }
      this.focusedCoordKey = null;
    }

    const partyCoord = state.map.partyCoord;
    if (!partyCoord) return;

    const partyTile = state.map.tilesByCoord[partyCoord];
    if (!partyTile) return;

    const world = coordToWorld(partyTile.coord, this.viewport);
    this.cameras.main.centerOn(world.x + this.cameraOffset.x, world.y + this.cameraOffset.y);
    this.updateBackgroundScroll();
  }

  private ensureGraniteTexture(): void {
    if (this.textures.exists("granite-soft")) return;

    const graphics = this.add.graphics();
    graphics.fillStyle(0xb8bdc6, 1);
    graphics.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 420; i += 1) {
      const shade = 0xa7adb8 + ((i * 37) % 0x14);
      const x = (i * 31) % 256;
      const y = (i * 47) % 256;
      const w = 2 + (i % 5);
      const h = 2 + ((i * 3) % 5);
      graphics.fillStyle(shade, 0.18);
      graphics.fillEllipse(x, y, w, h);
    }

    graphics.generateTexture("granite-soft", 256, 256);
    graphics.destroy();
  }

  private setupBackground(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    if (!this.background) {
      this.background = this.add.tileSprite(0, 0, w, h, "granite-soft").setOrigin(0, 0);
      this.background.setScrollFactor(0, 0);
      this.background.setDepth(-10);
    } else {
      this.background.setSize(w, h);
    }
    this.updateBackgroundScroll();
  }

  private updateBackgroundScroll(): void {
    if (!this.background) return;
    const cam = this.cameras.main;
    this.background.tilePositionX = cam.scrollX * 0.15;
    this.background.tilePositionY = cam.scrollY * 0.15;
  }

  private onResize(): void {
    this.setupBackground();
    this.centerCamera();
  }

  private clearRenderedObjects(): void {
    while (this.renderObjects.length > 0) {
      const obj = this.renderObjects.pop();
      obj?.destroy();
    }
  }

  private shouldInspect(coordKey: CoordKey, fsmState: SessionState["fsm"]["state"]): boolean {
    if (fsmState === "AWAIT_MOVE" || fsmState === "CONFIRM_MOVE" || fsmState === "MOVING") return false;
    const now = Date.now();
    const isDoubleTap = this.lastTap.coordKey === coordKey && now - this.lastTap.atMs <= 350;
    this.lastTap = { coordKey, atMs: now };
    return isDoubleTap;
  }
}
