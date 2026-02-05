import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";

import { DebugPanelComponent } from "./debug-panel.component";
import { DEV_MODE } from "../core/dev-mode";
import { SessionStore } from "../core/session.store";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";

describe("DebugPanelComponent", () => {
  it("renders in dev mode and dispatches a start_session intent", async () => {
    const initial = createNewSessionState({ atMs: 123 });
    initial.fsm.state = "SETUP";

    class TestSessionStore {
      private readonly _state = signal(initial);
      readonly state = this._state.asReadonly();
      setState(next: any) {
        this._state.set(next);
      }
    }

    const orchestrator = {
      dispatch: jasmine.createSpy("dispatch"),
    };

    await TestBed.configureTestingModule({
      imports: [DebugPanelComponent],
      providers: [
        { provide: DEV_MODE, useValue: true },
        { provide: SessionStore, useClass: TestSessionStore },
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
    expect(startButton.disabled).toBeFalse();

    startButton.click();
    expect(orchestrator.dispatch).toHaveBeenCalled();

    const arg = orchestrator.dispatch.calls.mostRecent().args[0];
    expect(arg.type).toBe("domain/start_session");
  });
});
