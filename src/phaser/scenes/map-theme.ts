export type MapThemeId = "phyrexian" | "neon-dynasty" | "lithomancy" | "halo-fountain";

export type ThemePalette = {
  cameraBg: number;
  tileFill: number;
  idleStroke: number;
  partyStroke: number;
  selectionStroke: number;
  hellrideStroke: number;
  faceDownFill: number;
  faceDownStroke: number;
  faceUpFallbackFill: number;
  nameBackdropFill: number;
  nameBackdropStroke: number;
  nameText: string;
  labelFontFamily: string;
  zoomHudPanel: number;
  zoomHudText: string;
};

export const THEME_PALETTES: Record<MapThemeId, ThemePalette> = {
  phyrexian: {
    cameraBg: 0x080b0b,
    tileFill: 0x121717,
    idleStroke: 0x6e8f80,
    partyStroke: 0xb8d8c8,
    selectionStroke: 0xc6ff50,
    hellrideStroke: 0x79e4bf,
    faceDownFill: 0x151f1f,
    faceDownStroke: 0x476257,
    faceUpFallbackFill: 0x1a2827,
    nameBackdropFill: 0x070c0c,
    nameBackdropStroke: 0x33574b,
    nameText: "#e7f5ec",
    labelFontFamily: "Copperplate Gothic, Palatino Linotype, serif",
    zoomHudPanel: 0x091111,
    zoomHudText: "#d0efe0",
  },
  "neon-dynasty": {
    cameraBg: 0x0d1129,
    tileFill: 0x141a3e,
    idleStroke: 0x6d79ff,
    partyStroke: 0x4de4ff,
    selectionStroke: 0xff4db7,
    hellrideStroke: 0x39d8ff,
    faceDownFill: 0x1d2554,
    faceDownStroke: 0x5a65cf,
    faceUpFallbackFill: 0x252f66,
    nameBackdropFill: 0x081128,
    nameBackdropStroke: 0x3554da,
    nameText: "#f5f7ff",
    labelFontFamily: "Century Gothic, Franklin Gothic Medium, Segoe UI, sans-serif",
    zoomHudPanel: 0x0a1133,
    zoomHudText: "#d5dcff",
  },
  lithomancy: {
    cameraBg: 0xf7eedf,
    tileFill: 0xefdfc2,
    idleStroke: 0xb79263,
    partyStroke: 0x805a33,
    selectionStroke: 0xd39138,
    hellrideStroke: 0x7aabcc,
    faceDownFill: 0xe9d4ae,
    faceDownStroke: 0xb08857,
    faceUpFallbackFill: 0xf4e6cb,
    nameBackdropFill: 0xe5cd9f,
    nameBackdropStroke: 0xad8452,
    nameText: "#3b2818",
    labelFontFamily: "Garamond, Book Antiqua, Palatino Linotype, serif",
    zoomHudPanel: 0xddc599,
    zoomHudText: "#3f2a19",
  },
  "halo-fountain": {
    cameraBg: 0x0b2430,
    tileFill: 0x133444,
    idleStroke: 0xd8b87b,
    partyStroke: 0xf1dfb2,
    selectionStroke: 0xffefbf,
    hellrideStroke: 0xb6e7ff,
    faceDownFill: 0x194255,
    faceDownStroke: 0x8d7a57,
    faceUpFallbackFill: 0x215168,
    nameBackdropFill: 0x0b2a37,
    nameBackdropStroke: 0xbf9b61,
    nameText: "#fff3d7",
    labelFontFamily: "Didot, Bodoni MT, Times New Roman, serif",
    zoomHudPanel: 0x0d2d3b,
    zoomHudText: "#f6dfb2",
  },
};

export const THEME_BACKGROUND_ASSETS: Record<MapThemeId, string> = {
  phyrexian: "assets/theme-backgrounds/phyrexian.png",
  "neon-dynasty": "assets/theme-backgrounds/neon-dynasty.png",
  lithomancy: "assets/theme-backgrounds/lithomancy.png",
  "halo-fountain": "assets/theme-backgrounds/halo-fountain.png",
};

const THEME_BOOTSTRAP_BACKGROUNDS: Record<MapThemeId, string> = {
  phyrexian: "#0d1315",
  "neon-dynasty": "#0f1230",
  lithomancy: "#f3e6cd",
  "halo-fountain": "#082634",
};

export function readThemeIdFromDom(): MapThemeId {
  const raw = document.documentElement.getAttribute("data-be-theme");
  if (
    raw === "phyrexian" ||
    raw === "neon-dynasty" ||
    raw === "lithomancy" ||
    raw === "halo-fountain"
  ) {
    return raw;
  }
  return "phyrexian";
}

export function getThemeBootstrapBackground(themeId: MapThemeId): string {
  return THEME_BOOTSTRAP_BACKGROUNDS[themeId];
}
