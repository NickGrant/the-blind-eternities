import { AfterViewChecked, Component, ElementRef, HostListener, ViewChild, computed } from "@angular/core";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";

@Component({
  selector: "app-modal-host",
  standalone: true,
  template: `
    @if (activeModal()) {
      <div class="backdrop">
        <section
          #modalPanel
          class="modal"
          role="dialog"
          aria-modal="false"
          [attr.aria-labelledby]="'modal-title-' + activeModal()!.id"
          [attr.aria-describedby]="'modal-body-' + activeModal()!.id"
          tabindex="-1"
        >
          <div class="attentionBar" aria-hidden="true"></div>
          <header>
            <h3 [id]="'modal-title-' + activeModal()!.id">{{ modalTitle() }}</h3>
            <div class="meta">
              @if (queueCount() > 0) {
                <span>{{ queueCount() }} queued</span>
              }
            </div>
          </header>

          <p [id]="'modal-body-' + activeModal()!.id">{{ modalBody() }}</p>

          <footer>
            <button type="button" (click)="closeActiveModal()">Close</button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        pointer-events: none;
        display: grid;
        place-items: start end;
        padding: 84px 24px 24px;
      }
      .modal {
        width: min(560px, 100%);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        background: linear-gradient(180deg, #111c2d 0%, #0a1320 100%);
        color: #f5f7fb;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
        padding: 18px;
        display: grid;
        gap: 14px;
        pointer-events: auto;
        animation: modalPop 220ms ease-out;
      }
      .attentionBar {
        height: 6px;
        border-radius: 999px;
        background: linear-gradient(90deg, #ffd166 0%, #ff7b54 50%, #ff4d6d 100%);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      h3 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 0.01em;
      }
      .meta {
        font-size: 13px;
        opacity: 0.8;
      }
      p {
        margin: 0;
        font-size: 17px;
        line-height: 1.5;
        letter-spacing: 0.005em;
      }
      footer {
        display: flex;
        justify-content: flex-end;
      }
      button {
        padding: 9px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
        cursor: pointer;
      }
      @keyframes modalPop {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class ModalHostComponent implements AfterViewChecked {
  @ViewChild("modalPanel") private modalPanel?: ElementRef<HTMLElement>;
  private focusedModalId?: string;

  readonly state;
  readonly activeModal = computed(() => this.state().modal.active);
  readonly queueCount = computed(() => this.state().modal.queue.length);
  readonly modalTitle = computed(() => {
    const modal = this.activeModal();
    if (!modal) return "";
    if (modal.title) return modal.title;
    if (modal.planeId) return this.deckService.getPlaneName(modal.planeId) ?? modal.planeId;
    return modal.type;
  });
  readonly modalBody = computed(() => {
    const modal = this.activeModal();
    if (!modal) return "";
    if (modal.body) return modal.body;
    if (modal.type === "PLANE") {
      const rules = this.deckService.getPlaneRulesText(modal.planeId);
      if (rules) return rules;
    }
    return "No additional details.";
  });

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly orchestrator: SessionOrchestrator,
    private readonly deckService: DeckService
  ) {
    this.state = this.sessionStore.state;
  }

  ngAfterViewChecked(): void {
    const active = this.activeModal();
    if (!active) {
      this.focusedModalId = undefined;
      return;
    }
    if (this.focusedModalId === active.id) return;
    this.focusedModalId = active.id;
    queueMicrotask(() => this.focusModalPanel());
  }

  closeActiveModal(): void {
    const active = this.activeModal();
    if (!active) return;

    this.orchestrator.dispatch({
      type: "domain/close_modal",
      atMs: Date.now(),
      modalId: active.id,
    });
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.activeModal()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeActiveModal();
      return;
    }
    if (event.key === "Tab") {
      this.handleTabFocus(event);
    }
  }

  private focusModalPanel(): void {
    const panel = this.modalPanel?.nativeElement;
    if (!panel) return;

    const first = this.getFocusable(panel)[0];
    (first ?? panel).focus();
  }

  private handleTabFocus(event: KeyboardEvent): void {
    const panel = this.modalPanel?.nativeElement;
    if (!panel) return;

    const focusable = this.getFocusable(panel);
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const current = document.activeElement as HTMLElement | null;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!current || !panel.contains(current)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusable(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));
  }
}
