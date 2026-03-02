# ISSUES ARCHIVE
----

## Purpose
- `ISSUES_ARCHIVE.md` stores completed issue history only.
- Keep `ISSUES.md` focused on active work (`unstarted`, `in-progress`, `reopened`).
- Preserve all historical `Resolution:` notes when moving items here.

## Archive Rules
- Do not track active work in this file.
- If an archived issue is reopened, move it back to `ISSUES.md` with `status: reopened`.
- When fixed again, append a new `Resolution:` entry and archive it again.
## Issues

### Visual

title: Enlarge Cards
status: complete
description: the planar cards shown on the canvas need to be enlarged by about 50% in each direction
Resolution: Increased Phaser tile/card dimensions from 130x78 to 195x117 (about +50% in both width and height), and kept interaction/selection behavior aligned to the new size.

---

title: Remove background text
status: complete
description: There is still text behind the cards on the canvas, this is distracting. Let's remove the text and replace it with an image you generate that is a soft grey granite pattern
Resolution: Removed the canvas legend and coordinate overlay text, and added a generated soft grey granite texture as the scene background.

---

title: Card backgrounds should be actual card art
status: complete
description: The card on the canvas should display the actual card art
Resolution: Added support for `artUrl` in the card catalog and Phaser card-face rendering now loads and displays card art when an image URL is provided; fallback rendering remains active until art files/URLs are supplied. Added a throttled caching script and expanded the local archive to 15 cards; only `plane-ivy-lane` is still missing an image.
Resolution: Updated deck creation to include only planes with both `artUrl` and full `rulesText`, which removes incomplete entries from playable draws so in-session cards consistently render real cached art.

---

title: Grey background not fully covering
status: complete
description: If you pan the background image gets moved out of place and you see the black behind it
Resolution: Updated the granite tile background to be viewport-locked (`setScrollFactor(0,0)`) while still updating tile position for texture motion, preventing exposed black edges during camera pan.

---

title: Open plane on landing
status: complete
description: When you land on a plane, the plane modal should open
Resolution: Movement completion now enqueues a `PLANE` modal using the landed plane ID and transitions to `MODAL_OPEN`, so landing always opens the plane modal.

---

title: Debug bar closed
status: complete
description: debug bar should start closed
Resolution: Updated the debug panel default collapsed signal to `true` so the panel starts closed in dev mode.

---

title: More info in plane modal
status: complete
description: When the plane modal is opened, the full text for the plane card should be in the modal body
Resolution: Modal body now prefers full `rulesText` from plane metadata (with `chaosText` fallback), and data sync now populates modal rules from MTGJSON card text. 15 of 16 planes now have full modal text, with `plane-ivy-lane` still missing from MTGJSON plane files.
Resolution: Updated playable deck filtering so cards missing full rules text are excluded from session draws, ensuring plane modals always show complete card rules for active gameplay cards.

---

title: Modal causes shift
status: complete
description: When the modal opens, the buttons in the game gontrols bar are hidden, this is causin content shift and it is distracting.
Resolution: Reworked modal presentation to a non-blocking anchored panel (top-right) with non-intercepting backdrop, so control bar buttons remain visible and the modal no longer causes distracting layout/visibility shifts.
reason-reopened: New modal position is good, but the issue is because the .status element in .controlBar isn't as tall as button elements in that row so when there are no buttons the bar shrinks in vertical height. The solution is to set a minimum height on that bar so it doesn't change height between having no buttons and changing one button
Resolution: Added a fixed `min-height` to `.controlBar` so the controls row keeps constant height whether buttons are present or not, eliminating vertical jitter when modal state changes.

---

title: No art showing
status: complete
description: even with the art cached, I am not seeing the art appear on the cards
Resolution: Normalized cached `artUrl` values to root-relative paths in `DeckService` and added Phaser loader fallbacks for both `/assets/...` and `assets/...` URL variants; this resolves asset path mismatches that prevented card art textures from loading.
reason-reopened: console full of 404 errors for image assets /assets/plane-art/{image}.jpg
Resolution: Changed art URL resolution to prefer relative `assets/...` paths first and added subpath-aware fallback candidates before root paths, so cached art loads correctly when the app is served from a nested path.
reason-reopened: Still no art, does that directory need to be moved to /public/ I do not see it in the dist files either. Are we possibly misconfigured in our compiler configuration? hitting the URL directly doesn't work. If it matters I am running the application locally through `npm run start`
Resolution: Updated Angular build assets configuration to publish `src/assets/**` to `/assets` (in addition to `public/**`), which restores runtime serving for cached plane art files and fixes the `/assets/plane-art/*.jpg` 404s.

---

title: Art doesn't show at the right time
status: complete
description: The art for a plane does not show until AFTER you move away from the plane, it should show right away.
Resolution: Updated tile render signatures to include art-load state, so tiles re-render immediately when art textures finish loading and art appears on the active plane without requiring additional movement.

---

title: No way to zoom in/out
status: complete
description: As a user, I may need to zoom in/out to show the planes closer. lets set the current view as all the way zoomed out and allow the players to zoom in to the point where the planes are 300% size
Resolution: Added Phaser camera zoom controls with mouse wheel and keyboard shortcuts (`+`, `-`, `0`), using a 1.0 to 3.0 zoom range so the default view starts fully zoomed out and players can zoom up to 300%.
reopen-reason: Zooming causes text to get blurry, instead lets resize the actual assets and start at a 50% zoom-out with a max of 150%. In order to make this work please also increase the font size of the title. Additionally, users should be able to pinch for zooming as well as having a UI element that they can interact with via mouse to zoom in/out
Resolution: Replaced camera zoom with asset-scale zoom (viewport/card resizing) to avoid blur, set default zoom to 50% with a 150% max, increased title font sizing at larger zoom levels, and added pinch plus on-canvas +/- controls for mouse/touch zoom interaction.
reopen-reason: initial plane doesn't zoom the same as the rest of the planes. scroll wheel zoom only allowing between 90 & 110%. Starting percentage decision earlier was wrong, should start at 100% and double the size of the rendered cards at 100%
Resolution: Fixed wheel zoom to use UI zoom state (not camera zoom), included zoom factor in tile render signatures so the centered starting plane re-renders consistently with zoom changes, set default zoom to 100%, and doubled base rendered card dimensions at 100% scale.

---

title: Name gets lost in image
status: complete
description: On some imaes, the name gets lost in the image. Make the text a little bolder and add some kind of backdrop or shadow behind it to separate from the imae behind it
Resolution: Improved plane title readability by rendering labels in bold with text shadow and adding a semi-opaque backdrop panel behind card names.



### Functional

title: Initial navigation creates wrong shape
status: complete
description: After the first movement, the board fills out a diamond pattern from -3, 0 to 3, 0 and 0, -3 to 0, 3. It should only be creating the immediately adjacent squares.
Resolution: Updated post-move map expansion to only ensure adjacency around the active party tile (radius 0), preventing full-radius diamond growth after a single move.

---

title: Movement doesn't reveal name
status: complete
description: When a player moves to a new plane, the name of the plane should be revealed
Resolution: Movement completion now flips the destination tile face-up, and face-up tiles render the plane name while face-down tiles remain unlabeled.

---

title: Chaos modal doesn't show correct info
status: complete
description: Currently, when the modal opens the title is "Current Plane" when it should be the actual name of the current plane (such as Akoum, Ivy Lane). The text in the modal should be the text for the chaos ability
Resolution: Chaos modals now rely on `planeId` metadata for title resolution and pull body content from each plane's `chaosText` in the local card catalog.

---

title: Plane name using wrong value
status: complete
description: We are using the wrong value for the plane name we render, we need to use the human readable version of the name (spaces instead of hyphenss, uppercase letters)
Resolution: Plane labels now use catalog names when available and automatically humanize plane IDs as a fallback (e.g. `plane-ivy-lane` -> `Ivy Lane`).

---

title: Players shouldn't need to complete movement
status: complete
description: players shouldn't need to click to finish movement after confirmation, this should happen automatically after movement is finished rendering
Resolution: Removed the manual `Complete Movement` UI action and updated the orchestrator to auto-dispatch `movement_complete` immediately after `confirm_move` transitions into `MOVING`.

---

title: Tiles not getting assigned
status: complete
description: When a player is revealed, it has a generic name. It should have been assigned a plane and show that plane instead of the placeholder name
Resolution: Post-move map processing now replaces placeholder `plane@x,y` IDs using draws from `deck.drawPile`, and updates draw pile state so newly revealed neighbors use real plane IDs.

---

title: Double clicking should confirm move
status: complete
description: when you double click while moving, that should confirm the move
Resolution: Added confirm-click behavior for the selected tile in `CONFIRM_MOVE`; second click on that tile dispatches `domain/confirm_move`, and movement auto-completes through orchestrator flow.

---

title: Double clicking plane to show
status: complete
description: if you are not moving, double clicking a plane should show that planes modal and snap that plane to the center of the viewport
Resolution: Added non-movement double-click behavior on face-up planes to open a `PLANE` modal for that tile and set camera focus to center the clicked plane in the viewport.

---

title: json missing data
status: complete
description: It feels like cards.json is missing some data, please reparse the information from mtgjson to populate that file with complete information. 
Resolution: Added `cards:sync:mtgjson` script to reparse plane metadata from MTGJSON (`OPCA`, `OPC2`, `OHOP`, `HOP`, `PHOP`) and populate fields like `rulesText`, `typeLine`, `types`, `subtypes`, set/number, and IDs; 15/16 planes now resolve directly from MTGJSON with existing fallback retained for `plane-ivy-lane`.

---

title: debug bar not useful
status: complete
description: The debug bar in it's current state is not very useful. Most of the buttons are never enabled or ever useful. Let's remove most of the functionality that is there and replace it with the following:
- roll dice (random) - Roll a dice at random, like the controller button does
- roll dice (chaos) - Trigger a chaos roll
- roll dice (planechase) - Trigger a planechase roll
- show hidden cards - reveal all face down cards
Resolution: Replaced the debug panel controls with only the requested actions and added orchestrator debug helpers for forced chaos/planeswalk outcomes and revealing all face-down tiles.

---

