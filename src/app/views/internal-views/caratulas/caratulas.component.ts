import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of, EMPTY, Observable } from 'rxjs';

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
  selector: 'app-caratulas',
  standalone: true,
  imports: [RouterModule, CommonModule, HomeBarComponent, FormsModule],
  templateUrl: './caratulas.component.html',
  styleUrls: ['./caratulas.component.css']
})
export class CaratulasComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  terminoBusqueda: string = '';
  sugerenciasFiltradas: SugerenciaCliente[] = [];
  mostrarSugerencias: boolean = false;

  datosCliente: DatosCliente | null = null;
  caratulaSeleccionada: boolean = false;

  isLoading = false;
  error: string | null = null;

  private searchSubject = new Subject<string>();
  private isSearchingDirectly = false; // Flag para distinguir búsqueda directa vs sugerencias

  constructor(private caratulasService: CaratulasService, private router: Router) { }

  ngOnInit() {
    this.initializeSearch();
  }

  private initializeSearch() {
    // Configurar búsqueda con debounce para sugerencias
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        // Si es búsqueda directa, no obtener sugerencias
        if (this.isSearchingDirectly) {
          this.isSearchingDirectly = false;
          return EMPTY;
        }

        if (!term || term.length < 2) {
          this.sugerenciasFiltradas = [];
          this.mostrarSugerencias = false;
          return EMPTY;
        }

        // Solo obtener sugerencias si no estamos haciendo búsqueda directa
        return this.obtenerSugerencias(term);
      }),
      catchError(error => {
        console.error('Error en búsqueda de sugerencias:', error);
        this.error = 'Error al buscar sugerencias';
        this.mostrarSugerencias = false;
        return of([]);
      })
    ).subscribe(sugerencias => {
      this.sugerenciasFiltradas = sugerencias || [];
      this.mostrarSugerencias = this.sugerenciasFiltradas.length > 0;
    });
  }

  private obtenerSugerencias(termino: string): Observable<SugerenciaCliente[]> {
    // Asegúrate de que este método del servicio esté implementado correctamente
    return this.caratulasService.obtenerSugerencias(termino);
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
      return;
    }

    // Emitir al subject para obtener sugerencias con debounce
    // Solo si no estamos en modo de búsqueda directa
    if (!this.isSearchingDirectly) {
      this.searchSubject.next(valor);
    }
  }

  onFocusInput() {
    // Solo mostrar sugerencias si hay datos y no estamos cargando
    if (this.terminoBusqueda.trim().length >= 2 &&
      this.sugerenciasFiltradas.length > 0 &&
      !this.isLoading) {
      this.mostrarSugerencias = true;
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

    // Validar que tenemos al menos un parámetro
    if (!clave && !nombreCliente) {
      this.error = 'Se requiere clave o nombre del cliente';
      this.isLoading = false;
      return;
    }

    console.log('Buscando cliente:', { clave, nombreCliente });

    this.caratulasService.buscarCaratulas(clave, nombreCliente).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servicio:', response);

        // Manejar diferentes tipos de respuesta
        let datos: any = null;

        // Verificar si la respuesta tiene una estructura específica
        if (response && response.success && response.data) {
          // Estructura: { success: true, data: [...] }
          datos = Array.isArray(response.data) ? response.data[0] : response.data;
        } else if (Array.isArray(response)) {
          // Respuesta directa como array
          datos = response[0];
        } else if (response && typeof response === 'object') {
          // Respuesta directa como objeto
          datos = response;
        }

        if (datos && Object.keys(datos).length > 0) {
          this.datosCliente = this.procesarDatosCliente(datos);
          this.caratulaSeleccionada = true;
          this.error = null;
          console.log('Datos procesados:', this.datosCliente);
        } else {
          this.datosCliente = null;
          this.caratulaSeleccionada = false;
          this.error = 'No se encontraron datos para este cliente';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al obtener datos del cliente:', error);

        // Mejorar el manejo de errores
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

  private procesarDatosCliente(datos: any): DatosCliente {
    console.log('Procesando datos desde Flask:', datos);

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
    this.isSearchingDirectly = false;

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
  
  generarPDF() {
    if (!this.datosCliente) {
      this.error = 'No hay datos para generar PDF';
      return;
    }

    console.log('Generando PDF para:', this.datosCliente.clave);
    // Aquí implementarías la lógica para generar el PDF
    // Podrías llamar a otro método del servicio o usar una librería como jsPDF
  }
}