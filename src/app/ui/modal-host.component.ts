import { AfterViewChecked, Component, ElementRef, HostListener, ViewChild, computed } from "@angular/core";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";
import { DOMAIN_INTENT } from "../../state/intents.types";

@Component({
  selector: "app-modal-host",
  standalone: true,
  templateUrl: "./modal-host.component.html",
  styleUrls: ["./modal-host.component.scss"],
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
      type: DOMAIN_INTENT.CLOSE_MODAL,
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

