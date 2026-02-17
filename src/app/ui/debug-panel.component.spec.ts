import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { describe, it, expect, vi } from "vitest";

import { DebugPanelComponent } from "./debug-panel.component";
import { DEV_MODE } from "../core/dev-mode";
import { SessionStore } from "../core/session.store";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";

describe("DebugPanelComponent", () => {
  it("renders in dev mode and dispatches a start_session intent", async () => {
    const initial = createNewSessionState({ atMs: 123 });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
    };

    const orchestrator = {
      dispatch: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DebugPanelComponent],
      providers: [
        { provide: DEV_MODE, useValue: true },
        { provide: SessionStore, useValue: storeMock },
        { provide: SessionOrchestrator, useValue: orchestrator },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DebugPanelComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const startButton = Array.from(el.querySelectorAll("button")).find((b) =>
      (b.textContent ?? "").includes("Start Session"),
    ) as HTMLButtonElement;

    expect(startButton).toBeTruthy();
    expect(startButton.disabled).toBe(false);

    startButton.click();
    expect(orchestrator.dispatch).toHaveBeenCalledTimes(1);

    const arg = (orchestrator.dispatch as any).mock.calls[0][0];
    expect(arg.type).toBe("domain/start_session");
  });
});