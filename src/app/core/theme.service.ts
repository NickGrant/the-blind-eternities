import { Injectable, signal } from "@angular/core";

export const APP_THEME_STORAGE_KEY = "be.theme";
export const APP_THEMES = ["phyrexian", "neon-dynasty", "lithomancy", "halo-fountain"] as const;
export type AppThemeId = (typeof APP_THEMES)[number];

export type AppThemeOption = {
  id: AppThemeId;
  label: string;
};

const DEFAULT_THEME: AppThemeId = "phyrexian";

/**
 * Manages app visual theme selection and persistence.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly options: readonly AppThemeOption[] = [
    { id: "phyrexian", label: "Phyrexian" },
    { id: "neon-dynasty", label: "Neon Dynasty" },
    { id: "lithomancy", label: "Lithomancy" },
    { id: "halo-fountain", label: "Halo Fountain" },
  ];

  private readonly currentThemeState = signal<AppThemeId>(DEFAULT_THEME);
  readonly currentTheme = this.currentThemeState.asReadonly();

  constructor() {
    const persisted = this.readPersistedTheme();
    this.applyTheme(persisted ?? DEFAULT_THEME, false);
  }

  setTheme(theme: AppThemeId): void {
    this.applyTheme(theme, true);
  }

  private applyTheme(theme: AppThemeId, persist: boolean): void {
    if (!APP_THEMES.includes(theme)) return;
    document.documentElement.setAttribute("data-be-theme", theme);
    this.currentThemeState.set(theme);
    if (persist) {
      try {
        localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage failures in restricted browser contexts.
      }
    }
  }

  private readPersistedTheme(): AppThemeId | null {
    try {
      const raw = localStorage.getItem(APP_THEME_STORAGE_KEY);
      if (!raw) return null;
      return APP_THEMES.includes(raw as AppThemeId) ? (raw as AppThemeId) : null;
    } catch {
      return null;
    }
  }

}
