// src/app/app.spec.ts
import { TestBed } from "@angular/core/testing";
import { describe, it, expect, vi } from "vitest";

import { AppComponent, Navigation } from "./app";
import { FatalErrorStore } from "./core/fatal-error.store";
import { PhaserBootstrapService } from "../phaser/phaser-bootstrap.service";
import { AnalyticsService } from "./core/analytics.service";

describe("AppComponent (class-only, injection-context)", () => {
  type AppWithHost = AppComponent & {
    phaserHost: { nativeElement: HTMLDivElement };
  };

  function createComponent(phaserInit: () => void = () => void 0) {
    const phaser = { init: vi.fn(phaserInit) };
    const analytics = { init: vi.fn() };
    const fatal = new FatalErrorStore();

    TestBed.configureTestingModule({
      providers: [
        { provide: PhaserBootstrapService, useValue: phaser },
        { provide: AnalyticsService, useValue: analytics },
        { provide: FatalErrorStore, useValue: fatal },
      ],
    });

    const cmp = TestBed.runInInjectionContext(() => new AppComponent());

    // We are not compiling templates; provide the ViewChild manually.
    (cmp as AppWithHost).phaserHost = { nativeElement: document.createElement("div") };

    return { cmp, phaser, analytics, fatal };
  }

  it("calls Phaser init on ngAfterViewInit", () => {
    const { cmp, phaser, analytics, fatal } = createComponent();

    cmp.ngAfterViewInit();

    expect(analytics.init).toHaveBeenCalledTimes(1);
    expect(phaser.init).toHaveBeenCalledTimes(1);
    expect(fatal.fatal()).toBeNull();
  });

  it("sets fatal error if Phaser init throws", () => {
    const { cmp, fatal } = createComponent(() => {
      throw new Error("boom");
    });

    cmp.ngAfterViewInit();

    expect(fatal.fatal()).not.toBeNull();
    expect(fatal.fatal()?.code).toBe("PHASER_INIT_FAILED");
  });

  it("onReload calls Navigation.reload", () => {
    const { cmp } = createComponent();

    const spy = vi.spyOn(Navigation, "reload").mockImplementation(() => void 0);

    cmp.onReload();

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
