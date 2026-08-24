import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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

  private readonly http = inject(HttpClient);
  private logoutSubject = new Subject<void>();
  public onLogout$ = this.logoutSubject.asObservable();

  private authState = new BehaviorSubject<boolean>(this.isLoggedIn());
  public authState$ = this.authState.asObservable();

  private apiUrl = environment.apiUrl;

  // Matriz de rutas permitidas cargadas en memoria
  private rutasPermitidas = new Set<string>();

  constructor() {
    this.restaurarPermisosLocales();
  }

  // ==========================================
  // GESTIÓN DE PERMISOS EN VIVO Y MATRIZ
  // ==========================================

  /**
   * Consulta a la BD en tiempo real la matriz de permisos según el Rol activo[cite: 2]
   */
  obtenerPermisosEnVivo(): Observable<Set<string>> {
    const rol = this.getRol();
    const userId = this.getUserId();

    // Rol 1: Bypass total SuperAdmin[cite: 1]
    if (rol === 1) {
      this.rutasPermitidas = new Set(['*']);
      return of(this.rutasPermitidas);
    }

    // Rol 2: Administrador Cliente / Distribuidor (Se agrega /api)
    if (rol === 2 && userId) {
      return this.http.get<any>(`${this.apiUrl}/api/permisos/delegables?padre_id=${userId}`).pipe(
        map(res => this.normalizarPermisos(res.permisos_delegables || [])),
        tap(set => {
          this.rutasPermitidas = set;
          localStorage.setItem('rutas_permitidas', JSON.stringify(Array.from(set)));
        }),
        catchError(err => {
          console.warn('Error al obtener bolsa delegable:', err);
          return of(new Set<string>());
        })
      );
    }

    // Rol 3: Usuario Hijo (Se agrega /api)[cite: 2, 4]
    if (rol === 3 && userId) {
      const padreId = this.getPadreId();
      return this.http.get<any>(`${this.apiUrl}/api/permisos/usuario/${userId}?padre_id=${padreId}`).pipe(
        map(res => this.normalizarPermisos(res.permisos || [])),
        tap(set => {
          this.rutasPermitidas = set;
          localStorage.setItem('rutas_permitidas', JSON.stringify(Array.from(set)));
        }),
        catchError(err => {
          console.warn('Error al obtener matriz de permisos del hijo:', err);
          return of(new Set<string>());
        })
      );
    }

    return of(new Set<string>());
  }

  /**
   * Estandariza módulos y acciones a rutas "modulo/accion" y "/modulo/accion"[cite: 1]
   */
  private normalizarPermisos(lista: any[]): Set<string> {
    const set = new Set<string>();
    lista.forEach(item => {
      const mod = (item.identificador || item.modulo || '').toLowerCase().trim();
      const acc = (item.accion_id_texto || item.accion || 'ver').toLowerCase().trim();

      if (mod) {
        set.add(`${mod}/${acc}`);
        set.add(`/${mod}/${acc}`);
        set.add(`${mod}/ver`);
        set.add(`/${mod}/ver`);
      }
    });
    return set;
  }

  /**
   * Carga manual específica para hijo (Se agrega /api)[cite: 2, 4]
   */
  cargarPermisos(hijoId: number, padreId: number): Observable<any> {
    return this.http.get<{ permisos: PermisoItem[] }>(
      `${this.apiUrl}/api/permisos/usuario/${hijoId}?padre_id=${padreId}`
    ).pipe(
      tap(response => {
        const setRutas = new Set<string>();
        if (response && response.permisos && Array.isArray(response.permisos)) {
          response.permisos.forEach(p => {
            setRutas.add(`/${p.modulo}/${p.accion}`.toLowerCase());
            setRutas.add(`${p.modulo}/${p.accion}`.toLowerCase());
          });
        }
        this.rutasPermitidas = setRutas;
        localStorage.setItem('rutas_permitidas', JSON.stringify(Array.from(setRutas)));
      }),
      catchError(err => {
        console.warn('Error al obtener la matriz de permisos:', err);
        return of({ permisos: [] });
      })
    );
  }

  /**
   * Consulta sincrónica in-situ para directivas *ngIf y getters[cite: 1]
   */
  tienePermiso(pathOAccion: string): boolean {
    if (this.isAdmin()) return true;

    const rutaLimpia = pathOAccion.startsWith('/')
      ? pathOAccion.toLowerCase()
      : `/${pathOAccion}`.toLowerCase();

    const sinDiagonal = rutaLimpia.substring(1);

    return this.rutasPermitidas.has(rutaLimpia) || this.rutasPermitidas.has(sinDiagonal);
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
      return payload.rol || payload.rol_id || 0;
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