import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Harmonise les réponses d'erreur du backend.
 *
 * Le backend répond au format ProblemDetail (RFC 7807) : le texte lisible est
 * dans `detail`. Or la plupart des écrans lisent `err.error.message` — le champ
 * des erreurs Spring par défaut. Sans cette normalisation, l'utilisateur voyait
 * « Impossible d'effectuer cette opération » au lieu de la vraie raison
 * (« N° de CNI invalide… », « suppression impossible… »).
 *
 * On recopie donc `detail` dans `message` quand il manque, une seule fois ici
 * plutôt que dans chaque composant.
 */
export const erreurHttpInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && estProblemDetail(err.error) && !err.error.message) {
        return throwError(() => new HttpErrorResponse({
          error: { ...err.error, message: err.error.detail },
          headers: err.headers,
          status: err.status,
          statusText: err.statusText,
          url: err.url ?? undefined
        }));
      }
      return throwError(() => err);
    })
  );

function estProblemDetail(corps: unknown): corps is { detail: string; message?: string } {
  return typeof corps === 'object' && corps !== null
    && typeof (corps as { detail?: unknown }).detail === 'string';
}
