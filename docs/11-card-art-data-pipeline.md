# Card and Art Data Pipeline

This document defines how card metadata and art are maintained.

## Sources

- MTGJSON: canonical structured card metadata sync
- Scryfall: image and oracle-text enrichment for locally cached assets

## Local Data Files

- `src/assets/cards.json`: local planar catalog (planes + phenomena) used by app runtime
- `src/assets/plane-art/*.jpg`: cached planar art images (plane + phenomenon IDs)

## Scripts

- `npm run cards:sync:mtgjson`
  - syncs plane metadata from MTGJSON sets
  - populates fields such as `rulesText`, `typeLine`, set/number, and IDs

- `npm run art:cache:fetch`
  - fetches a small, throttled batch of art files for missing planar entries
  - avoids burst traffic to external API
  - updates `artUrl` entries in `cards.json`

- `npm run art:coverage`
  - reports card/art coverage totals by card kind and set code
  - lists playable card IDs that are still missing cached art files

- `npm run art:coverage:json`
  - emits the same coverage report in machine-readable JSON

- `npm run assets:optimize:themes`
  - optimizes theme background PNG assets in-place
  - useful before release/package checkpoints

- `npm run assets:optimize:themes:guardrail`
  - dry-run quality gate for optimization settings
  - emits a JSON report at `tmp/theme-optimization-report.json`

- `npm run test:contrast`
  - runs a repeatable theme contrast check for representative text/background pairs

## Recommended Run Order

1. Run metadata sync first:
   - `npm run cards:sync:mtgjson`
2. Run throttled art caching:
   - `npm run art:cache:fetch`
   - for phenomenon-only backlog fetches, run with explicit delay:
     - `npm run art:cache -- --fetch --max=20 --delay-ms=10000`
3. (Optional) optimize theme backgrounds:
   - `npm run assets:optimize:themes`
4. Validate:
   - `npm run art:coverage`
   - `npm run build`
   - `npm run test:contrast`
   - open app and verify cards render art

## Operational Guardrails

- Do not run unthrottled bulk fetch loops.
- Keep local art files committed with matching `artUrl` values.
- Preserve fallback behavior for cards missing remote metadata or art.

## Known Gap

- Some source entries may have incomplete metadata or no image match; review script failure details after each fetch/sync run.
