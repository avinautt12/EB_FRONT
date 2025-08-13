import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrevioService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getFacturasCalculadas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/monitor_odoo_calculado`);
  }

  actualizarPrevio(clientesPaginados: any[], integrales: any[]): Observable<any> {
    const todosClientes = [...clientesPaginados, ...integrales].map(cliente => ({
      clave: cliente.clave,
      evac: cliente.evac,
      nombre_cliente: cliente.nombre_cliente,
      acumulado_anticipado: cliente.acumulado_anticipado || 0,
      nivel: cliente.nivel,
      nivel_cierre_compra_inicial: cliente.nivel_cierre_compra_inicial || null,
      compra_minima_anual: cliente.compra_minima_anual || 0,
      porcentaje_anual: cliente.porcentaje_anual || 0,
      compra_minima_inicial: cliente.compra_minima_inicial || 0,
      avance_global: cliente.avance_global || 0,
      porcentaje_global: cliente.porcentaje_global || 0,
      compromiso_scott: cliente.compromiso_scott || 0,
      avance_global_scott: cliente.avance_global_scott || 0,
      porcentaje_scott: cliente.porcentaje_scott || 0,
      compromiso_jul_ago: cliente.compromiso_jul_ago || 0,
      avance_jul_ago: cliente.avance_jul_ago || 0,
      porcentaje_jul_ago: cliente.porcentaje_jul_ago || 0,
      compromiso_sep_oct: cliente.compromiso_sep_oct || 0,
      avance_sep_oct: cliente.avance_sep_oct || 0,
      porcentaje_sep_oct: cliente.porcentaje_sep_oct || 0,
      compromiso_nov_dic: cliente.compromiso_nov_dic || 0,
      avance_nov_dic: cliente.avance_nov_dic || 0,
      porcentaje_nov_dic: cliente.porcentaje_nov_dic || 0,
      compromiso_apparel_syncros_vittoria: cliente.compromiso_apparel_syncros_vittoria || 0,
      avance_global_apparel_syncros_vittoria: cliente.avance_global_apparel_syncros_vittoria || 0,
      porcentaje_apparel_syncros_vittoria: cliente.porcentaje_apparel_syncros_vittoria || 0,
      compromiso_jul_ago_app: cliente.compromiso_jul_ago_app || 0,
      avance_jul_ago_app: cliente.avance_jul_ago_app || 0,
      porcentaje_jul_ago_app: cliente.porcentaje_jul_ago_app || 0,
      compromiso_sep_oct_app: cliente.compromiso_sep_oct_app || 0,
      avance_sep_oct_app: cliente.avance_sep_oct_app || 0,
      porcentaje_sep_oct_app: cliente.porcentaje_sep_oct_app || 0,
      compromiso_nov_dic_app: cliente.compromiso_nov_dic_app || 0,
      avance_nov_dic_app: cliente.avance_nov_dic_app || 0,
      porcentaje_nov_dic_app: cliente.porcentaje_nov_dic_app || 0,
      acumulado_syncros: cliente.acumulado_syncros || 0,
      acumulado_apparel: cliente.acumulado_apparel || 0,
      acumulado_vittoria: cliente.acumulado_vittoria || 0,
      acumulado_bold: cliente.acumulado_bold || 0,
      es_integral: cliente.esIntegral || cliente.esParteDeIntegral || false,
      grupo_integral: cliente.grupoIntegral || null
    }));

    return this.http.post(`${this.apiUrl}/actualizar_previo`, todosClientes);
  }
}
