import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrevioService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getFacturasCalculadas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/monitor_odoo_calculado`);
  }

  actualizarPrevio(todosLosDatos: any[]) {
    return this.http.post(`${this.apiUrl}/actualizar_previo`, { datos: todosLosDatos });
  }

  obtenerPrevio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtener_previo`);
  }
}
