import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { from, switchMap, catchError, throwError } from 'rxjs';

/**
 * Ajoute le token JWT Keycloak aux headers Authorization de chaque requête.
 *
 * IMPORTANT : KeycloakService.getToken() est `async` (retourne une Promise),
 * pas une valeur synchrone. L'utiliser directement dans un template literal
 * (`Bearer ${token}`) sérialise la Promise elle-même en la chaîne littérale
 * "[object Promise]" : le backend reçoit un header Authorization invalide,
 * répond 401 sur CHAQUE appel API, et le handler d'erreur ci-dessous
 * interprète ce faux 401 comme une session expirée puis appelle
 * keycloak.logout() — renvoyant l'utilisateur au login Keycloak alors que sa
 * session est en réalité toujours valide. On passe donc par from()+switchMap
 * pour résoudre le token avant de cloner la requête.
 */
export const keycloakAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (!keycloakService.isLoggedIn()) {
    return next(req);
  }

  return from(keycloakService.getToken()).pipe(
    switchMap(token => {
      const requete = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(requete);
    }),
    catchError((err: HttpErrorResponse) => {
      // Seul un 401 (token absent/expiré/invalide) signifie « session perdue » et
      // justifie une déconnexion. Un 403 = authentifié mais pas autorisé pour CETTE
      // ressource : la session reste valide, on laisse le composant afficher le
      // message. Traiter le 403 comme le 401 provoquait une boucle de redirection
      // (la 1re page admin appelle une API interdite → logout → login → …).
      if (err.status === 401 && !req.url.includes('/auth')) {
        keycloakService.logout();
        router.navigate(['/connexion'], { queryParams: { expire: '1' } });
      }
      return throwError(() => err);
    })
  );
};
