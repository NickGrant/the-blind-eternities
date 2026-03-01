import { Component, Input, computed, signal } from "@angular/core";
import { DeckService } from "../core/deck.service";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DOMAIN_INTENT, GAME_MODE, RULES_PROFILE, type GameMode, type RulesProfile } from "../../state/intents.types";

@Component({
  selector: "app-control-bar",
  standalone: true,
  templateUrl: "./control-bar.component.html",
  styleUrls: ["./control-bar.component.scss"],
})
/**
 * Renders primary session controls and pre-session set selection.
 */
export class ControlBarComponent {
  private readonly rollToastVisibleState = signal(false);
  @Input() set rollToastVisible(value: boolean) {
    this.rollToastVisibleState.set(value);
  }
  get rollToastVisible(): boolean {
    return this.rollToastVisibleState();
  }

  protected readonly DOMAIN_INTENT = DOMAIN_INTENT;
  protected readonly GAME_MODE = GAME_MODE;
  protected readonly RULES_PROFILE = RULES_PROFILE;
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);
  readonly planeSets;
  readonly minimumSessionPlanes: number;
  readonly selectedSetCodes = computed(() => [...this.selectedSets()].sort());
  readonly selectedPlayableCount = computed(() => this.deckService.countPlayablePlanesForSets(this.selectedSetCodes()));
  readonly canStartSession = computed(() => this.selectedPlayableCount() >= this.minimumSessionPlanes);
  readonly availableRulesProfiles = computed(() =>
    this.selectedGameMode() === GAME_MODE.REGULAR_PLANECHASE
      ? [RULES_PROFILE.REGULAR_STANDARD]
      : [RULES_PROFILE.BLIND_FOG_OF_WAR, RULES_PROFILE.BLIND_CLASSIC_PLUS]
  );
  readonly showRulesProfilePicker = computed(() => this.availableRulesProfiles().length > 1);
  readonly activeGameMode = computed(() =>
    this.fsmState() === "SETUP" ? this.selectedGameMode() : this.state().config.gameMode
  );
  readonly activeRulesProfile = computed(() =>
    this.fsmState() === "SETUP" ? this.selectedRulesProfile() : this.state().config.rulesProfile
  );
  readonly activeHellrideEnabled = computed(() =>
    this.fsmState() === "SETUP" ? this.enableHellride() : this.state().config.enableHellride === true
  );
  readonly activeAntiStallEnabled = computed(() =>
    this.fsmState() === "SETUP" ? this.enableAntiStall() : this.state().config.enableAntiStall === true
  );
  readonly revealProfile = computed(() => this.getRevealProfileLabel(this.activeRulesProfile()));
  readonly helpModeLabel = computed(() =>
    this.activeGameMode() === GAME_MODE.BLIND_ETERNITIES ? "Blind Eternities" : "Regular Planechase"
  );
  readonly showRollButton = computed(() => this.fsmState() === "IDLE" || this.rollToastVisibleState());
  readonly rollButtonDisabled = computed(() => this.rollToastVisibleState() || this.fsmState() !== "IDLE");
  readonly selectedGameMode = signal<GameMode>(GAME_MODE.BLIND_ETERNITIES);
  readonly selectedRulesProfile = signal<RulesProfile>(RULES_PROFILE.BLIND_FOG_OF_WAR);
  readonly enableHellride = signal(false);
  readonly enableAntiStall = signal(false);
  readonly isQuitConfirming = signal(false);
  private readonly selectedSets = signal<Set<string>>(new Set());

  constructor(
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore,
    private readonly deckService: DeckService
  ) {
    this.state = this.sessionStore.state;
    this.minimumSessionPlanes = this.deckService.getMinimumSessionPlanes();
    const sets = this.deckService.listPlaneSetOptions();
    this.planeSets = signal(sets).asReadonly();
    const preferredDefault = this.deckService.getPreferredDefaultSetCode();
    const hasPreferredDefault = preferredDefault ? sets.some((s) => s.code === preferredDefault) : false;
    const initial = hasPreferredDefault && preferredDefault ? [preferredDefault] : sets.slice(0, 1).map((s) => s.code);
    this.selectedSets.set(new Set(initial));
  }

  isSetSelected(code: string): boolean {
    return this.selectedSets().has(code);
  }

  /**
   * Toggles a set selection while enforcing at least one selected option.
   * @param code Plane set code to toggle.
   * @returns void
   */
  toggleSet(code: string): void {
    this.selectedSets.update((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        if (next.size <= 1) return current;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  /**
   * Dispatches a filtered start-session intent when selection is valid.
   * @returns void
   */
  startSession(): void {
    if (!this.canStartSession()) return;
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({
      type: DOMAIN_INTENT.START_SESSION,
      atMs: Date.now(),
      includedSetCodes: this.selectedSetCodes(),
      gameMode: this.selectedGameMode(),
      rulesProfile: this.selectedRulesProfile(),
      enableHellride: this.enableHellride(),
      enableAntiStall: this.enableAntiStall(),
    });
  }

  setGameMode(mode: GameMode): void {
    this.selectedGameMode.set(mode);
    if (mode === GAME_MODE.REGULAR_PLANECHASE) {
      this.selectedRulesProfile.set(RULES_PROFILE.REGULAR_STANDARD);
      this.enableHellride.set(false);
      this.enableAntiStall.set(false);
      return;
    }
    if (this.selectedRulesProfile() === RULES_PROFILE.REGULAR_STANDARD) {
      this.selectedRulesProfile.set(RULES_PROFILE.BLIND_FOG_OF_WAR);
    }
  }

  setRulesProfile(profile: RulesProfile): void {
    this.selectedRulesProfile.set(profile);
  }

  setEnableHellride(value: boolean): void {
    this.enableHellride.set(value);
  }

  setEnableAntiStall(value: boolean): void {
    this.enableAntiStall.set(value);
  }

  /**
   * Quits current play and returns to setup selection state.
   * @returns void
   */
  quitSession(): void {
    if (!this.isQuitConfirming()) {
      this.isQuitConfirming.set(true);
      return;
    }
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({
      type: DOMAIN_INTENT.RESTART_SESSION,
      atMs: Date.now(),
    });
  }

  cancelQuitSession(): void {
    this.isQuitConfirming.set(false);
  }

  /**
   * Dispatches standard control-bar intents.
   * @param type Domain intent type dispatched by control actions.
   * @returns void
   */
  dispatch(
    type:
      | typeof DOMAIN_INTENT.ROLL_DIE
      | typeof DOMAIN_INTENT.CONFIRM_MOVE
      | typeof DOMAIN_INTENT.CANCEL_MOVE
      | typeof DOMAIN_INTENT.RESTART_SESSION
  ): void {
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({ type, atMs: Date.now() });
  }

  private getRevealProfileLabel(profile: RulesProfile | undefined): string {
    if (profile === RULES_PROFILE.BLIND_CLASSIC_PLUS) return "Classic Plus Reveal";
    if (profile === RULES_PROFILE.BLIND_FOG_OF_WAR) return "Center Only Reveal";
    if (profile === RULES_PROFILE.REGULAR_STANDARD) return "Regular Centered";
    return "Center Only Reveal";
  }
}
