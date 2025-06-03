import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
 private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  obtenerUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios`);
  }

  agregarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, usuario);
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
  }

  actualizarUsuario(id: string, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, usuario);
  }
}