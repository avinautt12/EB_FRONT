import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/* ========================================================================
   MODELOS E INTERFACES DEL MÓDULO DE PERMISOS
   ======================================================================== */

export interface ApiResponse<T = any> {
  respuesta?: boolean;
  mensaje?: string;
  datos?: T;
  id?: number;
  error?: string;
}

export interface AdminClienteItem {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  activo: number;
  max_hijos: number;
  hijos_activos?: number;
}

export interface AccionBase {
  id: number;
  nombre: string;
  identificador: string;
  activo: number;
}

export interface ModuloItem {
  id: number;
  nombre: string;
  identificador: string;
  padre_id?: number | null;
  activo: number;
  acciones?: AccionBase[];
}

export interface ModuloPayload {
  nombre: string;
  identificador: string;
  padre_id?: number | null;
  acciones_ids: number[];
}

export interface UsuarioHijoItem {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  activo: number;
  cliente_id?: number;
}

export interface CrearHijoPayload {
  padre_id: number;
  nombre: string;
  correo: string;
  usuario: string;
  contrasena: string;
}

export interface PermisoUsuarioItem {
  modulo_id: number;
  modulo: string;
  accion_id: number;
  accion: string;
  identificador?: string;
}

export interface CupoResponse {
  max_hijos: number;
  hijos_activos: number;
  disponibles: number;
  tiene_cupo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminSistemaService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /* ========================================================================
     1. ENDPOINTS DEL ADMINISTRADOR DEL SISTEMA (NIVEL 0)
     ======================================================================== */

  /**
   * Obtiene la lista de Administradores Cliente junto con su estado y cupo de usuarios.
   * GET /api/admin-sistema/administradores
   */
  getAdministradores(): Observable<{ administradores: AdminClienteItem[] }> {
    return this.http.get<{ administradores: AdminClienteItem[] }>(`${this.apiUrl}/admin-sistema/administradores`);
  }

