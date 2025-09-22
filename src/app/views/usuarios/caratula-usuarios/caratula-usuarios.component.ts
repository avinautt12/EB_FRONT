import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { FormsModule } from '@angular/forms';
import { FacturasClienteComponent } from '../../../components/facturas-cliente/facturas-cliente.component';
import { AlertaService } from '../../../services/alerta.service';
import { AlertaComponent } from '../../../components/alerta/alerta.component';

import { FechaActualizacionComponent } from '../../../components/fecha-actualizacion/fecha-actualizacion.component';

interface DatosCliente {
  clave: string;
  evac: string;
  nombre_cliente: string;
  nivel: string;
  compra_minima_anual: number;
  compromiso_scott: number;
  avance_global_scott: number;
  porcentaje_scott: number;
  compromiso_apparel_syncros_vittoria: number;
  avance_global_apparel_syncros_vittoria: number;
  porcentaje_apparel_syncros_vittoria: number;
  compromiso_jul_ago: number;
  avance_jul_ago: number;
  porcentaje_jul_ago: number;
  compromiso_sep_oct: number;
  avance_sep_oct: number;
  porcentaje_sep_oct: number;
  compromiso_nov_dic: number;
  avance_nov_dic: number;
  porcentaje_nov_dic: number;
  compromiso_jul_ago_app: number;
  avance_jul_ago_app: number;
  porcentaje_jul_ago_app: number;
  compromiso_sep_oct_app: number;
  avance_sep_oct_app: number;
  porcentaje_sep_oct_app: number;
  compromiso_nov_dic_app: number;
  avance_nov_dic_app: number;
  porcentaje_nov_dic_app: number;
  compra_minima_inicial: number;
  avance_global: number;
  porcentaje_global: number;
  acumulado_anticipado: number;
  porcentaje_anual: number;
  periodoJulAgo: string;
  periodoSepOct: string;
  periodoNovDic: string;
  estatus: string;
  estado: string;
  fecha_inicio_calculo?: string;
}

@Component({
  selector: 'app-caratula-usuarios',
  standalone: true,
  imports: [RouterModule, CommonModule, TopBarUsuariosComponent,
    FormsModule, FacturasClienteComponent, AlertaComponent, FechaActualizacionComponent],
  templateUrl: './caratula-usuarios.component.html',
  styleUrls: ['./caratula-usuarios.component.css']
})
export class CaratulaUsuariosComponent implements OnInit {

  @ViewChild('contentToExport', { static: false }) contentToExport!: ElementRef;

  mostrarFacturas = false;
  datosCliente: DatosCliente | null = null; // Usar null para inicializar correctamente
  isLoading = false;
  error: string | null = null;
  private tokenData: any = null;

  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';

  exportandoPDF = false;

  constructor(
    private caratulasService: CaratulasService,
    private router: Router,
    private alertaService: AlertaService
  ) { }

  ngOnInit() {
    this.obtenerDatosToken();
    if (this.tokenData) {
      this.buscarAutomaticamente();
    } else {
      this.error = 'No se encontró información de usuario. Por favor inicie sesión nuevamente.';
    }
  }

