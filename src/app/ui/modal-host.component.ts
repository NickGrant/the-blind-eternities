import { AfterViewChecked, Component, ElementRef, HostListener, ViewChild, computed, signal } from "@angular/core";
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
  private dragPointerId: number | null = null;
  private dragLast = { x: 0, y: 0 };

  readonly state;
  readonly activeModal = computed(() => this.state().modal.active);
  readonly queueCount = computed(() => this.state().modal.queue.length);
  readonly modalOffset = signal({ x: 0, y: 0 });
  readonly isDragging = signal(false);
  readonly modalOffsetX = computed(() => `${this.modalOffset().x}px`);
  readonly modalOffsetY = computed(() => `${this.modalOffset().y}px`);
  readonly modalTitle = computed(() => {
    const modal = this.activeModal();
    if (!modal) return "";
    if (modal.title) return modal.title;
    if (modal.planeId) return this.deckService.getPlaneName(modal.planeId) ?? modal.planeId;
    return modal.type;
  });
  readonly modalBodyHtml = computed(() => {
    const modal = this.activeModal();
    if (!modal) return "";
    if (modal.body) return this.formatModalBodyHtml(modal.body);
    if (modal.type === "PLANE") {
      const rules = this.deckService.getPlaneRulesText(modal.planeId);
      if (rules) return this.formatModalBodyHtml(rules);
    }
    return this.formatModalBodyHtml("No additional details.");
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
      this.isDragging.set(false);
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

  onModalPointerDown(event: PointerEvent): void {
    if (!this.activeModal()) return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) return;
    this.dragPointerId = event.pointerId;
    this.dragLast = { x: event.clientX, y: event.clientY };
    this.isDragging.set(true);
    event.preventDefault();
  }

  @HostListener("document:pointermove", ["$event"])
  onPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    const dx = event.clientX - this.dragLast.x;
    const dy = event.clientY - this.dragLast.y;
    if (dx === 0 && dy === 0) return;
    this.dragLast = { x: event.clientX, y: event.clientY };
    const delta = this.clampDragDelta(dx, dy);
    if (delta.dx === 0 && delta.dy === 0) return;
    this.modalOffset.update((offset) => ({ x: offset.x + delta.dx, y: offset.y + delta.dy }));
  }

  @HostListener("document:pointerup", ["$event"])
  onPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    this.dragPointerId = null;
    this.isDragging.set(false);
  }

  @HostListener("document:pointercancel", ["$event"])
  onPointerCancel(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    this.dragPointerId = null;
    this.isDragging.set(false);
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

  private formatModalBodyHtml(raw: string): string {
    const normalized = raw.replace(/\r\n?/g, "\n").trim();
    return this.escapeHtml(normalized).replace(/\n/g, "<br /><br />");
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private clampDragDelta(dx: number, dy: number): { dx: number; dy: number } {
    const panel = this.modalPanel?.nativeElement;
    if (!panel) return { dx, dy };

    const rect = panel.getBoundingClientRect();
    const minDx = -rect.left;
    const maxDx = window.innerWidth - rect.right;
    const minDy = -rect.top;
    const maxDy = window.innerHeight - rect.bottom;

    return {
      dx: Math.min(maxDx, Math.max(minDx, dx)),
      dy: Math.min(maxDy, Math.max(minDy, dy)),
    };
  }
}
