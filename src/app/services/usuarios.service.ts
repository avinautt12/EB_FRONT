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

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  actualizarUsuario(id: number, usuarioData: {
    usuario?: string;
    contrasena?: string;
    nombre: string;
    correo?: string;
    rol: 'Administrador' | 'Usuario';
  }): Observable<any> {
    console.log('Datos para actualizar:', usuarioData);
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, usuarioData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}