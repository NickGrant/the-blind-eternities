// src/test/setup-angular.ts
//
// Initializes Angular's TestBed environment for Vitest.
// This project is zoneless (no zone.js dependency), so we use the
// platform-browser testing platform.

import "@angular/compiler";

import { getTestBed } from "@angular/core/testing";
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing";

// Vitest may evaluate multiple test files in the same worker. Guard against
// re-initializing the environment.
const tb = getTestBed() as unknown as { _testModuleRef?: unknown };

if (!tb._testModuleRef) {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  });
}