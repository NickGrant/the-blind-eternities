import { Inject, Injectable } from "@angular/core";
import Phaser from "phaser";
import { InertScene } from "./scenes/inert.scene";
import { DEV_MODE } from "../app/core/dev-mode";

@Injectable({ providedIn: "root" })
export class PhaserBootstrapService {
  private game: Phaser.Game | null = null;

  constructor(@Inject(DEV_MODE) private readonly devMode: boolean) {}

  init(container: HTMLElement): void {
    if (this.game) return;

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      backgroundColor: "#111111",
      scene: [InertScene],
      fps: {
        // Keep deterministic correctness concerns out of Phaser;
        // this is purely rendering for now.
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
