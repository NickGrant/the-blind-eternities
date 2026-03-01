# ISSUES FILE
----

## Purpose
- `ISSUES.md` tracks active work only.
- Keep this file small and current for day-to-day execution context.
- Historical completed issues are moved to `ISSUES_ARCHIVE.md`.

## How to Use
- Valid statuses for active items:
  - `unstarted`
  - `in-progress`
  - `reopened`
- Valid priorities for active items:
  - `low`
  - `medium`
  - `high`
- When an issue is resolved:
  - set `status: complete`
  - append `Resolution:` (1-2 sentences)
  - move the full completed entry to `ISSUES_ARCHIVE.md`
  - remove the completed entry from this active file

## Active Issues

### Functional

title: Replace phenomenon ID-prefix heuristic with explicit card-type metadata
status: unstarted
priority: medium
description: Phenomenon handling currently relies on card ID prefix checks (`phenomenon-`). Replace this with explicit card-type metadata in catalog/deck flow so phenomenon detection is data-driven and resilient to naming variance.

---

title: Refine visual themes with stronger differentiation, prompt-driven art direction, and custom generated assets
status: unstarted
priority: high
description: Expand theme implementation to create materially distinct visual systems across all supported themes and incorporate the following prompt/negative-prompt direction as implementation targets for palettes, textures, imagery, and UI embellishments. Include custom image generation when needed (for separate UX surfaces, background variants, decorative overlays, and theme-specific graphic accents).
details:
- phyrexian
  - visual prompt: A towering biomechanical entity formed from slick obsidian metal and fused organic sinew, dripping viscous black oil across ribbed cathedral-scale structures, asymmetrical bladed silhouette, harsh green internal glow veins pulsing beneath reflective tar-like armor, industrial gothic architecture rising behind it, oppressive vertical composition, high contrast lighting, wet specular highlights on black chrome surfaces, cinematic dark fantasy realism, ultra-detailed textures, no warm color tones.
  - negative prompt: warm lighting, gold trim, marble architecture, neon pink, bright cyan, medieval fantasy, natural greenery, soft painterly lighting, symmetrical beauty, art deco patterns, clean ivory stone
- neon dynasty
  - visual prompt: Rain-soaked cyberpunk megacity at night inspired by futuristic Tokyo, dense vertical skyline with glowing holographic signage, electric blue and magenta neon reflections across wet asphalt, chrome architecture with subtle Japanese design motifs, atmospheric mist diffusing cool light, lone silhouetted figure in foreground, cinematic perspective depth, cool temperature palette dominated by cyan, indigo, and hot pink, high-detail digital illustration, reflective surfaces, no warm gold tones.
  - negative prompt: marble columns, gold filigree, cathedral interiors, black oil textures, gothic horror, sandstone ruins, bright daylight, earthy browns, symmetrical art deco interior
- lithomancy
  - visual prompt: Monumental floating stone hedrons suspended in bright open sky, ivory and pale limestone architecture carved with sacred geometric glyphs, soft golden ambient sunlight beams illuminating smooth carved surfaces, serene celestial atmosphere, minimal color variation beyond ivory, pale gold, and sky blue, symmetrical composition with central floating monolith, clean negative space, high-key lighting, crisp detail, mystical yet peaceful tone.
  - negative prompt: dark oppressive shadows, neon lighting, biomechanical metal, oil sheen, rust, art deco gold interiors, cyberpunk signage, asymmetrical horror shapes
- halo fountain
  - visual prompt: Grand Art Deco interior centered around a radiant marble fountain glowing with warm golden halo light, symmetrical arches and polished ivory columns with geometric deco patterns, champagne and brushed gold trim reflecting soft ambient illumination, elegant high-society atmosphere, celestial nightclub cathedral aesthetic, balanced composition, soft highlight bloom, warm tonal dominance, refined luxury, high-detail digital painting.
  - negative prompt: neon magenta lighting, wet asphalt streets, black oil biomechanical horror, floating stone ruins, harsh green glow, dystopian grime, industrial decay

---

title: Add "What is Blind Eternities?" link to source article
status: unstarted
priority: medium
description: Add a clearly visible help link in the player-facing UI (for example in the How to Use section) labeled similarly to "What is Blind Eternities?" that opens the Blind Eternities article in a new tab so players can quickly read the original variant context and rules background.

---

title: Cleanup session setup dialog controls (selects + Planechase naming)
status: unstarted
priority: medium
description: Refine setup dialog inputs for clarity and compactness. Replace Fog of War radio buttons with a select control where option values are `0` and `1`, and option labels include the descriptive behavior text. Replace Game Mode radio buttons with a select control and rename the displayed mode label from `Regular Planechase` to `Planechase` while keeping behavior unchanged.

---
