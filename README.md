# Blind Eternities Planechase

Blind Eternities Planechase is an Angular + Phaser application for facilitator-led Planechase sessions.

## Quick Start

```bash
npm install
npm run start
```

App URL: `http://localhost:4200/`

## Core Commands

- `npm run start`: Start development server
- `npm run build`: Create production build
- `npm run test:unit`: Run unit test suite (Vitest)
- `npm run art:cache:fetch`: Fetch a small, throttled batch of plane art
- `npm run cards:sync:mtgjson`: Sync plane metadata from MTGJSON

## Documentation

- Documentation index: [docs/README.md](docs/README.md)
- Delivery plan and milestone status: [docs/08-delivery-plan.md](docs/08-delivery-plan.md)
- Contributor workflow: [docs/10-contributor-runbook.md](docs/10-contributor-runbook.md)

## Project Workflow Files

- Issue tracking and status: [ISSUES.md](ISSUES.md)
- Role-based behavior guidance: [ROLES.md](ROLES.md)
- Agent operating instructions: [AGENTS.md](AGENTS.md)

## Architecture Summary

- Angular owns state, game logic, and FSM transitions.
- Phaser handles rendering and input intent emission.
- SessionOrchestrator is the single state transition gateway.
- Card metadata and art are build-time/local assets (no runtime third-party API calls).

## Current Status

- Milestones 0 through 6: complete
- Current phase: UAT, bug-fix, and polish
- Active backlog source: `ISSUES.md`
