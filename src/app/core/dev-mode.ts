import { InjectionToken, Injectable, computed, inject, signal } from "@angular/core";
import { environment } from "../../environments/environment";

function resolveQueryDevMode(): boolean {
  if (typeof window === "undefined" || !window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("dev-mode")) return false;
  const raw = params.get("dev-mode");
  if (raw === null || raw.trim().length === 0) return true;
  const normalized = raw.trim().toLowerCase();
  return normalized !== "0" && normalized !== "false" && normalized !== "off";
}

export const DEV_MODE = new InjectionToken<boolean>("DEV_MODE", {
  providedIn: "root",
  factory: () => !!environment.dev || resolveQueryDevMode(),
});

@Injectable({ providedIn: "root" })
export class DevModeStore {
  private readonly devMode = inject(DEV_MODE);
  private readonly forcedOff = signal(false);
  readonly enabled = computed(() => this.devMode && !this.forcedOff());

  /**
   * Disables dev mode behavior for the current runtime session.
   * Reloading the page restores environment-based default behavior.
   */
  disableUntilReload(): void {
    this.forcedOff.set(true);
  }
}
