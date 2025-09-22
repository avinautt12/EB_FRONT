import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { AlertaService } from '../../../services/alerta.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of, EMPTY, Observable } from 'rxjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { EmailService, EmailData, EmailConfig } from '../../../services/email.service';
import { FechaActualizacionComponent } from '../../../components/fecha-actualizacion/fecha-actualizacion.component';

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
  imports: [RouterModule, CommonModule, HomeBarComponent, FormsModule, FechaActualizacionComponent],
  templateUrl: './caratulas.component.html',
  styleUrls: ['./caratulas.component.css']
})
export class CaratulasComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('contentToExport', { static: false }) contentToExport!: ElementRef;

  terminoBusqueda: string = '';
  sugerenciasFiltradas: SugerenciaCliente[] = [];
  mostrarSugerencias: boolean = false;

  datosCliente: DatosCliente | null = null;
  caratulaSeleccionada: boolean = false;

  isLoading = false;
  error: string | null = null;

  loadingCache = false;

  private searchSubject = new Subject<string>();
  private isSearchingDirectly = false;

  private allClientes: SugerenciaCliente[] = [];
  private cacheLoaded = false;

  mostrarModalEmail: boolean = false;
  emailDestinatario: string = '';
  mensajePersonalizado: string = '';
  enviandoEmail: boolean = false;

  mensajeAlerta: string = '';
  tipoAlerta: string = '';

  configuracionEmail: EmailConfig | null = null;

  exportandoPDF = false;

  constructor(
    private caratulasService: CaratulasService,
    private router: Router,
    private emailService: EmailService,
    private alertaService: AlertaService
  ) { }

  ngOnInit() {
    this.initializeSearch();
    this.loadAllClientes();
    this.verificarConfiguracionEmail();
  }

  abrirModalEmail() {
    if (!this.datosCliente) {
      this.mostrarError('Primero debe seleccionar un cliente');
      return;
    }

    this.emailDestinatario = '';
    this.mensajePersonalizado = '';
    this.mostrarModalEmail = true;
  }

  cerrarModalEmail() {
    this.mostrarModalEmail = false;
    this.enviandoEmail = false;
  }

  async enviarCaratulaPorEmail() {
    // 1. Validaciones
    if (!this.emailDestinatario || !this.datosCliente) {
      this.mostrarError('Primero debe seleccionar un cliente');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailDestinatario)) {
      this.mostrarError('Por favor ingrese un email válido');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      this.mostrarError('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      return;
    }

    // 2. Mostrar feedback de carga inmediato
    this.enviandoEmail = true;
    this.mostrarModalEmail = false;
    setTimeout(() => {
      this.mostrarExito('El correo se está procesando y será enviado en breve.');
    }, 3000); 

    // 3. Preparar los datos del payload (sin el PDF)
    const emailData: EmailData = {
      to: this.emailDestinatario,
      cliente_nombre: this.datosCliente.nombre_cliente,
      clave: this.datosCliente.clave,
      mensaje_personalizado: this.mensajePersonalizado,
      datos_caratula: this.datosCliente,

      periodos: [
        { nombre: 'Julio-Agosto', estado: this.getEstadoPeriodo('Jul-Ago') },
        { nombre: 'Septiembre-Octubre', estado: this.getEstadoPeriodo('Sep-Oct') },
        { nombre: 'Noviembre-Diciembre', estado: this.getEstadoPeriodo('Nov-Dic') }
      ]
    };

    // 4. Enviar la petición al backend de forma asíncrona
    this.emailService.enviarCaratulaPdf(emailData).subscribe({
      next: (response) => {
        this.enviandoEmail = false;
        // La alerta de éxito ya se mostró antes de enviar la petición.
      },
      error: (error) => {
        this.enviandoEmail = false;
        console.error('Error al enviar email:', error);
        let mensajeError = 'Error al enviar el email.';
        if (error.error?.error) {
          mensajeError = error.error.error;
        } else if (error.status === 401) {
          mensajeError = 'Error de autenticación. Token inválido o expirado.';
        } else if (error.status === 500) {
          mensajeError = 'Error del servidor al procesar el envío.';
        }
        this.mostrarError(mensajeError);
      }
    });
  }

  private mostrarError(mensaje: string) {
    this.alertaService.mostrarError(mensaje);
    this.error = mensaje;
    setTimeout(() => this.error = null, 5000);
  }

  private mostrarExito(mensaje: string) {
    this.alertaService.mostrarExito(mensaje);
  }

  private verificarConfiguracionEmail() {
    this.emailService.verificarConfiguracion().subscribe({
      next: (config: any) => {
        this.configuracionEmail = config;
        console.log('Configuración de email detectada:', config);
      },
      error: (error) => {
        console.error('Error al verificar configuración de email:', error);
        // Configuración por defecto en caso de error
        this.configuracionEmail = {
          configurado: false,
          email_remitente: 'No disponible',
          usuario_actual: 'Error de conexión'
        };
      }
    });
  }

  private initializeSearch() {
    // Configurar búsqueda con debounce para sugerencias
    this.searchSubject.pipe(
      debounceTime(50),
      distinctUntilChanged(),
      switchMap(term => {
        // Si es búsqueda directa, no obtener sugerencias
        if (this.isSearchingDirectly) {
          this.isSearchingDirectly = false;
          return EMPTY;
        }

        if (!term || term.length < 1) {
          this.sugerenciasFiltradas = [];
          this.mostrarSugerencias = false;
          return EMPTY;
        }

        if (this.cacheLoaded && this.allClientes.length > 0) {
          const resultados = this.filtrarClientesLocalmente(term);
          this.sugerenciasFiltradas = resultados;
          this.mostrarSugerencias = resultados.length > 0;
          return EMPTY; // No llamar al servicio
        } else {
          // Llamar al servicio si no tenemos cache
          return this.obtenerSugerencias(term);
        }
      }),
      catchError(error => {
        console.error('Error en búsqueda de sugerencias:', error);
        this.error = 'Error al buscar sugerencias';
        this.mostrarSugerencias = false;
        return of([]);
      })
    ).subscribe(sugerencias => {
      if (sugerencias && sugerencias.length > 0) {
        this.sugerenciasFiltradas = sugerencias;
        this.mostrarSugerencias = true;
      }
    });
  }

  private loadAllClientes() {
    // Llamar sin parámetro o con string vacío para obtener todos
    this.caratulasService.obtenerSugerencias('').subscribe({
      next: (clientes) => {
        this.allClientes = clientes || [];
        this.cacheLoaded = true;
      },
      error: (error) => {
        console.error('Error al cargar cache de clientes:', error);
        this.cacheLoaded = false;
        // Fallback: intentar cargar con un carácter que devuelva muchos resultados
        this.caratulasService.obtenerSugerencias('A').subscribe({
          next: (clientesFallback) => {
            this.allClientes = clientesFallback || [];
            this.cacheLoaded = true;
          },
          error: (errorFallback) => {
            console.error('Error en fallback también:', errorFallback);
            this.cacheLoaded = false;
          }
        });
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

  private obtenerSugerencias(termino: string): Observable<SugerenciaCliente[]> {
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
    if (!this.datosCliente || this.exportandoPDF) {
      this.mostrarError('Seleccione un cliente primero o espere a que finalice la descarga actual.');
      return;
    }

    this.exportandoPDF = true; // Inicia el estado de carga
    this.error = null;
    this.alertaService.mostrarExito('Generando PDF, por favor espere...');

    // Preparamos el payload, similar a como lo haces para el email
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
        document.body.appendChild(link); // Necesario para Firefox
        link.click();

        // 5. Limpiar: remover el enlace y revocar la URL del objeto
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.exportandoPDF = false; // Finaliza el estado de carga
      },
      error: (error) => {
        console.error('Error al generar PDF desde el backend:', error);
        this.mostrarError(error.message || 'Ocurrió un error al generar el PDF.');
        this.exportandoPDF = false; // Finaliza el estado de carga en caso de error
      }
    });
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

  // ========== NUEVOS MÉTODOS PARA EL PERIODO ACUMULADO ==========

  getMesActual(): number {
    return new Date().getMonth() + 1; // Enero = 1, Diciembre = 12
  }

  getTituloPeriodoAcumulado(): string {
    const mes = this.getMesActual();

    if (mes <= 8) return 'Julio-Agosto';
    if (mes <= 10) return 'Septiembre-Octubre';
    return 'Noviembre-Diciembre';
  }

  getEstadoPeriodoAcumulado(): string {
    const mes = this.getMesActual();

    if (mes <= 8) return 'En curso';
    if (mes <= 10) return 'En curso';
    return 'Cerrado';
  }

  debeMostrarPeriodo(periodo: string): boolean {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;

    const periodos = {
      'Jul-Ago': { inicio: 7 },    // Mostrar desde julio (mes 7)
      'Sep-Oct': { inicio: 9 },    // Mostrar desde septiembre (mes 9)
      'Nov-Dic': { inicio: 11 }    // Mostrar desde noviembre (mes 11)
    };

    const periodoData = periodos[periodo as keyof typeof periodos];

    if (!periodoData) return false;

    // Mostrar solo si estamos en o después del mes de inicio
    return mesActual >= periodoData.inicio;
  }

  getEstadoPeriodo(periodo: string): string {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;

    const periodos = {
      'Jul-Ago': { inicio: 7, fin: 8 },    // Julio-Agosto
      'Sep-Oct': { inicio: 9, fin: 10 },   // Septiembre-Octubre
      'Nov-Dic': { inicio: 11, fin: 12 }   // Noviembre-Diciembre
    };

    const periodoData = periodos[periodo as keyof typeof periodos];

    if (!periodoData) return 'Sin definir';

    // Si estamos ANTES del periodo
    if (mesActual < periodoData.inicio) {
      return 'Sin iniciar';
    }

    // Si estamos DESPUÉS del periodo
    if (mesActual > periodoData.fin) {
      return 'Cerrado';
    }

    // Si estamos DENTRO del periodo
    return 'En curso';
  }

  // Métodos para Scott
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

  // Métodos para Apparel (misma lógica que Scott)
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