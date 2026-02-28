// src/app/app.ts
import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject } from "@angular/core";
import { ErrorBannerComponent } from "./ui/error-banner.component";
import { DebugPanelComponent } from "./ui/debug-panel.component";
import { ModalHostComponent } from "./ui/modal-host.component";
import { FatalErrorStore } from "./core/fatal-error.store";
import { PhaserBootstrapService } from "../phaser/phaser-bootstrap.service";

/**
 * Indirection to keep reload testable under Vitest/JSDOM.
 * (Spying on same-module exported functions is unreliable with ESM bindings.)
 */
export const Navigation = {
  reload(): void {
    window.location.reload();
  },
};

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ErrorBannerComponent, DebugPanelComponent, ModalHostComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class AppComponent implements AfterViewInit {
  @ViewChild("phaserHost", { static: true }) phaserHost!: ElementRef<HTMLDivElement>;

  private readonly fatalErrorStore = inject(FatalErrorStore);
  private readonly phaser = inject(PhaserBootstrapService);

  readonly fatal = this.fatalErrorStore.fatal;
  readonly hasFatal = computed(() => this.fatal() !== null);

  ngAfterViewInit(): void {
    try {
      this.phaser.init(this.phaserHost.nativeElement);
    } catch (err) {
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      this.fatalErrorStore.set({
        code: "PHASER_INIT_FAILED",
        message: "Failed to initialize the game canvas. Please refresh to retry.",
        detail,
      });
    }
  }

  onReload(): void {
    Navigation.reload();
  }
}
