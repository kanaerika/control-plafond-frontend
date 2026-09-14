/**
 * Persiste les tokens Keycloak (access/refresh/id) en sessionStorage.
 *
 * onLoad: 'check-sso' détecte normalement une session existante via une
 * iframe cachée qui lit le cookie de session Keycloak depuis un AUTRE
 * port/origine (localhost:8080 dans une page localhost:4200). Les navigateurs
 * modernes bloquent de plus en plus cet accès "cookie tiers", ce qui fait
 * échouer silencieusement ce check à chaque rechargement de page — l'app
 * croit alors l'utilisateur déconnecté et le renvoie sur Keycloak, même juste
 * après un login réussi.
 *
 * En passant un refreshToken stocké à keycloak.init(), keycloak-js revalide
 * la session via un appel HTTPS direct au endpoint token (kc.updateToken),
 * qui ne dépend d'aucun cookie tiers et fonctionne donc de façon fiable.
 */
const KEY = 'kc-tokens';

export interface StoredTokens {
  token: string;
  refreshToken: string;
  idToken?: string;
}

export function readStoredTokens(): StoredTokens | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTokens(token?: string, refreshToken?: string, idToken?: string): void {
  if (!token || !refreshToken) return;
  sessionStorage.setItem(KEY, JSON.stringify({ token, refreshToken, idToken }));
}

export function clearStoredTokens(): void {
  sessionStorage.removeItem(KEY);
}
