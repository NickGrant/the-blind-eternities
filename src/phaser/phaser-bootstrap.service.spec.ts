import { TestBed } from '@angular/core/testing';
import { PhaserBootstrapService } from './phaser-bootstrap.service';
import { DEV_MODE } from '../app/core/dev-mode';

// Mock Phaser so unit tests don't attempt real canvas/game boot in jsdom.
const gameCtor = vi.fn();

vi.mock('phaser', () => {
  return {
    default: {
      AUTO: 0,
      Scale: { RESIZE: 'RESIZE', CENTER_BOTH: 'CENTER_BOTH' },
      Game: gameCtor,
    },
  };
});

describe('PhaserBootstrapService', () => {
  beforeEach(() => {
    gameCtor.mockClear();
  });

  it('initializes Phaser.Game only once', async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: DEV_MODE, useValue: true }],
    }).compileComponents();

    const svc = TestBed.inject(PhaserBootstrapService);
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 123 });
    Object.defineProperty(container, 'clientHeight', { value: 45 });

    svc.init(container);
    svc.init(container);

    expect(gameCtor).toHaveBeenCalledTimes(1);
  });

  it('uses container size with fallback and configures fps forceSetTimeOut based on DEV_MODE', async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: DEV_MODE, useValue: false }],
    }).compileComponents();

    const svc = TestBed.inject(PhaserBootstrapService);
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 0 });
    Object.defineProperty(container, 'clientHeight', { value: 0 });

    svc.init(container);

    expect(gameCtor).toHaveBeenCalledTimes(1);
    const config = gameCtor.mock.calls[0][0];

    expect(config.width).toBe(800);
    expect(config.height).toBe(450);
    expect(config.fps.forceSetTimeOut).toBe(true);
  });

  it('destroy clears the cached game instance', async () => {
    const destroy = vi.fn();
    gameCtor.mockImplementation(() => ({ destroy }));

    await TestBed.configureTestingModule({
      providers: [{ provide: DEV_MODE, useValue: true }],
    }).compileComponents();

    const svc = TestBed.inject(PhaserBootstrapService);
    const container = document.createElement('div');

    svc.init(container);
    svc.destroy();

    expect(destroy).toHaveBeenCalledWith(true);

    // Should be able to init again after destroy
    svc.init(container);
    expect(gameCtor).toHaveBeenCalledTimes(2);
  });
});
