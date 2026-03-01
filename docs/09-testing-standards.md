# Testing Standards

## Goals
- Catch regressions in core logic early.
- Keep tests deterministic and fast.
- Avoid coupling tests to Phaser rendering details (Milestone 0-5 constraint).

This project uses:
- **Vitest** as the runner (Angular `@angular/build:unit-test`)
- **JSDOM** for DOM-based component tests
- Angular **TestBed** for component/integration tests

## File Naming & Location
- All tests use `*.spec.ts`
- Tests live beside the file they test:
  - `src/app/core/fatal-error.store.ts` -> `src/app/core/fatal-error.store.spec.ts`

## Test Types & Required Coverage

### 1) Functional Tests (Required)
Scope: pure logic, stores, services.
- No DOM required
- No Phaser required
- Prefer direct instantiation where possible, otherwise TestBed injection

Examples:
- `FatalErrorStore.set/clear`
- "config object built correctly"
- "guards reject invalid input"

### 2) DOM Tests (Required for UI Components)
Scope: Angular standalone components, templates, bindings, and conditional rendering.
- Use TestBed + `fixture.nativeElement`
- Assert **user-visible behavior**, not internal implementation
- Prefer stable selectors:
  - role-based selectors (e.g., `[role="alert"]`)
  - semantic elements (`h1`, `button`)
- Avoid CSS-structure assertions (brittle)

### 3) Integration Tests (Selective)
Scope: Angular component + injected services working together.
- Use DI to provide real stores and mocked external dependencies (Phaser).
- Example:
  - `AppComponent` + `FatalErrorStore` + mocked `PhaserBootstrapService`

### 4) End-to-End Tests (Deferred)
Not required in v1 unless/until:
- You add routing, persistence, or multi-step gameplay flows
- You need browser-level coverage (Playwright/Cypress)

## Mocking Rules

### Phaser
- Phaser is treated as an external runtime dependency.
- Unit tests must **mock** Phaser to avoid jsdom instability.
- Assert only:
  - the service calls Phaser once
  - correct config is passed
  - destroy clears resources

### Time & Randomness
- No real timers in logic tests.
- If randomness is introduced later, it must be seedable and controllable in tests.

## Assertion Style
- AAA structure:
  - Arrange: build module, mocks
  - Act: call the unit
  - Assert: expectations
- Avoid snapshot testing for gameplay logic and state machines.

## Minimum CI Expectations (when you add CI)
- `npm test` must pass
- Add coverage later once core logic exists (Milestone 2+), focusing on:
  - FSM transitions
  - ensure-plus
  - decay
  - deck/reshuffle