  private obtenerDatosToken() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = token.split('.')[1];
        const decodedPayload = atob(payload);
        this.tokenData = JSON.parse(decodedPayload);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      this.error = 'Error al obtener información del usuario';
    }
  }

  private buscarAutomaticamente() {
    this.isLoading = true;
    const clave = this.tokenData.clave;
    const nombreCliente = this.tokenData.nombre_cliente;

    this.caratulasService.buscarCaratulas(clave, nombreCliente).subscribe({
      next: (response: any) => {
        let datos: any = null;
        if (response && response.success && response.data) {
          datos = Array.isArray(response.data) ? response.data[0] : response.data;
        } else if (Array.isArray(response)) {
          datos = response[0];
        } else if (response && typeof response === 'object') {
          datos = response;
        }

        if (datos && Object.keys(datos).length > 0) {
          this.datosCliente = this.procesarDatosCliente(datos);
          this.error = null;
        } else {
          this.datosCliente = null;
          this.error = 'No se encontraron datos para este cliente';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al obtener datos del cliente:', error);
        let mensajeError = 'No se encontraron datos para este cliente';
        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        } else if (error.status === 404) {
          mensajeError = 'Cliente no encontrado';
        } else if (error.status === 0) {
          mensajeError = 'Error de conexión con el servidor';
        }
        this.error = mensajeError;
        this.datosCliente = null;
        this.isLoading = false;
      }
    });
  }

  private procesarDatosCliente(datos: any): DatosCliente {
    const metaScott = this.parseNumber(datos.compromiso_scott || '0');
    const avanceScott = this.parseNumber(datos.avance_global_scott || '0');
    const metaCombined = this.parseNumber(datos.compromiso_apparel_syncros_vittoria || '0');
    const avanceCombined = this.parseNumber(datos.avance_global_apparel_syncros_vittoria || '0');
    const porcentajeScott = this.parseNumber(datos.porcentaje_scott || '0');
    const porcentajeCombined = this.parseNumber(datos.porcentaje_apparel_syncros_vittoria || '0');

    const totalMeta = metaScott + metaCombined;

    return {
      clave: datos.clave || '',
      evac: datos.evac || '',
      nombre_cliente: datos.nombre_cliente || '',
      nivel: datos.nivel || '',
      compra_minima_anual: this.parseNumber(datos.compra_minima_anual || totalMeta || '0'),
      compromiso_scott: metaScott,
      avance_global_scott: avanceScott,
      porcentaje_scott: porcentajeScott,
      compromiso_apparel_syncros_vittoria: metaCombined,
      avance_global_apparel_syncros_vittoria: avanceCombined,
      porcentaje_apparel_syncros_vittoria: porcentajeCombined,
      compromiso_jul_ago: this.parseNumber(datos.compromiso_jul_ago || '0'),
      avance_jul_ago: this.parseNumber(datos.avance_jul_ago || '0'),
      porcentaje_jul_ago: this.parseNumber(datos.porcentaje_jul_ago || '0'),
      compromiso_sep_oct: this.parseNumber(datos.compromiso_sep_oct || '0'),
      avance_sep_oct: this.parseNumber(datos.avance_sep_oct || '0'),
      porcentaje_sep_oct: this.parseNumber(datos.porcentaje_sep_oct || '0'),
      compromiso_nov_dic: this.parseNumber(datos.compromiso_nov_dic || '0'),
      avance_nov_dic: this.parseNumber(datos.avance_nov_dic || '0'),
      porcentaje_nov_dic: this.parseNumber(datos.porcentaje_nov_dic || '0'),
      compromiso_jul_ago_app: this.parseNumber(datos.compromiso_jul_ago_app || '0'),
      avance_jul_ago_app: this.parseNumber(datos.avance_jul_ago_app || '0'),
      porcentaje_jul_ago_app: this.parseNumber(datos.porcentaje_jul_ago_app || '0'),
      compromiso_sep_oct_app: this.parseNumber(datos.compromiso_sep_oct_app || '0'),
      avance_sep_oct_app: this.parseNumber(datos.avance_sep_oct_app || '0'),
      porcentaje_sep_oct_app: this.parseNumber(datos.porcentaje_sep_oct_app || '0'),
      compromiso_nov_dic_app: this.parseNumber(datos.compromiso_nov_dic_app || '0'),
      avance_nov_dic_app: this.parseNumber(datos.avance_nov_dic_app || '0'),
      porcentaje_nov_dic_app: this.parseNumber(datos.porcentaje_nov_dic_app || '0'),
      compra_minima_inicial: this.parseNumber(datos.compra_minima_inicial || '0'),
      avance_global: this.parseNumber(datos.avance_global || '0'),
      porcentaje_global: this.parseNumber(datos.porcentaje_global || '0'),
      acumulado_anticipado: this.parseNumber(datos.acumulado_anticipado || '0'),
      porcentaje_anual: this.parseNumber(datos.porcentaje_anual || '0'),
      periodoJulAgo: datos.periodoJulAgo || 'Julio - Agosto',
      periodoSepOct: datos.periodoSepOct || 'Septiembre - Octubre',
      periodoNovDic: datos.periodoNovDic || 'Noviembre - Diciembre',
      estatus: datos.estatus || '',
      estado: datos.estado || ''
    };
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

   generarPDF() {
    if (!this.datosCliente || this.exportandoPDF) {
      this.alertaService.mostrarError('Espere a que los datos del cliente carguen o a que finalice la descarga actual.');
      return;
    }

    this.exportandoPDF = true; // Inicia el estado de carga
    this.error = null;
    this.alertaService.mostrarExito('Generando PDF, por favor espere...');

    // Preparamos el payload, tal como lo hicimos en el otro componente
    const payload = {
      datos_caratula: this.datosCliente,
      periodos: [
        { nombre: 'Julio-Agosto', estado: this.getEstadoPeriodo('Jul-Ago') },
        { nombre: 'Septiembre-Octubre', estado: this.getEstadoPeriodo('Sep-Oct') },
        { nombre: 'Noviembre-Diciembre', estado: this.getEstadoPeriodo('Nov-Dic') }
      ]
    };

    this.caratulasService.generarPdfDesdeBackend(payload).subscribe({
      next: (blob) => {
        // 1. Crear una URL temporal para el blob (el archivo recibido)
        const url = window.URL.createObjectURL(blob);

        // 2. Crear un enlace <a> temporal en el documento
        const link = document.createElement('a');
        link.href = url;

        // 3. Definir el nombre del archivo para la descarga
        const clave = this.datosCliente?.clave || 'cliente';
        link.download = `Caratula_${clave}_${new Date().toISOString().split('T')[0]}.pdf`;

        // 4. Simular un clic en el enlace para iniciar la descarga
        document.body.appendChild(link);
        link.click();

        // 5. Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.exportandoPDF = false; // Finaliza el estado de carga
      },
      error: (error) => {
        console.error('Error al generar PDF desde el backend:', error);
        this.alertaService.mostrarError(error.message || 'Ocurrió un error al generar el PDF.');
        this.exportandoPDF = false; // Finaliza el estado de carga en caso de error
      }
    });
  }

  getMesActual(): number {
    return new Date().getMonth() + 1;
  }

  debeMostrarPeriodo(periodo: string): boolean {
    const mesActual = this.getMesActual();
    const periodos = {
      'Jul-Ago': { inicio: 7 },
      'Sep-Oct': { inicio: 9 },
      'Nov-Dic': { inicio: 11 }
    };
    const periodoData = periodos[periodo as keyof typeof periodos];
    return mesActual >= periodoData.inicio;
  }

  getEstadoPeriodo(periodo: string): string {
    const mesActual = this.getMesActual();
    const periodos = {
      'Jul-Ago': { inicio: 7, fin: 8 },
      'Sep-Oct': { inicio: 9, fin: 10 },
      'Nov-Dic': { inicio: 11, fin: 12 }
    };
    const periodoData = periodos[periodo as keyof typeof periodos];
    if (mesActual < periodoData.inicio) return 'Sin iniciar';
    if (mesActual > periodoData.fin) return 'Cerrado';
    return 'En curso';
  }

  getCompromisoAcumuladoScott(): number {
    if (!this.datosCliente) return 0;
    const mes = this.getMesActual();
    let total = this.datosCliente.compromiso_jul_ago;
    if (mes >= 9) total += this.datosCliente.compromiso_sep_oct;
    if (mes >= 11) total += this.datosCliente.compromiso_nov_dic;
    return total;
  }

  getAvanceAcumuladoScott(): number {
    if (!this.datosCliente) return 0;
    const mes = this.getMesActual();
    let total = this.datosCliente.avance_jul_ago;
    if (mes >= 9) total += this.datosCliente.avance_sep_oct;
    if (mes >= 11) total += this.datosCliente.avance_nov_dic;
    return total;
  }

  getPorcentajeAcumuladoScott(): number {
    const compromiso = this.getCompromisoAcumuladoScott();
    if (compromiso === 0) return 0;
    return Math.round((this.getAvanceAcumuladoScott() / compromiso) * 100);
  }

  getFaltanteAcumuladoScott(): number {
    return Math.max(0, this.getCompromisoAcumuladoScott() - this.getAvanceAcumuladoScott());
  }

  getSobranteAcumuladoScott(): number {
    const diferencia = this.getCompromisoAcumuladoScott() - this.getAvanceAcumuladoScott();
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getCompromisoAcumuladoApparel(): number {
    if (!this.datosCliente) return 0;
    const mes = this.getMesActual();
    let total = this.datosCliente.compromiso_jul_ago_app;
    if (mes >= 9) total += this.datosCliente.compromiso_sep_oct_app;
    if (mes >= 11) total += this.datosCliente.compromiso_nov_dic_app;
    return total;
  }

  getAvanceAcumuladoApparel(): number {
    if (!this.datosCliente) return 0;
    const mes = this.getMesActual();
    let total = this.datosCliente.avance_jul_ago_app;
    if (mes >= 9) total += this.datosCliente.avance_sep_oct_app;
    if (mes >= 11) total += this.datosCliente.avance_nov_dic_app;
    return total;
  }

  getPorcentajeAcumuladoApparel(): number {
    const compromiso = this.getCompromisoAcumuladoApparel();
    if (compromiso === 0) return 0;
    return Math.round((this.getAvanceAcumuladoApparel() / compromiso) * 100);
  }

  getFaltanteAcumuladoApparel(): number {
    return Math.max(0, this.getCompromisoAcumuladoApparel() - this.getAvanceAcumuladoApparel());
  }

  getSobranteAcumuladoApparel(): number {
    const diferencia = this.getCompromisoAcumuladoApparel() - this.getAvanceAcumuladoApparel();
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }
}