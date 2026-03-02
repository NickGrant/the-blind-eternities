# Blind Eternities Article Alignment Matrix

Reference article:
https://terriblemagic.blogspot.com/2016/05/the-blind-eternities-planechase-variant.html

Use this matrix for UAT and drift checks.

| Rule Area | Article Expectation | Current Runtime | Status | Notes |
|---|---|---|---|---|
| Startup reveal visibility | Controlled by fog-of-war style reveal depth | Numeric toggle-backed distance (`0` = current only, `1` = current + cardinals on move) | Aligned | UI text now describes reveal distance directly |
| Planeswalk in Blind Eternities | Move to new square, reveal/fill nearby cardinals as needed | Implemented movement + fill pipeline | Aligned | Reveal distance controls use numeric `0`/`1` semantics |
| Hellride | Diagonal option into unrevealed/void spaces | Always enabled in Blind Eternities movement flow | Aligned | No setup toggle |
| Phenomenon on fill | Resolve immediately, do not persist, replace with plane draw | Implemented replace-on-fill logic | Aligned | Detection is card-type metadata driven |
| Enter-plane vs phenomenon ordering | Enter plane first, then phenomenon resolution during fill | Documented in spec and phase logs | Partial | Add explicit acceptance tests tied to this matrix |
| Diagonal reveal behavior | Cardinal reveal logic only; diagonal exclusions | Current reveal/fill uses cardinal policy | Aligned | Hellride remains movement-only |
| Anti-stall/backtrack | Optional variant behavior | Optional setup toggle implemented | Intentional deviation | Keep optional and off by default |

## Intentional Deviations (Must Stay Explicit)

- Anti-stall is optional and not article-default.
- Debug controls and telemetry are implementation conveniences, not article rules.

## Release Gate Usage

Before release candidate:

1. Review this matrix against current `ISSUES.md`.
2. Confirm each `Partial` line has an active issue or documented rationale.
3. Update `status` column when behavior lands.
