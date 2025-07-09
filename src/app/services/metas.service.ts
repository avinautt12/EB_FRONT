import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetasService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // Obtener todas las metas
  getMetas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metas`);
  }

  // Agregar nueva meta
  agregarMeta(meta: {
    nivel: string;
    compromiso_scott: number;
    compromiso_syncros: number;
    compromiso_apparel: number;
    compromiso_vittoria: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metas/agregar`, meta);
  }

  // Editar meta por ID
  editarMeta(id: number, meta: {
    nivel: string;
    compromiso_scott: number;
    compromiso_syncros: number;
    compromiso_apparel: number;
    compromiso_vittoria: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/metas/editar/${id}`, meta);
  }

  // Eliminar meta por ID
  eliminarMeta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/metas/eliminar/${id}`);
  }
}