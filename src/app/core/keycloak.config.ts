import { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

/**
 * Configuration Keycloak pour le frontend Angular.
 * clientId doit correspondre exactement au client défini dans le realm
 * Keycloak (afriland) — vérifié: "afb-frontend", PAS "control-plafond-frontend"
 * ni tout autre nom historique. Un clientId inexistant fait échouer l'init
 * avec client_not_found avant même d'afficher le login.
 */
export const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'afriland',
  clientId: 'afb-frontend'
};

/**
 * Configuration Keycloak Angular.
 * Les rôles du realm Keycloak sont accessibles via keycloakService.getUserRoles()
 */
export const initOptions: KeycloakInitOptions = {
  // 'check-sso' : vérifie silencieusement une session existante sans forcer
  // la redirection, pour laisser les routes publiques (landing, connexion...)
  // accessibles. Les guards déclenchent keycloak.login() sur les routes
  // protégées. 'login-required' bloquerait toute la SPA derrière Keycloak.
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  // Le client Keycloak exige PKCE (pkce.code.challenge.method: S256). Sans ce
  // paramètre, Keycloak rejette la redirection avec
  // invalid_request: Missing parameter: code_challenge_method.
  pkceMethod: 'S256',
  // Désactive l'iframe de monitoring de session (true par défaut) : elle est
  // fragile dans de nombreux contextes et sa présence n'est pas nécessaire ici
  // (updateToken() suffit pour gérer l'expiration du token).
  checkLoginIframe: false,
  // BUG connu de keycloak-js : sa validation de nonce post-login compare le
  // nonce stocké non seulement à l'id_token (qui le porte correctement) mais
  // AUSSI à l'access_token et au refresh_token, qui n'ont jamais de claim
  // "nonce" par défaut sur un Keycloak standard. Cela déclenche un faux
  // mismatch systématique qui efface les tokens fraîchement obtenus et fait
  // échouer keycloak.init() (page blanche) après CHAQUE login pourtant réussi
  // côté serveur. State + PKCE (S256) suffisent à protéger le flux
  // "Authorization Code" contre le CSRF et l'interception du code.
  useNonce: false
};
