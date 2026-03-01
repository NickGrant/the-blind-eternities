import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";

import { PhaserBootstrapService } from "./phaser-bootstrap.service";
import type { SessionStore } from "../app/core/session.store";
import type { SessionOrchestrator } from "../app/core/session-orchestrator.service";
import type { DeckService } from "../app/core/deck.service";
import { createNewSessionState } from "../state/session.factory";
import type { DevModeStore } from "../app/core/dev-mode";

type MockPhaserGameClass = {
  instances: Array<{ config: { scene: unknown } }>;
};

describe("PhaserBootstrapService", () => {
  beforeEach(() => {
    (Phaser.Game as unknown as MockPhaserGameClass).instances = [];
  });

  function createService(
    storeMock: Pick<SessionStore, "state">,
    orchestratorMock: Pick<SessionOrchestrator, "dispatch">,
    deckMock: Pick<DeckService, "getPlaneName" | "getPlaneArtUrl">
  ) {
    const devModeMock: Pick<DevModeStore, "enabled" | "disableUntilReload"> = {
      enabled: signal(true).asReadonly(),
      disableUntilReload: () => void 0,
    };
    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new PhaserBootstrapService(
          devModeMock as DevModeStore,
          storeMock as SessionStore,
          orchestratorMock as SessionOrchestrator,
          deckMock as DeckService
        )
    );
  }

  it("initializes Phaser once per lifecycle and can re-init after destroy", () => {
    const _state = signal(createNewSessionState({ atMs: 1 }));
    const storeMock: Pick<SessionStore, "state"> = {
      state: _state.asReadonly(),
    };
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };
    const deckMock: Pick<DeckService, "getPlaneName" | "getPlaneArtUrl"> = {
      getPlaneName: () => undefined,
      getPlaneArtUrl: () => undefined,
    };

    const service = createService(storeMock, orchestratorMock, deckMock);

    const container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { value: 900 });
    Object.defineProperty(container, "clientHeight", { value: 500 });

    service.init(container);
    service.init(container);

    expect((Phaser.Game as unknown as MockPhaserGameClass).instances.length).toBe(1);

    service.destroy();
    service.init(container);

    expect((Phaser.Game as unknown as MockPhaserGameClass).instances.length).toBe(2);
  });

  it("registers map scene in Phaser game config", () => {
    const _state = signal(createNewSessionState({ atMs: 1 }));
    const storeMock: Pick<SessionStore, "state"> = {
      state: _state.asReadonly(),
    };
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };
    const deckMock: Pick<DeckService, "getPlaneName" | "getPlaneArtUrl"> = {
      getPlaneName: () => undefined,
      getPlaneArtUrl: () => undefined,
    };

    const service = createService(storeMock, orchestratorMock, deckMock);

    const container = document.createElement("div");
    service.init(container);

    const game = (Phaser.Game as unknown as MockPhaserGameClass).instances[0];
    const scenes = game.config.scene as unknown[];

    expect(Array.isArray(scenes)).toBe(true);
    expect(typeof (scenes[0] as { setSessionState?: unknown }).setSessionState).toBe("function");
  });
});
