# ISSUES FILE
----

## How to Use
- Issues listed by category below
    - Valid categories are "visual", "functional"
- When issues are resolved the following steps should be followed
    - Status updated to "complete"
    - Add a "Resolution" subsection with a brief explanation (1-2 sentences) of what was done to resolve the issue

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
