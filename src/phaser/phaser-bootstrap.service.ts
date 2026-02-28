import { effect, Inject, Injectable } from "@angular/core";
import Phaser from "phaser";
import { MapScene } from "./scenes/map.scene";
import { DEV_MODE } from "../app/core/dev-mode";
import { SessionStore } from "../app/core/session.store";
import { SessionOrchestrator } from "../app/core/session-orchestrator.service";

@Injectable({ providedIn: "root" })
export class PhaserBootstrapService {
  private game: Phaser.Game | null = null;
  private readonly scene: MapScene;

  constructor(
    @Inject(DEV_MODE) private readonly devMode: boolean,
    private readonly sessionStore: SessionStore,
    private readonly orchestrator: SessionOrchestrator
  ) {
    this.scene = new MapScene({
      onSelectPlane: (toCoord) => {
        this.orchestrator.dispatch({
          type: "domain/select_plane",
          atMs: Date.now(),
          toCoord,
        });
      },
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
      backgroundColor: "#111111",
      scene: [this.scene],
      fps: {
        // Keep deterministic correctness concerns out of Phaser;
        // this is purely rendering + input intents.
        target: 60,
        forceSetTimeOut: !this.devMode,
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
}
