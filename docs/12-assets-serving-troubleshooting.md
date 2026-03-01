# Assets Serving Troubleshooting

Use this guide when `/assets/...` files fail to load at runtime.

## Symptom

- Browser console shows 404 errors for files like:
  - `/assets/plane-art/plane-edge-of-malacol.jpg`

## Required Angular Configuration

`angular.json` build options must include both:

- `public/**` input (existing static files)
- `src/assets/**` mapped to output `assets`

Without `src/assets` mapping, cached art will not be served by `npm run start`.

## Verification Steps

1. Confirm local files exist:
   - `src/assets/plane-art/*.jpg`
2. Build:
   - `npm run build`
3. Confirm output files exist:
   - `dist/blind-eternities/browser/assets/plane-art/*.jpg`
4. Start dev server:
   - `npm run start`
5. Open direct URL:
   - `http://localhost:4200/assets/plane-art/<filename>.jpg`

## If Still Failing

- Restart dev server after config changes.
- Verify `cards.json` `artUrl` uses `assets/plane-art/<file>.jpg`.
- Check app base path deployment behavior if hosted on subpaths.
