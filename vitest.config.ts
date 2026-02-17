import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { URL } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup-angular.ts"],
  },
  resolve: {
    alias: {
      phaser: fileURLToPath(new URL("./src/test/phaser.mock.ts", import.meta.url)),
    },
  },
});