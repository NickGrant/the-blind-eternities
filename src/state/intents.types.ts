export type PhaserIntent =
  | { type: "phaser/ready"; atMs: number }
  | { type: "input/pointer_down"; atMs: number; x: number; y: number }
  | { type: "input/pointer_up"; atMs: number; x: number; y: number };

/**
 * Milestone 0 rule:
 * - intents are defined, but not yet dispatched into any orchestrator.
 * - payloads must remain pure data (no functions).
 */
