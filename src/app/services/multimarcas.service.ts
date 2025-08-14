import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MultimarcasService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getMultimarcas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes_multimarcas`);
  }

}
