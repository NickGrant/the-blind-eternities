import { Component, EventEmitter, Input, Output } from "@angular/core";
import { type PlaneSetOption } from "../core/deck.service";
import { FOG_OF_WAR_DISTANCE, GAME_MODE, type FogOfWarDistance, type GameMode } from "../../state/intents.types";

@Component({
  selector: "app-control-bar-setup",
  standalone: true,
  templateUrl: "./control-bar-setup.component.html",
  styleUrls: ["./control-bar-setup.component.scss"],
})
/**
 * Setup-only controls rendered before session start.
 */
export class ControlBarSetupComponent {
  @Input() planeSets: readonly PlaneSetOption[] = [];
  @Input() selectedSetCodes: readonly string[] = [];
  @Input() selectedPlayableCount = 0;
  @Input() minimumSessionPlanes = 5;
  @Input() canStartSession = false;
  @Input() selectedGameMode: GameMode = GAME_MODE.BLIND_ETERNITIES;
  @Input() selectedFogOfWarDistance: FogOfWarDistance = FOG_OF_WAR_DISTANCE.CURRENT_PLUS_CARDINAL;
  @Input() antiStallEnabled = false;
  @Input() usePhysicalDie = false;

  @Output() toggleSet = new EventEmitter<string>();
  @Output() gameModeChange = new EventEmitter<GameMode>();
  @Output() fogEnhancedRevealChange = new EventEmitter<boolean>();
  @Output() antiStallChange = new EventEmitter<boolean>();
  @Output() usePhysicalDieChange = new EventEmitter<boolean>();
  @Output() startSession = new EventEmitter<void>();

  protected readonly GAME_MODE = GAME_MODE;
  protected readonly FOG_OF_WAR_DISTANCE = FOG_OF_WAR_DISTANCE;

  isSetSelected(code: string): boolean {
    return this.selectedSetCodes.includes(code);
  }

  getSetCountTooltip(count: number): string {
    return `${count} playable cards`;
  }

  onFogEnhancedRevealChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.fogEnhancedRevealChange.emit(target?.checked === true);
  }

  onAntiStallChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.antiStallChange.emit(target?.checked === true);
  }

  onPhysicalDieChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.usePhysicalDieChange.emit(target?.checked === true);
  }
}