title: Debug panel missing session start and restart controls
status: complete
description: The debug panel needs explicit Session Start and Session Restart actions for facilitator testing flows.
Resolution: Added `Session Start` and `Session Restart` actions to the debug panel and wired them through orchestrator debug helpers for facilitator testing workflows.

---

title: Initial reveal should only flip center tile
status: complete
description: On initial session start, only the center tile should be face-up. Adjacent bootstrap tiles should remain face-down until revealed by gameplay.
Resolution: Bootstrap reveal reducer flow now flips only center tile (`C`) and leaves N/E/S/W hidden; unit tests were updated to enforce center-only reveal behavior.

---

title: Map scene re-renders full board on every state update
status: complete
description: The Phaser map scene currently destroys and recreates all rendered tile objects on each state update. This should be optimized to incremental updates to improve scalability and reduce rendering overhead as board size grows.
Resolution: Refactored `MapScene` rendering to tile-level diff updates keyed by coordinate/signature so only changed/added/removed tiles are re-rendered instead of rebuilding the full board each update.

---

title: All tiles are always interactive in Phaser scene
status: complete
description: The map scene currently sets all tile frames as interactive regardless of current FSM interaction needs. Restrict interactivity to relevant tiles/states to reduce unnecessary input handlers and improve performance.
Resolution: Added explicit interactivity gating helpers and updated `MapScene` to enable pointer interaction only for selectable/confirm tiles and inspect-eligible face-up tiles.

---

title: Deck lifecycle missing discard and recycle behavior
status: complete
description: Revealed/decayed cards should be moved to discard pile, and when draw pile runs out the discard pile should be recycled into draw pile so play can continue without placeholder fallback.
Resolution: Added discard accumulation for decayed planes plus deterministic discard-to-draw recycle logic during placeholder assignment; added reducer tests covering recycle behavior.

---

title: Placeholder card assignment order should be explicitly deterministic
status: complete
description: Assignment of newly created placeholder tiles currently depends on object entry iteration order. Sort/define a canonical coordinate ordering before consuming draw pile to guarantee deterministic replay behavior.
Resolution: Placeholder assignment now sorts coordinates canonically (Y then X) before consuming deck draws, with reducer tests verifying deterministic mapping order.

---

title: Modal accessibility and keyboard behavior hardening
status: complete
description: Modal host lacks accessibility semantics and keyboard/focus handling. Add dialog semantics, focus trap, and escape/keyboard behavior so modal interactions are accessible and predictable.
Resolution: Added dialog ARIA semantics, focus targeting/trapping (`Tab`/`Shift+Tab`), and `Escape` close handling to `ModalHostComponent`, with coverage added in modal host tests.

---

title: Debug actions should use reducer/intents consistently
status: complete
description: Debug helpers currently include direct state mutation paths outside reducer-driven intent flow. Route debug actions through explicit intents/reducer handling (with logging where appropriate) to preserve traceability and consistency.
Resolution: Introduced explicit `domain/debug_force_roll` and `domain/debug_reveal_all` intents and routed debug orchestrator methods through standard `dispatch` reducer flow.

---

title: Allow user to select which sets to pull planes cards from
status: complete
description: Currently we load a slim subset of available planes, we should add an option that is available before the user hits start session that shows all the sets that do contain planes and all the players to check or uncheck the ones they want included. The planechase sets should be checked by default. We will need to reseed our cards file with way more card information. This should also cover phenomenon if they are implemented, if not the documentation for their implementation should be updated to include future support for this. 
Resolution: Added pre-session set selection controls in the control bar, defaulting Planechase-family sets when available, and wired selected set codes into `start_session` deck creation filtering. Expanded MTGJSON sync script logic to append newly discovered planes so `cards.json` can be reseeded with broader set coverage, and updated phenomenon spec to include set-filter compatibility considerations.
reason-reopened: Only seeing Planechase anthology (OPCA) as an option to select for starting a session. We also need to enforce that at least one option is selected. Please fix this so I can select each available option
Resolution: Set selection now always lists all Planechase-family set options (`OPCA`, `OPC2`, `OHOP`, `HOP`, `PHOP`) and the control logic prevents deselecting the final remaining set so at least one option is always selected.

---

title: Enforce minimum deck size before session start
status: complete
description: Starting a session with too few planes creates unstable gameplay. Require at least 5 playable planes in the selected set combination before allowing start.
Resolution: Added minimum deck-size enforcement (5 planes) in `DeckService` deck creation and disabled start action in the control bar when selected sets do not meet the threshold.

---

title: Show draw/discard order in debug panel
status: complete
description: Facilitators need visibility into remaining draw pile order and discard pile order for deterministic validation and troubleshooting.
Resolution: Added ordered draw-pile and discard-pile debug sections to the debug panel, bound directly to session state deck slices.

---

title: Add quit session action to return to set selection
status: complete
description: Users need a direct way to leave an active session and return to setup to pick a new set combination.
Resolution: Added a `Quit Session` control that dispatches `domain/restart_session`, returning the app to `SETUP` and enabling immediate set reselection.

### Documentation

title: Replace boilerplate root README
status: complete
description: Root README is still Angular boilerplate and does not document project-specific setup, architecture summary, development workflow, or supported scripts.
Resolution: Replaced root README with project-specific onboarding content, core commands, architecture summary, workflow file references, and current project status.

---

title: Add contributor runbook
status: complete
description: Create a single contributor guide covering role usage (ROLES.md), issue workflow (ISSUES.md), verification expectations (unit tests/build), and commit/update conventions.
Resolution: Added `docs/10-contributor-runbook.md` with role lifecycle guidance, issue workflow, standard verification sequence, and scope/quality expectations.

---

title: Document card/art data pipeline
status: complete
description: Add end-to-end documentation for card metadata and art ingestion/sync scripts, including run order, throttling expectations, and known data gaps.
Resolution: Added `docs/11-card-art-data-pipeline.md` documenting sources, scripts, execution order, guardrails, and known metadata/art coverage gap.

---

title: Add assets and serving troubleshooting doc
status: complete
description: Document Angular asset configuration, expected dist output paths, and common 404 troubleshooting steps for cached plane art.
Resolution: Added `docs/12-assets-serving-troubleshooting.md` with required Angular asset config, verification path checks, and 404 troubleshooting steps.

---

title: Sync delivery-plan with post-milestone workflow
status: complete
description: Update docs/08-delivery-plan.md to reflect that milestone implementation is complete and ongoing work is now UAT/polish and issue-driven.
Resolution: Updated `docs/08-delivery-plan.md` with a post-milestone execution section that defines issue-driven UAT/polish workflow and references `ISSUES.md` as operational backlog.

---

title: Add UX behavior spec addendum
status: complete
description: Document current agreed runtime UX behaviors (landing modal, plane inspect double-click and recenter, debug panel controls, modal placement behavior).
Resolution: Added `docs/13-ux-behavior-spec.md` to consolidate current runtime interaction and modal behavior expectations.

---

title: Add UAT and release readiness checklist
status: complete
description: Add a checklist for facilitator testing, browser coverage, asset validation, and regression gates required before release candidate sign-off.
Resolution: Added `docs/14-uat-release-checklist.md` with functional, visual, data, quality-gate, and release-documentation checkpoints.

---

title: Fix docs encoding issues
status: complete
description: Normalize documentation encoding and replace garbled characters in docs/README.md to ensure long-term readability and maintainability.
Resolution: Rewrote `docs/README.md` with normalized ASCII-safe content and updated index entries, removing prior garbled encoding artifacts.

---

title: Define phenomenon card support specification
status: complete
description: Create a documentation spec for phenomenon support that defines play pattern, backend/state flow, and UX flow before implementation starts.
Resolution: Added `docs/15-phenomenon-support-spec.md` defining proposed phenomenon play pattern, state/FSM behavior, UX flow, and implementation readiness criteria.


---

title: Art cache script failure details are opaque
status: complete
description: Image fetching script consistently reports failure counts but does not identify which card/image failed or why.
Resolution: Updated the cache script to capture per-card failures and print a structured failure detail list with plane ID, resolved name, and error reason at the end of each run.

---

title: Hide sets with zero cards
status: complete
description: Set selection should not display sets that currently resolve to zero playable cards.
Resolution: Set option generation now derives only from playable cards and no longer injects zero-count defaults, so setup only shows sets that can produce playable planes.

---

title: Remove milestone/development progress UI from player-facing surfaces
status: complete
description: Any UI element showing current milestone or development progress should be moved out of the user-facing gameplay interface.
Resolution: Removed the milestone subtitle from the main app header so player-facing UI no longer shows internal development progress text.

---

title: Move current state indicator out of Game Controls
status: complete
description: Current state indicator should not appear in the main Game Controls row; move it into the debug panel for now.
Resolution: Removed the state chip from Game Controls and moved the current FSM state indicator into the debug panel body.

---

title: Add AGENTS guidance for "add new feature" documentation workflow
status: complete
description: AGENTS instructions should define how to handle "add new feature" requests: capture feature details, evaluate and surface gaps to the user, complete a clarification loop, then update docs in `docs/` when requirements are sufficiently defined.
Resolution: Added a dedicated Feature Intake Workflow section to AGENTS.md covering requirement capture, gap analysis, clarification loop, and docs updates when feature details are implementation-ready.

---

title: Missing planes from Doctor Who and supplemental sets
status: complete
description: Plane cards from the Doctor Who set are missing, and there may be additional gaps across other supplemental plane sets that need ingestion/validation.
Resolution: Expanded MTGJSON sync scope to include the `WHO` set and ran a reseed; `cards.json` now contains 36 Doctor Who planes (`who_planes=36`) and updated metadata for existing entries.

---

title: Improve modal rule readability and visual emphasis
status: complete
description: Modal does not convey rules information clearly at a glance; increase text size and redesign the modal experience to be more attention-grabbing while remaining readable.
Resolution: Updated modal visuals with larger typography, stronger contrast, animated entry, and an attention bar to make rules content easier to scan and more visually prominent.

---

title: Add immediate dice roll feedback in UI
status: complete
description: Users need visible feedback when rolling the die beyond the event log, such as a transient popup/toast message that fades.
Resolution: Added a transient roll-result toast (`CHAOS`, `PLANESWALK`, `BLANK`) that appears on die-resolution log events and fades automatically.

