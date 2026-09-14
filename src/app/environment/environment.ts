export const environment = {
  production: false,
  // TEMPORAIRE pour tester en local avec le backend + Keycloak locaux.
  // Il n'existe pas de fichier environment.prod.ts / fileReplacements dans
  // angular.json : ce fichier est utilisé tel quel en dev ET en prod.
  // Remettre 'https://afriland-transfert-api.onrender.com/api' (et
  // production: true) avant tout déploiement.
  apiUrl: 'http://localhost:8081/api'
};
  