# Phenomenon Support Specification

This spec aligns Blind Eternities phenomenon behavior with the reference article:
https://terriblemagic.blogspot.com/2016/05/the-blind-eternities-planechase-variant.html

## Product Rule Intent

- Phenomena are transient interrupts during reveal/fill.
- A phenomenon is never left on the map as a long-term plane tile.
- Reveal/fill continues until the target slot contains a valid plane.

## Required Ordering

When movement resolves in Blind Eternities:

1. Enter destination plane (land/enter behavior context).
2. Fill/reveal needed nearby cardinal slots.
3. If a revealed fill draw is a phenomenon:
   - resolve it immediately in flow,
   - remove/discard it from long-term map placement,
   - draw replacement card(s) until a plane occupies the slot.
4. Finalize movement resolution.

## UX Expectations

- Phenomenon should be visible in logs as a distinct resolution event.
- Gameplay should remain flow-driven; no persistent phenomenon tile on board.
- Avoid extra blocking modal requirements unless explicitly added by future issue.

## Data Model Requirements

- Phenomenon detection must be type-driven (`cardType`/`kind`) rather than ID naming heuristics.
- Deck/catalog records must distinguish at least:
  - `PLANE`
  - `PHENOMENON`

## Logging Requirements

- Log metadata must include:
  - `phenomenonReplaceCount`
  - movement phase markers
  - game mode / fog-of-war context

## Open Follow-Up (Tracked in ISSUES)

- Validate exact enter-plane effect ordering with acceptance tests tied to article matrix.
