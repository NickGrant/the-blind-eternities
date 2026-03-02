import { effect, Injectable } from "@angular/core";
import Phaser from "phaser";
import { MapScene } from "./scenes/map.scene";
import { DevModeStore } from "../app/core/dev-mode";
import { SessionStore } from "../app/core/session.store";
import { SessionOrchestrator } from "../app/core/session-orchestrator.service";
import { DeckService } from "../app/core/deck.service";
import { DOMAIN_INTENT, MODAL_TYPE } from "../state/intents.types";
import { getThemeBootstrapBackground, readThemeIdFromDom } from "./scenes/map-theme";

@Injectable({ providedIn: "root" })
export class PhaserBootstrapService {
  private game: Phaser.Game | null = null;
  private readonly scene: MapScene;

  constructor(
    private readonly devModeStore: DevModeStore,
    private readonly sessionStore: SessionStore,
    private readonly orchestrator: SessionOrchestrator,
    private readonly deckService: DeckService
  ) {
    this.scene = new MapScene({
      onSelectPlane: (toCoord) => {
        this.orchestrator.dispatch({
          type: DOMAIN_INTENT.SELECT_PLANE,
          atMs: Date.now(),
          toCoord,
        });
      },
      onConfirmMove: () => {
        this.orchestrator.dispatch({
          type: DOMAIN_INTENT.CONFIRM_MOVE,
          atMs: Date.now(),
        });
      },
      onInspectPlane: (planeId) => {
        const state = this.sessionStore.state();
        this.orchestrator.dispatch({
          type: DOMAIN_INTENT.OPEN_MODAL,
          atMs: Date.now(),
          modal: {
            id: `inspect_${Date.now()}`,
            modalType: MODAL_TYPE.PLANE,
            planeId,
            resumeToState: state.fsm.state,
          },
        });
      },
      getPlaneName: (planeId) => this.deckService.getPlaneName(planeId),
      getPlaneArtUrl: (planeId) => this.deckService.getPlaneArtUrl(planeId),
    });

    effect(() => {
      const state = this.sessionStore.state();
      this.scene.setSessionState(state);
    });
  }

  init(container: HTMLElement): void {
    if (this.game) return;

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      backgroundColor: this.resolveBootstrapThemeBackground(),
      scene: [this.scene],
      fps: {
        // Keep deterministic correctness concerns out of Phaser;
        // this is purely rendering + input intents.
        target: 60,
        forceSetTimeOut: !this.devModeStore.enabled(),
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }

  private resolveBootstrapThemeBackground(): string {
    return getThemeBootstrapBackground(readThemeIdFromDom());
  }
}
