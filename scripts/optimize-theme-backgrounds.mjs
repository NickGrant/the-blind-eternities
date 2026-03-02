import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const THEME_BACKGROUND_DIR = path.resolve("src/assets/theme-backgrounds");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

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
      effort: 10,
      adaptiveFiltering: true,
      palette: true,
      quality: 85,
      dither: 0.8,
    })
    .toBuffer();

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
    `${dryRun ? "[DRY RUN] " : ""}Optimizing ${pngPaths.length} PNG file(s) in src/assets/theme-backgrounds...`
  );

  const results = [];
  for (const pngPath of pngPaths) {
    results.push(await optimizePng(pngPath));
  }

  const beforeTotal = results.reduce((sum, item) => sum + item.beforeBytes, 0);
  const afterTotal = results.reduce((sum, item) => sum + item.afterBytes, 0);

  results.forEach((result) => {
    console.log(
      `- ${result.name}: ${result.width}x${result.height}, ${formatBytes(result.beforeBytes)} -> ${formatBytes(result.afterBytes)} (${formatPercent(result.beforeBytes, result.afterBytes)} saved)`
    );
  });
  console.log(
    `Total: ${formatBytes(beforeTotal)} -> ${formatBytes(afterTotal)} (${formatPercent(beforeTotal, afterTotal)} saved)`
  );
}

main().catch((error) => {
  console.error("Failed to optimize theme background PNGs:", error);
  process.exitCode = 1;
});
