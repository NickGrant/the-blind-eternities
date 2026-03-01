import { beforeEach, describe, expect, it } from "vitest";

import { APP_THEME_STORAGE_KEY, ThemeService } from "./theme.service";

describe("ThemeService", () => {
  beforeEach(() => {
    localStorage.removeItem(APP_THEME_STORAGE_KEY);
    document.documentElement.removeAttribute("data-be-theme");
  });

  it("applies persisted theme on startup when valid", () => {
    localStorage.setItem(APP_THEME_STORAGE_KEY, "neon-dynasty");

    const service = new ThemeService();

    expect(service.currentTheme()).toBe("neon-dynasty");
    expect(document.documentElement.getAttribute("data-be-theme")).toBe("neon-dynasty");
  });

  it("updates DOM attribute and storage on setTheme", () => {
    const service = new ThemeService();

    service.setTheme("halo-fountain");

    expect(service.currentTheme()).toBe("halo-fountain");
    expect(document.documentElement.getAttribute("data-be-theme")).toBe("halo-fountain");
    expect(localStorage.getItem(APP_THEME_STORAGE_KEY)).toBe("halo-fountain");
  });
});
