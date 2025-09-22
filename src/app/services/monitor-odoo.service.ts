import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonitorOdooService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getFacturas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/monitor_odoo`);
  }

  importarFacturas(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/importar_facturas`, formData);
  }

  getUltimaActualizacion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ultima_actualizacion`);
  }
}
