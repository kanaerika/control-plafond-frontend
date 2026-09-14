import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environment/environment';
import { ProfilResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProfilService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/v1/profil`;

  consulter(): Observable<ProfilResponse> {
    return this.http.get<ProfilResponse>(this.api);
  }

  modifier(data: { nomComplet: string; email: string; agence: string }): Observable<ProfilResponse> {
    return this.http.put<ProfilResponse>(this.api, data);
  }
}
