import Phaser from "phaser";
import type { CoordKey, SessionState } from "../../state/session.types";
import {
  canInspectTiles,
  coordToWorld,
  isHellrideSelectableTile,
  isConfirmSelectionTile,
  isInteractiveTile,
  isSelectableTile,
  type ViewportConfig,
} from "./map-rendering";

type SceneDeps = {
  onSelectPlane: (coordKey: CoordKey) => void;
  onConfirmMove?: () => void;
  onInspectPlane?: (planeId: string) => void;
  getPlaneName?: (planeId: string | undefined) => string | undefined;
  getPlaneArtUrl?: (planeId: string | undefined) => string | undefined;
};

type MapThemeId = "phyrexian" | "neon-dynasty" | "lithomancy" | "halo-fountain";
type ThemePalette = {
  cameraBg: number;
  tileFill: number;
  idleStroke: number;
  partyStroke: number;
  selectionStroke: number;
  hellrideStroke: number;
  faceDownFill: number;
  faceDownStroke: number;
  faceUpFallbackFill: number;
  nameBackdropFill: number;
  nameBackdropStroke: number;
  nameText: string;
  zoomHudPanel: number;
  zoomHudText: string;
};

const THEME_PALETTES: Record<MapThemeId, ThemePalette> = {
  phyrexian: {
    cameraBg: 0x0d1315,
    tileFill: 0x111a1e,
    idleStroke: 0x7fa39a,
    partyStroke: 0xb6d6cf,
    selectionStroke: 0xe3ff7a,
    hellrideStroke: 0x7de0ff,
    faceDownFill: 0x1a252a,
    faceDownStroke: 0x516660,
    faceUpFallbackFill: 0x202f34,
    nameBackdropFill: 0x090f11,
    nameBackdropStroke: 0x3f5750,
    nameText: "#e7f4ed",
    zoomHudPanel: 0x091114,
    zoomHudText: "#d8f3e5",
  },
  "neon-dynasty": {
    cameraBg: 0x0f1230,
    tileFill: 0x121738,
    idleStroke: 0x8d7dff,
    partyStroke: 0x5bd2ff,
    selectionStroke: 0xff73d2,
    hellrideStroke: 0x54f8ff,
    faceDownFill: 0x20264e,
    faceDownStroke: 0x6b6bd8,
    faceUpFallbackFill: 0x242f63,
    nameBackdropFill: 0x0a1231,
    nameBackdropStroke: 0x3c5ace,
    nameText: "#f5f7ff",
    zoomHudPanel: 0x0a1130,
    zoomHudText: "#cbdbff",
  },
  lithomancy: {
    cameraBg: 0xf3e6cd,
    tileFill: 0xebd9b3,
    idleStroke: 0xb78a57,
    partyStroke: 0x835d36,
    selectionStroke: 0xd5902f,
    hellrideStroke: 0x6aa0d0,
    faceDownFill: 0xe4cfa2,
    faceDownStroke: 0xae8455,
    faceUpFallbackFill: 0xf0dfbf,
    nameBackdropFill: 0xe1c695,
    nameBackdropStroke: 0xa97d4b,
    nameText: "#3b2818",
    zoomHudPanel: 0xd9bf8f,
    zoomHudText: "#3f2a19",
  },
  "halo-fountain": {
    cameraBg: 0x082634,
    tileFill: 0x0d3341,
    idleStroke: 0x70c5cc,
    partyStroke: 0xb7f2f3,
    selectionStroke: 0x95ffd4,
    hellrideStroke: 0x84d8ff,
    faceDownFill: 0x123c4d,
    faceDownStroke: 0x58a8b0,
    faceUpFallbackFill: 0x185165,
    nameBackdropFill: 0x062a35,
    nameBackdropStroke: 0x4a9ea5,
    nameText: "#e4ffff",
    zoomHudPanel: 0x082a37,
    zoomHudText: "#ccf6ff",
  },
};

