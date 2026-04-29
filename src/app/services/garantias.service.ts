import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GarantiasKpis {
  total: number;
  cerradas: number;
  en_proceso: number;
  latencia_promedio: number;
}

export interface GarantiasDashboard {
  kpis: GarantiasKpis;
  por_estatus: Record<string, number>;
  latencia_mensual: Record<string, number>;
  latencia_por_cliente: Record<string, number>;
  garantias_por_cliente: Record<string, number>;
  descripcion_dano: Record<string, number>;
  ubicacion_dano: Record<string, number>;
  por_marca: Record<string, number>;
  ultima_actualizacion: string;
}

@Injectable({ providedIn: 'root' })
export class GarantiasService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<GarantiasDashboard> {
    return this.http.get<GarantiasDashboard>(`${this.api}/garantias/dashboard`);
  }

  refrescar(): Observable<any> {
    return this.http.post(`${this.api}/garantias/refrescar`, {});
  }

  getExportUrl(): string {
    return `${this.api}/garantias/exportar`;
  }
}
