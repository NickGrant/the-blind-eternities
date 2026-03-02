import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { DeckService } from "./core/deck.service";

function initializeCardCatalog(deckService: DeckService) {
  return () => deckService.loadCatalog();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeCardCatalog,
      deps: [DeckService],
    },
  ]
};
