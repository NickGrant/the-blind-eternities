import { Injectable } from "@angular/core";
import type { DieOutcome } from "../../state/intents.types";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

@Injectable({ providedIn: "root" })
export class DieService {
  roll(args: { atMs: number; seed?: string; rollCount: number }): DieOutcome {
    const key = args.seed
      ? `${args.seed}|${args.rollCount}`
      : `${args.atMs}|${args.rollCount}`;
    const face = hashString(key) % 6;

    // Planechase-style 6-face mapping: 4 blank, 1 chaos, 1 planeswalk.
    if (face === 4) return "chaos";
    if (face === 5) return "planeswalk";
    return "blank";
  }
}
