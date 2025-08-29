import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of, EMPTY, Observable } from 'rxjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FacturasClienteComponent } from '../../../components/facturas-cliente/facturas-cliente.component';

interface SugerenciaCliente {
  clave: string;
  razon_social: string;
  nombre_cliente?: string;
  evac?: string;
  nivel_firmado?: string;
}

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
  imports: [RouterModule, CommonModule, TopBarUsuariosComponent, FormsModule, FacturasClienteComponent],
  templateUrl: './caratula-usuarios.component.html',
  styleUrls: ['./caratula-usuarios.component.css']
})
export class CaratulaUsuariosComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('contentToExport', { static: false }) contentToExport!: ElementRef;

  mostrarFacturas = false;
  datosCliente: any;

  terminoBusqueda: string = '';
  sugerenciasFiltradas: SugerenciaCliente[] = [];
  mostrarSugerencias: boolean = false;

  caratulaSeleccionada: boolean = false;

  isLoading = false;
  error: string | null = null;

  loadingCache = false;

  private searchSubject = new Subject<string>();
  private isSearchingDirectly = false;

  private allClientes: SugerenciaCliente[] = [];
  private cacheLoaded = false;

  private tokenData: any = null;

  constructor(private caratulasService: CaratulasService, private router: Router) { }

  ngOnInit() {
    // Obtener y decodificar el token del localStorage
    this.obtenerDatosToken();

    // Si tenemos datos del token, buscar automáticamente
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
        // Decodificar el token (asumiendo que es un JWT)
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

    // Usar la clave del token para buscar
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
          this.caratulaSeleccionada = true;
          this.error = null;
        } else {
          this.datosCliente = null;
          this.caratulaSeleccionada = false;
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
        this.caratulaSeleccionada = false;
        this.isLoading = false;
      }
    });
  }
  private filtrarClientesLocalmente(termino: string): SugerenciaCliente[] {
    const terminoLower = termino.toLowerCase();

    return this.allClientes.filter(cliente => {
      const clave = (cliente.clave || '').toLowerCase();
      const razonSocial = (cliente.razon_social || '').toLowerCase();
      const nombreCliente = (cliente.nombre_cliente || '').toLowerCase();

      // Buscar coincidencias en clave, razón social o nombre
      return clave.includes(terminoLower) ||
        razonSocial.includes(terminoLower) ||
        nombreCliente.includes(terminoLower);
    }).slice(0, 10); // Limitar a 10 resultados para mejor performance
  }

  onInputChange(event: any) {
    const valor = event.target.value;
    this.terminoBusqueda = valor;
    this.error = null;

    // Limpiar datos anteriores si el input está vacío
    if (!valor.trim()) {
      this.datosCliente = null;
      this.sugerenciasFiltradas = [];
      this.mostrarSugerencias = false;
      this.caratulaSeleccionada = false;
      this.isSearchingDirectly = false; // RESETEAR FLAG
      return;
    }

    // RESETEAR el flag cuando el usuario empiece a escribir de nuevo
    if (this.caratulaSeleccionada) {
      this.isSearchingDirectly = false;
      this.caratulaSeleccionada = false;
      this.datosCliente = null;
    }

    // Si tenemos cache cargado, filtrar inmediatamente
    if (this.cacheLoaded && !this.isSearchingDirectly) {
      const resultados = this.filtrarClientesLocalmente(valor);
      this.sugerenciasFiltradas = resultados;
      this.mostrarSugerencias = resultados.length > 0;
      return; // No continuar con el Subject
    }

    // Emitir al subject para búsqueda con servicio
    if (!this.isSearchingDirectly) {
      this.searchSubject.next(valor);
    }
  }

  onFocusInput() {
    const termino = this.terminoBusqueda.trim();
    if (termino.length >= 1 && !this.caratulaSeleccionada) {
      if (this.cacheLoaded) {
        const resultados = this.filtrarClientesLocalmente(termino);
        this.sugerenciasFiltradas = resultados;
        this.mostrarSugerencias = resultados.length > 0;
      } else if (this.sugerenciasFiltradas.length > 0) {
        this.mostrarSugerencias = true;
      }
    }
  }

  onBlurInput() {
    // Delay para permitir click en sugerencias
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.realizarBusqueda();
    }

    if (event.key === 'Escape') {
      this.mostrarSugerencias = false;
      this.searchInput.nativeElement.blur();
    }

    // Agregar navegación con flechas en sugerencias
    if (event.key === 'ArrowDown' && this.mostrarSugerencias) {
      event.preventDefault();
      // Aquí podrías implementar navegación con teclado
    }

    if (event.key === 'ArrowUp' && this.mostrarSugerencias) {
      event.preventDefault();
      // Aquí podrías implementar navegación con teclado
    }
  }

  seleccionarSugerencia(sugerencia: SugerenciaCliente) {
    this.terminoBusqueda = sugerencia.clave;
    this.mostrarSugerencias = false;
    this.isSearchingDirectly = true; // Marcar como búsqueda directa
    this.buscarDatosCliente(sugerencia.clave, sugerencia.nombre_cliente || sugerencia.razon_social);
  }

  realizarBusqueda() {
    const termino = this.terminoBusqueda.trim();
    if (!termino) {
      this.error = 'Por favor ingresa un término de búsqueda';
      return;
    }

    // Marcar como búsqueda directa para evitar obtener sugerencias
    this.isSearchingDirectly = true;
    this.mostrarSugerencias = false;

    // Determinar si el término parece ser una clave o nombre
    const esClaveRegex = /^[A-Z]{2,5}\d*$/i; // Formato como EVAC, KA591, etc.

    if (esClaveRegex.test(termino)) {
      // Buscar por clave
      this.buscarDatosCliente(termino.toUpperCase());
    } else {
      // Buscar por nombre
      this.buscarDatosCliente(undefined, termino);
    }
  }

  private buscarDatosCliente(clave?: string, nombreCliente?: string) {
    this.isLoading = true;
    this.error = null;
    this.mostrarSugerencias = false;

    if (!clave && !nombreCliente) {
      this.error = 'Se requiere clave o nombre del cliente';
      this.isLoading = false;
      this.isSearchingDirectly = false; // RESETEAR
      return;
    }

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
          this.caratulaSeleccionada = true;
          this.error = null;
        } else {
          this.datosCliente = null;
          this.caratulaSeleccionada = false;
          this.error = 'No se encontraron datos para este cliente';
        }

        this.isLoading = false;
        // IMPORTANTE: Resetear flag después de completar búsqueda
        this.isSearchingDirectly = false;
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
        this.caratulaSeleccionada = false;
        this.isLoading = false;
        // IMPORTANTE: Resetear flag en caso de error también
        this.isSearchingDirectly = false;
      }
    });
  }

  onInputKeyup(event: KeyboardEvent) {
    // Si el usuario presiona Backspace o Delete y el campo queda vacío
    if ((event.key === 'Backspace' || event.key === 'Delete') && !this.terminoBusqueda.trim()) {
      this.resetearBusqueda();
    }
  }

  private resetearBusqueda() {
    this.datosCliente = null;
    this.sugerenciasFiltradas = [];
    this.mostrarSugerencias = false;
    this.caratulaSeleccionada = false;
    this.isSearchingDirectly = false;
    this.error = null;
  }

  private procesarDatosCliente(datos: any): DatosCliente {
    // Mapear los campos exactos que devuelve tu API Flask
    const metaScott = this.parseNumber(datos.compromiso_scott || '0');
    const avanceScott = this.parseNumber(datos.avance_global_scott || '0');
    const metaCombined = this.parseNumber(datos.compromiso_apparel_syncros_vittoria || '0');
    const avanceCombined = this.parseNumber(datos.avance_global_apparel_syncros_vittoria || '0');

    // Usar los porcentajes que ya vienen calculados desde Flask
    const porcentajeScott = this.parseNumber(datos.porcentaje_scott || '0');
    const porcentajeCombined = this.parseNumber(datos.porcentaje_apparel_syncros_vittoria || '0');

    // Calcular faltantes
    const faltanteScott = Math.max(0, metaScott - avanceScott);
    const faltanteCombined = Math.max(0, metaCombined - avanceCombined);

    // Calcular datos de compra mínima usando los campos de Flask
    const metaInicial = this.parseNumber(datos.compra_minima_inicial || '0');
    const metaAnual = this.parseNumber(datos.compra_minima_anual || '0');
    const avanceGlobal = this.parseNumber(datos.avance_global || '0');
    const porcentajeGlobal = this.parseNumber(datos.porcentaje_global || '0');
    const porcentajeAnual = this.parseNumber(datos.porcentaje_anual || '0');

    // Determinar estatus del compromiso
    const totalMeta = metaScott + metaCombined;
    const totalAvance = avanceScott + avanceCombined;
    const estatusCompromiso = totalAvance >= totalMeta ? 'CUMPLIDA' : 'FALTANTE';

    // Calcular importe faltante acumulado
    const importeFaltanteAcumulado = Math.max(0, totalMeta - totalAvance);

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
      compra_minima_inicial: this.parseNumber(datos.compra_minima_inicial || metaInicial || '0'),
      avance_global: this.parseNumber(datos.avance_global || avanceGlobal || '0'),
      porcentaje_global: this.parseNumber(datos.porcentaje_global || porcentajeGlobal || '0'),
      acumulado_anticipado: this.parseNumber(datos.acumulado_anticipado || '0'),
      porcentaje_anual: this.parseNumber(datos.porcentaje_anual || porcentajeAnual || '0'),
      periodoJulAgo: datos.periodoJulAgo || 'Julio - Agosto',
      periodoSepOct: datos.periodoSepOct || 'Septiembre - Octubre',
      periodoNovDic: datos.periodoNovDic || 'Noviembre - Diciembre',
      estatus: datos.estatus || '',
      estado: datos.estado || ''
    };
  }

  // Método auxiliar para parsear números de forma segura
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.datosCliente = null;
    this.sugerenciasFiltradas = [];
    this.mostrarSugerencias = false;
    this.error = null;
    this.caratulaSeleccionada = false;
    this.isSearchingDirectly = false; // IMPORTANTE: Resetear flag

    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  // Métodos para clases CSS dinámicas
  getEstadoClass(estado: string): string {
    if (!estado) return '';
    return estado.toLowerCase().replace(/\s+/g, '-');
  }

  getEstatusClass(estatus: string): string {
    if (!estatus) return '';
    return estatus.toLowerCase().replace(/\s+/g, '-');
  }

  getEstatusCompromisoClass(estatus: string): string {
    if (!estatus) return '';
    return estatus.toLowerCase() === 'cumplida' ? 'cumplida' : 'faltante';
  }

  getImporteFaltanteAcumuladoJulAgo(): number {
    if (!this.datosCliente) return 0;
    const faltanteScott = Math.max(0, this.datosCliente.compromiso_jul_ago - this.datosCliente.avance_jul_ago);
    const faltanteApp = Math.max(0, this.datosCliente.compromiso_jul_ago_app - this.datosCliente.avance_jul_ago_app);
    return faltanteScott + faltanteApp;
  }

  getImporteFaltanteAcumuladoSepOct(): number {
    if (!this.datosCliente) return 0;
    const faltanteScott = Math.max(0, this.datosCliente.compromiso_sep_oct - this.datosCliente.avance_sep_oct);
    const faltanteApp = Math.max(0, this.datosCliente.compromiso_sep_oct_app - this.datosCliente.avance_sep_oct_app);
    return faltanteScott + faltanteApp;
  }

  getImporteFaltanteAcumuladoNovDic(): number {
    if (!this.datosCliente) return 0;
    const faltanteScott = Math.max(0, this.datosCliente.compromiso_nov_dic - this.datosCliente.avance_nov_dic);
    const faltanteApp = Math.max(0, this.datosCliente.compromiso_nov_dic_app - this.datosCliente.avance_nov_dic_app);
    return faltanteScott + faltanteApp;
  }

  getEstadoPeriodo(periodo: string): string {
    const fechaActual = new Date(); // Fecha actual del sistema
    const añoActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // Enero = 1, Diciembre = 12

    // Definición de periodos para 2025
    const PERIODO_JUL_AGO = { inicio: 7, fin: 8, año: 2025 };
    const PERIODO_SEP_OCT = { inicio: 9, fin: 10, año: 2025 };
    const PERIODO_NOV_DIC = { inicio: 11, fin: 12, año: 2025 };

    // Determinar qué periodo estamos evaluando
    let periodoEvaluar;
    switch (periodo) {
      case 'Jul-Ago':
        periodoEvaluar = PERIODO_JUL_AGO;
        break;
      case 'Sep-Oct':
        periodoEvaluar = PERIODO_SEP_OCT;
        break;
      case 'Nov-Dic':
        periodoEvaluar = PERIODO_NOV_DIC;
        break;
      default:
        return 'Sin definir';
    }

    // 1. Verificar si estamos ANTES del periodo
    if (añoActual < periodoEvaluar.año ||
      (añoActual === periodoEvaluar.año && mesActual < periodoEvaluar.inicio)) {
      return 'Sin iniciar';
    }

    // 2. Verificar si estamos DESPUÉS del periodo
    if (añoActual > periodoEvaluar.año ||
      (añoActual === periodoEvaluar.año && mesActual > periodoEvaluar.fin)) {
      return 'Cerrado';
    }

    // 3. Si estamos DENTRO del periodo
    return 'En curso';
  }

  getImporteFaltanteScottJulAgo(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_jul_ago - this.datosCliente.avance_jul_ago;
    return Math.max(0, diferencia);
  }

  getSobranteScottJulAgo(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_jul_ago - this.datosCliente.avance_jul_ago;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getImporteFaltanteApparelJulAgo(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_jul_ago_app - this.datosCliente.avance_jul_ago_app;
    return Math.max(0, diferencia);
  }

  getSobranteApparelJulAgo(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_jul_ago_app - this.datosCliente.avance_jul_ago_app;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getImporteFaltanteScottSepOct(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_sep_oct - this.datosCliente.avance_sep_oct;
    return Math.max(0, diferencia);
  }

  getSobranteScottSepOct(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_sep_oct - this.datosCliente.avance_sep_oct;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getImporteFaltanteApparelSepOct(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_sep_oct_app - this.datosCliente.avance_sep_oct_app;
    return Math.max(0, diferencia);
  }

  getSobranteApparelSepOct(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_sep_oct_app - this.datosCliente.avance_sep_oct_app;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getImporteFaltanteScottNovDic(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_nov_dic - this.datosCliente.avance_nov_dic;
    return Math.max(0, diferencia);
  }

  getSobranteScottNovDic(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_nov_dic - this.datosCliente.avance_nov_dic;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  getImporteFaltanteApparelNovDic(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_nov_dic_app - this.datosCliente.avance_nov_dic_app;
    return Math.max(0, diferencia);
  }

  getSobranteApparelNovDic(): number {
    if (!this.datosCliente) return 0;
    const diferencia = this.datosCliente.compromiso_nov_dic_app - this.datosCliente.avance_nov_dic_app;
    return diferencia < 0 ? Math.abs(diferencia) : 0;
  }

  generarPDF() {
    if (!this.datosCliente) {
      this.error = 'No hay datos para generar PDF';
      return;
    }

    // Obtener el elemento que contiene solo la información a exportar
    const element = document.getElementById('pdf-content');

    if (!element) {
      this.error = 'No se puede generar el PDF en este momento';
      return;
    }

    // Añadir clase específica para PDF
    element.classList.add('pdf-mode');

    // Ocultar elementos que no deben aparecer en el PDF
    this.hideElementsForPDF();

    // Pequeño retraso para asegurar que el DOM se actualice
    setTimeout(() => {
      html2canvas(element, {
        scale: 2, // Mayor calidad
        useCORS: true,
        logging: false
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 180; // Reducir ancho para que no ocupe toda la página
        const pageHeight = 295; // Alto A4 en mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Centrar horizontalmente (210 - 180)/2 = 15mm de margen
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Añadir páginas adicionales si el contenido es muy largo
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Restaurar los elementos ocultos y quitar clase PDF
        this.showElementsAfterPDF();
        element.classList.remove('pdf-mode');

        // Guardar el PDF
        const clave = this.datosCliente ? this.datosCliente.clave : 'cliente';
        pdf.save(`Caratula_${clave}_${new Date().toISOString().split('T')[0]}.pdf`);
      }).catch(error => {
        console.error('Error al generar PDF:', error);
        this.error = 'Error al generar el PDF';
        this.showElementsAfterPDF();
        element.classList.remove('pdf-mode');
      });
    }, 500);
  }

  private hideElementsForPDF() {
    // Ocultar elementos que no deben aparecer en el PDF
    const elementsToHide = [
      '.search-section',
      '.acciones-monitor',
      '.home-bar-container',
      'app-home-bar'
    ];

    elementsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }

  private showElementsAfterPDF() {
    // Mostrar elementos que fueron ocultos para el PDF
    const elementsToShow = [
      '.search-section',
      '.acciones-monitor',
      '.home-bar-container',
      'app-home-bar'
    ];

    elementsToShow.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    });
  }

  getMesActual(): number {
    return new Date().getMonth() + 1; // getMonth() devuelve 0-11, sumamos 1
  }

  // Función para determinar si debe mostrar el período Sep-Oct
  mostrarPeriodoSepOct(): boolean {
    const mesActual = this.getMesActual();
    // Mostrar si estamos en septiembre (9) o después
    return mesActual >= 9;
  }

  // Función para determinar si debe mostrar el período Nov-Dic
  mostrarPeriodoNovDic(): boolean {
    const mesActual = this.getMesActual();
    // Mostrar si estamos en noviembre (11) o después
    return mesActual >= 11;
  }

  // Función alternativa más específica si quieres controlar por rangos exactos
  mostrarPeriodoPorFechas(): { sepOct: boolean, novDic: boolean } {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const dia = hoy.getDate();

    return {
      // Sep-Oct: mostrar desde el 1 de septiembre
      sepOct: mes >= 9,

      // Nov-Dic: mostrar desde el 1 de noviembre  
      novDic: mes >= 11
    };
  }
}