export class MapScene extends Phaser.Scene {
  private readonly deps: SceneDeps;
  private lastState: SessionState | null = null;
  private lastPartyCoord: CoordKey | null = null;
  private cameraOffset = { x: 0, y: 0 };
  private dragPointerId: number | null = null;
  private dragLast = { x: 0, y: 0 };
  private dragDistance = 0;
  private focusedCoordKey: CoordKey | null = null;
  private readonly tilesByCoord = new Map<
    CoordKey,
    {
      signature: string;
      objects: Phaser.GameObjects.GameObject[];
    }
  >();
  private readonly artTextureByUrl = new Map<string, string>();
  private readonly pendingArtLoads = new Set<string>();
  private background?: Phaser.GameObjects.TileSprite;
  private activeThemeId: MapThemeId = "phyrexian";
  private palette: ThemePalette = THEME_PALETTES.phyrexian;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 1.5;
  private readonly zoomStep = 0.1;
  private uiZoom = 1;
  private pinchStartDistance: number | null = null;
  private pinchStartZoom = 1;
  private zoomHud?: {
    panel: Phaser.GameObjects.Rectangle;
    zoomOut: Phaser.GameObjects.Text;
    zoomIn: Phaser.GameObjects.Text;
    label: Phaser.GameObjects.Text;
  };
  private readonly baseViewport = {
    tileWidth: 390,
    tileHeight: 234,
    gapX: 44,
    gapY: 32,
  };
  private readonly viewport: ViewportConfig = {
    originX: 0,
    originY: 0,
    tileWidth: this.baseViewport.tileWidth,
    tileHeight: this.baseViewport.tileHeight,
    gapX: this.baseViewport.gapX,
    gapY: this.baseViewport.gapY,
  };

  constructor(deps: SceneDeps) {
    super({ key: "MapScene" });
    this.deps = deps;
  }

  create(): void {
    this.syncTheme(true);
    this.updateViewportForZoom(this.uiZoom);
    this.setupBackground();
    this.setupZoomHud();
    this.setupCameraControls();
    this.scale.on("resize", this.onResize, this);
    this.renderFromState();
    this.centerCamera();
  }

