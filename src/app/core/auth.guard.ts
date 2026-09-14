import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { firstValueFrom } from 'rxjs';
import { ProfilService } from '../services/profil.service';

/** Nom du partenaire fondateur : seul son admin gère les autres partenaires. */
const PARTENAIRE_AFRILAND = 'Afriland First Bank';

/**
 * Accès aux zones protégées. Avec Keycloak, la vérification se fait via les
 * rôles du realm ; keycloak.login() gère lui-même la redirection.
 */
export const authGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);

  if (!keycloak.isLoggedIn()) {
    keycloak.login();
    return false;
  }
  return true;
};

/**
 * Réservé à la page de changement obligatoire. Keycloak gère lui-même le
 * changement de mot de passe temporaire sur sa propre page hébergée ; cette
 * route applicative n'est donc plus un passage obligé.
 */
export const firstLoginGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);

  if (!keycloak.isLoggedIn()) {
    keycloak.login();
    return false;
  }
  return true;
};

/**
 * Restreint une route à certains rôles Keycloak.
 * Comparaison insensible à la casse : les rôles du realm sont parfois
 * documentés en minuscules ('admin') mais définis en majuscules ('ADMIN')
 * selon le realm-export — se caler sur l'un ou l'autre casse le contrôle
 * d'accès pour de vrais utilisateurs.
 */
export const roleGuard = (...rolesAutorises: string[]): CanActivateFn => () => {
  const keycloak = inject(KeycloakService);

  if (!keycloak.isLoggedIn()) {
    keycloak.login();
    return false;
  }

  const userRoles = keycloak.getUserRoles().map(r => r.toLowerCase());
  const hasRole = rolesAutorises.some(role => {
    const r = role.toLowerCase();
    return userRoles.includes(r) || userRoles.includes(`realm-${r}`);
  });

  return hasRole;
};

/**
 * Réservé à l'admin du partenaire Afriland First Bank : lui seul onboarde les
 * autres partenaires. Un admin d'un autre partenaire a le même rôle Keycloak
 * "ADMIN" — la distinction se fait donc sur le partenaire d'appartenance
 * (résolu via /v1/profil), pas sur le rôle.
 */
export const afrilandGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);
  const profilService = inject(ProfilService);

  if (!keycloak.isLoggedIn()) {
    keycloak.login();
    return false;
  }

  const userRoles = keycloak.getUserRoles().map(r => r.toLowerCase());
  if (!userRoles.includes('admin') && !userRoles.includes('realm-admin')) {
    return false;
  }

  return firstValueFrom(profilService.consulter())
    .then(profil => profil.partenaireNom === PARTENAIRE_AFRILAND)
    .catch(() => false);
};
