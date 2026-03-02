#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "src", "environments", "environment.prod.ts");
const measurementId = (process.env.GTAG_ID ?? "").trim();

const analyticsLine = measurementId
  ? `  analyticsMeasurementId: ${JSON.stringify(measurementId)} as string | undefined,`
  : "  analyticsMeasurementId: undefined as string | undefined,";

const content = `export const environment = {
  dev: false,
  debugSeed: undefined,
${analyticsLine}
};
`;

await fs.writeFile(outputPath, content, "utf8");
console.log(`[env] Wrote production environment config to ${outputPath}`);
console.log(`[env] analyticsMeasurementId configured: ${measurementId ? "yes" : "no"}`);