---

title: Centralize plane set code definitions across deck and pipeline logic
status: complete
description: Deck service and related workflows maintain plane set code lists in multiple locations, which caused omissions like missing Doctor Who (`WHO`). Extract set code definitions into a single shared source and consume that source everywhere.
Resolution: Added shared `src/assets/plane-set-config.json` and consumed it from both DeckService and MTGJSON sync script, eliminating duplicated set-code sources and keeping WHO/default labels in sync.

---

title: Improve JSDoc coverage for function inputs and outputs
status: complete
description: Existing JSDoc blocks often omit explicit parameter and return value documentation. Update comments to consistently describe inputs, outputs, and key side effects where relevant.
Resolution: Expanded JSDoc in orchestration/debug/control and sync-pipeline modules to include explicit `@param`/`@returns` descriptions and clarified side-effect methods used in runtime control flows.

---

title: Do not require confirmation when user explicitly asks to add issues
status: complete
description: When the user asks to add issues, the agent should update `ISSUES.md` directly without asking for additional confirmation prompts.
Resolution: Updated AGENTS issue workflow rules to explicitly require direct issue insertion when user asks to add issues, without additional confirmation prompts.

---

title: Add runtime control to disable dev mode until reload
status: complete
description: Dev mode should include a button that disables dev-only behavior for the current session and keeps it disabled until the page is reloaded.
Resolution: Added `DevModeStore` with runtime disable-until-reload behavior and wired it into debug panel, orchestrator, and Phaser bootstrap so dev-only features can be switched off immediately.

---

title: Replace repeated intent type literals with shared constants
status: complete
description: Intent type values and other constants are duplicated as raw strings across the codebase. Extract them into shared constants/enums and update call sites to reduce typo risk and improve maintainability.
Resolution: Added centralized `DOMAIN_INTENT`, `DIE_OUTCOME`, and `MODAL_TYPE` constants in `intents.types.ts` and refactored runtime dispatch/reducer code to use those shared constants instead of repeated literals.

---

title: Move inline Angular component templates to standalone HTML files
status: complete
description: Angular components currently using inline `template` strings should be refactored to use dedicated `.html` template files for readability, consistency, and maintainability.
Resolution: Refactored control-bar, debug-panel, modal-host, and error-banner components to use external `templateUrl` HTML files with matching component stylesheets.

---

title: Reduce inline component CSS and extract non-trivial styles to stylesheet files
status: complete
description: Components with more than minimal inline styles should move styles into dedicated stylesheet files to improve readability and long-term maintenance.
Resolution: Removed inline style blocks from key UI components and moved styling into dedicated `.scss` files, reducing decorator noise and improving maintainability.

---

title: Update code guidelines to require separate HTML and CSS files for components
status: complete
description: Documentation/guidelines should explicitly encourage and standardize external template (`.html`) and style (`.scss`) files rather than inline component definitions.
Resolution: Updated contributor runbook with explicit frontend structure rules requiring separate component `.ts`/`.html`/`.scss` files and discouraging non-trivial inline templates/styles.

---

title: Replace hardcoded style values with design tokens/CSS variables
status: complete
description: Current styles use hardcoded colors/sizing. Migrate to a token-based approach leveraging CSS variables (including Bootstrap variable conventions) for consistency and theming.
Resolution: Added global `--be-*` design tokens in `styles.scss` (Bootstrap-variable backed where available) and migrated refactored UI/app styles to consume tokenized colors, spacing, borders, and typography.

---

title: Standardize CSS naming to BEM and update docs
status: complete
description: Class naming is inconsistent. Adopt BEM naming across components, update stylesheets/selectors, and document the convention in project guidelines.
Resolution: Applied BEM class naming across refactored app/UI templates and stylesheets and documented the convention in the contributor runbook.

---

title: Ensure component styling uses properly nested SCSS structure
status: complete
description: Refactor stylesheet structure to use consistent, properly nested SCSS patterns for clarity and maintainability.
Resolution: Reworked component and app styles into nested SCSS block structures, keeping selectors scoped and readable under each component root block.

---

title: Default selected set should be OPCA
status: complete
description: In setup, the default selected set should be `OPCA` (not all sets) unless explicitly changed by the user.
Resolution: Updated control-bar initialization to select only OPCA by default when available, with a first-set fallback when OPCA is absent.

---

title: Enforce single-copy rule per plane card in deck construction
status: complete
description: Session deck generation should prevent duplicate card IDs so each specific plane appears at most once in draw/discard lifecycle.
Resolution: Added deduplication in deck creation by normalizing `planeIds` to unique IDs before deterministic shuffle, and added regression coverage in deck-model tests.

---

title: Open plane info modal on initial reveal
status: complete
description: When the first plane is revealed at session start, automatically open the plane info modal so players immediately understand the active plane's effects.
Resolution: Bootstrap reveal now enqueues and opens a plane modal for the revealed center plane, resuming to IDLE on close; reducer and orchestrator tests were updated accordingly.

---

title: Prevent accidental Quit Session clicks when controls reflow
status: complete
description: During chaos/modal transitions, Roll Die buttons disappear and Quit Session shifts under the pointer, making accidental quits too easy. Stabilize control layout and/or add confirmation/guard so quit cannot be triggered unintentionally.
Resolution: Added a confirmation guard to Quit Session so restart dispatch only occurs after explicit user confirmation, preventing accidental session termination from control reflow clicks.

---

title: Hide debug/event panels when dev mode is off and expand canvas area
status: complete
description: Dev mode should control visibility of Event Log and Debug sections. When dev mode is disabled, hide both panels and let the Phaser canvas expand to fill available space without introducing page scrollbars.
Resolution: App layout now conditionally hides Event Log and Debug sections when dev mode is disabled and switches to single-column content so the canvas fills available area without layout spill.


---

title: Add legal notice for third-party card metadata and cached art assets
status: complete
description: Create a legal documentation file stating project does not claim ownership of `cards.json` source data or cached plane art images and provide proper attribution/source disclaimer language.
Resolution: Added `THIRD_PARTY_NOTICE.md` with clear ownership/disclaimer language for `cards.json` metadata and cached plane art, and linked it from docs index for visibility.

---

title: Prevent duplicate modal open/queue entries for same target
status: complete
description: A modal that is already active or already queued (for example same plane like `kessig`) should not be opened or queued again. Deduplicate modal enqueue/open behavior by modal identity.
Resolution: Modal enqueue now rejects duplicates by modal ID and by plane-target identity (`type` + `planeId`) across active and queued entries, preventing repeated plane modal stacking.

---

title: Modal should be draggable and remember position
status: complete
description: Active modal panel should support click-and-drag repositioning and persist its last position across modal opens within the session.
Resolution: Modal panel header now supports pointer drag movement, and the modal offset persists while the app session remains active so reopened modals keep the user-adjusted position.

---

title: Increase modal close button size and click target
status: complete
description: Modal close button should be visually larger with a larger interactive hit area for better usability.
Resolution: Updated modal close action styling to enforce a larger minimum hit area and stronger visual affordance for easier interaction.

---

title: Add AGENTS role-command guidance for task execution patterns
status: complete
description: Update `AGENTS.md` with explicit command-style guidance for assuming specific roles and running their expected tasks (for example: Senior Developer for code review/optimization and best-practice refactors, Technical Product Manager for issue/doc review and updates, etc.).
Resolution: Expanded `AGENTS.md` with explicit role command patterns describing expected execution behavior for Senior Developer, Technical Product Manager, and QA Lead workflows.

---

title: Move default set selection to shared set-config source
status: complete
description: Setup default selection currently hardcodes `OPCA` in UI logic. Default set behavior should be sourced from shared plane-set configuration to avoid future config drift.
Resolution: Removed hardcoded `OPCA` default selection and now source preferred default set from shared plane-set configuration via DeckService.

---

title: Add AGENTS rule to notify when role/persona changes
status: complete
description: Update AGENTS.md with an explicit rule that whenever a previously requested role/persona is no longer active and the default persona is assumed, the agent must proactively notify the user of that transition.
Resolution: Added AGENTS rule requiring proactive user notification whenever active role/persona context is dropped and default persona handling resumes.



---

title: Starting tile double-click does not open modal; verify tile instantiation consistency
status: complete
description: Double-clicking the starting tile does not open its modal. Investigate whether the starting tile is created/instantiated differently from other tiles and normalize behavior so inspection interactions are consistent.
Resolution: Replaced timing-based double-click detection with deterministic two-click inspect behavior (first click focuses/centers tile, second click opens modal), which normalizes starting-tile and non-starting-tile interactions.

---

title: Replace browser confirm quit flow with app-native confirm interaction
status: complete
description: `window.confirm` in control flow is blocking and hard to style/test. Replace with app-native confirmation behavior (modal/intent-based) to keep UX and architecture consistent.
Resolution: Removed blocking `window.confirm` usage and implemented an in-app two-step quit confirmation (`Quit Session` -> `Confirm Quit` / `Keep Playing`) with updated tests.

---

title: Avoid event-log projection work when dev panels are hidden
status: complete
description: App currently computes reversed/sliced event-log view on state updates even when Event Log is hidden. Gate or defer this work when dev-mode panels are not visible.
Resolution: `AppComponent` now skips event-log projection when dev mode is off and uses a bounded reverse iteration when visible to avoid full-array copy/reverse work.



---

title: Establish a consistent and appealing visual style system
status: complete
description: Application UI needs a cohesive visual language across layout, typography, surfaces, spacing, and interactive elements.
Resolution: Introduced a cohesive token-driven visual system (panel surfaces, shadows, typography, backgrounds, and control styling) and updated app shell styling to use a consistent presentation across gameplay UI.

---

title: Add switchable MTG-themed visual themes with persisted preference
status: complete
description: Implement user-selectable visual themes that control UI background images/colors, border colors, text colors, and related styling tokens. Support four themes: Phyrexian, Neon Dynasty, Lithomancy, and Halo Fountain; remember user selection across sessions.
Resolution: Added a persisted theme system with four selectable MTG-inspired themes (Phyrexian, Neon Dynasty, Lithomancy, Halo Fountain), a header theme picker, and CSS variable overrides applied via root theme attribute.


