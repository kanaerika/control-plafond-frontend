import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { keycloakAuthInterceptor } from './core/keycloak-auth.interceptor';
import { authExpirationInterceptor } from './core/auth-expiration.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { KeycloakService, KeycloakEventTypeLegacy } from 'keycloak-angular';
import { keycloakConfig, initOptions } from './core/keycloak.config';
import { readStoredTokens, saveTokens, clearStoredTokens } from './core/keycloak-token-storage';

/**
 * Initialisation de Keycloak au démarrage de l'application.
 *
 * On réinjecte les tokens persistés (voir keycloak-token-storage.ts) au lieu
 * de compter uniquement sur le check-sso par iframe, qui échoue de façon
 * fiable dans les navigateurs bloquant les cookies tiers dès qu'on recharge
 * la page — provoquant un renvoi immédiat vers le login Keycloak alors que la
 * session est pourtant toujours valide côté serveur.
 */
function initializeKeycloak(keycloakService: KeycloakService): () => Promise<boolean> {
  return () => {
    const stored = readStoredTokens();
    const mergedInitOptions = stored
      ? { ...initOptions, token: stored.token, refreshToken: stored.refreshToken, idToken: stored.idToken }
      : initOptions;

    return keycloakService
      .init({
        config: keycloakConfig,
        initOptions: mergedInitOptions,
        bearerExcludedUrls: ['/assets', '/silent-check-sso.html']
      })
      .then(authenticated => {
        keycloakService.keycloakEvents$.subscribe(event => {
          if (
            event.type === KeycloakEventTypeLegacy.OnAuthSuccess ||
            event.type === KeycloakEventTypeLegacy.OnAuthRefreshSuccess
          ) {
            const kc = keycloakService.getKeycloakInstance();
            saveTokens(kc.token, kc.refreshToken, kc.idToken);
          } else if (
            event.type === KeycloakEventTypeLegacy.OnAuthLogout ||
            event.type === KeycloakEventTypeLegacy.OnAuthRefreshError
          ) {
            clearStoredTokens();
          }
        });

        if (authenticated) {
          const kc = keycloakService.getKeycloakInstance();
          saveTokens(kc.token, kc.refreshToken, kc.idToken);
        } else {
          clearStoredTokens();
        }

        return authenticated;
      })
      .catch(err => {
        // Un refresh token stocké mais expiré/invalide fait échouer init() ;
        // on nettoie et on repart sur un check-sso propre au lieu de rester
        // bloqué en boucle d'erreur.
        clearStoredTokens();
        throw err;
      });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([keycloakAuthInterceptor, authExpirationInterceptor])),
    provideCharts(withDefaultRegisterables()),
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      deps: [KeycloakService],
      multi: true
    }
  ]
};