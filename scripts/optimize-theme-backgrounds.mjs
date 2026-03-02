import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const THEME_BACKGROUND_DIR = path.resolve("src/assets/theme-backgrounds");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const quality = readIntArg("--quality", 85, 30, 100);
const effort = readIntArg("--effort", 10, 1, 10);
const maxRmse = readFloatArg("--max-rmse", undefined, 0, 255);
const reportPath = readStringArg("--report");

async function getPngPaths(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function optimizePng(filePath) {
  const before = await fs.stat(filePath);
  const input = sharp(filePath);
  const metadata = await input.metadata();
  const output = await input
    .png({
      compressionLevel: 9,
      effort,
      adaptiveFiltering: true,
      palette: true,
      quality,
      dither: 0.8,
    })
    .toBuffer();
  const beforeBuffer = await fs.readFile(filePath);
  const rmse = await computeRmse(beforeBuffer, output);

  if (!dryRun) {
    await fs.writeFile(filePath, output);
  }

  const afterBytes = dryRun ? output.byteLength : (await fs.stat(filePath)).size;
  return {
    name: path.basename(filePath),
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    beforeBytes: before.size,
    afterBytes,
    deltaBytes: before.size - afterBytes,
    rmse,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatPercent(before, after) {
  if (before === 0) return "0.00%";
  return `${(((before - after) / before) * 100).toFixed(2)}%`;
}

async function main() {
  const pngPaths = await getPngPaths(THEME_BACKGROUND_DIR);
  if (pngPaths.length === 0) {
    console.log("No PNG files found in src/assets/theme-backgrounds.");
    return;
  }

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Optimizing ${pngPaths.length} PNG file(s) in src/assets/theme-backgrounds (quality=${quality}, effort=${effort})...`
  );

  const results = [];
  for (const pngPath of pngPaths) {
    results.push(await optimizePng(pngPath));
  }

  const beforeTotal = results.reduce((sum, item) => sum + item.beforeBytes, 0);
  const afterTotal = results.reduce((sum, item) => sum + item.afterBytes, 0);

  results.forEach((result) => {
    console.log(
      `- ${result.name}: ${result.width}x${result.height}, ${formatBytes(result.beforeBytes)} -> ${formatBytes(result.afterBytes)} (${formatPercent(result.beforeBytes, result.afterBytes)} saved, rmse=${result.rmse.toFixed(3)})`
    );
  });
  console.log(
    `Total: ${formatBytes(beforeTotal)} -> ${formatBytes(afterTotal)} (${formatPercent(beforeTotal, afterTotal)} saved)`
  );

  if (typeof maxRmse === "number") {
    const exceeded = results.filter((result) => result.rmse > maxRmse);
    if (exceeded.length > 0) {
      exceeded.forEach((result) => {
        console.error(
          `[RMSE FAIL] ${result.name}: ${result.rmse.toFixed(3)} > max ${maxRmse.toFixed(3)}`
        );
      });
      process.exitCode = 1;
    }
  }

  if (reportPath) {
    const payload = {
      generatedAt: new Date().toISOString(),
      dryRun,
      quality,
      effort,
      maxRmse: typeof maxRmse === "number" ? maxRmse : null,
      totals: {
        beforeBytes: beforeTotal,
        afterBytes: afterTotal,
        savedPercent: Number.parseFloat(formatPercent(beforeTotal, afterTotal)),
      },
      files: results,
    };
    const outPath = path.resolve(reportPath);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Report written: ${outPath}`);
  }
}

async function computeRmse(beforePngBuffer, afterPngBuffer) {
  const before = await sharp(beforePngBuffer).raw().toBuffer({ resolveWithObject: true });
  const after = await sharp(afterPngBuffer).raw().toBuffer({ resolveWithObject: true });
  if (
    before.info.width !== after.info.width ||
    before.info.height !== after.info.height ||
    before.info.channels !== after.info.channels
  ) {
    return Number.POSITIVE_INFINITY;
  }
  let squaredError = 0;
  for (let i = 0; i < before.data.length; i += 1) {
    const delta = before.data[i] - after.data[i];
    squaredError += delta * delta;
  }
  const mse = squaredError / before.data.length;
  return Math.sqrt(mse);
}

function readIntArg(name, fallback, min, max) {
  const raw = readStringArg(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readFloatArg(name, fallback, min, max) {
  const raw = readStringArg(name);
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readStringArg(name) {
  const prefix = `${name}=`;
  const arg = [...args].find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : undefined;
}

main().catch((error) => {
  console.error("Failed to optimize theme background PNGs:", error);
  process.exitCode = 1;
});
