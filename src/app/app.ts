// src/app/app.ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from "@angular/core";
import { ErrorBannerComponent } from "./ui/error-banner.component";
import { DebugPanelComponent } from "./ui/debug-panel.component";
import { ModalHostComponent } from "./ui/modal-host.component";
import { ControlBarComponent } from "./ui/control-bar.component";
import { FatalErrorStore } from "./core/fatal-error.store";
import { PhaserBootstrapService } from "../phaser/phaser-bootstrap.service";
import { SessionStore } from "./core/session.store";

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
  imports: [ErrorBannerComponent, DebugPanelComponent, ModalHostComponent, ControlBarComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class AppComponent implements AfterViewInit {
  @ViewChild("phaserHost", { static: true }) phaserHost!: ElementRef<HTMLDivElement>;

  private readonly fatalErrorStore = inject(FatalErrorStore);
  private readonly phaser = inject(PhaserBootstrapService);
  private readonly sessionStore = inject(SessionStore);

  readonly fatal = this.fatalErrorStore.fatal;
  readonly hasFatal = computed(() => this.fatal() !== null);
  readonly logEntries = computed(() => [...this.sessionStore.state().log.entries].reverse().slice(0, 25));
  readonly rollToast = signal<{ id: number; message: string } | null>(null);
  private readonly lastProcessedLogId = signal<string | null>(null);
  private nextToastId = 0;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const entries = this.sessionStore.state().log.entries;
      const latest = entries.length > 0 ? entries[entries.length - 1] : null;
      if (!latest) return;
      if (latest.id === this.lastProcessedLogId()) return;
      this.lastProcessedLogId.set(latest.id);

      const outcome = parseDieOutcome(latest.message);
      if (!outcome) return;
      this.showRollToast(outcome);
    });
  }

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

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private showRollToast(outcome: "blank" | "chaos" | "planeswalk"): void {
    const message =
      outcome === "chaos" ? "CHAOS!" : outcome === "planeswalk" ? "PLANESWALK!" : "Blank roll";

    this.rollToast.set({ id: ++this.nextToastId, message });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.rollToast.set(null), 1500);
  }
}

function parseDieOutcome(message: string): "blank" | "chaos" | "planeswalk" | null {
  const match = /^Die roll resolved:\s*(blank|chaos|planeswalk)\./i.exec(message.trim());
  if (!match) return null;
  return match[1].toLowerCase() as "blank" | "chaos" | "planeswalk";
}
