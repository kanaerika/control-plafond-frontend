import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

export interface ValidationInvitation {
  email: string;
  message: string;
}

/**
 * Activation d'un compte depuis le lien reçu par email.
 * Endpoints publics : aucun token JWT n'est requis (l'invité n'en a pas encore).
 */
@Injectable({ providedIn: 'root' })
export class ActivationService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/invitation`;

  /** Vérifie que le lien est encore utilisable et renvoie l'email associé. */
  verifierToken(token: string): Observable<ValidationInvitation> {
    return this.http.post<ValidationInvitation>(`${this.api}/validation`, {}, {
      params: { token }
    });
  }

  activerCompte(token: string, motDePasse: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/activer`, { token, motDePasse });
  }
}