  override update(): void {
    this.syncTheme();
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

    const state = this.lastState;
    if (!state) {
      this.clearRenderedObjects();
      return;
    }

    const partyCoord = state.map.partyCoord;
    const entries = Object.entries(state.map.tilesByCoord);
    const expected = new Set(entries.map(([coordKey]) => coordKey));
    for (const coordKey of [...this.tilesByCoord.keys()]) {
      if (expected.has(coordKey)) continue;
      this.destroyTile(coordKey);
    }

    entries.forEach(([coordKey, tile]) => {
      const world = coordToWorld(tile.coord, this.viewport);
      const isParty = coordKey === partyCoord;
      const isFaceUp = tile.isFaceUp;
      const selectable = isSelectableTile(state, coordKey);
      const hellrideSelectable = isHellrideSelectableTile(state, coordKey);
      const confirmSelection = isConfirmSelectionTile(state, coordKey);
      const stroke = selectable || confirmSelection
        ? this.palette.selectionStroke
        : hellrideSelectable
          ? this.palette.hellrideStroke
        : isParty
          ? this.palette.partyStroke
          : this.palette.idleStroke;
      const signature = this.getTileSignature({
        coordKey,
        planeId: tile.planeId,
        art: this.getArtSignature(tile.planeId, isFaceUp),
        theme: this.activeThemeId,
        zoom: this.uiZoom,
        x: world.x,
        y: world.y,
        isFaceUp,
        selectable,
        hellrideSelectable,
        confirmSelection,
        isParty,
      });
      const existing = this.tilesByCoord.get(coordKey);
      if (existing?.signature === signature) return;
      if (existing) this.destroyTile(coordKey);

      const frame = this.add
        .rectangle(world.x, world.y, this.viewport.tileWidth, this.viewport.tileHeight, this.palette.tileFill, 0.96)
        .setStrokeStyle(selectable || hellrideSelectable ? 4 : 3, stroke, 1);

      const art = this.renderCardFace({
        x: world.x,
        y: world.y,
        planeId: tile.planeId,
        isFaceUp,
      });

      if (isInteractiveTile(state, coordKey, tile.isFaceUp)) {
        frame.setInteractive({ useHandCursor: true });
      } else {
        frame.disableInteractive();
      }

      frame.on("pointerup", () => {
        if (this.dragDistance > 6) return;
        const latest = this.lastState;
        if (!latest) return;
        const latestTile = latest.map.tilesByCoord[coordKey];
        if (!latestTile) return;

        const canConfirm = isConfirmSelectionTile(latest, coordKey);
        const canSelect = isSelectableTile(latest, coordKey);
        const canHellrideSelect = isHellrideSelectableTile(latest, coordKey);
        if (canConfirm) {
          this.deps.onConfirmMove?.();
          return;
        }
        if (canSelect || canHellrideSelect) {
          this.deps.onSelectPlane(coordKey);
          return;
        }
        if (latestTile.isFaceUp && canInspectTiles(latest)) {
          if (this.focusedCoordKey !== coordKey) {
            this.focusedCoordKey = coordKey;
            this.centerCamera();
            return;
          }
          this.focusedCoordKey = coordKey;
          this.centerCamera();
          this.deps.onInspectPlane?.(latestTile.planeId);
        }
      });

      const objects = [frame, ...art];
      this.tilesByCoord.set(coordKey, {
        signature,
        objects,
      });
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
      const back = this.add.rectangle(args.x, args.y, artWidth, artHeight, this.palette.faceDownFill, 0.9);
      back.setStrokeStyle(1, this.palette.faceDownStroke, 1);
      objects.push(back);
      return objects;
    }

    const artTexture = this.resolveArtTexture(args.planeId);
    if (artTexture) {
      objects.push(this.add.image(args.x, args.y - 8, artTexture).setDisplaySize(artWidth, artHeight));
    } else {
      objects.push(this.add.rectangle(args.x, args.y - 8, artWidth, artHeight, this.palette.faceUpFallbackFill, 0.88));
    }

    const name = this.resolvePlaneName(args.planeId);
    const labelFontSizePx = Math.max(14, Math.round(14 + this.uiZoom * 4));
    const labelBackdrop = this.add.rectangle(args.x, nameY - 10, artWidth - 6, 26, this.palette.nameBackdropFill, 0.72);
    labelBackdrop.setStrokeStyle(1, this.palette.nameBackdropStroke, 0.45);
    const label = this.add.text(args.x, nameY, name, {
      fontFamily: "Arial, sans-serif",
      fontSize: `${labelFontSizePx}px`,
      color: this.palette.nameText,
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: artWidth - 10, useAdvancedWrap: true },
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: "#000000",
        blur: 1,
        fill: true,
      },
    });
    label.setOrigin(0.5, 1);
    objects.push(labelBackdrop, label);

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
    this.input.addPointer(2);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragPointerId = pointer.id;
      this.dragLast = { x: pointer.x, y: pointer.y };
      this.dragDistance = 0;
      if (this.isPinching()) {
        this.pinchStartDistance = this.getPinchDistance();
        this.pinchStartZoom = this.uiZoom;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isPinching()) {
        const currentDistance = this.getPinchDistance();
        if (this.pinchStartDistance && currentDistance > 0) {
          const factor = currentDistance / this.pinchStartDistance;
          this.applyZoom(this.pinchStartZoom * factor);
        }
        return;
      }

