import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  it('defaults error input to null', () => {
    const cmp = new ErrorBannerComponent();
    expect(cmp.error).toBeNull();
  });

  it('accepts fatal error payloads via input', () => {
    const cmp = new ErrorBannerComponent();
    cmp.error = {
      code: 'PHASER_INIT_FAILED',
      message: 'Failed to initialize',
      detail: 'Error: boom',
    };
    expect(cmp.error?.code).toBe('PHASER_INIT_FAILED');
    expect(cmp.error?.message).toBe('Failed to initialize');
    expect(cmp.error?.detail).toBe('Error: boom');
  });
});
