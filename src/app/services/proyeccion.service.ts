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

  agregarProyeccionCliente(proyeccion: any[], token: string) {
    const idUsuario = this.authService.getUserId();

    if (!idUsuario) {
      throw new Error('No se pudo obtener el id de usuario del token');
    }

    return this.http.post(`${this.baseUrl}/proyecciones/agregar`, proyeccion, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'id_usuario': idUsuario.toString()
      }
    });
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

}


