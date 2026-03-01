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

