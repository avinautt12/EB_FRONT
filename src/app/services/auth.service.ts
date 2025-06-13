import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, user);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  enviarCodigoActivacion(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar_codigo_activacion`, { correo });
  }

  verificarCodigo(codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar_codigo`, { codigo });
  }

  cambiarContrasena(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cambiar_contrasena`, {
      token,
      nueva_contrasena: nuevaContrasena
    });
  }
}
