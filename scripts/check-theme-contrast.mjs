import process from "node:process";

const MIN_CONTRAST = 4.5;

const checks = [
  { theme: "base", fg: "#e7edf4", bg: "#10161b", label: "body text on app bg" },
  { theme: "base", fg: "#f8fbff", bg: "#10161b", label: "strong text on app bg" },
  { theme: "phyrexian", fg: "#dde5e8", bg: "#0f1214", label: "body text on app bg" },
  { theme: "phyrexian", fg: "#f7fcfd", bg: "#0f1214", label: "strong text on app bg" },
  { theme: "neon-dynasty", fg: "#e8ebff", bg: "#131428", label: "body text on app bg" },
  { theme: "neon-dynasty", fg: "#ffffff", bg: "#131428", label: "strong text on app bg" },
  { theme: "lithomancy", fg: "#483322", bg: "#f3ecdf", label: "body text on app bg" },
  { theme: "lithomancy", fg: "#2f1f14", bg: "#f3ecdf", label: "strong text on app bg" },
  { theme: "halo-fountain", fg: "#e7fcff", bg: "#092834", label: "body text on app bg" },
  { theme: "halo-fountain", fg: "#ffffff", bg: "#092834", label: "strong text on app bg" },
];

function hexToRgb(hex) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3
    ? clean.split("").map((char) => `${char}${char}`).join("")
    : clean;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function toLinear(component) {
  const c = component / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function contrastRatio(a, b) {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

let failed = 0;
for (const check of checks) {
  const ratio = contrastRatio(check.fg, check.bg);
  const pass = ratio >= MIN_CONTRAST;
  const status = pass ? "PASS" : "FAIL";
  console.log(
    `[${status}] ${check.theme} ${check.label}: ${ratio.toFixed(2)}:1 (min ${MIN_CONTRAST}:1)`
  );
  if (!pass) failed += 1;
}

if (failed > 0) {
  console.error(`Theme contrast check failed: ${failed} pair(s) below ${MIN_CONTRAST}:1.`);
  process.exitCode = 1;
} else {
  console.log("Theme contrast check passed.");
}
