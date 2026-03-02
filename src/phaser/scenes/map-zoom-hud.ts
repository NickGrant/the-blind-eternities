import Phaser from "phaser";
import type { ThemePalette } from "./map-theme";

type ZoomHudArgs = {
  scene: Phaser.Scene;
  palette: ThemePalette;
  onZoomOut: () => void;
  onZoomIn: () => void;
};

export class MapZoomHud {
  private readonly scene: Phaser.Scene;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly zoomOut: Phaser.GameObjects.Text;
  private readonly zoomIn: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;

  constructor(args: ZoomHudArgs) {
    this.scene = args.scene;

    this.panel = this.scene.add
      .rectangle(0, 0, 136, 36, args.palette.zoomHudPanel, 0.76)
      .setOrigin(0, 0)
      .setDepth(500)
      .setScrollFactor(0, 0);
    this.zoomOut = this.scene.add
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
    this.zoomIn = this.scene.add
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
    this.label = this.scene.add
      .text(0, 0, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: args.palette.zoomHudText,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(501)
      .setScrollFactor(0, 0);

    this.zoomOut.on("pointerup", args.onZoomOut);
    this.zoomIn.on("pointerup", args.onZoomIn);
    this.layout();
  }

  updateTheme(palette: ThemePalette): void {
    this.panel.setFillStyle(palette.zoomHudPanel, 0.76);
    this.label.setColor(palette.zoomHudText);
  }

  layout(): void {
    const baseX = 12;
    const baseY = 12;
    this.panel.setPosition(baseX, baseY);
    this.zoomOut.setPosition(baseX + 18, baseY + 18);
    this.label.setPosition(baseX + 68, baseY + 18);
    this.zoomIn.setPosition(baseX + 118, baseY + 18);
  }

  setLabel(zoomValue: number): void {
    this.label.setText(`Zoom ${Math.round(zoomValue * 100)}%`);
  }

  setEnabled(enabled: boolean): void {
    const controlAlpha = enabled ? 1 : 0.45;
    this.panel.setAlpha(enabled ? 0.76 : 0.5);
    this.zoomOut.setAlpha(controlAlpha);
    this.zoomIn.setAlpha(controlAlpha);
    this.label.setAlpha(controlAlpha);
    this.zoomOut.disableInteractive();
    this.zoomIn.disableInteractive();
    if (enabled) {
      this.zoomOut.setInteractive({ useHandCursor: true });
      this.zoomIn.setInteractive({ useHandCursor: true });
    }
  }
}