  /**
   * Ajusta el límite máximo de usuarios hijos (max_hijos) para un Administrador Cliente.
   * PUT /api/admin-sistema/administradores/:admin_id/cupo
   */
  actualizarCupoAdmin(adminId: number, maxHijos: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/admin-sistema/administradores/${adminId}/cupo`, {
      max_hijos: maxHijos
    });
  }

  /**
   * Activa (1) o desactiva (0) el estado de cualquier usuario en el sistema.
   * PATCH /api/admin-sistema/usuarios/:usuario_id/estado
   */
  cambiarEstadoUsuarioGlobal(usuarioId: number, activo: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/admin-sistema/usuarios/${usuarioId}/estado`, {
      activo
    });
  }

  /**
   * Asigna un permiso a la bolsa delegable de un Administrador Cliente.
   * POST /api/admin-sistema/permisos-delegables/asignar
   */
  asignarPermisoDelegable(administradorId: number, moduloId: number, accionId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/admin-sistema/permisos-delegables/asignar`, {
      administrador_id: administradorId,
      modulo_id: moduloId,
      accion_id: accionId
    });
  }

  /**
   * Retira un permiso de la bolsa delegable de un Administrador Cliente.
   * DELETE /api/admin-sistema/permisos-delegables/revocar
   */
  revocarPermisoDelegable(administradorId: number, moduloId: number, accionId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/admin-sistema/permisos-delegables/revocar`, {
      body: {
        administrador_id: administradorId,
        modulo_id: moduloId,
        accion_id: accionId
      }
    });
  }

  /* ========================================================================
     2. ENDPOINTS DE MÓDULOS Y ACCIONES (CATÁLOGO UNIFICADO 2 EN 1)
     ======================================================================== */

  /**
   * Obtiene el catálogo completo de módulos, submódulos y sus acciones vinculadas.
   * GET /api/modulos
   */
  getModulos(): Observable<{ modulos: ModuloItem[] }> {
    return this.http.get<{ modulos: ModuloItem[] }>(`${this.apiUrl}/modulos`);
  }

  /**
   * Crea un módulo o submódulo y le asigna sus acciones permitidas.
   * POST /api/modulos
   */
  crearModulo(payload: ModuloPayload): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/modulos`, payload);
  }

  /**
   * Actualiza los datos base de un módulo y reconfigura sus acciones vinculadas.
   * PUT /api/modulos/:modulo_id
   */
  actualizarModulo(moduloId: number, payload: ModuloPayload): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/modulos/${moduloId}`, payload);
  }

  /**
   * Activa (1) o desactiva (0) un módulo (borrado lógico).
   * PATCH /api/modulos/:modulo_id/estado
   */
  cambiarEstadoModulo(moduloId: number, activo: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/modulos/${moduloId}/estado`, { activo });
  }

  /**
   * Elimina permanentemente un módulo y limpia sus relaciones en la BD.
   * DELETE /api/modulos/:modulo_id
   */
  eliminarModulo(moduloId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/modulos/${moduloId}`);
  }

  /**
   * Obtiene la lista global de acciones base (Ver, Crear, Editar, Eliminar, etc.).
   * GET /api/acciones
   */
  getAcciones(): Observable<{ acciones: AccionBase[] }> {
    return this.http.get<{ acciones: AccionBase[] }>(`${this.apiUrl}/acciones`);
  }

  /**
   * Crea una nueva acción base global.
   * POST /api/acciones
   */
  crearAccion(nombre: string, identificador: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/acciones`, { nombre, identificador });
  }

  /**
   * Activa (1) o desactiva (0) una acción base.
   * PATCH /api/acciones/:accion_id/estado
   */
  cambiarEstadoAccion(id: number, activo: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/acciones/${id}/estado`, { activo });
  }

  /**
   * Elimina permanentemente una acción base.
   * DELETE /api/acciones/:accion_id
   */
  eliminarAccion(accionId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/acciones/${accionId}`);
  }

  /* ========================================================================
     3. ENDPOINTS DE ADMINISTRADOR CLIENTE / DISTRIBUIDOR (NIVEL 1)
     ======================================================================== */

  /**
   * Consulta la disponibilidad de cupos de un Administrador Cliente.
   * GET /api/usuarios-hijos/cupo?padre_id=X
   */
  getCupoPadre(padreId: number): Observable<CupoResponse> {
    const params = new HttpParams().set('padre_id', padreId.toString());
    return this.http.get<CupoResponse>(`${this.apiUrl}/usuarios-hijos/cupo`, { params });
  }

  /**
   * Obtiene la lista de usuarios hijos creados por un distribuidor.
   * GET /api/usuarios-hijos?padre_id=X
   */
  getUsuariosHijos(padreId: number): Observable<{ usuarios: UsuarioHijoItem[] }> {
    const params = new HttpParams().set('padre_id', padreId.toString());
    return this.http.get<{ usuarios: UsuarioHijoItem[] }>(`${this.apiUrl}/usuarios-hijos`, { params });
  }

  /**
   * Crea un usuario hijo verificando disponibilidad de cupo e heredando el cliente_id.
   * POST /api/usuarios-hijos
   */
  crearUsuarioHijo(payload: CrearHijoPayload): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/usuarios-hijos`, payload);
  }

  /**
   * Activa o desactiva un usuario hijo.
   * PATCH /api/usuarios-hijos/:hijo_id/estado
   */
  cambiarEstadoHijo(hijoId: number, padreId: number, activo: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/usuarios-hijos/${hijoId}/estado`, {
      padre_id: padreId,
      activo
    });
  }

  /**
   * Reestablece la contraseña de un usuario hijo.
   * PATCH /api/usuarios-hijos/:hijo_id/contrasena
   */
  cambiarContrasenaHijo(hijoId: number, padreId: number, contrasena: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/usuarios-hijos/${hijoId}/contrasena`, {
      padre_id: padreId,
      contrasena
    });
  }

  /**
   * Consulta los permisos que el Administrador Cliente tiene autorizados en su bolsa delegable.
   * GET /api/permisos/delegables?padre_id=X
   */
  getPermisosDelegables(padreId: number): Observable<{ permisos_delegables: PermisoUsuarioItem[] }> {
    const params = new HttpParams().set('padre_id', padreId.toString());
    return this.http.get<{ permisos_delegables: PermisoUsuarioItem[] }>(`${this.apiUrl}/permisos/delegables`, { params });
  }

  /**
   * Consulta los permisos asignados actualmente a un usuario hijo.
   * GET /api/permisos/usuario/:hijo_id?padre_id=X
   */
  getPermisosUsuarioHijo(hijoId: number, padreId: number): Observable<{ permisos: PermisoUsuarioItem[] }> {
    const params = new HttpParams().set('padre_id', padreId.toString());
    return this.http.get<{ permisos: PermisoUsuarioItem[] }>(`${this.apiUrl}/permisos/usuario/${hijoId}`, { params });
  }

  /**
   * Asigna un permiso de la bolsa delegable a un usuario hijo.
   * POST /api/permisos/asignar
   */
  asignarPermisoHijo(padreId: number, hijoId: number, moduloId: number, accionId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/permisos/asignar`, {
      padre_id: padreId,
      hijo_id: hijoId,
      modulo_id: moduloId,
      accion_id: accionId
    });
  }

  /**
   * Revoca un permiso previamente asignado a un usuario hijo.
   * DELETE /api/permisos/revocar
   */
  revocarPermisoHijo(padreId: number, hijoId: number, moduloId: number, accionId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/permisos/revocar`, {
      body: {
        padre_id: padreId,
        hijo_id: hijoId,
        modulo_id: moduloId,
        accion_id: accionId
      }
    });
  }
}