---

title: Modal popup flickers from default position to saved position on open
status: complete
description: Modal currently renders at the default location briefly before applying saved drag offset, causing visible position flicker. Apply saved position at first paint so modal opens directly at persisted coordinates.
Resolution: Modal positioning now uses CSS custom properties from first paint, and modal open animation respects saved offsets, eliminating the visible jump from default to persisted position.

---

title: Refine MTG theme implementations for stronger world-accurate art direction
status: complete
description: Current themes need deeper visual polish and stronger identity. Lithomancy should shift to lighter white/tan Zendikar-inspired styling with hedron visual motifs; Phyrexian should feel oily and biomechanical with matching UI treatment; remaining themes should receive similarly distinctive directional refinement.
Resolution: Refined theme tokens and overlays for stronger world identity, including a lighter Zendikar-inspired Lithomancy palette with hedron-like geometric motifs and an oily, biomechanical Phyrexian treatment.

---

title: Disable Roll Die button while roll-result toast is visible
status: complete
description: During active roll toast display, the Roll Die control should remain visible but disabled instead of disappearing, to preserve layout stability and prevent accidental clicks on neighboring controls.
Resolution: Control bar now keeps Roll Die visible during roll toast display and disables it instead of removing it, preserving layout stability during state transitions.

---

title: Audit AGENTS/context strategy for portability and LLM efficiency
status: complete
description: Review `AGENTS.md` and the broader project setup used to feed LLM context, then produce actionable issues to improve process quality and portability across projects. Include opportunities such as skill-based workflows, explicit context include/exclude rules, file prioritization, and reusable conventions that reduce token overhead while preserving decision quality.
Resolution: Completed an AGENTS/context audit and generated targeted follow-up issues covering context manifests, reusable skills, budget guardrails, startup validation, and docs normalization automation for portability.



---

title: Add portable LLM context manifest with include/exclude rules
status: complete
description: Create a repository-level context manifest (for example LLM_CONTEXT.md or context.manifest.json) that explicitly defines high-priority include files and low-value exclude paths (generated output, caches, archives, binaries) so the setup is portable across projects and minimizes token waste.
Resolution: Added LLM_CONTEXT.md with explicit include/exclude guidance, context budget targets, and portability rules for reuse across projects.

---

title: Introduce reusable project skills for issue workflow and documentation hygiene
status: complete
description: Add Codex skills that encapsulate repeated workflows used in this project (issue lifecycle updates, archive movement, doc trimming, release readiness checks) so the process can be reused with minimal prompt overhead in future repos.
Resolution: Added reusable local skills at .codex/skills/issue-workflow/SKILL.md and .codex/skills/doc-hygiene/SKILL.md and referenced them from AGENTS workflow guidance.

---

title: Define context budget and document size guardrails for active docs
status: complete
description: Add explicit token/length guardrails for active coordination docs (AGENTS.md, ROLES.md, ISSUES.md) and define trimming/archiving triggers to prevent context bloat over time.
Resolution: Added explicit line-count guardrails and trim-before-growth rules to AGENTS.md, including archive-first guidance when active docs exceed limits.

---

title: Add startup verification checklist for agent operating context
status: complete
description: Create a concise startup checklist that validates required control files are present, current, and internally consistent (AGENTS.md/ROLES.md/ISSUES.md/docs index), with fallback behavior when files are missing or stale.
Resolution: Added a startup verification checklist to AGENTS.md covering required control docs, optional context docs, status validation, and fallback behavior when files are stale or missing.

---

title: Add optional automation to lint and normalize working docs
status: complete
description: Provide a scriptable docs-maintenance pass to normalize formatting, section order, and issue entry schema in active tracking files so context remains machine-friendly and portable between projects.
Resolution: Added scripts/normalize-issues.mjs and npm command docs:normalize:issues to normalize active issue formatting and keep issue-tracking structure machine-friendly.

---

title: Roll Die remains disabled after chaos modal closes
status: complete
description: After a chaos roll triggers a modal, the Roll Die button stays disabled even once the modal is closed and the game returns to idle. Ensure control state re-enables Roll Die correctly after modal dismissal when gameplay is ready for another roll.
Resolution: Made `rollToastVisible` reactive via a signal-backed input setter and added regression coverage to verify the Roll Die button re-enables after toast clearance in IDLE state.




---

title: Phaser scene visuals should respond to selected application theme
status: complete
description: Phaser map scene palette/background currently remains static while app UI theme changes. Update Phaser scene colors/background treatment so it follows the active selected theme for a cohesive presentation.
Resolution: Added live theme synchronization in MapScene with theme-specific palettes and generated background textures; Phaser scene colors, tile treatment, HUD colors, and backdrop now update when app theme changes.


---

title: Migrate current app into the-blind-eternities repo and release as v2.0.0
status: complete
description: Pull https://github.com/NickGrant/the-blind-eternities, replace its existing project contents with this application, and prepare the migrated codebase as a major release by setting application version to 2.0.0 (reflecting a breaking/major change from prior repo state). Include any required project metadata/version updates needed for consistency.
Resolution: Added Git remote to target repository, bumped project version metadata to 2.0.0, and completed overwrite push to origin/main from this working directory.


---

title: Disable dev mode on GitHub Pages deployments
status: complete
description: The production build served via GitHub Pages should default to dev mode off so debug-only panels and controls are hidden in the hosted experience.
Resolution: Added production file replacement in angular.json so Pages/production builds use environment.prod.ts where dev is false, ensuring debug-only UI is disabled in hosted builds.

---

title: Constrain modal drag movement to viewport bounds
status: complete
description: Modal drag behavior should be clamped to the visible viewport so users cannot drag the modal off-screen (top edge above viewport, bottom edge below viewport, or similarly out of horizontal bounds).
Resolution: Modal drag now clamps pointer deltas against current panel bounds and viewport dimensions, preventing off-screen drag in any direction; added unit coverage for boundary clamping behavior.


---

title: Add game mode selection before session start (Regular Planechase vs Blind Eternities)
status: complete
description: Before starting a session, players should choose mode. Blind Eternities keeps current map-based implementation. Regular Planechase should show only one active plane at a time; when planeswalking resolves, replace the current plane with the next deck card instead of map movement flow.
Resolution: Added setup-time game mode selection in control bar and threaded mode through start-session intent/state config; implemented regular-mode planeswalk flow to replace the active plane directly (single face-up center tile) while preserving existing Blind Eternities adjacency flow.

---

title: Modal should be draggable from all non-button regions
status: complete
description: Modal dragging should be available from anywhere on the modal surface except interactive buttons, so users are not limited to header-only drag behavior while preserving button click intent.
Resolution: Expanded modal drag start handling to the full modal panel and excluded button-origin pointer events so users can drag from any non-button region without breaking click behavior.

---

title: Newlines in card text are not rendered in modal/body display
status: complete
description: Card rules text newline characters are currently flattened in HTML rendering. Improve text parsing/rendering so intended line breaks and paragraph spacing are preserved for readability.
Resolution: Added modal text newline normalization (`CRLF`/`CR` to `LF`) and switched modal body rendering to `white-space: pre-line`, so card text line breaks render as authored.
Resolution: Updated modal body formatting to emit escaped HTML with `<br /><br />` per newline for stronger vertical separation and improved readability.

---

title: Theme selector not updated when theme is applied on page load
status: complete
description: The theme dropdown should reflect the persisted theme immediately on initial load so UI control state matches the active visual theme.
Resolution: Bound option selected state to `selectedTheme()` so the picker now visibly matches the applied persisted theme on first render.

---

title: Cursor over modal does not indicate draggable state
status: complete
description: Modal can be dragged from non-button regions, but cursor feedback is inconsistent. Update cursor states (for example grab/grabbing) on draggable modal regions so users understand drag affordance and active drag state.
Resolution: Added modal panel drag cursors (`grab` idle, `grabbing` during pointer drag) and bound active dragging state to the panel class so cursor feedback now reflects drag affordance and active drag state.

---

title: Modal newlines need stronger vertical separation for readability
status: complete
description: Current newline rendering in modal body is too compact. Increase separation by parsing logical line breaks into paragraph blocks (`<p>`) or by rendering double breaks (`<br /><br />`) to improve scannability of card text.
Resolution: Updated modal text formatting to render each newline as `<br /><br />` (after newline normalization and HTML escaping), increasing vertical separation for faster rules-text scanning.

---

title: Disable canvas panning in Regular Planechase mode
status: complete
description: In Regular Planechase mode, camera/canvas movement should be disabled so the single active plane remains centered and in focus at all times. Prevent drag/pan interactions while this mode is active.
Resolution: Added mode-aware camera gating in `MapScene` so drag-based panning is disabled in `REGULAR_PLANECHASE`, and center-camera logic ignores pan offsets to keep the active plane fixed in focus.

---

title: Add player-facing "How to Use" help section
status: complete
description: Add an accessible in-app help section explaining controls and flow (starting a session, rolling, moving/planeswalking behavior per mode, modal usage, and debug-mode visibility notes). Content should be visible to non-dev users.
Resolution: Added a persistent in-app `How to Use` section to the control bar with non-dev-facing guidance on controls, roll outcomes, movement flow, modal behavior, and mode-specific play expectations.

---

title: Expand in-app rules/help content with mode and variant-specific behavior
status: complete
description: Extend the planned How-to-Use surface to include mode/profile-specific rules (startup reveal pattern, planeswalk behavior, Hellride eligibility, and phenomenon replacement handling).
Resolution: Expanded the help content with dynamic mode-specific guidance (`Blind Eternities` vs `Regular Planechase`) and reveal profile context, plus explicit variant-status notes for Hellride and phenomenon replacement work-in-progress.

---

title: Add runtime telemetry/log context for mode and variant outcomes
status: complete
description: Include game mode/rules profile and key variant outcomes (hellride used, phenomenon replacement chain count, reveal phase markers) in event logs to improve UAT diagnosis and reproducibility.
Resolution: Enriched reducer log metadata across setup, bootstrap, roll resolution, movement, and regular planeswalk events with `gameMode`, derived `rulesProfile`, and placeholder variant telemetry fields (`hellrideUsed`, `phenomenonReplaceCount`) for consistent UAT diagnostics.

