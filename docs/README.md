# Blind Eternities Planechase — Documentation

This directory contains the **authoritative system documentation** for the Blind Eternities Planechase application.

These documents define **scope, architecture, runtime behavior, and constraints** for the project.  
They are intended to be read **before** making implementation changes.

---

## 📚 Documentation Index

### 1. System Architecture & State Model  
**`01-system-architecture.md`**

Describes:
- Overall frontend-only architecture
- Angular vs Phaser responsibilities
- Core services and orchestration
- Canonical state shape and ownership rules
- Modal queue design
- Phaser ↔ Angular interaction contract

This document answers:  
> *“What exists, who owns it, and how do systems talk to each other?”*

---

### 2. Runtime Flow & Finite State Machine  
**`02-runtime-flow-fsm.md`**

Defines:
- Session finite state machine (FSM)
- Allowed user actions per state
- Reveal sequencing rules
- Die roll outcomes and transitions
- Decay behavior and movement flow

This document answers:  
> *“What happens, in what order, and what is allowed when?”*

---

### 3. Build-Time Data & Asset Pipeline  
**`03-build-time-pipeline.md`**

Covers:
- Scryfall ingestion strategy
- Build-time data fetching only (no runtime API calls)
- Image handling approach
- Generated asset expectations

This document answers:  
> *“Where does card data come from, and how does it enter the app?”*

---

### 4. Risks, Assumptions & Open Decisions  
**`04-risks-assumptions.md`**

Lists:
- Explicit assumptions made by the system
- Known risks and mitigations
- Features intentionally deferred
- Non-blocking future considerations

This document answers:  
> *“What are we consciously choosing not to solve yet?”*

---

## 🧭 How to Use These Docs

- These files are **source-of-truth**, not commentary.
- Implementation should follow these documents unless explicitly revised.
- If implementation deviates, **update the docs first**, then the code.
- New features should include:
  - an update to the relevant doc(s), or
  - a new numbered document if scope warrants it.

---

## 🏷️ Versioning & Changes

- Documentation changes should be committed alongside code changes.
- Major scope changes should be recorded in:
  - `04-risks-assumptions.md`, or
  - a new architecture addendum document.

---

## 🚦 Project Status

- Phase: **Pre-kickoff / Architecture Locked**
- Code implementation has not yet begun
- Next milestone: **Project scaffolding + state store skeleton**

---

If you are new to the project, start with:
1. **System Architecture**
2. **Runtime Flow & FSM**
3. **Build Pipeline**

in that order.
