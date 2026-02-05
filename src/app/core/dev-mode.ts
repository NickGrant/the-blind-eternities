import { InjectionToken } from "@angular/core";
import { environment } from "../../environments/environment";

export const DEV_MODE = new InjectionToken<boolean>("DEV_MODE", {
  providedIn: "root",
  factory: () => !!environment.dev,
});