---

title: Add Blind Eternities classic reveal profile (center + four adjacent face-up at start)
status: complete
description: Add a rules-profile option for Blind Eternities that follows the article-aligned startup reveal pattern (center plus N/E/S/W face-up on session start) while preserving deterministic deck usage and modal flow.
Resolution: Added selectable rules profiles and wired `BLIND_CLASSIC_PLUS` bootstrap behavior to reveal center plus N/E/S/W on bootstrap completion with deterministic assignment/reveal ordering.

---

title: Enforce ordered reveal pipeline phases for Blind Eternities turn resolution
status: complete
description: Refactor movement/reveal sequencing into explicit ordered phases (move -> land/enter effects -> board fill -> phenomenon resolve/replace -> finalize) and add deterministic log markers for each phase.
Resolution: Added deterministic phase markers in movement resolution logs (`move`, `board_fill`, `phenomenon_resolve`, `finalize`) with stable phase indexes and contextual metadata for reproducible diagnostics.

---

title: Add variant rules profile system across modes
status: complete
description: Introduce a first-class rules profile model (for example Blind Eternities Article, Blind Eternities Fog-of-War, Regular Planechase) to keep behavior differences explicit, testable, and selectable at session start.
Resolution: Introduced first-class rules profile values in intent/state flow, added setup-time profile selection UI, and connected profile-to-bootstrap mapping across Blind Eternities and Regular Planechase starts.

---

title: Add optional Hellride movement (diagonal into unrevealed void only)
status: complete
description: Implement Hellride movement as an optional rules toggle/profile behavior: allow diagonal movement only when target diagonal space is currently unoccupied/unrevealed; block if a revealed plane already exists there.
Resolution: Added an optional setup toggle for Hellride and updated movement eligibility to include diagonal targets only when enabled and unrevealed; revealed diagonal tiles remain blocked.

---

title: Add movement UI affordances for Hellride candidates
status: complete
description: When Hellride is enabled, distinguish diagonal Hellride movement options visually from standard adjacent movement options so users can understand available path types.
Resolution: Added dedicated Hellride candidate highlighting in Phaser using a distinct stroke color, exposed hellride highlight state separately from cardinal moves, and added contextual control-bar hint text during movement selection.

---

title: Hide Rules Profile picker when only one profile option is available
status: complete
description: The rules profile selector should not be displayed when there is only one valid profile choice for the selected game mode (for example Regular Planechase). Show the picker only when users can meaningfully choose between multiple profiles.
Resolution: Added conditional rendering for the Rules Profile picker so it only appears when multiple profile choices exist, keeping setup UI focused and less noisy.

---

title: Improve "How to Use" copy for player-friendly readability
status: complete
description: Current "How to Use" language is too technical and not easy to scan for typical players. Rewrite the section with simpler phrasing, clearer step-by-step guidance, and more concise wording oriented around player actions.
Resolution: Rewrote the in-app help text with simpler language, explicit step-by-step play guidance, and short action-focused descriptions for die results, movement flow, and modal interactions.

---

title: Enforce strict phenomenon-on-reveal replacement in Blind Eternities fill flow
status: complete
description: During board fill after movement, if a phenomenon is drawn, resolve it immediately, prevent it from persisting on the map, and continue drawing until a valid plane occupies that slot.
Resolution: Added strict fill-time replacement logic that detects phenomenon card IDs, discards them without placing them on the map, and keeps drawing until a plane is assigned or deck sources are exhausted; logs now record phenomenon replacement counts per move resolution.

---

title: Evaluate optional anti-stall/backtrack rule toggle for Blind Eternities
status: complete
description: Assess and optionally add a configurable anti-stall movement constraint (for example soft anti-backtrack) while keeping article-aligned behavior as default profile baseline.
Resolution: Implemented an optional setup toggle (`Prevent immediate backtracking`) that blocks moving directly back to the previously occupied plane when enabled, while keeping the default experience unchanged when disabled.

---

title: Add Google Analytics tracking for GitHub Pages deployment
status: complete
description: Integrate Google Analytics (GA4) in production/GitHub Pages builds to track usage metrics (sessions, page views, key interactions) with environment-based configuration so local/dev builds remain unaffected.
Resolution: Added a root analytics service that conditionally initializes GA4 from environment config, injects the gtag script once, and keeps tracking disabled by default until a production `analyticsMeasurementId` is provided.

---

title: Double-clicking a Hellride square does not trigger movement selection/confirm behavior
status: complete
description: Hellride diagonal candidates highlight correctly, but double-click interaction on those squares does nothing. Hellride tiles should follow the same double-click flow as other movement targets (select/confirm as applicable).
Resolution: Updated map-scene pointer handling to treat Hellride-selectable tiles as valid movement-selection targets, so Hellride squares now participate in the same click/double-click movement flow as standard selectable tiles.

---

title: Documentation consolidation blocker - resolve drift across core active docs
status: complete
description: Active docs are not yet consolidation-ready due behavior drift between `docs/13-ux-behavior-spec.md`, `docs/02-runtime-flow-fsm.md`, `docs/08-delivery-plan.md`, and current runtime. Execute a doc-sync pass so all active docs describe the same current behavior and active roadmap.
Resolution: Consolidated and synchronized core active docs (UX spec, runtime FSM, delivery plan, docs index, and UAT checklist) so they now describe current runtime behavior and current roadmap without conflicting statements.

---

title: Align Phenomenon specification with Blind Eternities article semantics
status: complete
description: `docs/15-phenomenon-support-spec.md` currently describes a modal-forward phenomenon flow that conflicts with article semantics. Update spec and implementation plan to match article behavior: phenomenon triggers immediately when revealed during fill, does not remain on the board, and is replaced by a plane in the revealed slot.
Resolution: Rewrote the phenomenon spec to article-aligned semantics: immediate in-flow resolution during fill, no persistent phenomenon tile placement, and replacement draw continuation until a plane fills the slot.

---

title: Add explicit documentation for enter-plane effect ordering before phenomenon resolution
status: complete
description: Document and test the ordering rule from the article: destination plane is entered first, then fill reveals occur, and any revealed phenomenon resolves after enter-plane effects. Add acceptance criteria and state-flow notes to runtime docs and phenomenon spec.
Resolution: Added explicit ordering requirements to runtime and phenomenon docs, including movement-pipeline sequencing notes and release/UAT checklist expectations for enter-plane then phenomenon resolution ordering.

---

title: Add article-alignment acceptance matrix for Blind Eternities rules
status: complete
description: Create a concise checklist/spec matrix mapping runtime behavior to article rules (initial reveal pattern by fog-of-war value, cardinal fill behavior, Hellride eligibility, phenomenon replacement semantics, and optional anti-stall deviations). Include explicit notes for intentional deviations.
Resolution: Added `docs/16-blind-eternities-article-alignment.md` as a maintainable alignment matrix with status columns, intentional deviations, and release-gate usage guidance.

---

title: Add priority levels to issue schema (low/medium/high)
status: complete
description: Extend active issue format to support a required priority field (`low`, `medium`, `high`) and keep priority preserved when moving entries between `ISSUES.md` and `ISSUES_ARCHIVE.md`. Update relevant guidance docs and issue-maintenance scripts accordingly.
Resolution: Updated issue schema guidance in `ISSUES.md` and operating rules in `AGENTS.md` to include explicit `priority` values and priority-aware triage ordering.

---

title: Align button groups to Bootstrap 5.3 checkbox/radio group pattern
status: complete
priority: low
description: Button groups should follow the Bootstrap 5.3 checkbox/radio button-group pattern for semantics and interaction behavior.
Resolution: Updated setup button-group markup to use Bootstrap-style `btn-group`/`btn-check`/label patterns with group roles and accessible labels for both Deck Sets and Game Mode controls.

---

title: Convert remaining checkboxes to switch-style controls
status: complete
priority: low
description: Remaining checkbox-style option controls should use switch presentation.
Resolution: Converted optional rules checkbox treatment to switch-style UI and kept Fog of War as a switch control with consistent styling and behavior.

---

title: Remove "(Fog Value 1)" text from Fog of War label
status: complete
priority: low
description: Remove the explicit "(Fog Value 1)" phrase from the Fog of War label copy.
Resolution: Simplified Fog of War switch label copy by removing the parenthetical value reference while preserving behavior.

---

title: Move playable-plane count text inside Deck Sets box
status: complete
priority: low
description: The playable planes helper text should be shown within the Deck Sets section.
Resolution: Moved the playable-plane count hint into the Deck Sets panel so setup context remains grouped with set selection controls.

---

title: Keep buttonless game-control sections the same height as buttoned sections
status: complete
priority: low
description: Control sections without active buttons should maintain comparable height to avoid layout jitter against sections that include buttons.
Resolution: Normalized minimum heights for toggle buttons and control action buttons to keep control-row layout visually stable when button presence changes.

---

title: Replace Phaser procedural theme backgrounds with generated art assets
status: complete
priority: high
description: Current Phaser-drawn theme backgrounds are not sufficient. Replace procedural/vector-drawn scene backgrounds with generated rendered art assets per theme. Use the prompt and negative-prompt direction from the most recent UX theme refinement issue in ISSUES_ARCHIVE.md as the source of truth for asset generation and visual alignment.
Resolution: Replaced Phaser procedural background drawing with per-theme rendered art assets (`src/assets/theme-backgrounds/*.svg`) and updated map scene background loading to use these assets with async texture loading and a fallback texture path.

---

title: Update session configuration UI to Bootstrap-style button groups and fog switch
status: complete
priority: high
description: Refactor setup controls for clearer UX. Deck Sets should remove set code text from display labels and be presented as a Bootstrap button-group style control using the radio button group pattern as a baseline. Game Mode should also become a button group in the same style, with Blind Eternities selected by default. Replace Fog of War select/radio controls with a single switch where the label describes Fog value `1` behavior, and default the switch to ON (value `1`).
Resolution: Updated setup controls to button-group toggles for deck sets and game mode, removed set-code text from deck-set labels, kept Blind Eternities as default mode, and replaced fog controls with a single switch for Fog value `1` behavior (default ON in setup; regular mode forces fog `0`).

---