      if (!pointer.isDown) return;
      if (this.dragPointerId !== pointer.id) return;
      if (!this.canPanCanvas()) return;

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
      this.pinchStartDistance = null;
    });

    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objs: unknown, _dx: number, dy: number) => {
      if (dy === 0) return;
      const dir = dy > 0 ? -1 : 1;
      this.applyZoom(this.uiZoom + dir * this.zoomStep);
    });

    this.input.keyboard?.on("keydown-PLUS", () => this.applyZoom(this.uiZoom + this.zoomStep));
    this.input.keyboard?.on("keydown-NUMPAD_ADD", () => this.applyZoom(this.uiZoom + this.zoomStep));
    this.input.keyboard?.on("keydown-MINUS", () => this.applyZoom(this.uiZoom - this.zoomStep));
    this.input.keyboard?.on("keydown-NUMPAD_SUBTRACT", () => this.applyZoom(this.uiZoom - this.zoomStep));
    this.input.keyboard?.on("keydown-ZERO", () => this.applyZoom(this.minZoom));
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
    const offsetX = this.canPanCanvas() ? this.cameraOffset.x : 0;
    const offsetY = this.canPanCanvas() ? this.cameraOffset.y : 0;
    this.cameras.main.centerOn(world.x + offsetX, world.y + offsetY);
    this.updateBackgroundScroll();
  }

  private setupBackground(): void {
    const textureKey = this.ensureThemeBackgroundTexture(this.activeThemeId);
    const w = this.scale.width;
    const h = this.scale.height;
    if (!this.background) {
      this.background = this.add.tileSprite(0, 0, w, h, textureKey).setOrigin(0, 0);
      this.background.setScrollFactor(0, 0);
      this.background.setDepth(-10);
    } else {
      this.background.setSize(w, h);
      this.background.setTexture(textureKey);
    }
    this.updateBackgroundScroll();
  }

  private syncTheme(force = false): void {
    const nextTheme = this.readThemeId();
    if (!force && nextTheme === this.activeThemeId) return;
    this.activeThemeId = nextTheme;
    this.palette = THEME_PALETTES[nextTheme];
    this.cameras.main.setBackgroundColor(this.palette.cameraBg);
    this.setupBackground();
    this.updateZoomHudTheme();
    this.renderFromState();
  }

  private readThemeId(): MapThemeId {
    const raw = document.documentElement.getAttribute("data-be-theme");
    if (
      raw === "phyrexian" ||
      raw === "neon-dynasty" ||
      raw === "lithomancy" ||
      raw === "halo-fountain"
    ) {
      return raw;
    }
    return "phyrexian";
  }

  private ensureThemeBackgroundTexture(themeId: MapThemeId): string {
    const key = `bg-theme-${themeId}`;
    if (this.textures.exists(key)) return key;
    const graphics = this.add.graphics();
    this.drawThemeBackground(graphics, themeId);
    graphics.generateTexture(key, 256, 256);
    graphics.destroy();
    return key;
  }

  private drawThemeBackground(graphics: Phaser.GameObjects.Graphics, themeId: MapThemeId): void {
    const fill = (color: number, alpha = 1) => graphics.fillStyle(color, alpha);
    if (themeId === "lithomancy") {
      fill(0xf0dfbf);
      graphics.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 14; i += 1) {
        fill(0xc99f66, 0.24);
        const x = (i * 37) % 256;
        const y = (i * 53) % 256;
        graphics.fillTriangle(x, y + 16, x + 10, y - 14, x + 20, y + 16);
      }
      return;
    }
    if (themeId === "phyrexian") {
      fill(0x10181a);
      graphics.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 24; i += 1) {
        fill(0x243831, 0.28);
        graphics.fillEllipse((i * 29) % 256, (i * 41) % 256, 26 + (i % 8), 10 + ((i * 3) % 9));
      }
      return;
    }
    if (themeId === "neon-dynasty") {
      fill(0x131a3f);
      graphics.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 22; i += 1) {
        fill(i % 2 === 0 ? 0x6b7bff : 0x29d7ff, 0.24);
        const y = (i * 11) % 256;
        graphics.fillRect(0, y, 256, 2);
      }
      return;
    }

    fill(0x0b3340);
    graphics.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 32; i += 1) {
      fill(0x71d8d3, 0.16);
      graphics.fillCircle((i * 31) % 256, (i * 17) % 256, 2 + (i % 4));
    }
  }

  private updateBackgroundScroll(): void {
    if (!this.background) return;
    const cam = this.cameras.main;
    this.background.tilePositionX = cam.scrollX * 0.15;
    this.background.tilePositionY = cam.scrollY * 0.15;
  }

  private onResize(): void {
    this.setupBackground();
    this.layoutZoomHud();
    this.centerCamera();
  }

  private clearRenderedObjects(): void {
    for (const coordKey of [...this.tilesByCoord.keys()]) {
      this.destroyTile(coordKey);
    }
  }

  private destroyTile(coordKey: CoordKey): void {
    const existing = this.tilesByCoord.get(coordKey);
    if (!existing) return;
    existing.objects.forEach((obj) => obj.destroy());
    this.tilesByCoord.delete(coordKey);
  }

  private getTileSignature(args: {
    coordKey: CoordKey;
    planeId: string;
    art: string;
    theme: string;
    zoom: number;
    x: number;
    y: number;
    isFaceUp: boolean;
    selectable: boolean;
    hellrideSelectable: boolean;
    confirmSelection: boolean;
    isParty: boolean;
  }): string {
    return [
      args.coordKey,
      args.planeId,
      args.art,
      args.theme,
      args.zoom,
      args.x,
      args.y,
      args.isFaceUp ? "1" : "0",
      args.selectable ? "1" : "0",
      args.hellrideSelectable ? "1" : "0",
      args.confirmSelection ? "1" : "0",
      args.isParty ? "1" : "0",
    ].join("|");
  }

  private getArtSignature(planeId: string, isFaceUp: boolean): string {
    if (!isFaceUp) return "face-down";

    const raw = this.deps.getPlaneArtUrl?.(planeId)?.trim();
    if (!raw) return "no-art";

    const candidates = this.expandArtCandidates(raw);
    for (const candidate of candidates) {
      const knownKey = this.artTextureByUrl.get(candidate);
      if (knownKey && this.textures.exists(knownKey)) return `loaded:${knownKey}`;
    }
    for (const candidate of candidates) {
      if (this.pendingArtLoads.has(candidate)) return `loading:${candidate}`;
    }
    return `url:${raw}`;
  }

  private applyZoom(nextZoom: number): void {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
    if (Math.abs(clamped - this.uiZoom) < 0.0001) return;
    this.uiZoom = clamped;
    this.updateViewportForZoom(clamped);
    this.renderFromState();
    this.updateZoomHudLabel();
    this.centerCamera();
  }

  private updateViewportForZoom(zoom: number): void {
    this.viewport.tileWidth = Math.round(this.baseViewport.tileWidth * zoom);
    this.viewport.tileHeight = Math.round(this.baseViewport.tileHeight * zoom);
    this.viewport.gapX = Math.round(this.baseViewport.gapX * zoom);
    this.viewport.gapY = Math.round(this.baseViewport.gapY * zoom);
  }

  private setupZoomHud(): void {
    const panel = this.add
      .rectangle(0, 0, 136, 36, this.palette.zoomHudPanel, 0.76)
      .setOrigin(0, 0)
      .setDepth(500)
      .setScrollFactor(0, 0);
    const zoomOut = this.add
      .text(0, 0, "-", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(501)
      .setScrollFactor(0, 0)
      .setInteractive({ useHandCursor: true });
    const zoomIn = this.add
      .text(0, 0, "+", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(501)
      .setScrollFactor(0, 0)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: this.palette.zoomHudText,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(501)
      .setScrollFactor(0, 0);

    zoomOut.on("pointerup", () => this.applyZoom(this.uiZoom - this.zoomStep));
    zoomIn.on("pointerup", () => this.applyZoom(this.uiZoom + this.zoomStep));

    this.zoomHud = { panel, zoomOut, zoomIn, label };
    this.layoutZoomHud();
    this.updateZoomHudLabel();
  }

  private updateZoomHudTheme(): void {
    if (!this.zoomHud) return;
    this.zoomHud.panel.setFillStyle(this.palette.zoomHudPanel, 0.76);
    this.zoomHud.label.setColor(this.palette.zoomHudText);
  }

  private layoutZoomHud(): void {
    if (!this.zoomHud) return;
    const baseX = 12;
    const baseY = 12;

    this.zoomHud.panel.setPosition(baseX, baseY);
    this.zoomHud.zoomOut.setPosition(baseX + 18, baseY + 18);
    this.zoomHud.label.setPosition(baseX + 68, baseY + 18);
    this.zoomHud.zoomIn.setPosition(baseX + 118, baseY + 18);
  }

  private updateZoomHudLabel(): void {
    if (!this.zoomHud) return;
    this.zoomHud.label.setText(`Zoom ${Math.round(this.uiZoom * 100)}%`);
  }

  private isPinching(): boolean {
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    return Boolean(p1?.isDown && p2?.isDown);
  }

  private getPinchDistance(): number {
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    if (!p1 || !p2) return 0;
    return Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
  }

  private canPanCanvas(): boolean {
    return this.lastState?.config.gameMode !== "REGULAR_PLANECHASE";
  }

}
