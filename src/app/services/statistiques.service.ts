import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environment/environment';
import { StatistiquesResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StatistiquesService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/v1/statistiques`;

  charger(): Observable<StatistiquesResponse> {
    return this.http.get<StatistiquesResponse>(this.api);
  }
}