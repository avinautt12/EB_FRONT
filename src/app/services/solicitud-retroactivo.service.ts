import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type EstatusSolicitud = 'pendiente' | 'validado' | 'rechazado';
export type EstatusDocumento = 'pendiente' | 'valido' | 'rechazado';

export interface ArchivoSolicitud {
  key: string;
  url: string | null;
  estatus?: EstatusDocumento;
}

// GUÍA: log de auditoría -- ver _entrada_historial en el backend
// (routes/solicitud_retroactivo.py). Columna JSON, no una tabla aparte.
export interface ItemHistorial {
  fecha: string;
  tipo: 'creacion' | 'validacion' | 'precio' | 'reenvio';
  descripcion: string;
}

export interface SolicitudRetroactivo {
  id: number;
  id_usuario?: number;
  id_formulario: number;
  nombre_formulario: string;
  id_marca_bicicleta: number | null;
  id_msi: number;
  plazo_meses?: number;
  nombre_sucursal: string;
  correo_electronico: string;
  nombre_completo: string;
  fecha_venta: string;
  modelo_bicicleta: string;
  numero_serie: string;
  precio_publico: string;
  porcentaje?: string;
  monto_pagar: string;
  monto_aplicar?: string;
  // GUÍA: el estatus general se deriva de validacion_docs (cualquier archivo
  // rechazado -> solicitud completa 'rechazado'; los 4 en 'valido' -> 'validado').
  estatus: EstatusSolicitud;
  validacion_docs?: Record<string, EstatusDocumento>;
  anio_modelo?: string;
  archivos?: Record<string, ArchivoSolicitud>;
  historial?: ItemHistorial[];
  nota_credito: string
  fecha_registro: string;
}

export interface TotalesGenerales {
  total_solicitudes: number;
  monto_total_pagar: string;
  monto_total_aplicar: string;
  pendientes: number;
  validados: number;
  rechazados: number;
}

export interface GrupoDashboard {
  total_solicitudes: number;
  monto_total: string;
  [key: string]: unknown;
}

export interface DashboardSolicitudRetroactivo {
  totales_generales: TotalesGenerales;
  por_campana: GrupoDashboard[];
  por_cliente: GrupoDashboard[];
  por_anio_modelo: GrupoDashboard[];
}

// GUÍA: HttpClient ya manda el JWT solo (interceptors/auth.interceptor.ts),
// no hace falta armar headers de Authorization a mano aquí.
@Injectable({ providedIn: 'root' })
export class SolicitudRetroactivoService {
  private base = `${environment.apiUrl}/api/solicitud-retroactivo`;

  constructor(private http: HttpClient) {}

  listar(): Observable<SolicitudRetroactivo[]> {
    return this.http.get<SolicitudRetroactivo[]>(`${this.base}/listar`);
  }

  dashboard(): Observable<DashboardSolicitudRetroactivo> {
    return this.http.get<DashboardSolicitudRetroactivo>(`${this.base}/dashboard`);
  }

  validarDocumento(id: number, documento: string, estatus: 'valido' | 'rechazado'): Observable<any> {
    return this.http.post(`${this.base}/validar-documento/${id}`, { documento, estatus });
  }

  corregirPrecio(id: number, precioPublico: number): Observable<any> {
    return this.http.post(`${this.base}/precio/${id}`, { precio_publico: precioPublico });
  }

  corregirNotaCredito(id: number, notaCredito: string): Observable<any> {
    return this.http.post(`${this.base}/nota-credito/${id}`, { nota_credito: notaCredito });
  }

  misSolicitudes(): Observable<SolicitudRetroactivo[]> {
    return this.http.get<SolicitudRetroactivo[]>(`${this.base}/mis-solicitudes`);
  }

  actualizarVenta(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.base}/venta/${id}`, formData);
  }
}
