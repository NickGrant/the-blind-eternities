import { Injectable, signal } from "@angular/core";

export type FatalError = {
  code: string;
  message: string;
  detail?: string;
};

@Injectable({ providedIn: "root" })
export class FatalErrorStore {
  private readonly _fatal = signal<FatalError | null>(null);

  readonly fatal = this._fatal.asReadonly();

  set(error: FatalError): void {
    this._fatal.set(error);
  }

  clear(): void {
    this._fatal.set(null);
  }
}
