import { TestBed } from '@angular/core/testing';
import { FatalErrorStore } from './fatal-error.store';

describe('FatalErrorStore', () => {
  it('starts with no fatal error', () => {
    const store = TestBed.runInInjectionContext(() => new FatalErrorStore());
    expect(store.fatal()).toBeNull();
  });

  it('set() stores the fatal error', () => {
    const store = TestBed.runInInjectionContext(() => new FatalErrorStore());

    store.set({ code: 'X', message: 'nope', detail: 'details' });
    expect(store.fatal()).toEqual({ code: 'X', message: 'nope', detail: 'details' });
  });

  it('clear() resets fatal to null', () => {
    const store = TestBed.runInInjectionContext(() => new FatalErrorStore());

    store.set({ code: 'X', message: 'nope' });
    store.clear();

    expect(store.fatal()).toBeNull();
  });
});
