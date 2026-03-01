import { InjectionToken, Injectable, computed, signal } from "@angular/core";
import { environment } from "../../environments/environment";

export const DEV_MODE = new InjectionToken<boolean>("DEV_MODE", {
  providedIn: "root",
  factory: () => !!environment.dev,
});

@Injectable({ providedIn: "root" })
export class DevModeStore {
  private readonly forcedOff = signal(false);
  readonly enabled = computed(() => !!environment.dev && !this.forcedOff());

  /**
   * Disables dev mode behavior for the current runtime session.
   * Reloading the page restores environment-based default behavior.
   */
  disableUntilReload(): void {
    this.forcedOff.set(true);
  }
}
