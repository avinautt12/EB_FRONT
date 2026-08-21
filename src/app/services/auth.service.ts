import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface PermisoItem {
  modulo: string;
  accion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private logoutSubject = new Subject<void>();
  public onLogout$ = this.logoutSubject.asObservable();

  private authState = new BehaviorSubject<boolean>(this.isLoggedIn());
  public authState$ = this.authState.asObservable();

  private apiUrl = environment.apiUrl;

  // Matriz de rutas permitidas cargadas en memoria (ej. '/garantias/ver')
  private rutasPermitidas = new Set<string>();

  constructor(private http: HttpClient) {
    this.restaurarPermisosLocales();
  }

  // ==========================================
  // GESTIÓN DE PERMISOS Y MATRIZ
  // ==========================================

  /**
   * Carga los permisos del usuario desde la API sin interrumpir el flujo si falla
   */
  cargarPermisos(hijoId: number, padreId: number): Observable<any> {
    return this.http.get<{ permisos: PermisoItem[] }>(
      `${this.apiUrl}/permisos/usuario/${hijoId}?padre_id=${padreId}`
    ).pipe(
      tap(response => {
        const setRutas = new Set<string>();
        if (response && response.permisos && Array.isArray(response.permisos)) {
          response.permisos.forEach(p => {
            setRutas.add(`/${p.modulo}/${p.accion}`.toLowerCase());
          });
        }
        this.rutasPermitidas = setRutas;
        localStorage.setItem('rutas_permitidas', JSON.stringify(Array.from(setRutas)));
      }),
      catchError(err => {
        console.warn('Error al obtener la matriz de permisos:', err);
        this.rutasPermitidas = new Set();
        return of({ permisos: [] });
      })
    );
  }

  /**
   * Consulta in-situ si una ruta o acción está permitida.
   * Retorna true si es Admin del Sistema (rol === 1) o si existe en la matriz.
   */
  hasPermission(pathOAccion: string): boolean {
    if (this.isAdmin()) return true; // Bypass total para Administrador del Sistema

    const rutaLimpia = pathOAccion.startsWith('/')
      ? pathOAccion.toLowerCase()
      : `/${pathOAccion}`.toLowerCase();

    return this.rutasPermitidas.has(rutaLimpia);
  }

  private restaurarPermisosLocales(): void {
    const raw = localStorage.getItem('rutas_permitidas');
    if (raw) {
      try {
        const arreglo: string[] = JSON.parse(raw);
        this.rutasPermitidas = new Set(arreglo);
      } catch (e) {
        this.rutasPermitidas = new Set();
      }
    }
  }

  // ==========================================
  // HELPER MÉTODOS DE ROLES Y TOKEN
  // ==========================================

  getRol(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol || 0;
    } catch {
      return 0;
    }
  }

  isAdmin(): boolean {
    return this.getRol() === 1;
  }

  isUsuarioHijo(): boolean {
    return this.getRol() === 3;
  }

  getPadreId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.padre_id || null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // MÉTODOS EXISTENTES DE AUTENTICACIÓN
  // ==========================================

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, user);
  }

  login(credentials: any): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.authState.next(true);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearToken();
        this.logoutSubject.next();
        this.authState.next(false);
      })
    );
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

  renovarToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/renovar_token`, {});
  }

  getTokenExpirySeconds(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp - Math.floor(Date.now() / 1000);
    } catch { return 0; }
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

  getToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  clearToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rutas_permitidas');
    this.rutasPermitidas.clear();
  }

  getUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch (e) {
      return null;
    }
  }

  getUserName(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nombre || payload.usuario || null;
    } catch (e) {
      return null;
    }
  }

  getFlujoPermiso(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.flujo || 0;
    } catch (error) {
      return 0;
    }
  }

}