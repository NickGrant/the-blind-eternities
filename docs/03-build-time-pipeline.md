# Build-Time Data & Asset Pipeline

## Goals
- Avoid runtime Scryfall calls
- Avoid repeated API hits
- Deterministic local card pool

## Build Script Responsibilities
- Fetch card metadata from Scryfall
- Download one high-res image per card
- Emit cards.json and sets.json

## Runtime
- Load data from assets
- Phaser scales images dynamically
- No offline or PWA behavior required
