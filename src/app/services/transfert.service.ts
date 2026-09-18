import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Bilan, ClientConnu, PlafondClient, Referentiel, Transfert,
  VerificationRequest, VerificationResponse
} from '../models/models';
import { environment } from '../environment/environment';
 
@Injectable({ providedIn: 'root' })
export class TransfertService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  clientsConnus(q: string) {
    return this.http.get<ClientConnu[]>(`${this.api}/v1/transferts/clients-connus`,
      { params: new HttpParams().set('q', q) });
  }

  referentiel() {
    return this.http.get<Referentiel>(`${this.api}/v1/referentiel`);
  }

  verifier(req: VerificationRequest) {
    return this.http.post<VerificationResponse>(`${this.api}/v1/transferts/verification`, req);
  }

  /** Contrôle en lecture seule (sans enregistrement) du plafond déjà atteint par un client. */
  plafondClient(nomClient: string, numeroPiece: string, dateNaissance: string) {
    return this.http.get<PlafondClient>(`${this.api}/v1/transferts/plafond-client`, {
      params: new HttpParams()
        .set('nomClient', nomClient)
        .set('numeroPiece', numeroPiece)
        .set('dateNaissance', dateNaissance)
    });
  }

  executer(req: VerificationRequest & { reference: string; canal: string; transfertId?: number | null }) {
    return this.http.post<Transfert>(`${this.api}/v1/transferts/execution`, req);
  }

  nonClotures(q = '') {
    return this.http.get<Transfert[]>(`${this.api}/v1/transferts/non-clotures`,
      { params: new HttpParams().set('q', q) });
  }

  cloturer(id: number, reference: string, canal: string) {
    return this.http.post<Transfert>(`${this.api}/v1/transferts/cloture`,
      { transfertId: id, reference, canal });
  }

  historique(q = '') {
    return this.http.get<Transfert[]>(`${this.api}/v1/transferts/historique`,
      { params: new HttpParams().set('q', q) });
  }

  annulables(q = '') {
    return this.http.get<Transfert[]>(`${this.api}/v1/transferts/annulables`,
      { params: new HttpParams().set('q', q) });
  }

  annuler(id: number, motif: string) {
    return this.http.post<Transfert>(`${this.api}/v1/transferts/${id}/annulation`, { motif });
  }

  rejeter(id: number, motif: string) {
    return this.http.post<Transfert>(`${this.api}/v1/transferts/${id}/rejet`, { motif });
  }

  bilan() {
    return this.http.get<Bilan>(`${this.api}/v1/transferts/bilan`);
  }
  detail(id: number) {
    return this.http.get<Transfert>(`${this.api}/v1/transferts/${id}`);
  }
}