title: Refine visual themes with stronger differentiation, prompt-driven art direction, and custom generated assets
status: complete
priority: high
description: Expand theme implementation to create materially distinct visual systems across all supported themes and incorporate the following prompt/negative-prompt direction as implementation targets for palettes, textures, imagery, and UI embellishments. Include custom image generation when needed (for separate UX surfaces, background variants, decorative overlays, and theme-specific graphic accents).
Resolution: Expanded theme token systems and scene rendering so each theme now has materially distinct palettes, typography, panel chrome, overlays, and Phaser background motifs aligned to the intended art direction. Added stronger theme-specific UI polish and procedural background embellishments so visual identity changes meaningfully across all four themes.

---

title: Replace phenomenon ID-prefix heuristic with explicit card-type metadata
status: complete
priority: medium
description: Phenomenon handling currently relies on card ID prefix checks (`phenomenon-`). Replace this with explicit card-type metadata in catalog/deck flow so phenomenon detection is data-driven and resilient to naming variance.
Resolution: Added explicit `cardTypesById` metadata in deck/session flow and switched phenomenon replacement checks to metadata lookup instead of ID prefix heuristics. Deck initialization now includes normalized card-kind mapping and tests cover phenomenon handling via metadata.

---

title: Add "What is Blind Eternities?" link to source article
status: complete
priority: medium
description: Add a clearly visible help link in the player-facing UI (for example in the How to Use section) labeled similarly to "What is Blind Eternities?" that opens the Blind Eternities article in a new tab so players can quickly read the original variant context and rules background.
Resolution: Added a player-facing help link in the How to Use section that opens the Blind Eternities article in a new tab with safe external-link attributes.

---

title: Cleanup session setup dialog controls (selects + Planechase naming)
status: complete
priority: medium
description: Refine setup dialog inputs for clarity and compactness. Replace Fog of War radio buttons with a select control where option values are `0` and `1`, and option labels include the descriptive behavior text. Replace Game Mode radio buttons with a select control and rename the displayed mode label from `Regular Planechase` to `Planechase` while keeping behavior unchanged.
Resolution: Replaced setup radios with select controls for Game Mode and Fog of War distance, keeping values explicit (`0`/`1`) and descriptions user-readable. Updated player-facing mode labeling to `Planechase` while preserving existing regular-mode behavior.

---

title: How to Use section should be two columns on desktop
status: complete
priority: medium
description: Update the player-facing How to Use layout to render in a two-column format on desktop/wider breakpoints while preserving a single-column layout on mobile for readability.
Resolution: Added desktop breakpoint styling to render How to Use content in two columns while retaining a single-column flow on smaller screens.

---

title: Replace "Rules Profile" setup with numeric "Fog of War" setting (1 or 2)
status: complete
priority: high
description: Remove the current "Rules Profile" configuration and replace it with a "Fog of War" setting that accepts only numeric values `1` or `2`. Behavior requirements: `1` means only the current square (current plane tile) is face up; on movement, only the destination square is turned face up. `2` means movement reveal follows the article-style directional reveal: after entering destination, reveal current square if needed, then reveal adjacent squares in NESW order until all empty adjacent cardinal squares are face up. Diagonal squares are excluded from this reveal behavior.
Resolution: Replaced setup-time Rules Profile selection with a numeric Fog of War control and updated gameplay to use distance-based reveal semantics. Per updated UX direction, this is now implemented as `0` (reveal entered square only) and `1` (reveal entered square plus adjacent cardinal squares) for Blind Eternities mode.

---

title: Remove Hellride toggle from setup; Hellride must always be on in Blind Eternities mode
status: complete
priority: high
description: Remove user-facing enable/disable controls for Hellride. In Blind Eternities mode, Hellride behavior should always be active and enforced in state/rules flow. Regular Planechase behavior remains unaffected.
Resolution: Removed Hellride controls from setup UI and help copy now states Hellride is always active in Blind Eternities. Movement eligibility now enforces Hellride diagonals automatically in Blind Eternities and keeps Regular Planechase behavior unchanged.

---

title: Add Bootstrap dependency and global stylesheet integration
status: complete
priority: high
description: Install Bootstrap 5.3 in project dependencies and wire its stylesheet globally so Bootstrap classes used in templates are actually backed by framework CSS instead of custom reimplementation.
Resolution: Added bootstrap@5.3.3 to dependencies and imported bootstrap/dist/css/bootstrap.min.css at the top of src/styles.scss, enabling framework-native styling across templates.

---

title: Remove custom control-bar button-group CSS and use Bootstrap-native button groups
status: complete
priority: high
description: Refactor control-bar button group implementation to rely on Bootstrap btn-group, btn-check, and button variant classes with minimal local overrides. Remove duplicated state/focus/checked styling currently implemented in control-bar.component.scss.
Resolution: Updated deck-set and game-mode controls to Bootstrap btn-check plus btn-group markup and removed custom checked/focus button-group styling from control-bar SCSS.

---

title: Refactor modal host shell to Bootstrap modal structure without behavior regression
status: complete
priority: high
description: The modal uses fully custom styling and structure. Migrate to Bootstrap modal classes/structure (modal, modal-dialog, modal-content, modal-header, modal-body, modal-footer) while preserving existing project-specific behavior (draggable panel, queued count, keyboard handling, viewport clamping).
Resolution: Migrated modal host markup to Bootstrap modal semantics while preserving drag interactions, queued-count display, keyboard handling, and viewport clamping behavior through existing component logic.

---

title: Phenomena not appearing in live gameplay; validate card data pipeline
status: complete
priority: high
description: Phenomenon cards are not surfacing during real gameplay runs. Investigate deck composition and runtime filtering to confirm phenomena are included when expected, and verify cards.json contains complete/valid phenomenon metadata required by current detection logic.
Resolution: Extended card sync and deck loading to include phenomena, added card-type metadata mapping in deck initialization, and refreshed cards.json so runtime draw/replacement logic can surface and handle phenomena correctly.

---

title: Replace custom switch styling with Bootstrap form-check form-switch pattern
status: complete
priority: medium
description: Update Fog of War and optional rules switches to Bootstrap switch markup (form-check form-switch plus form-check-input/form-check-label) and remove custom switch appearance rules from component SCSS.
Resolution: Replaced custom switch markup with Bootstrap form-check form-switch controls for Fog of War and optional rules and removed bespoke switch rendering styles from control-bar SCSS.

---

title: Migrate control bar action buttons to Bootstrap button variants/utilities
status: complete
priority: medium
description: Replace custom control-bar__button visual variants with Bootstrap button classes (btn, btn-primary, btn-secondary, btn-danger, disabled state) and keep component CSS focused on layout spacing only.
Resolution: Converted control-bar action buttons to Bootstrap button variants and reduced component CSS to layout-only button sizing via control-bar__button-slot.

---

title: Refactor debug panel controls to Bootstrap button and details styling
status: complete
priority: medium
description: Debug panel currently duplicates button/chip/panel styling. Migrate buttons and status chips to Bootstrap classes/utilities and reduce custom CSS to component-specific layout concerns.
Resolution: Updated debug actions and state chip to Bootstrap button/badge patterns, styled details sections with Bootstrap utility classes, and removed duplicated button styling from debug-panel SCSS.

---

title: Replace custom error banner styling with Bootstrap alert component pattern
status: complete
priority: medium
description: Update error banner to use Bootstrap alert semantics and classes (alert, severity variant, heading/body structure) and remove duplicated alert border/background/text styling from local SCSS.
Resolution: Refactored error banner markup to Bootstrap alert alert-danger semantics with heading/body structure and removed redundant custom border/background/title/message style definitions.

---

title: Reduce app shell panel/card style duplication via Bootstrap cards and utilities
status: complete
priority: medium
description: App shell reimplements panel surfaces, headers, spacing, and list presentation. Migrate reusable panel blocks (Game Controls, Event Log, Debug) to Bootstrap card/layout utility classes and keep theme-specific overrides token-based.
Resolution: Migrated core shell panels to Bootstrap card structure (card + card-body) and shifted app-shell styling toward tokenized overrides via card CSS variables instead of fully custom panel primitives.

---

title: Canvas background should not tile
status: complete
priority: medium
description: Phaser canvas theme backgrounds should render as a single composed scene background and should not visually tile/repeat across the viewport during camera movement or resize.
Resolution: Replaced the Phaser tiling background path with a single non-repeating image background that is scaled to cover the viewport, so camera movement and resize no longer produce visible tiling seams.

---

title: Fix theme color regressions after Bootstrap migration and improve theme contrast
status: complete
priority: medium
description: Inputs and buttons have theme color regressions after switching to Bootstrap classes. Audit and correct theme token/class overrides so controls remain theme-consistent, then evaluate text/background contrast across all themes with focused fixes for Phyrexian, Neon Dynasty, and Halo Fountain where dark text is hard to distinguish from darker backgrounds.
Resolution: Added a token-driven Bootstrap conformance layer in global styles to map body/text/border/button/form/badge/alert colors to theme variables, restoring themed control styling and improving text contrast across darker themes.

---

title: Add Bootstrap-conformance guardrails to documentation
status: complete
priority: low
description: Update coding/style guidance docs to require Bootstrap-first implementation for common UI primitives (buttons, groups, switches, alerts, cards, modals) and prohibit duplicating framework component styles unless explicitly justified.
Resolution: Updated contributor guidance with explicit Bootstrap-first rules for common UI primitives and documented that custom overrides should be scoped, token-based, and justified when Bootstrap defaults are insufficient.

---

title: Replace SVG theme backgrounds with raster art assets
status: complete
priority: high
description: Replace current Phaser theme background SVG files with raster art assets (theme-specific generated renders) for higher visual fidelity. PNG assets now exist and this issue is unblocked. Implementation requirements:
- normalize file naming so each theme key maps cleanly and consistently (for example `phyrexian`, `neon-dynasty`, `lithomancy`, `halo-fountain`; fix current `phyrexia.png` naming mismatch)
- convert/normalize image dimensions and format settings as needed so assets are consistent for runtime loading
- optimize/compress PNG files to reduce transfer and bundle weight while preserving acceptable visual quality
- update Phaser theme background loader mapping to use the raster assets
- remove legacy SVG background files after raster migration is validated
Resolution: Completed raster migration by normalizing theme PNG naming/mapping, deleting legacy SVGs, and replacing tiling behavior with viewport-fit background rendering. Added npm-native optimization flow (`assets:optimize:themes` and `assets:optimize:themes:dry`) backed by `sharp` and reduced theme background total size from 10.43 MB to 3.53 MB (66.11% saved).

