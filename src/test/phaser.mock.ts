// src/test/phaser.mock.ts
//
// Minimal Phaser module stub for unit tests.
// Phaser does Canvas/WebGL feature detection at import time, which breaks in JSDOM.

class MockScene {
  constructor(_config?: unknown) {}
}

class MockGame {
  static instances: MockGame[] = [];
  readonly config: unknown;

  constructor(config?: unknown) {
    this.config = config;
    MockGame.instances.push(this);
  }

  destroy(_removeCanvas?: boolean) {}
}

const Phaser = {
  Scene: MockScene,
  Game: MockGame,

  AUTO: 0,
  CANVAS: 1,
  WEBGL: 2,

  Scale: {
    RESIZE: 0,
    CENTER_BOTH: 0,
  },
};

export default Phaser;
