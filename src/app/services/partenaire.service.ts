import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environment/environment';
import { Partenaire } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {

  private readonly http = inject(HttpClient);

  private readonly api = environment.apiUrl + '/v1/partenaires';

  getAll(): Observable<Partenaire[]> {
    return this.http.get<Partenaire[]>(this.api);
  }

  create(data: any): Observable<Partenaire> {
    return this.http.post<Partenaire>(this.api, data);
  }

  update(id: string, data: any): Observable<Partenaire> {
    return this.http.put<Partenaire>(`${this.api}/${id}`, data);
  }

  supprimer(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  activerDesactiver(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/activation`, {});
  }

  renvoyerInvitation(id: string): Observable<any> {
    return this.http.post(`${this.api}/${id}/invitation`, {});
  }

  getById(id:string){

   return this.http.get<Partenaire>(
      `${this.api}/${id}`
   );

}
  envoyerInvitation(id:string){

    return this.http.post(

        `${this.api}/${id}/invitation`,

        {}

    );

}

}