---

title: Reduce initial bundle pressure by lazy-loading card catalog data
status: complete
priority: high
description: `DeckService` currently imports `src/assets/cards.json` directly into the application bundle, increasing initial JS payload and parse time. Move catalog loading to runtime asset fetch (or equivalent lazy mechanism) with caching/error handling to reduce startup cost and improve scalability as card data grows.
Resolution: Refactored deck catalog loading to runtime fetch via `DeckService.loadCatalog()` and wired app startup with an `APP_INITIALIZER` so the catalog loads before UI usage. Production build `main` bundle dropped from 1.59 MB to 1.51 MB raw.

---

title: Disable zoom controls when no cards are present on canvas
status: complete
priority: medium
description: Zoom in/out controls should be disabled when there are no rendered cards/tiles on the Phaser canvas to avoid non-functional interactions and reduce user confusion.
Resolution: Added zoom-control gating in `MapScene` so HUD controls become visually disabled and non-interactive when no tiles are rendered; zoom actions now no-op until cards are present.

---

title: Move set card counts to hover tooltips and validate counts include all cards
status: complete
priority: medium
description: In Deck Sets selection, remove always-visible per-set count text from button labels and show counts on hover/focus tooltip instead. Validate that displayed counts represent all playable cards in the selected set scope (planes plus any other supported card types), not planes-only counts.
Resolution: Removed inline count text from set buttons, added hover/focus tooltip text for playable card totals, and updated set-option counting logic to use all playable cards (planes plus supported non-plane card types) rather than planes-only.

---

title: Align playable planes helper text with Deck Sets label and stack on mobile
status: complete
priority: medium
description: Update Deck Sets header layout so helper text (playable planes minimum summary) appears on the same horizontal row as the `Deck Sets` label and is right-justified on desktop. On mobile, collapse to a stacked layout with label on top and helper text below.
Resolution: Reworked Deck Sets header into a desktop row with right-justified helper text and added a mobile breakpoint that stacks label and helper text vertically.

---

title: Add application-appropriate favicon
status: complete
priority: medium
description: Replace the default favicon with a project-appropriate icon for Blind Eternities Planechase and ensure it is wired correctly for local/dev and production (including GitHub Pages) builds.
Resolution: Added a custom app-specific SVG favicon in `public/favicon.svg` and wired it in `index.html`, replacing the default Angular favicon reference.

---

title: Improve page title and SEO meta tags
status: complete
priority: medium
description: Update the app document head with a stronger, product-appropriate page title and core SEO/social metadata (description, Open Graph, and related tags) for better discoverability and share previews.
Resolution: Updated `index.html` with a product-specific page title and added SEO/social metadata including description, keywords, Open Graph fields, and Twitter card tags.

---

title: No art shown for phenomenon cards
status: complete
priority: medium
description: Phenomenon cards currently do not render dedicated art in gameplay/modals. Ensure phenomenon entries can resolve and display art assets consistently with plane card art behavior.
Resolution: Extended art caching to process both planes and phenomena, then fetched missing phenomenon art with throttling (`--delay-ms=10000`) and updated `cards.json` art URLs. Current run fetched 12 phenomenon images with 0 failures.

---

title: No modal rules text shown for phenomenon cards
status: complete
priority: medium
description: When phenomenon cards are surfaced, modal content should include the phenomenon rules text. Add phenomenon-aware modal text resolution and fallback handling similar to plane modals.
Resolution: Updated modal text resolution to use card-type agnostic deck lookups so phenomenon modals now pull rules text from catalog data the same as plane cards.

---

title: Combine Fog of War and Optional Rules into one settings box with stacked switches
status: complete
priority: medium
description: Merge the separate `Fog of War` and `Optional Rules` setup boxes into a single settings section. Keep Fog of War enabled by default, shorten Fog of War label text, and render both switches vertically stacked for clearer layout.
Resolution: Merged both toggles into a single `Rules` setup box, shortened Fog of War copy to `Reveal nearby cards`, retained default-on behavior, and enforced vertical switch stacking in control-bar layout styles.

---

title: Remove spacing between button-group buttons
status: complete
priority: medium
description: Button groups should render as contiguous segmented controls with no visual gap between adjacent buttons, matching Bootstrap button-group expectations.
Resolution: Removed internal gap/wrapping spacing from button-group option rows so grouped controls render as contiguous segmented buttons.

---

title: Add contrast/accessibility regression checks for themed UI variants
status: complete
priority: medium
description: Theme changes have repeatedly introduced readability regressions. Add repeatable accessibility checks (manual checklist and/or automated lint/test gate) for color contrast and text legibility across all supported themes, especially for Bootstrap component variants.
Resolution: Added automated contrast validation via `npm run test:contrast` (`scripts/check-theme-contrast.mjs`) and integrated the command into contributor verification guidance for theme-sensitive UI work.

---

title: Add quality guardrails for PNG optimization workflow
status: complete
priority: low
description: The new PNG optimization flow is effective but currently has no quality guardrails. Add configurable quality presets, before/after reporting artifact output, and an optional visual-regression step to ensure aggressive compression does not degrade background art beyond acceptable thresholds.
Resolution: Extended `optimize-theme-backgrounds.mjs` with configurable quality/effort args, RMSE threshold enforcement (`--max-rmse`), and JSON reporting (`--report`), then added `assets:optimize:themes:guardrail` for repeatable dry-run quality gating.

---

title: Document asset optimization workflow in project docs index/runbook
status: complete
priority: low
description: Add documentation for `assets:optimize:themes` and `assets:optimize:themes:dry` (when to run, expected outputs, and commit expectations) in active docs so release prep and contributor workflows stay consistent.
Resolution: Documented optimization and guardrail commands plus recommended run order/usage in `docs/10-contributor-runbook.md` and `docs/11-card-art-data-pipeline.md`.

---

title: Refactor MapScene into smaller domain-focused collaborators
status: complete
priority: medium
description: `src/phaser/scenes/map.scene.ts` has grown into a large multi-responsibility class (theme sync, background loading, camera controls, tile rendering, pointer interactions, art loading, zoom HUD). Split into focused collaborators/services to reduce cognitive load, improve testability, and lower regression risk during gameplay/UI changes.
Resolution: Extracted theme and palette definitions into `map-theme.ts` and separated zoom HUD behavior into `MapZoomHud` (`map-zoom-hud.ts`), reducing direct UI/controller responsibilities inside `MapScene` while preserving existing rendering behavior.

---

title: Consolidate duplicated theme mappings between Phaser bootstrap and scene/theme tokens
status: complete
priority: medium
description: Theme color/theme-id mapping logic is currently duplicated across `src/styles.scss`, `src/phaser/scenes/map.scene.ts`, and `src/phaser/phaser-bootstrap.service.ts`. Extract shared theme metadata into a single source of truth to prevent drift and inconsistent fallback behavior between app shell and Phaser bootstrap.
Resolution: Added shared runtime theme config in `map-theme.ts` (theme IDs, palettes, background assets, bootstrap background colors) and switched both `MapScene` and `PhaserBootstrapService` to read from the shared module.

---

title: Update Fog of War helper label text to include "on move"
status: complete
priority: medium
description: In session setup, update the user-facing Fog of War switch label so it ends with `on move` (for example, `Reveal nearby cards on move`) to clarify that reveal behavior is movement-triggered.
Resolution: Updated the setup rules switch label copy to `Reveal nearby cards on move` for explicit movement-triggered behavior wording.

---

title: Make setup option boxes equal size in row and preserve Start Session button height
status: complete
priority: medium
description: Adjust flex/layout rules for the row containing `Deck Sets`, `Game Mode`, and `Rules` boxes so those boxes render at equal visual size. Preserve current Start Session button height and alignment; if needed, wrap button in a container so equal-height box behavior does not regress button sizing.
Resolution: Added a dedicated setup row layout container with equal-flex option boxes and a separate action container for Start Session, keeping the button height stable while normalizing setup box sizing across desktop/mobile layouts.

---

title: "Esc" text in How to Use does not match theme contrast rules
status: complete
priority: medium
description: Update the `<kbd>` Esc styling in the How to Use section so text/background contrast follows the same theme readability standards as surrounding instructional copy.
Resolution: Increased `<kbd>` token contrast by setting stronger foreground color, font weight, and darker themed background mix so Esc styling aligns with theme readability standards.

---

title: Stack game control sections vertically on md viewport
status: complete
priority: medium
description: At medium viewport widths, game control sections should stack vertically instead of staying in a horizontal row to improve readability and prevent cramped controls.
Resolution: Added a medium-breakpoint layout rule (`max-width: 980px`) that stacks setup control sections vertically while preserving full-width action alignment for consistent readability.

---

title: Keep button-group button heights consistent when labels wrap
status: complete
priority: medium
description: In setup button groups, all buttons in the same group should maintain equal height even when one or more labels wrap to multiple lines.
Resolution: Updated button-group button styling to use consistent min-height and centered inline-flex alignment with wrapped label support, keeping all segmented buttons at matching heights within each group.
reason-reopened: Button heights are still not equal; likely missing flex behavior that makes each grouped button stretch to matching vertical size.
Resolution: Updated grouped controls to `align-items: stretch` and enforced stretch behavior on visible `.btn` siblings of `.btn-check`, keeping wrapped labels while normalizing button heights within each group.

---

title: Move setup-box vertical stacking breakpoint to lg
status: complete
priority: medium
description: Adjust responsive layout so setup control boxes switch to vertical stacking at the `lg` breakpoint instead of the current breakpoint.
Resolution: Moved setup-row stacking rule from `max-width: 980px` to `max-width: 992px` (Bootstrap `lg` threshold), keeping Start Session sizing/alignment intact in stacked mode.

---

