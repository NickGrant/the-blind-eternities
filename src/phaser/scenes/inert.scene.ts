import Phaser from "phaser";

export class InertScene extends Phaser.Scene {
  constructor() {
    super({ key: "InertScene" });
  }

  create(): void {
    // Inert placeholder: render something minimal so canvas is visibly alive.
    this.add.text(12, 12, "Blind Eternities — Milestone 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#ffffff",
    });

    // No input -> Angular intent wiring yet (defined in types only).
    // We intentionally do NOT emit intents in Milestone 0.
    this.cameras.main.setBackgroundColor(0x111111);
  }
}
