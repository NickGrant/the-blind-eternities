import { Component, Input } from "@angular/core";
import type { FatalError } from "../core/fatal-error.store";

@Component({
  selector: "app-error-banner",
  standalone: true,
  templateUrl: "./error-banner.component.html",
  styleUrls: ["./error-banner.component.scss"],
})
export class ErrorBannerComponent {
  @Input({ required: true }) error: FatalError | null = null;
}

