import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { AnalyticsService } from "./analytics.service";
import { environment } from "../../environments/environment";

describe("AnalyticsService", () => {
  let originalMeasurementId: string | undefined;

  beforeEach(() => {
    originalMeasurementId = environment.analyticsMeasurementId;
    delete window.gtag;
    delete window.dataLayer;
    document
      .querySelectorAll('script[src*="googletagmanager.com/gtag/js?id="]')
      .forEach((node) => node.remove());
  });

  afterEach(() => {
    environment.analyticsMeasurementId = originalMeasurementId;
  });

  it("does nothing when no measurement id is configured", () => {
    environment.analyticsMeasurementId = undefined;
    const service = new AnalyticsService();
    service.init();
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js?id="]')).toBeNull();
  });

  it("injects gtag script and configures GA once when measurement id is provided", () => {
    environment.analyticsMeasurementId = "G-UNITTEST";
    const service = new AnalyticsService();

    service.init();
    service.init();

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-UNITTEST"]');
    expect(scripts.length).toBe(1);
    expect(typeof window.gtag).toBe("function");
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect((window.dataLayer ?? []).length).toBe(2);
  });

  it("tracks events only after GA is configured", () => {
    environment.analyticsMeasurementId = "G-UNITTEST";
    const service = new AnalyticsService();
    service.trackEvent("be_before_init", { a: 1 });
    service.init();
    service.trackEvent("be_after_init", { a: 1 });
    const last = (window.dataLayer ?? [])[2] as unknown[];
    expect(last?.[0]).toBe("event");
    expect(last?.[1]).toBe("be_after_init");
  });
});
