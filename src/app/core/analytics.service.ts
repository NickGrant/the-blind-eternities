import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Initializes optional GA4 tracking for production hosts when configured.
 */
@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private initialized = false;
  private activeMeasurementId?: string;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const measurementId = environment.analyticsMeasurementId?.trim();
    if (!measurementId) return;
    this.activeMeasurementId = measurementId;

    this.ensureTagScript(measurementId);
    const dataLayer = (window.dataLayer = window.dataLayer ?? []);
    window.gtag = window.gtag ?? ((...args: unknown[]) => dataLayer.push(args));
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { anonymize_ip: true });
  }

  trackEvent(name: string, params?: Record<string, string | number | boolean | null>): void {
    if (!this.activeMeasurementId) return;
    if (!window.gtag) return;
    window.gtag("event", name, params ?? {});
  }

  private ensureTagScript(measurementId: string): void {
    const src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }
}
