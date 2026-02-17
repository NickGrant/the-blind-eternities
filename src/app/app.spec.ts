import { TestBed } from "@angular/core/testing";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { AppComponent, reloadPage } from "./app";
import { FatalErrorStore } from "./core/fatal-error.store";
import { PhaserBootstrapService } from "../phaser/phaser-bootstrap.service";

describe("AppComponent", () => {
  beforeEach(() => {
    // Vitest/Angular (platform-browser testing) does not resolve templateUrl/styleUrl
    // automatically. Override with an inline template that still exercises the same behavior.
    TestBed.overrideComponent(AppComponent, {
      set: {
        template: `
          <header class="shell">
            <h1>Blind Eternities Planechase</h1>
            @if (hasFatal()) {
              <button class="reload" type="button" (click)="onReload()">Reload</button>
            }
          </header>
          <app-error-banner [error]="fatal()"></app-error-banner>
          <div #phaserHost></div>
        `,
        styles: [],
      },
    });
  });

  it("creates and renders the shell header", async () => {
    const phaser = { init: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }, FatalErrorStore],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("h1")?.textContent).toContain("Blind Eternities Planechase");
    expect(el.querySelector("button.reload")).toBeNull();
    expect(phaser.init).toHaveBeenCalledTimes(1);
  });

  it("sets fatal error and renders error banner if Phaser init throws", async () => {
    const phaser = {
      init: vi.fn(() => {
        throw new Error("boom");
      }),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }, FatalErrorStore],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const store = TestBed.inject(FatalErrorStore);
    expect(store.fatal()).not.toBeNull();
    expect(store.fatal()?.code).toBe("PHASER_INIT_FAILED");

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector("button.reload")).not.toBeNull();
    expect(el.querySelector("[role='alert']")?.textContent).toContain("PHASER_INIT_FAILED");
  });

  it("onReload calls reloadPage", async () => {
    const phaser = { init: vi.fn() };
    const reloadSpy = vi.spyOn({ reloadPage }, "reloadPage").mockImplementation(() => void 0);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }, FatalErrorStore],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const cmp = fixture.componentInstance;

    cmp.onReload();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    reloadSpy.mockRestore();
  });
});