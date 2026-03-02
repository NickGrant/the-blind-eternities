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
import { MapZoomHud } from "./map-zoom-hud";
import {
  THEME_BACKGROUND_ASSETS,
  THEME_PALETTES,
  readThemeIdFromDom,
  type MapThemeId,
  type ThemePalette,
} from "./map-theme";

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
  private readonly pendingThemeBackgroundLoads = new Set<MapThemeId>();
  private background?: Phaser.GameObjects.Image;
  private activeThemeId: MapThemeId = "phyrexian";
  private palette: ThemePalette = THEME_PALETTES.phyrexian;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 1.5;
  private readonly zoomStep = 0.1;
  private uiZoom = 1;
  private pinchStartDistance: number | null = null;
  private pinchStartZoom = 1;
  private zoomHud?: MapZoomHud;
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
      this.updateZoomHudEnabled();
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

    this.updateZoomHudEnabled();
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
      fontFamily: this.palette.labelFontFamily,
      fontSize: `${labelFontSizePx}px`,
      color: this.palette.nameText,
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: artWidth - 10, useAdvancedWrap: true },
      shadow: this.getNameLabelShadowStyle(),
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
      this.background = this.add.image(w / 2, h / 2, textureKey).setOrigin(0.5, 0.5);
      this.background.setScrollFactor(0, 0);
      this.background.setDepth(-10);
    } else {
      this.background.setTexture(textureKey);
    }
    this.fitBackgroundToViewport();
  }

  private syncTheme(force = false): void {
    const nextTheme = readThemeIdFromDom();
    if (!force && nextTheme === this.activeThemeId) return;
    this.activeThemeId = nextTheme;
    this.palette = THEME_PALETTES[nextTheme];
    this.cameras.main.setBackgroundColor(this.palette.cameraBg);
    this.setupBackground();
    this.updateZoomHudTheme();
    this.renderFromState();
  }

  private ensureThemeBackgroundTexture(themeId: MapThemeId): string {
    const key = `bg-theme-${themeId}`;
    if (this.textures.exists(key)) return key;
    this.requestThemeBackgroundLoad(themeId);
    return this.ensureFallbackBackgroundTexture();
  }

  private ensureFallbackBackgroundTexture(): string {
    const key = "bg-theme-fallback";
    if (this.textures.exists(key)) return key;
    const graphics = this.add.graphics();
    graphics.fillStyle(this.palette.cameraBg, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
    return key;
  }

  private requestThemeBackgroundLoad(themeId: MapThemeId): void {
    if (this.pendingThemeBackgroundLoads.has(themeId)) return;

    const key = `bg-theme-${themeId}`;
    const url = THEME_BACKGROUND_ASSETS[themeId];
    this.pendingThemeBackgroundLoads.add(themeId);

    const cleanup = () => {
      this.load.off(`filecomplete-image-${key}`, onComplete);
      this.load.off("loaderror", onError);
    };
    const onComplete = () => {
      cleanup();
      this.pendingThemeBackgroundLoads.delete(themeId);
      this.setupBackground();
    };
    const onError = (file: { key?: string }) => {
      if (file?.key !== key) return;
      cleanup();
      this.pendingThemeBackgroundLoads.delete(themeId);
      console.warn(`Failed to load theme background asset: ${url}`);
    };

    this.load.on(`filecomplete-image-${key}`, onComplete);
    this.load.on("loaderror", onError);
    this.load.image(key, url);
    if (!this.load.isLoading()) this.load.start();
  }

  private updateBackgroundScroll(): void {
    this.fitBackgroundToViewport();
  }

  private fitBackgroundToViewport(): void {
    if (!this.background) return;

    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const texture = this.textures.get(this.background.texture.key);
    const sourceImage = texture?.getSourceImage() as { width?: number; height?: number } | undefined;
    const textureWidth = sourceImage?.width ?? viewportWidth;
    const textureHeight = sourceImage?.height ?? viewportHeight;

    const scale = Math.max(viewportWidth / textureWidth, viewportHeight / textureHeight);
    this.background.setPosition(viewportWidth / 2, viewportHeight / 2);
    this.background.setDisplaySize(textureWidth * scale, textureHeight * scale);
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
    if (!this.canUseZoomControls()) return;
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
    this.zoomHud = new MapZoomHud({
      scene: this,
      palette: this.palette,
      onZoomOut: () => this.applyZoom(this.uiZoom - this.zoomStep),
      onZoomIn: () => this.applyZoom(this.uiZoom + this.zoomStep),
    });
    this.zoomHud.setLabel(this.uiZoom);
    this.zoomHud.setEnabled(this.canUseZoomControls());
  }

  private updateZoomHudTheme(): void {
    this.zoomHud?.updateTheme(this.palette);
  }

  private layoutZoomHud(): void {
    this.zoomHud?.layout();
  }

  private updateZoomHudLabel(): void {
    this.zoomHud?.setLabel(this.uiZoom);
  }

  private updateZoomHudEnabled(): void {
    this.zoomHud?.setEnabled(this.canUseZoomControls());
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

  private canUseZoomControls(): boolean {
    return this.tilesByCoord.size > 0;
  }

  private getNameLabelShadowStyle(): Phaser.Types.GameObjects.Text.TextShadow {
    if (this.activeThemeId === "lithomancy") {
      return {
        offsetX: 0,
        offsetY: 0,
        color: "#f8ecd1",
        blur: 0,
        fill: false,
      };
    }
    return {
      offsetX: 1,
      offsetY: 1,
      color: "#000000",
      blur: 1,
      fill: true,
    };
  }

}
