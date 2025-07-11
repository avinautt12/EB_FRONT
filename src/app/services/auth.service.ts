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

  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    } catch (e) {
      return false;
    }
  }

  isLoggedIn(): boolean {
    return this.isTokenValid();
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // En tu AuthService
  getToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  clearToken(): void {
    localStorage.removeItem('token');
  }

  getUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null; // Ajusta 'id' si tu token usa otro nombre, ej: 'userId'
    } catch (e) {
      return null;
    }
  }

}
