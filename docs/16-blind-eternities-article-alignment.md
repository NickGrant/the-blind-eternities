# Blind Eternities Article Alignment Matrix

Reference article:
https://terriblemagic.blogspot.com/2016/05/the-blind-eternities-planechase-variant.html

Use this matrix for UAT and drift checks.

| Rule Area | Article Expectation | Current Runtime | Status | Notes |
|---|---|---|---|---|
| Startup reveal visibility | Controlled by fog-of-war style reveal depth | Profile-based (`center-only` / `center+NESW`) | Partial | Active issue: migrate to numeric Fog of War (`1`/`2`) |
| Planeswalk in Blind Eternities | Move to new square, reveal/fill nearby cardinals as needed | Implemented movement + fill pipeline | Aligned | Pending fog-of-war naming migration |
| Hellride | Diagonal option into unrevealed/void spaces | Implemented as setup toggle | Partial | Active issue: always-on in Blind Eternities |
| Phenomenon on fill | Resolve immediately, do not persist, replace with plane draw | Implemented replace-on-fill logic | Aligned | Current detection heuristic uses ID prefix; metadata issue open |
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
