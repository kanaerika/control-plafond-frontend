import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environment/environment';
import { Agent, MessageResponse } from '../models/models';

/** Requête de création/modification d'un agent (alignée sur AgentRequest du backend). */
export interface AgentRequest {
  nomComplet: string;
  email: string;
  agence?: string;
  codeAgent?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/v1/agents`;

  // Le partenaire est déduit du JWT côté backend : aucun id à transmettre.

  getAll(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.api);
  }

  create(data: AgentRequest): Observable<Agent> {
    return this.http.post<Agent>(this.api, data);
  }

  update(id: number, data: AgentRequest): Observable<Agent> {
    return this.http.put<Agent>(`${this.api}/${id}`, data);
  }

  /** Bascule actif/inactif (le backend inverse l'état courant). */
  basculerActif(id: number): Observable<Agent> {
    return this.http.patch<Agent>(`${this.api}/${id}/activation`, {});
  }

  renvoyerInvitation(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/${id}/invitation`, {});
  }

  reinitialiser(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/${id}/reinitialisation`, {});
  }

  // Décommenter si tu ajoutes le DELETE au backend (voir plus bas).
  // supprimer(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.api}/${id}`);
  // }
}