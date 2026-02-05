import { Component, Input } from "@angular/core";
import type { FatalError } from "../core/fatal-error.store";

@Component({
  selector: "app-error-banner",
  standalone: true,
  template: `
    <div class="banner" role="alert">
      @if(error) {
        <div class="title">Error: {{ error.code }}</div>
        <div class="msg">{{ error.message }}</div>
        @if(error.detail) {
          <div class="detail">{{ error.detail }}</div>
        }
      }
    </div>
  `,
  styles: [`
    .banner {
      border: 1px solid #b00020;
      background: #ffebee;
      color: #2b2b2b;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .title { font-weight: 700; margin-bottom: 4px; }
    .msg { font-weight: 500; }
    .detail { margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; opacity: 0.9; }
  `],
})
export class ErrorBannerComponent {
  @Input({ required: true }) error: FatalError | null = null;
}
