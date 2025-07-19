import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProyeccionService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  getProyecciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/proyecciones`);
  }

  getProyeccionesLimpias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/proyecciones-limpias`);
  }

  agregarProyeccionCliente(proyecciones: any[], token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/proyecciones/agregar`, proyecciones, { headers });
  }

  getHistorialCliente(): Observable<any[]> {
    const token = this.authService.getToken();

    if (!token) {
      throw new Error('Token no disponible');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(`${this.baseUrl}/proyecciones/historial`, { headers });
  }

  getDetalleProducto(idProyeccion: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/proyecciones/detalles/${idProyeccion}`);
  }

  buscarProyeccionPorId(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/proyecciones/buscar/${id}`);
  }

  agregarProyeccion(proyeccion: any) {
    return this.http.post(`${this.baseUrl}/proyecciones/nueva`, proyeccion);
  }

  editarProyeccion(id: number, proyeccion: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/proyecciones/editar/${id}`, proyeccion);
  }

  eliminarProyeccion(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/proyecciones/eliminar/${id}`);
  }

  getDisponibilidades(): Observable<any> {
    return this.http.get(`${this.baseUrl}/disponibilidades`);
  }

  verificarProyeccionCliente(): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token no disponible');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.baseUrl}/proyecciones/ya-enviada`, { headers });
  }

  getProyeccionesDetalladas(): Observable<any[]> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token no disponible');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(`${this.baseUrl}/proyecciones/resumen-global`, { headers });
  }

  subirArchivoProyecciones(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/importar_proyecciones`, formData);
  }
}


