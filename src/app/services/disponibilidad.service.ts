import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private apiUrl = `${environment.apiUrl}/disponibilidades`;

  constructor(private http: HttpClient) { }

  // Obtener todas las disponibilidades
  getDisponibilidades(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Obtener una disponibilidad por ID
  getDisponibilidad(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Agregar una nueva disponibilidad
  agregarDisponibilidad(disponibilidad: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/agregar`, disponibilidad);
  }

  // Actualizar una disponibilidad existente
  actualizarDisponibilidad(id: number, disponibilidad: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/editar/${id}`, disponibilidad);
  }

  // Eliminar una disponibilidad
  eliminarDisponibilidad(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`);
  }
}