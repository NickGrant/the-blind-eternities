import { Component, computed } from "@angular/core";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";

@Component({
  selector: "app-modal-host",
  standalone: true,
  template: `
    @if (activeModal()) {
      <div class="backdrop">
        <section class="modal">
          <header>
            <h3>{{ modalTitle() }}</h3>
            <div class="meta">
              @if (queueCount() > 0) {
                <span>{{ queueCount() }} queued</span>
              }
            </div>
          </header>

          <p>{{ modalBody() }}</p>

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
        background: rgba(3, 5, 9, 0.58);
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .modal {
        width: min(560px, 100%);
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: #0d1420;
        color: #f5f7fb;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        padding: 16px;
        display: grid;
        gap: 12px;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      h3 {
        margin: 0;
        font-size: 18px;
      }
      .meta {
        font-size: 12px;
        opacity: 0.8;
      }
      p {
        margin: 0;
        font-size: 14px;
      }
      footer {
        display: flex;
        justify-content: flex-end;
      }
      button {
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
        cursor: pointer;
      }
    `,
  ],
})
export class ModalHostComponent {
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
    return modal.body ?? "No additional details.";
  });

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly orchestrator: SessionOrchestrator,
    private readonly deckService: DeckService
  ) {
    this.state = this.sessionStore.state;
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
}

