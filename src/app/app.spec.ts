import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { PhaserBootstrapService } from '../phaser/phaser-bootstrap.service';
import { FatalErrorStore } from './core/fatal-error.store';

describe('AppComponent', () => {
  it('creates and renders the shell header', async () => {
    const phaser = { init: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // triggers ngAfterViewInit

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Blind Eternities Planechase');
    expect(el.querySelector('button.reload')).toBeNull();
    expect(phaser.init).toHaveBeenCalledTimes(1);
  });

  it('sets fatal error and renders error banner if Phaser init throws', async () => {
    const phaser = { init: vi.fn(() => { throw new Error('boom'); }) };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }, FatalErrorStore],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const store = TestBed.inject(FatalErrorStore);
    expect(store.fatal()).not.toBeNull();
    expect(store.fatal()?.code).toBe('PHASER_INIT_FAILED');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('PHASER_INIT_FAILED');
    expect(el.querySelector('button.reload')).not.toBeNull();
  });

  it('onReload calls window.location.reload', async () => {
    const phaser = { init: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: PhaserBootstrapService, useValue: phaser }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const cmp = fixture.componentInstance;

    const original = window.location.reload;
    const reloadMock = vi.fn();

    Object.defineProperty(window.location, 'reload', {
      value: reloadMock,
      configurable: true,
    });

    cmp.onReload();
    expect(reloadMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(window.location, 'reload', {
      value: original,
      configurable: true,
    });
  });

});
