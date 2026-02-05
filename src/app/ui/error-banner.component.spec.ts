import { TestBed } from '@angular/core/testing';
import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  it('renders an alert banner even when error is null', async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.componentInstance.error = null;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('renders code, message, and optional detail when error exists', async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.componentInstance.error = {
      code: 'PHASER_INIT_FAILED',
      message: 'Failed to initialize',
      detail: 'Error: boom',
    };
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';

    expect(text).toContain('Error: PHASER_INIT_FAILED');
    expect(text).toContain('Failed to initialize');
    expect(text).toContain('Error: boom');
  });
});
