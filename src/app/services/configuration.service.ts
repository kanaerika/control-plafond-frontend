import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environment/environment';
import { ConfigurationResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/v1/configuration`;

  lire(): Observable<ConfigurationResponse> {
    return this.http.get<ConfigurationResponse>(this.api);
  }

  modifierPlafond(plafondMensuel: number): Observable<ConfigurationResponse> {
    return this.http.put<ConfigurationResponse>(`${this.api}/plafond`, { plafondMensuel });
  }
}