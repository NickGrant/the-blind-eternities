import Phaser from "phaser";

export class InertScene extends Phaser.Scene {
  constructor() {
    super({ key: "InertScene" });
  }

  create(): void {
    // Inert placeholder: render something minimal so canvas is visibly alive.
    const { width, height } = this.scale;
    this.add.text(12, 12, "Blind Eternities — Milestone 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#ffffff",
    });

    // No input -> Angular intent wiring yet (defined in types only).
    // We intentionally do NOT emit intents in Milestone 0.
    this.cameras.main.setBackgroundColor(0x111111);
    this.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0x1d1d1d).setStrokeStyle(2, 0x333333);
  }
}
