# Card and Art Data Pipeline

This document defines how card metadata and art are maintained.

## Sources

- MTGJSON: canonical structured card metadata sync
- Scryfall: image and oracle-text enrichment for locally cached assets

## Local Data Files

- `src/assets/cards.json`: local plane catalog used by app runtime
- `src/assets/plane-art/*.jpg`: cached plane art images

## Scripts

- `npm run cards:sync:mtgjson`
  - syncs plane metadata from MTGJSON sets
  - populates fields such as `rulesText`, `typeLine`, set/number, and IDs

- `npm run art:cache:fetch`
  - fetches a small, throttled batch of art files
  - avoids burst traffic to external API
  - updates `artUrl` entries in `cards.json`

## Recommended Run Order

1. Run metadata sync first:
   - `npm run cards:sync:mtgjson`
2. Run throttled art caching:
   - `npm run art:cache:fetch`
3. Validate:
   - `npm run build`
   - open app and verify cards render art

## Operational Guardrails

- Do not run unthrottled bulk fetch loops.
- Keep local art files committed with matching `artUrl` values.
- Preserve fallback behavior for cards missing remote metadata or art.

## Known Gap

- `plane-ivy-lane` may remain partially populated depending on source coverage.