title: Set selector button group is too wide on smaller screens
status: complete
priority: medium
description: The Deck Sets control uses a segmented button-group layout that forces an overly wide minimum width. Replace this with a wrap-friendly selector pattern so set choices remain usable on smaller screens without horizontal pressure.
Resolution: Replaced the Deck Sets segmented button-group with a responsive wrapping grid of independent toggle buttons, preserving selection behavior while allowing clean wrapping at narrow widths.

---

title: Start Session button should be taller when full width
status: complete
priority: medium
description: When the setup row stacks and Start Session becomes full-width, increase its vertical size so it maintains prominence and touch ergonomics.
Resolution: Added stacked-layout sizing rules so the full-width Start Session button gets a larger minimum height at the `lg` stack breakpoint.

---

title: Keep Deck Sets buttons equal height in stacked grid layout
status: complete
priority: medium
description: After introducing the responsive Deck Sets grid, button heights can diverge when labels have different line counts (for example `Planechase` versus longer names). Ensure set buttons in the same row/stack maintain equal visual height.
Resolution: Updated the set-grid layout to use equal row sizing and made each set option a full-height flex item so all set buttons in the same grid row remain visually equal height.

---

title: Prevent Game Mode button height growth during viewport resize
status: complete
priority: medium
description: Game Mode segmented buttons currently become too tall during some resize ranges. Button height should remain stable across viewport changes and only increase when label wrapping requires equal-height adjustment within the group.
Resolution: Stopped resize-driven stretching by top-aligning the segmented control container and keeping game mode buttons at content-driven height, while preserving equal height behavior when labels wrap.

---

title: Top-align content inside Game Mode and Rules setup containers
status: complete
priority: medium
description: The content inside the `Game Mode` and `Rules` setup boxes should align to the top edge of their containers for consistent vertical rhythm with neighboring setup boxes.
Resolution: Applied top content alignment to setup picker grids so the Game Mode and Rules sections anchor to the top rather than stretching vertically.

---

title: Increase switch control height for better usability
status: complete
priority: medium
description: Setup switches are currently too short. Increase switch/control height (and matching label alignment) to improve readability and touch ergonomics.
Resolution: Increased switch input dimensions and tightened label alignment/line-height so setup switches have larger click targets and improved readability.

---

title: Add lint/type-style quality gate to prevent regressions
status: complete
priority: high
description: The project currently relies on tests/build only and has no lint command in package scripts. Add a lint gate (and optional formatting check) wired into local verification and CI to catch maintainability and style regressions early.
Resolution: Added a `lint` gate (`npm run lint`) backed by strict TypeScript no-emit checks for app and spec configs, updated contributor/release docs to include it, and fixed existing spec typing drift so the gate passes.

---

title: Split ControlBarComponent into setup and in-session subcomponents
status: complete
priority: medium
description: `ControlBarComponent` is handling setup config, active play controls, quit-confirm flow, and help content in one class/template. Refactor into smaller focused components to reduce coupling and simplify long-term maintenance.
Resolution: Split control rendering into `ControlBarSetupComponent` and `ControlBarSessionComponent`, with `ControlBarComponent` now coordinating state and help content while delegating setup/session UI responsibilities.

---

title: Add a repeatable UAT smoke test workflow for core gameplay loop
status: complete
priority: high
description: There is no automated or scripted browser smoke test that covers start session -> roll die -> move/resolve -> modal close across both Blind Eternities and Planechase modes. Add a repeatable UAT smoke flow and document pass criteria.
Resolution: Added `docs/17-uat-smoke-workflow.md` with deterministic step-by-step smoke paths for Blind Eternities and Planechase plus explicit pass criteria and command gate requirements.

---

title: Add card-art coverage report to data pipeline
status: complete
priority: medium
description: The team does not have a single command that reports total playable cards, cached art count, and missing-art IDs by type/set. Add an artifact coverage report script to reduce uncertainty about when image fetching is complete.
Resolution: Added `scripts/report-card-art-coverage.mjs` plus `npm run art:coverage` and `npm run art:coverage:json`, and documented usage in pipeline docs for repeatable visibility into missing playable art.

---

title: Support ?dev-mode URL param outside dev builds
status: complete
priority: medium
description: Add support for a `?dev-mode` URL query parameter that enables dev mode even when running non-dev environments (for example production/GitHub Pages), with safe defaults when the parameter is absent.
Resolution: Updated `DEV_MODE` resolution to allow query-param activation (`?dev-mode`, `?dev-mode=true`) outside dev builds while still supporting explicit falsey values (`0`, `false`, `off`).

---

title: Slightly reduce switch height and increase spacing between switches
status: complete
priority: medium
description: Tune setup switch styling by reducing switch control height slightly and adding more vertical spacing between stacked switches for better visual balance.
Resolution: Refined setup switch dimensions to a slightly shorter control and increased vertical spacing in the switch stack for improved visual rhythm.

---

title: Update docs to reflect fog-of-war values 0/1 and current setup UX
status: complete
priority: high
description: Several active docs still reference legacy fog values (`1`/`2`) and outdated profile wording. Update delivery/runtime/UX/article-alignment docs to match implemented `0/1` behavior and current setup labels.
Resolution: Updated delivery/runtime/UX/article-alignment docs to reflect current numeric fog semantics (`0`/`1`), always-on Blind Eternities hellride behavior, and current setup wording.

---

title: Add acceptance tests for enter-plane and phenomenon resolution ordering
status: complete
priority: high
description: Documentation still marks article alignment as partial for move ordering (`enter plane` before `phenomenon fill/replace`). Add explicit reducer/orchestrator acceptance tests that validate this ordering and associated phase logs.
Resolution: Added reducer and orchestrator acceptance tests that assert destination plane becomes active/modal-target before phenomenon fill replacement finalization, and that phase logs preserve the required move -> board_fill -> phenomenon_resolve -> finalize ordering.

---

title: Fix Deck Sets overflow on lg-and-smaller stacked layout
status: complete
priority: high
description: In session setup, when containers switch to full-width (`lg` and smaller), Deck Sets buttons stop stacking/reflowing correctly and produce horizontal scrolling on smaller screens. Update the Deck Sets control so buttons reflow without any mobile scrollbars.
Resolution: Updated Deck Sets responsive grid rules at the `lg` stacked breakpoint to force single-column reflow in full-width containers, preventing horizontal overflow/scrollbars on smaller screens.

---

title: Eliminate style budget warning in app shell styles
status: complete
priority: medium
description: `npm run build` still reports a style budget warning for `src/app/app.scss`. Evaluate existing style rules for consolidation opportunities (duplicate selectors, repeated declarations, and extractable shared patterns), then refactor to improve output size so production build passes cleanly without style budget warnings.
Resolution: Consolidated toast animation/presentation styles out of `app.scss` into global styles and reduced component stylesheet payload; latest `npm run build` completes without the prior `app.scss` budget warning.

---

title: Update delivery plan milestone statuses to match current completion
status: complete
priority: medium
description: `docs/08-delivery-plan.md` still lists Milestone 8 as in-progress despite completed alignment and acceptance-test coverage. Reconcile milestone statuses and goal text with actual shipped state.
Resolution: Updated delivery plan milestone status to reflect Milestone 8 completion and aligned milestone goal wording with shipped phenomenon ordering acceptance coverage.

---

title: Refresh README current project status for release-readiness context
status: complete
priority: low
description: `README.md` still uses broad status text (`UAT, bug-fix, polish`) that is now stale. Update the status block to reflect current near-release state and current outstanding work path.
Resolution: Updated README status section to reflect implemented milestone progress and the current release-readiness/final-polish phase.

---

title: Run pre-release card/art pipeline validation pass
status: complete
priority: medium
description: Before release candidate, run and record `cards:sync:mtgjson`, throttled `art:cache:fetch` (if needed), and `art:coverage` outputs to confirm metadata/art integrity and capture any drift as issues.
Resolution: Executed metadata sync and coverage validation (`cards:sync:mtgjson`, `art:coverage`) and documented results in `docs/18-release-validation-report.md`; no missing playable art remained so throttled fetch was not required.

---

title: Improve lithomancy canvas card-name readability (remove dark blur shadow on dark text)
status: complete
priority: medium
description: In the Lithomancy theme, canvas card names use dark text with a dark drop shadow, which makes labels look blurry. Adjust the name text/shadow styling for this theme so card names stay sharp and readable.
Resolution: Updated Phaser card-name text rendering to use a Lithomancy-specific shadow profile with no dark blur/offset, keeping labels crisp while preserving existing shadow styling for other themes.

---

title: Correct Blind Eternities phenomenon resolution flow (modal + recursive replacement)
status: complete
priority: high
description: In Blind Eternities mode, when a phenomenon is revealed it should open its modal immediately. After that modal closes, the slot should auto-replace with a new card; if the replacement is also a phenomenon, repeat this modal-and-replace cycle until a plane occupies the slot. Apply this starting with the destination square first, then for additional revealed squares when Fog of War is enabled, aligned to the reference article resolution order.
Resolution: Implemented phenomenon modal queue flow in movement resolution so revealed phenomena are surfaced as `PHENOMENON` modals (destination-first ordering with fog-reveal prioritization) and chained phenomena continue modal sequencing until resolution returns to landed-plane modal. Added reducer/orchestrator tests to validate the updated close-flow behavior.

---

title: Add optional physical-dice mode with manual planeswalk trigger
status: complete
priority: medium
description: Add a session setup option for players using real physical planar dice. When enabled, gameplay should replace random in-app die rolling with a manual `Walk` control so players can trigger movement after resolving their physical die result.
Resolution: Added `usePhysicalDie` session config with setup toggle (`Dice Input`) and new `manual_walk` domain intent. In physical-dice mode the Roll button is replaced by `Walk`, random in-app rolling is disabled, and manual walk routes through the correct Blind Eternities/Planechase movement flows. Added reducer and control-bar tests for the new behavior.

---

title: Execute and record release UAT smoke workflow results
status: complete
priority: high
description: Run `docs/17-uat-smoke-workflow.md` and `docs/14-uat-release-checklist.md`, then document pass/fail results and any defects discovered as actionable issues.
Resolution: Completed manual smoke verification for Blind Eternities and Planechase flows, updated release validation documentation/checklist, and confirmed no new UAT defects requiring additional active issues.

