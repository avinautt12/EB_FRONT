import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { ClientesService } from '../../../services/clientes.service';
import { PrevioService } from '../../../services/previo.service';
import { FiltroService } from '../../../services/filtro.service';
import { FiltroPrevioComponent } from '../../../components/filtro-previo/filtro-previo.component';
import { AlertaService } from '../../../services/alerta.service';
import { TooltipComponent } from '../../../components/tooltip/tooltip.component';
import * as XLSX from 'xlsx';

import { FechaActualizacionComponent } from '../../../components/fecha-actualizacion/fecha-actualizacion.component';

interface Cliente {
  clave: string;
  zona: string;
  evac: string;
  nombre_cliente: string;
  nivel: string;
  f_inicio?: string;
  f_fin?: string;
}

interface FacturaOdoo {
  contacto_referencia: string;
  contacto_nombre: string;
  cantidad: number;
  precio_unitario: string;
  fecha_factura: string;
  categoria_producto: string;
  numero_factura: string;
  nombre_producto: string;
  estado_factura: string;
  costo_producto: string;
  venta_total: number;
  apparel?: string;
  marca?: string;
  id?: string;
  estado?: string;
  subcategoria?: string;
  referencia_interna?: string;
  eride?: string;
  evac?: string;
}

interface ClienteConAcumulado extends Cliente {
  acumulado_anticipado: number;
  avance_global_scott?: number;
  esIntegral?: boolean;
  grupoIntegral?: number;
  compra_minima_anual?: number;
  compra_minima_inicial?: number;
  avance_global?: number;
  compromiso_scott?: number;
  compromiso_jul_ago?: number;
  compromiso_sep_oct?: number;
  compromiso_nov_dic?: number;
  compromiso_apparel_syncros_vittoria?: number;
  avance_global_apparel_syncros_vittoria?: number;
  compromiso_jul_ago_app?: number;
  compromiso_sep_oct_app?: number;
  compromiso_nov_dic_app?: number;
  avance_jul_ago?: number;
  avance_sep_oct?: number;
  avance_nov_dic?: number;
  avance_jul_ago_app?: number;
  avance_sep_oct_app?: number;
  avance_nov_dic_app?: number;
  acumulado_syncros?: number;
  acumulado_apparel?: number;
  acumulado_vittoria?: number;
  acumulado_bold?: number;
  avance_global_1?: number;
  f_inicio?: string;
  f_fin?: string;
  fecha_inicio_calculo?: string;
  esParteDeIntegral?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-previo',
  standalone: true,
  imports: [HomeBarComponent, RouterModule, CommonModule, FormsModule,
    FiltroPrevioComponent, TooltipComponent, FechaActualizacionComponent],
  templateUrl: './previo.component.html',
  styleUrl: './previo.component.css'
})

export class PrevioComponent implements OnInit, OnDestroy {
  @Output() onInit = new EventEmitter<void>();

  datosPrevio: any[] = [];

  tooltipPosition: { x: number, y: number } = { x: 0, y: 0 };
  clienteParaTooltip: any = null;

  Math = Math;

  @Input() tipo: string = '';
  @Input() placeholder: string = '';
  @Input() opciones: any[] = [];
  @Input() estaActivo: boolean = false;

  @Output() aplicarFiltro = new EventEmitter<any>();
  @Output() limpiarFiltro = new EventEmitter<void>();
  @Output() filtroClicked = new EventEmitter<void>();

  clientes: Cliente[] = [];
  clientesOriginal: ClienteConAcumulado[] = [];
  clientesFiltrados: ClienteConAcumulado[] = [];
  clientesPaginados: ClienteConAcumulado[] = [];

  integralesOriginal: ClienteConAcumulado[] = [];

  todosLosDatos: ClienteConAcumulado[] = [];

  facturas: FacturaOdoo[] = [];

  showClaveFilter: boolean = false;
  showEvacFilter: boolean = false;
  showClienteFilter: boolean = false;
  showEleccionNivelFilter: boolean = false;

  paginaActual = 1;
  paginaActualTemp = 1;
  itemsPorPagina = 100;
  totalPaginas = 0;
  cargando = true;

  filtros: {
    clave: string[];
    zona: string;
    nombre_cliente: string;
    nivel: string[];
    evac: string[];
    cliente: string[];
  } = {
      clave: [],
      zona: '',
      nombre_cliente: '',
      nivel: [],
      evac: [],
      cliente: []
    };

  zonasUnicas: string[] = [];
  nivelesUnicos: string[] = [];
  filtrosCheckbox = {
    zonasSeleccionadas: new Set<string>(),
    nivelesSeleccionados: new Set<string>()
  };

  fechaEspecialClientes: Set<string> = new Set(['FA318', 'JC554', 'MD670', 'NE724']);

  integrales: ClienteConAcumulado[] = [];

  mostrarIntegrales: boolean = true;

  opcionesClave: { value: string; selected: boolean }[] = [];
  opcionesEvac: { value: string; selected: boolean }[] = [];
  opcionesCliente: { value: string; selected: boolean }[] = [];
  opcionesEleccionNivel: { value: string; selected: boolean }[] = [];

  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';

  filtroActivo: string | null = null;

  totales: {
    acumulado_anticipado: number;
    compra_minima_anual: number;
    compra_minima_inicial: number;
    avance_global: number;
    avance_global_scott: number;
    compromiso_scott: number;
    compromiso_jul_ago: number;
    avance_jul_ago: number;
    compromiso_sep_oct: number;
    avance_sep_oct: number;
    compromiso_nov_dic: number;
    avance_nov_dic: number;
    compromiso_apparel_syncros_vittoria: number;
    avance_global_apparel_syncros_vittoria: number;
    compromiso_jul_ago_app: number;
    avance_jul_ago_app: number;
    compromiso_sep_oct_app: number;
    avance_sep_oct_app: number;
    compromiso_nov_dic_app: number;
    avance_nov_dic_app: number;
    acumulado_syncros: number;
    acumulado_apparel: number;
    acumulado_vittoria: number;
    acumulado_bold: number;
  } = {
      acumulado_anticipado: 0,
      compra_minima_anual: 0,
      compra_minima_inicial: 0,
      avance_global: 0,
      avance_global_scott: 0,
      compromiso_scott: 0,
      compromiso_jul_ago: 0,
      avance_jul_ago: 0,
      compromiso_sep_oct: 0,
      avance_sep_oct: 0,
      compromiso_nov_dic: 0,
      avance_nov_dic: 0,
      compromiso_apparel_syncros_vittoria: 0,
      avance_global_apparel_syncros_vittoria: 0,
      compromiso_jul_ago_app: 0,
      avance_jul_ago_app: 0,
      compromiso_sep_oct_app: 0,
      avance_sep_oct_app: 0,
      compromiso_nov_dic_app: 0,
      avance_nov_dic_app: 0,
      acumulado_syncros: 0,
      acumulado_apparel: 0,
      acumulado_vittoria: 0,
      acumulado_bold: 0
    };

  constructor(
    private clientesService: ClientesService,
    private previoService: PrevioService,
    private alertaService: AlertaService,
    private filtroService: FiltroService
  ) { }

  ngOnInit(): void {
    Promise.all([
      this.clientesService.getClientes().toPromise(),
      this.previoService.getFacturasCalculadas().toPromise()
    ]).then(([clientes, facturas]) => {
      this.facturas = facturas ?? [];

      this.filtroService.filtroAbierto$.subscribe(filtroId => {
        this.filtroActivo = filtroId;
      });

      // Primero mapear todos los clientes con sus acumulados
      const todosClientes = clientes.map((cliente: Cliente) => {
        const {
          acumulado,
          scott,
          avance_jul_ago,
          avance_sep_oct,
          avance_nov_dic,
          avance_jul_ago_app,
          avance_sep_oct_app,
          avance_nov_dic_app,
          acumulado_syncros,
          acumulado_apparel,
          acumulado_vittoria,
          acumulado_bold,
          avance_global_apparel_syncros_vittoria,
          avance_global
          //avance_global_1
        } = this.calcularAcumulados(cliente, this.facturas);
        const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');

        return {
          ...cliente,
          acumulado_anticipado: acumulado,
          avance_global_scott: scott,
          avance_jul_ago: avance_jul_ago,
          avance_sep_oct: avance_sep_oct,
          avance_nov_dic: avance_nov_dic,
          avance_jul_ago_app: avance_jul_ago_app,
          avance_sep_oct_app: avance_sep_oct_app,
          avance_nov_dic_app: avance_nov_dic_app,
          acumulado_syncros: acumulado_syncros,
          acumulado_apparel: acumulado_apparel,
          acumulado_vittoria: acumulado_vittoria,
          acumulado_bold: acumulado_bold,
          avance_global_apparel_syncros_vittoria: avance_global_apparel_syncros_vittoria,
          avance_global: avance_global,
          //avance_global_1: avance_global_1,
          fecha_inicio_calculo: fechaInicio.toISOString().split('T')[0]
        };
      });

      // Luego procesar los integrales
      this.clientesOriginal = this.procesarIntegrales(todosClientes);
      this.combinarDatos();

      this.inicializarOpcionesFiltro();
      this.guardarDatosEnBackend();

      // Configurar filtros basados en TODOS los datos
      this.zonasUnicas = Array.from(new Set(this.todosLosDatos.map(c => c.zona ?? '').filter(Boolean)));
      this.nivelesUnicos = Array.from(new Set(this.todosLosDatos.map(c => c.nivel ?? '').filter(Boolean)));

      // Dentro de ngOnInit(), después de cargar los datos
      this.opcionesEleccionNivel = Array.from(new Set(this.todosLosDatos.map(c => c.nivel)))
        .filter(nivel => nivel) // Filtrar valores nulos/vacíos
        .map(nivel => ({
          value: nivel,
          selected: false
        }));

      this.aplicarFiltros();
      this.cargando = false;
      this.onInit.emit();

    }).catch(error => {
      console.error('Error al cargar datos:', error);
      this.cargando = false;

      this.onInit.emit();
    });

    this.previoService.obtenerPrevio().subscribe({
      next: (datos) => {
        // Procesar datos del endpoint (convertir strings a números)
        this.datosPrevio = this.procesarDatosDelEndpoint(datos);
        this.clientesFiltrados = this.datosPrevio;
        this.todosLosDatos = this.datosPrevio;

        // Calcular totales después de procesar los datos
        this.calcularTotales();

        this.inicializarOpcionesFiltro();
        this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
        this.actualizarPaginado();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos del previo:', error);
        this.cargando = false;
      }
    });
  }

  procesarDatosDelEndpoint(datos: any[]): ClienteConAcumulado[] {
    return datos.map(item => ({
      ...item,
      // Convertir todos los strings numéricos a números
      acumulado_anticipado: parseFloat(item.acumulado_anticipado) || 0,
      compra_minima_anual: parseFloat(item.compra_minima_anual) || 0,
      compra_minima_inicial: parseFloat(item.compra_minima_inicial) || 0,
      avance_global: parseFloat(item.avance_global) || 0,
      avance_global_scott: parseFloat(item.avance_global_scott) || 0,
      compromiso_scott: parseFloat(item.compromiso_scott) || 0,
      compromiso_jul_ago: parseFloat(item.compromiso_jul_ago) || 0,
      compromiso_sep_oct: parseFloat(item.compromiso_sep_oct) || 0,
      compromiso_nov_dic: parseFloat(item.compromiso_nov_dic) || 0,
      compromiso_apparel_syncros_vittoria: parseFloat(item.compromiso_apparel_syncros_vittoria) || 0,
      avance_global_apparel_syncros_vittoria: parseFloat(item.avance_global_apparel_syncros_vittoria) || 0,
      compromiso_jul_ago_app: parseFloat(item.compromiso_jul_ago_app) || 0,
      compromiso_sep_oct_app: parseFloat(item.compromiso_sep_oct_app) || 0,
      compromiso_nov_dic_app: parseFloat(item.compromiso_nov_dic_app) || 0,
      avance_jul_ago: parseFloat(item.avance_jul_ago) || 0,
      avance_sep_oct: parseFloat(item.avance_sep_oct) || 0,
      avance_nov_dic: parseFloat(item.avance_nov_dic) || 0,
      avance_jul_ago_app: parseFloat(item.avance_jul_ago_app) || 0,
      avance_sep_oct_app: parseFloat(item.avance_sep_oct_app) || 0,
      avance_nov_dic_app: parseFloat(item.avance_nov_dic_app) || 0,
      acumulado_syncros: parseFloat(item.acumulado_syncros) || 0,
      acumulado_apparel: parseFloat(item.acumulado_apparel) || 0,
      acumulado_vittoria: parseFloat(item.acumulado_vittoria) || 0,
      acumulado_bold: parseFloat(item.acumulado_bold) || 0
    }));
  }

  manejarClickFiltro(tipoFiltro: string) {
    const filtroId = `previo-${tipoFiltro}`;

    // Si el filtro ya está abierto, lo cerramos
    if (this.filtroActivo === filtroId) {
      this.filtroService.cerrarFiltros();
    } else {
      // Si no, abrimos este filtro (esto cerrará automáticamente cualquier otro abierto)
      this.filtroService.abrirFiltro(filtroId);
    }
  }

  mostrarFiltroClave() {
    this.manejarClickFiltro('clave');
  }

  mostrarFiltroEvac() {
    this.manejarClickFiltro('evac');
  }

  mostrarFiltroCliente() {
    this.manejarClickFiltro('cliente');
  }

  mostrarFiltroNivel() {
    this.manejarClickFiltro('nivel');
  }

  // Métodos para verificar si un filtro está activo
  esFiltroActivo(tipoFiltro: string): boolean {
    return this.filtroActivo === `previo-${tipoFiltro}`;
  }

  ngOnDestroy() {
    // Cerrar todos los filtros al salir del componente
    this.filtroService.cerrarFiltros();
  }

  toggleFiltro(tipoFiltro: string): void {
    const filtroId = `previo-${tipoFiltro}`;
    if (this.filtroActivo === filtroId) {
      this.filtroService.cerrarFiltros();
    } else {
      this.filtroService.abrirFiltro(filtroId);
    }
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    this.filtrarClientes();
    this.calcularTotales();
  }

  filtrarClientes() {
    const filtroEvac = this.filtros.evac;
    const filtroCliente = this.filtros.cliente;
    const filtroNivel = this.filtros.nivel;

    const filtrar = (cliente: ClienteConAcumulado) => {
      const claveValida = !this.filtros.clave.length || this.filtros.clave.includes(cliente.clave);
      const evacValido = !filtroEvac.length || filtroEvac.includes(cliente.evac);
      const clienteValido = !filtroCliente.length || filtroCliente.includes(cliente.nombre_cliente);
      const nivelValido = !filtroNivel.length || filtroNivel.includes(cliente.nivel);
      return claveValida && evacValido && clienteValido && nivelValido;
    };

    this.clientesFiltrados = this.todosLosDatos.filter(filtrar);

    // Actualizar paginación para la lista combinada
    this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
    this.actualizarPaginado();

    this.calcularTotales();
  }

  private combinarDatos(): void {
    // Combinar TODOS los clientes + integrales
    this.todosLosDatos = [...this.clientesOriginal, ...this.integralesOriginal];
  }

  private combinarDatosParaGuardar(): any[] {
    // Esta función es para GUARDAR los datos
    return [...this.clientesOriginal, ...this.integrales];
  }

  private inicializarOpcionesFiltro(): void {
    // NUEVO: Usar todosLosDatos en lugar de arrays separados
    const clavesUnicas = Array.from(new Set(this.todosLosDatos.map(c => c.clave).filter(Boolean)));
    this.opcionesClave = clavesUnicas.map(clave => ({
      value: clave,
      selected: false
    }));

    const evacsUnicos = Array.from(new Set(this.todosLosDatos.map(c => c.evac).filter(Boolean)));
    this.opcionesEvac = evacsUnicos.map(evac => ({
      value: evac,
      selected: false
    }));

    const nombresUnicos = Array.from(new Set(this.todosLosDatos.map(c => c.nombre_cliente).filter(Boolean)));
    this.opcionesCliente = nombresUnicos.map(nombre => ({
      value: nombre,
      selected: false
    }));

    const nivelesUnicos = Array.from(new Set(this.todosLosDatos.map(c => c.nivel).filter(Boolean)));
    this.opcionesEleccionNivel = nivelesUnicos.map(nivel => ({
      value: nivel,
      selected: false
    }));
  }

  aplicarFiltroClave(clavesSeleccionadas: string[]): void {
    this.filtros.clave = clavesSeleccionadas;
    this.aplicarFiltros();
  }

  aplicarFiltroEvac(evacsSeleccionados: string[]): void {
    this.filtros.evac = evacsSeleccionados;
    this.aplicarFiltros();
  }

  aplicarFiltroCliente(clientesSeleccionados: string[]): void {
    this.filtros.cliente = clientesSeleccionados;
    this.aplicarFiltros();
  }

  limpiarFiltroClave(): void {
    this.filtros.clave = [];
    this.opcionesClave.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();

    this.calcularTotales();
  }

  limpiarFiltroEvac(): void {
    this.filtros.evac = [];
    this.opcionesEvac.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();

    this.calcularTotales();
  }

  limpiarFiltroCliente(): void {
    this.filtros.cliente = [];
    this.opcionesCliente.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();

    this.calcularTotales();
  }

  aplicarFiltroEleccionNivel(nivelesSeleccionados: string[]): void {
    this.filtros.nivel = nivelesSeleccionados;
    this.aplicarFiltros();
  }

  limpiarFiltroEleccionNivel(): void {
    this.filtros.nivel = [];
    this.opcionesEleccionNivel.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();

    this.calcularTotales();
  }

  actualizarPaginado() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.clientesPaginados = this.clientesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  /* MY26 */

  private fechasEspeciales: { patrones: string[], fecha: string }[] = [
    {
      patrones: ['LIVING FOR BIKES', 'CHRISTIAN BOCCALETTI', 'ELITE CYCLERY',
        'VICTOR ALEJANDRO GARNIER MORGA', 'RODRIGO AMADOR RAMIREZ',
        'ALEXIS JASIEL CONCHA ESPIRITU', 'RAÚL MENA ORTIZ', 'ANA CECILIA LOPEZ LOPEZ',
        'RAUL INFANTE MIRANDA', 'ARTURO LUNA ROMERO', 'EDUARDO LUNA LOPEZ',
        'MIGUEL ANGEL ORTIZ CASTAÑEDA', 'OSIRIS ONDAL DELFIN', 'JOSE MANUEL VAZQUEZ PACHECO',
        'TUNING AUTOSPORT', 'ADÁN ORTEGA LEÓN', 'HUGO ALLAN GARCIA MACIAS',
        'ORIOIL MEDRANO CESPEDES', 'JOSÉ RICARDO GAMBOA MANRIQUE', 'PAULINA ÁLVAREZ FERNÁNDEZ',
        'JOSE ANGEL DIAZ CORTES', 'JORGE FLORES LIMA', 'BERTHA LIGIA LAMELAS DOMINGUEZ',
        'ATV MOTO POWERSPORTS', 'ROCIO CABALLERO CORONEL', 'GRAND MOTOR SPORTS',
        'ALBERTO DÍAZ DE LEÓN ALONSO', 'MARKETER AYV', 'FRANCISCO MACHUCA ROJAS',
        'BLANCA ISABEL DÍAZ ALDECO RODRÍGUEZ', 'EL PAJE TIENDAS DEPARTAMENTALES SA DE CV',
        'MARIA GUADALUPE GODINEZ FERNANDEZ', 'FERNANDO PONTON ROCHA',
        'ZIRANDA CAPINDA MADRIGAL ALVAREZ UGENA', 'BROTHERS BIKE',
        'VICTOR ALBERTO VILLASEÑOR RUIZ', 'RAMON DE JESUS MARTINEZ LOPEZ',
        'EDUARDO FRANCISCO MENDOZA NIETO', 'BIKES95CYCLINGCLUB', 'OPCIONES CREATIVAS',
        'DEPORTES TEXCOCO', 'ANGELICA OSORIO GASPERIN', 'DANIEL CRUZ ARRIETA',
        'JULIAN ERNESTO CURIEL JIMENEZ', 'GO LEMON', 'H & A BIKES MEXICO',
        'CHRISTOPHER WALTER BASSAM', 'MANUEL ALEJANDRO NAVARRO GONZALEZ',
        'IVAN MARTINEZ CARRILLO', 'JESSICA FERNANDA JURADO CUETO', 'RICARDO REYES GOMEZ',
        'MANUEL DE JESUS SOTO ACOSTA', 'CARLOS DOMINGUEZ TOLEDO', 'ADÁN JOSUE SUÁREZ HERNÁNDEZ',
        'CICLISMO EXTREMO', 'CARLOS ALBERTO CRUZ CALVA', 'JUAN JOSÉ DE RUEDA MUÑOZ',
        'JESÚS EUDON FLORES NOVOA', 'JUAN JOSÉ GARCÍA MEDRANO', 'MARCO ANTONIO GARCÍA VEJAR',
        'HABROS BICICLETAS', 'MARIA CRISTINA QUINTERO MILLAN', 'JORGE JUAN VILLA MARTÍNEZ',
        'VICTOR HUGO VILLANUEVA GUZMAN', 'ADVENTURE BIKE RIDER', 'BICICLETAS SCJM',
        'MARCO TULIO ANDRADE NAVARRO', 'SALUD MARTINEZ'],
      fecha: '2025-07-01'
    },
    {
      patrones: ['XAVIER JAMES LORD SANTOS', 'IVAN NIEVES AYALA', 'LUCIA SALAZAR LOPEZ',
        'JESUS MANUEL MEDRANO VELARDE'],
      fecha: '2025-06-11'
    },
    {
      patrones: ['CYCLING RIDING DE MEXICO'],
      fecha: '2025-06-10'
    },
    {
      patrones: ['FRANCISCO AGUILAR MORALES', 'RUTA 87 BIKE STORE'],
      fecha: '2025-06-16'
    },
    {
      patrones: ['BIKES MART'],
      fecha: '2025-06-21'
    },
    {
      patrones: ['GUADALUPE GONZALEZ REYES', 'GUADALUPE GONZÁLES REYES'],
      fecha: '2025-06-13'
    },
    {
      patrones: ['FRANCISCO DAVID FRAGOSO DEL RIO', 'JESÚS IVÁN PÉREZ CAVAZOS'],
      fecha: '2025-06-25'
    },
    {
      patrones: ['JUAN MANUEL RUACHO RANGEL', 'NARUCO'],
      fecha: '2025-06-17'
    }
  ];

  private obtenerFechaInicio(cliente: ClienteConAcumulado): Date {
    if (cliente.f_inicio) {
      return new Date(cliente.f_inicio);
    }

    if (cliente.fecha_inicio_calculo) {
      return new Date(cliente.fecha_inicio_calculo);
    }

    const nombreUpper = cliente.nombre_cliente.toUpperCase();
    const claveUpper = cliente.clave.toUpperCase();

    for (const grupo of this.fechasEspeciales) {
      const encontrado = grupo.patrones.some(patron =>
        nombreUpper.includes(patron.toUpperCase()) ||
        claveUpper.includes(patron.toUpperCase())
      );

      if (encontrado) {
        return new Date(grupo.fecha);
      }
    }

    return new Date('2025-07-01');
  }

  private procesarIntegrales(clientes: ClienteConAcumulado[]): ClienteConAcumulado[] {
    const gruposIntegrales = [
      {
        nombre: 'MARCO TULIO ANDRADE NAVARRO',
        claves: ['JC539', 'EC216'],
        nombreIntegral: 'Integral 1',
        nivel: 'Partner Elite Plus',
        compraMinimaAnual: 12200000,
        compraMinimaInicial: 6345000,
        compromisoScott: 9000000,
        compromisoJulAgo: 1930500,
        compromisoSepOct: 2047500,
        compromisoNovDic: 1872000,
        compromisoSynApaVit: 990000,
        compromisoJulAgoApp: 163350,
        compromisoSepOctApp: 173250,
        compromisoNovDicApp: 158400
      },
      {
        nombre: 'VICTOR HUGO VILLANUEVA GUZMAN',
        claves: ['LC657', 'GC411', 'MC679', 'MC677'],
        nombreIntegral: 'Integral 2',
        nivel: 'Partner Elite Plus',
        compraMinimaAnual: 19980000,
        compraMinimaInicial: 12690000,
        compromisoScott: 18000000,
        compromisoJulAgo: 3861000,
        compromisoSepOct: 4095000,
        compromisoNovDic: 3744000,
        compromisoSynApaVit: 1980000,
        compromisoJulAgoApp: 326700,
        compromisoSepOctApp: 346500,
        compromisoNovDicApp: 316800
      },
      {
        nombre: 'NARUCO',
        claves: ['LC625', 'LC626', 'LC627'],
        nombreIntegral: 'Integral 3',
        nivel: 'Partner Elite',
        compraMinimaAnual: 5700000,
        compraMinimaInicial: 3590000,
        compromisoScott: 4950000,
        compromisoJulAgo: 1064250,
        compromisoSepOct: 1128600,
        compromisoNovDic: 1029600,
        compromisoSynApaVit: 750000,
        compromisoJulAgoApp: 123750,
        compromisoSepOctApp: 260750,
        compromisoNovDicApp: 238400
      }
    ];

    // 1. Procesar TODOS los clientes individualmente (respetando sus claves únicas)
    const todosClientesProcesados = clientes.map(cliente => {
      // Verificar si el cliente es parte de un grupo integral
      const grupoIntegral = gruposIntegrales.find(grupo =>
        grupo.claves.includes(cliente.clave)
      );

      // CALCULAR ACUMULADOS INDIVIDUALES usando el método corregido
      const resultados = this.calcularAcumulados(cliente, this.facturas);

      const clienteConValores: ClienteConAcumulado = {
        ...cliente,
        // VALORES CALCULADOS INDIVIDUALMENTE (cada cliente con SUS propias facturas)
        acumulado_anticipado: resultados.acumulado,
        avance_global_scott: resultados.scott,
        avance_jul_ago: resultados.avance_jul_ago,
        avance_sep_oct: resultados.avance_sep_oct,
        avance_nov_dic: resultados.avance_nov_dic,
        avance_jul_ago_app: resultados.avance_jul_ago_app,
        avance_sep_oct_app: resultados.avance_sep_oct_app,
        avance_nov_dic_app: resultados.avance_nov_dic_app,
        acumulado_syncros: resultados.acumulado_syncros,
        acumulado_apparel: resultados.acumulado_apparel,
        acumulado_vittoria: resultados.acumulado_vittoria,
        acumulado_bold: resultados.acumulado_bold,
        avance_global: resultados.avance_global,
        avance_global_apparel_syncros_vittoria: resultados.avance_global_apparel_syncros_vittoria,

        // COMPROMISOS: Si es parte de integral, usar los del grupo, sino los individuales
        compra_minima_anual: grupoIntegral ? grupoIntegral.compraMinimaAnual : this.calcularCompraMinimaPorNivel(cliente.nivel),
        compra_minima_inicial: grupoIntegral ? grupoIntegral.compraMinimaInicial : this.calcularCompraMinimaInicial(cliente.nivel),
        compromiso_scott: grupoIntegral ? grupoIntegral.compromisoScott : this.calcularCompromisoScott(cliente.nivel),
        compromiso_jul_ago: grupoIntegral ? grupoIntegral.compromisoJulAgo : this.calcularCompromisoJulAgo(cliente.nivel, cliente.nombre_cliente),
        compromiso_sep_oct: grupoIntegral ? grupoIntegral.compromisoSepOct : this.calcularCompromisoSepOct(cliente.nivel, cliente.nombre_cliente),
        compromiso_nov_dic: grupoIntegral ? grupoIntegral.compromisoNovDic : this.calcularCompromisoNovDic(cliente.nivel, cliente.nombre_cliente),
        compromiso_apparel_syncros_vittoria: grupoIntegral ? grupoIntegral.compromisoSynApaVit : this.calcularCompromisoApparelSyncrosVittoria(cliente.nivel, cliente.nombre_cliente),
        compromiso_jul_ago_app: grupoIntegral ? grupoIntegral.compromisoJulAgoApp : this.calcularCompromisoJulAgoApp(cliente.nivel, cliente.nombre_cliente),
        compromiso_sep_oct_app: grupoIntegral ? grupoIntegral.compromisoSepOctApp : this.calcularCompromisoSepOctApp(cliente.nivel, cliente.nombre_cliente),
        compromiso_nov_dic_app: grupoIntegral ? grupoIntegral.compromisoNovDicApp : this.calcularCompromisoNovDicApp(cliente.nivel, cliente.nombre_cliente),

        fecha_inicio_calculo: cliente.f_inicio ? new Date(cliente.f_inicio).toISOString().split('T')[0] : this.obtenerFechaInicio(cliente).toISOString().split('T')[0],
        esParteDeIntegral: !!grupoIntegral,
        grupoIntegral: grupoIntegral ? gruposIntegrales.indexOf(grupoIntegral) + 1 : undefined
      };

      // Caso especial para CHRISTIAN BOCCALETTI
      if (cliente.nombre_cliente.toUpperCase() === 'CHRISTIAN BOCCALETTI') {
        clienteConValores.compra_minima_anual = 3800000;
        clienteConValores.compra_minima_inicial = 2395000;
        clienteConValores.compromiso_scott = 3300000;
        clienteConValores.compromiso_jul_ago = 707850;
        clienteConValores.compromiso_sep_oct = 750750;
        clienteConValores.compromiso_nov_dic = 686400;
        clienteConValores.compromiso_apparel_syncros_vittoria = 500000;
        clienteConValores.compromiso_jul_ago_app = 82500;
        clienteConValores.compromiso_sep_oct_app = 87500;
        clienteConValores.compromiso_nov_dic_app = 80000;
      }

      return clienteConValores;
    });

    // 2. Crear registros de INTEGRALES CONSOLIDADOS (sumando los valores individuales)
    this.integralesOriginal = gruposIntegrales.map((grupo, index) => {
      // Obtener SOLO los clientes que pertenecen a este grupo integral
      const clientesGrupo = todosClientesProcesados.filter(cliente =>
        grupo.claves.includes(cliente.clave)
      );

      // SUMAR los valores que fueron calculados individualmente para cada cliente
      const sumaAcumulado = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_anticipado || 0), 0);
      const sumaScott = clientesGrupo.reduce((sum, c) => sum + (c.avance_global_scott || 0), 0);
      const sumaJulAgo = clientesGrupo.reduce((sum, c) => sum + (c.avance_jul_ago || 0), 0);
      const sumaSepOct = clientesGrupo.reduce((sum, c) => sum + (c.avance_sep_oct || 0), 0);
      const sumaNovDic = clientesGrupo.reduce((sum, c) => sum + (c.avance_nov_dic || 0), 0);
      const sumaJulAgoApp = clientesGrupo.reduce((sum, c) => sum + (c.avance_jul_ago_app || 0), 0);
      const sumaSepOctApp = clientesGrupo.reduce((sum, c) => sum + (c.avance_sep_oct_app || 0), 0);
      const sumaNovDicApp = clientesGrupo.reduce((sum, c) => sum + (c.avance_nov_dic_app || 0), 0);
      const acumuladoSyncros = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_syncros || 0), 0);
      const acumuladoApparel = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_apparel || 0), 0);
      const acumuladoVittoria = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_vittoria || 0), 0);
      const acumuladoBold = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_bold || 0), 0);

      const avanceGlobal = sumaScott + acumuladoSyncros + acumuladoApparel + acumuladoVittoria + acumuladoBold;
      const avanceGlobalApparel = acumuladoSyncros + acumuladoApparel + acumuladoVittoria + acumuladoBold;

      return {
        clave: grupo.nombreIntegral,
        zona: clientesGrupo[0]?.zona || '',
        evac: clientesGrupo[0]?.evac,
        nombre_cliente: grupo.nombre,
        nivel: grupo.nivel,
        acumulado_anticipado: sumaAcumulado,
        avance_global_scott: sumaScott,
        compra_minima_anual: grupo.compraMinimaAnual,
        compra_minima_inicial: grupo.compraMinimaInicial,
        compromiso_scott: grupo.compromisoScott,
        compromiso_jul_ago: grupo.compromisoJulAgo,
        compromiso_sep_oct: grupo.compromisoSepOct,
        compromiso_nov_dic: grupo.compromisoNovDic,
        compromiso_apparel_syncros_vittoria: grupo.compromisoSynApaVit,
        compromiso_jul_ago_app: grupo.compromisoJulAgoApp,
        compromiso_sep_oct_app: grupo.compromisoSepOctApp,
        compromiso_nov_dic_app: grupo.compromisoNovDicApp,
        esIntegral: true,
        esParteDeIntegral: false,
        avance_jul_ago: sumaJulAgo,
        avance_sep_oct: sumaSepOct,
        avance_nov_dic: sumaNovDic,
        avance_jul_ago_app: sumaJulAgoApp,
        avance_sep_oct_app: sumaSepOctApp,
        avance_nov_dic_app: sumaNovDicApp,
        acumulado_syncros: acumuladoSyncros,
        acumulado_apparel: acumuladoApparel,
        acumulado_vittoria: acumuladoVittoria,
        acumulado_bold: acumuladoBold,
        avance_global: avanceGlobal,
        avance_global_apparel_syncros_vittoria: avanceGlobalApparel,
        grupoIntegral: index + 1
      };
    });

    return todosClientesProcesados;
  }

  calcularAvanceGlobal(cliente: any): number {
    const avanceGlobal = (cliente.avance_global_scott || 0) +
      (cliente.avance_global_apparel_syncros_vittoria || 0);
    return avanceGlobal;
  }

  calcularCompraMinimaPorNivel(nivel: string): number {
    switch (nivel) {
      case 'Partner Elite Plus':
        return 6660000;
      case 'Partner Elite':
        return 2530000;
      case 'Partner':
        return 1730000;
      case 'Distribuidor':
        return 410000;
      default:
        return 0;
    }
  }

  calcularCompraMinimaInicial(nivel: string): number {
    if (!nivel) return 0;

    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 4230000;
      case 'PARTNER ELITE':
        return 1595000;
      case 'PARTNER':
        return 1090000;
      case 'DISTRIBUIDOR':
        return 205000;
      default:
        return 0;
    }
  }

  calcularCompromisoScott(nivel: string): number {
    if (!nivel) return 0;

    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 6000000;
      case 'PARTNER ELITE':
        return 2200000;
      case 'PARTNER':
        return 1500000;
      case 'DISTRIBUIDOR':
        return 350000;
      default:
        return 0;
    }
  }

  calcularCompromisoJulAgo(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 1287000;
      case 'PARTNER ELITE':
        return 471900;
      case 'PARTNER':
        return 321750;
      case 'DISTRIBUIDOR':
        return 87500;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  calcularCompromisoSepOct(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 1365000;
      case 'PARTNER ELITE':
        return 500500;
      case 'PARTNER':
        return 341250;
      case 'DISTRIBUIDOR':
        return 87500;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  calcularCompromisoNovDic(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 1248000;
      case 'PARTNER ELITE':
        return 457600;
      case 'PARTNER':
        return 312000;
      case 'DISTRIBUIDOR':
        return 70000;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  calcularCompromisoApparelSyncrosVittoria(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 660000;
      case 'PARTNER ELITE':
        return 330000;
      case 'PARTNER':
        return 230000;
      case 'DISTRIBUIDOR':
        return 60000;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  calcularCompromisoJulAgoApp(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 108900;
      case 'PARTNER ELITE':
        return 54450;
      case 'PARTNER':
        return 37950;
      case 'DISTRIBUIDOR':
        return 15000;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  private calcularCompromisoSepOctApp(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 115500;
      case 'PARTNER ELITE':
        return 57750;
      case 'PARTNER':
        return 40250;
      case 'DISTRIBUIDOR':
        return 15000;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  private calcularCompromisoNovDicApp(nivel: string, nombreCliente: string): number {
    switch (nivel.toUpperCase()) {
      case 'PARTNER ELITE PLUS':
        return 105600;
      case 'PARTNER ELITE':
        return 52800;
      case 'PARTNER':
        return 36800;
      case 'DISTRIBUIDOR':
        return 0;
      case 'INTEGRAL': // Este caso se maneja en los grupos integrales
        return 0;
      default:
        return 0;
    }
  }

  private calcularAcumulados(cliente: Cliente, facturas: FacturaOdoo[]): {
    acumulado: number, scott: number, avance_jul_ago: number,
    avance_sep_oct: number, avance_nov_dic: number, avance_jul_ago_app: number,
    avance_sep_oct_app: number, avance_nov_dic_app: number,
    acumulado_syncros: number, acumulado_apparel: number, acumulado_vittoria: number,
    acumulado_bold: number, avance_global_apparel_syncros_vittoria: number, avance_global: number
  } {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = cliente.f_fin ? new Date(cliente.f_fin) : new Date('2026-06-30');

    // DEBUG: Solo para el cliente específico LD648
    const esClienteDebug = clave === 'LD648' && nombreCliente.includes('FRANCISCO DAVID FRAGOSO DEL RIO');

    // FILTRADO SEGURO: Primero por clave, si no hay resultados entonces por nombre
    let facturasCliente = facturas.filter(factura => {
      // PRIMERA PRIORIDAD: buscar por CLAVE EXACTA
      const coincidePorClave =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      return coincidePorClave && fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
    });

    // FALLBACK: Solo si no hay facturas por clave, buscar por nombre
    if (facturasCliente.length === 0) {
      facturasCliente = facturas.filter(factura => {
        const nombreFactura = factura.contacto_nombre?.toUpperCase() || '';
        const coincidePorNombre = nombreFactura === nombreCliente ||
          (nombreCliente.length > 10 && nombreFactura.includes(nombreCliente)) ||
          (nombreFactura.length > 10 && nombreCliente.includes(nombreFactura));

        const fechaFactura = new Date(factura.fecha_factura);
        return coincidePorNombre && fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
      });
    }

    // FACTURAS SCOTT - VALIDACIÓN SIMPLIFICADA
    let facturasScott = facturas.filter(factura => {
      // PRIMERA PRIORIDAD: por clave exacta
      const coincidePorClave =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Validación simplificada para productos Scott
      const esMarcaScott = factura.marca === 'SCOTT';
      const esApparelNo = factura.apparel === 'NO';

      // Solo validar que no sea apparel, no restringir por categoría o nombre
      const esProductoValido = esMarcaScott && esApparelNo;

      const fechaFactura = new Date(factura.fecha_factura);
      const fechaValida = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      return coincidePorClave && esProductoValido && fechaValida;
    });

    // FALLBACK para Scott: Solo si no hay facturas por clave, buscar por nombre
    if (facturasScott.length === 0) {
      facturasScott = facturas.filter(factura => {
        const nombreFactura = factura.contacto_nombre?.toUpperCase() || '';
        const coincidePorNombre = nombreFactura === nombreCliente ||
          (nombreCliente.length > 10 && nombreFactura.includes(nombreCliente)) ||
          (nombreFactura.length > 10 && nombreCliente.includes(nombreFactura));

        // Validación simplificada para productos Scott
        const esMarcaScott = factura.marca === 'SCOTT';
        const esApparelNo = factura.apparel === 'NO';

        // Solo validar que no sea apparel, no restringir por categoría o nombre
        const esProductoValido = esMarcaScott && esApparelNo;

        const fechaFactura = new Date(factura.fecha_factura);
        const fechaValida = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        return coincidePorNombre && esProductoValido && fechaValida;
      });
    }

    // Calcular los acumulados específicos usando los métodos existentes
    const avanceJulAgo = this.calcularAvanceJulAgo(cliente, facturas);
    const avanceSepOct = this.calcularAvanceSepOct(cliente, facturas);
    const avanceNovDic = this.calcularAvanceNovDic(cliente, facturas);
    const avanceJulAgoApp = this.calcularAvanceJulAgoApp(cliente, facturas);
    const avanceSepOctApp = this.calcularAvanceSepOctApp(cliente, facturas);
    const avanceNovDicApp = this.calcularAvanceNovDicApp(cliente, facturas);
    const acumuladoSyncros = this.calcularAcumuladoSyncros(cliente, facturas);
    const acumuladoApparel = this.calcularAcumuladoApparel(cliente, facturas);
    const acumuladoVittoria = this.calcularAcumuladoVittoria(cliente, facturas);
    const acumuladoBold = this.calcularAcumuladoBold(cliente, facturas);

    // Calcular totales usando las facturas filtradas correctamente
    const acumulado = facturasCliente.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
    const acumuladoScott = facturasScott.reduce((total, factura) => total + (+factura.venta_total || 0), 0);

    const avance_global_apparel_syncros_vittoria = (acumuladoSyncros || 0) +
      (acumuladoApparel || 0) +
      (acumuladoVittoria || 0);

    const avance_global = acumuladoScott + acumuladoSyncros + acumuladoApparel + acumuladoVittoria;

    return {
      acumulado: acumulado,
      scott: acumuladoScott,
      avance_jul_ago: avanceJulAgo,
      avance_sep_oct: avanceSepOct,
      avance_nov_dic: avanceNovDic,
      avance_jul_ago_app: avanceJulAgoApp,
      avance_sep_oct_app: avanceSepOctApp,
      avance_nov_dic_app: avanceNovDicApp,
      acumulado_syncros: acumuladoSyncros,
      acumulado_apparel: acumuladoApparel,
      acumulado_vittoria: acumuladoVittoria,
      acumulado_bold: acumuladoBold,
      avance_global_apparel_syncros_vittoria,
      avance_global
    };
  }

  private calcularAvanceJulAgo(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = new Date('2025-08-31');

    // Casos especiales que requieren lógica particular
    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES') ||
      nombreCliente.includes('JUAN MANUEL RUACHO RANGEL');

    let facturasValidas;

    if (esCasoEspecial) {
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave;

        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        }
        else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }
        else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esMarcaScott = factura.marca === 'SCOTT';
        const esApparelNo = factura.apparel === 'NO';

        const categoria = factura.categoria_producto?.toUpperCase() || '';
        const categoriaContieneScott = categoria.includes('SCOTT');
        const categoriaContieneApparel = categoria.includes('APPAREL');
        const esCategoriaValida = categoriaContieneScott && !categoriaContieneApparel;

        const esProductoValido = esMarcaScott && esApparelNo && esCategoriaValida;

        if (nombreCliente.includes('BROTHERS BIKE')) {
          return coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          return coincideClave && enRangoFechas && esProductoValido;
        } else {
          return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }
      });
    } else {
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto =
          factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esMarcaScott = factura.marca === 'SCOTT';
        const esApparelNo = factura.apparel === 'NO';

        const categoria = factura.categoria_producto?.toUpperCase() || '';
        const categoriaContieneScott = categoria.includes('SCOTT');
        const categoriaContieneApparel = categoria.includes('APPAREL');
        const esCategoriaValida = categoriaContieneScott && !categoriaContieneApparel;

        const esProductoValido = esMarcaScott && esApparelNo && esCategoriaValida;

        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      if (facturasValidas.length === 0) {
        const facturasPorNombre = facturas.filter(factura => {
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

          const esMarcaScott = factura.marca === 'SCOTT';
          const esApparelNo = factura.apparel === 'NO';

          const categoria = factura.categoria_producto?.toUpperCase() || '';
          const categoriaContieneScott = categoria.includes('SCOTT');
          const categoriaContieneApparel = categoria.includes('APPAREL');
          const esCategoriaValida = categoriaContieneScott && !categoriaContieneApparel;

          const esProductoValido = esMarcaScott && esApparelNo && esCategoriaValida;

          return coincideNombre && enRangoFechas && esProductoValido;
        });

        facturasValidas = facturasPorNombre;
      }
    }

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceSepOct(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = new Date('2025-09-01');
    const fechaFin = new Date('2025-10-31');

    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES') ||
      nombreCliente.includes('JUAN MANUEL RUACHO RANGEL');

    let facturasValidas;

    if (esCasoEspecial) {
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave;

        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        } else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        } else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = this.esFacturaProductoValido(factura);

        if (nombreCliente.includes('BROTHERS BIKE')) {
          return coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          return coincideClave && enRangoFechas && esProductoValido;
        } else {
          return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }
      });
    } else {
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto = factura.contacto_referencia === clave || factura.contacto_referencia === `${clave}-CA`;
        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = this.esFacturaProductoValido(factura);
        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      // Si la búsqueda por clave no tiene resultados, intentamos con el nombre del cliente
      if (facturasValidas.length === 0) {
        const facturasPorNombre = facturas.filter(factura => {
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }
          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = this.esFacturaProductoValido(factura);
          return coincideNombre && enRangoFechas && esProductoValido;
        });
        facturasValidas = facturasPorNombre;
      }
    }

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private esFacturaProductoValido(factura: FacturaOdoo): boolean {
    const esMarcaScott = factura.marca === 'SCOTT';
    const esApparelNo = factura.apparel === 'NO';
    const categoria = factura.categoria_producto?.toUpperCase() || '';
    const categoriaContieneScott = categoria.includes('SCOTT');
    const categoriaNoContieneApparel = !categoria.includes('APPAREL');
    const esCategoriaValida = categoriaContieneScott && categoriaNoContieneApparel;
    const nombreProducto = factura.nombre_producto?.toUpperCase() || '';
    const nombreProductoContieneScott = nombreProducto.includes('SCOTT');

    return esMarcaScott &&
      esApparelNo &&
      (esCategoriaValida || nombreProductoContieneScott);
  }

  private calcularAvanceNovDic(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = new Date('2025-11-01');
    const fechaFin = new Date('2025-12-31');

    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES') ||
      nombreCliente.includes('JUAN MANUEL RUACHO RANGEL');

    let facturasValidas;

    if (esCasoEspecial) {
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave;

        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        } else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        } else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = this.esFacturaProductoValido(factura);

        if (nombreCliente.includes('BROTHERS BIKE')) {
          return coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          return coincideClave && enRangoFechas && esProductoValido;
        } else {
          return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }
      });
    } else {
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto = factura.contacto_referencia === clave || factura.contacto_referencia === `${clave}-CA`;
        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = this.esFacturaProductoValido(factura);
        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      if (facturasValidas.length === 0) {
        const facturasPorNombre = facturas.filter(factura => {
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }
          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = this.esFacturaProductoValido(factura);
          return coincideNombre && enRangoFechas && esProductoValido;
        });
        facturasValidas = facturasPorNombre;
      }
    }

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceJulAgoApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = new Date('2025-08-31');

    // Casos especiales que requieren lógica particular
    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: lógica específica
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        }
        // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
        else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }
        // Para otros casos especiales
        else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esProductoValido =
          factura.marca === 'SYNCROS' ||
          factura.marca === 'VITTORIA' ||
          factura.apparel === 'SI';

        // Lógica especial para cada caso
        let esValida;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          esValida = coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          esValida = coincideClave && enRangoFechas && esProductoValido;
        } else {
          esValida = (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }

        return esValida;
      });
    } else {
      // Para casos normales: primero buscar por clave
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto =
          factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esProductoValido =
          factura.marca === 'SYNCROS' ||
          factura.marca === 'VITTORIA' ||
          factura.apparel === 'SI';

        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

          const esProductoValido =
            factura.marca === 'SYNCROS' ||
            factura.marca === 'VITTORIA' ||
            factura.apparel === 'SI';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAvanceSepOctApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = new Date('2025-09-01');
    const fechaFin = new Date('2025-10-31');

    // Casos especiales que requieren lógica particular
    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: lógica específica
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        }
        // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
        else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }
        // Para otros casos especiales
        else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esProductoValido =
          factura.marca === 'SYNCROS' ||
          factura.marca === 'VITTORIA' ||
          factura.apparel === 'SI';

        // Lógica especial para cada caso
        let esValida;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          esValida = coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          esValida = coincideClave && enRangoFechas && esProductoValido;
        } else {
          esValida = (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }

        return esValida;
      });
    } else {
      // Para casos normales: primero buscar por clave
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto =
          factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        const esProductoValido =
          factura.marca === 'SYNCROS' ||
          factura.marca === 'VITTORIA' ||
          factura.apparel === 'SI';

        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

          const esProductoValido =
            factura.marca === 'SYNCROS' ||
            factura.marca === 'VITTORIA' ||
            factura.apparel === 'SI';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAvanceNovDicApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = new Date('2025-11-01');
    const fechaFin = new Date('2025-12-31');

    // Casos especiales que requieren lógica particular
    const esCasoEspecial = nombreCliente.includes('BROTHERS BIKE') ||
      nombreCliente.includes('NARUCO') ||
      clave === 'KC612' ||
      clave === 'FD324' ||
      nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: lógica específica
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        }
        // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
        else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }
        // Para otros casos especiales
        else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        // Verificar criterios de producto
        const esProductoValido = factura.apparel === 'NO' &&
          (factura.marca === 'SCOTT' ||
            factura.categoria_producto?.includes('SCOTT') ||
            factura.nombre_producto?.includes('SCOTT'));

        // Lógica especial para cada caso
        let esValida;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          esValida = coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          esValida = coincideClave && enRangoFechas && esProductoValido;
        } else {
          esValida = (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }

        return esValida;
      });
    } else {
      // Para casos normales: primero buscar por clave
      facturasValidas = facturas.filter(factura => {
        const esClienteCorrecto =
          factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

        // Verificar criterios de producto
        const esProductoValido = factura.apparel === 'NO' &&
          (factura.marca === 'SCOTT' ||
            factura.categoria_producto?.includes('SCOTT') ||
            factura.nombre_producto?.includes('SCOTT'));

        return esClienteCorrecto && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

          // Verificar criterios de producto
          const esProductoValido = factura.apparel === 'NO' &&
            (factura.marca === 'SCOTT' ||
              factura.categoria_producto?.includes('SCOTT') ||
              factura.nombre_producto?.includes('SCOTT'));

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAcumuladoSyncros(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = cliente.f_fin ? new Date(cliente.f_fin) : new Date('2026-06-30');

    // Casos especiales que SIEMPRE permiten filtrado por nombre
    const esCasoEspecial = clave === 'LC657' || nombreCliente.includes('BROTHERS BIKE') ||
      clave === 'KC612' || nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      clave === 'FD324' || nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: usar filtrado combinado (clave O nombre)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre en las facturas
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        } else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'SYNCROS';

        return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
      });
    } else {
      // Para casos normales: filtrado seguro (clave primero, nombre como fallback)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'SYNCROS';

        return coincideClave && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Solo si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = factura.marca === 'SYNCROS';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return this.redondearDecimales(
      facturasValidas.reduce((total, factura) => total + (Number(factura.venta_total) || 0), 0)
    );
  }

  // Método genérico para redondear
  private redondearDecimales(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private calcularAcumuladoApparel(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = cliente.f_fin ? new Date(cliente.f_fin) : new Date('2026-06-30');

    const esCasoEspecial = clave === 'KA578' || nombreCliente.includes('BROTHERS BIKE') ||
      clave === 'KC612' || nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      clave === 'FD324' || nombreCliente.includes('JOSE ANGEL DIAZ CORTES') ||
      clave === 'LC625' || clave === 'LC626' || clave === 'LC627' || nombreCliente.includes('NARUCO');

    let facturasValidas;

    if (esCasoEspecial) {
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        }
        else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.apparel === 'SI';

        // Para BROTHERS BIKE: priorizar coincidencia por nombre
        // Para NARUCO con claves LC625/LC626/LC627, solo coincidencia por clave
        // Para otros casos especiales, coincidencia por clave O nombre
        let esValida;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          esValida = coincideNombre && enRangoFechas && esProductoValido;
        } else if (nombreCliente.includes('NARUCO') && ['LC625', 'LC626', 'LC627'].includes(clave)) {
          esValida = coincideClave && enRangoFechas && esProductoValido;
        } else {
          esValida = (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
        }

        return esValida;
      });
    } else {
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.apparel === 'SI';

        return coincideClave && enRangoFechas && esProductoValido;
      });

      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA BROTHERS BIKE: Buscar directamente por nombre en las facturas
          let coincideNombre = false;
          if (nombreCliente.includes('BROTHERS BIKE')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
          }
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          else if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = factura.apparel === 'SI';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return this.redondearDecimales(
      facturasValidas.reduce((total, factura) => total + (Number(factura.venta_total) || 0), 0)
    );
  }

  private calcularAcumuladoVittoria(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = cliente.f_fin ? new Date(cliente.f_fin) : new Date('2026-06-30');

    // Casos especiales que SIEMPRE permiten filtrado por nombre
    const esCasoEspecial = clave === 'LC657' || nombreCliente.includes('BROTHERS BIKE') ||
      clave === 'KC612' || nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      clave === 'FD324' || nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: usar filtrado combinado (clave O nombre)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre en las facturas
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        } else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'VITTORIA';

        return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
      });
    } else {
      // Para casos normales: filtrado seguro (clave primero, nombre como fallback)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'VITTORIA';

        return coincideClave && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Solo si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = factura.marca === 'VITTORIA';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return this.redondearDecimales(
      facturasValidas.reduce((total, factura) => total + (Number(factura.venta_total) || 0), 0)
    );
  }

  private calcularAcumuladoBold(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const nombreCliente = cliente.nombre_cliente?.toUpperCase() || '';
    const fechaInicio = cliente.f_inicio ? new Date(cliente.f_inicio) : new Date('2025-07-01');
    const fechaFin = cliente.f_fin ? new Date(cliente.f_fin) : new Date('2026-06-30');

    // Casos especiales que SIEMPRE permiten filtrado por nombre
    const esCasoEspecial = clave === 'LC657' || nombreCliente.includes('BROTHERS BIKE') ||
      clave === 'KC612' || nombreCliente.includes('MANUEL ALEJANDRO NAVARRO GONZALEZ') ||
      clave === 'FD324' || nombreCliente.includes('JOSE ANGEL DIAZ CORTES');

    let facturasValidas;

    if (esCasoEspecial) {
      // Para casos especiales: usar filtrado combinado (clave O nombre)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        // PARA BROTHERS BIKE: Buscar directamente por nombre en las facturas
        let coincideNombre = false;
        if (nombreCliente.includes('BROTHERS BIKE')) {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes('BROTHERS BIKE');
        } else {
          coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
            nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
        }

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'BOLD';

        return (coincideClave || coincideNombre) && enRangoFechas && esProductoValido;
      });
    } else {
      // Para casos normales: filtrado seguro (clave primero, nombre como fallback)
      facturasValidas = facturas.filter(factura => {
        const coincideClave = factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA`;

        const fechaFactura = new Date(factura.fecha_factura);
        const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
        const esProductoValido = factura.marca === 'BOLD';

        return coincideClave && enRangoFechas && esProductoValido;
      });

      // FALLBACK: Solo si no hay resultados por clave, buscar por nombre
      if (facturasValidas.length === 0) {
        facturasValidas = facturas.filter(factura => {
          // PARA NARUCO: Solo permitir coincidencia por nombre si la clave NO es LC625, LC626 o LC627
          let coincideNombre = false;
          if (nombreCliente.includes('NARUCO') && !['LC625', 'LC626', 'LC627'].includes(clave)) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          } else if (!nombreCliente.includes('NARUCO')) {
            coincideNombre = factura.contacto_nombre?.toUpperCase().includes(nombreCliente) ||
              nombreCliente.includes(factura.contacto_nombre?.toUpperCase() || '');
          }

          const fechaFactura = new Date(factura.fecha_factura);
          const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
          const esProductoValido = factura.marca === 'BOLD';

          return coincideNombre && enRangoFechas && esProductoValido;
        });
      }
    }

    return this.redondearDecimales(
      facturasValidas.reduce((total, factura) => total + (Number(factura.venta_total) || 0), 0)
    );
  }

  getValoresIntegral(nombreCliente: string): any {
    switch (nombreCliente.toUpperCase()) {
      case 'MARCO TULIO ANDRADE NAVARRO':
        return {
          compraMinimaAnual: 12200000,
          compraMinimaInicial: 6345000,
          compromisoScott: 9000000,
          compromisoJulAgo: 1930500,
          compromisoSepOct: 2047500,
          compromisoNovDic: 1872000,
          compromisoSynApaVit: 990000,
          compromisoJulAgoApp: 163350,
          compromisoSepOctApp: 173250,
          compromisoNovDicApp: 158400
        };

      case 'VICTOR HUGO VILLANUEVA GUZMAN':
        return {
          compraMinimaAnual: 19980000,
          compraMinimaInicial: 12690000,
          compromisoScott: 18000000,
          compromisoJulAgo: 3861000,
          compromisoSepOct: 4095000,
          compromisoNovDic: 3744000,
          compromisoSynApaVit: 1980000,
          compromisoJulAgoApp: 326700,
          compromisoSepOctApp: 346500,
          compromisoNovDicApp: 316800
        };

      case 'NARUCO':
        return {
          compraMinimaAnual: 5700000,
          compraMinimaInicial: 3590000,
          compromisoScott: 4950000,
          compromisoJulAgo: 1061775,
          compromisoSepOct: 2808000,
          compromisoNovDic: 2808000,
          compromisoSynApaVit: 750000,
          compromisoJulAgoApp: 123750,
          compromisoSepOctApp: 260750,
          compromisoNovDicApp: 238400
        };

      default:
        return null;
    }
  }

  calculoPorcentajeCompraAnual(integral: any): string {
    if (!integral || !integral.nombre_cliente) return '0%';

    const nombreCliente = integral.nombre_cliente.toUpperCase();
    const valores = this.getValoresIntegral(nombreCliente);

    if (!valores || !valores.compraMinimaAnual || valores.compraMinimaAnual <= 0) {
      return '0%';
    }

    const suma = (integral.avance_global_scott || 0) +
      (integral.acumulado_syncros || 0) +
      (integral.acumulado_apparel || 0) +
      (integral.acumulado_vittoria || 0);

    const porcentaje = (suma / valores.compraMinimaAnual) * 100;
    return Math.round(porcentaje) + '%';
  }

  calculoPorcentajeCompraInicial(integral: any): string {
    if (!integral || !integral.nombre_cliente) return '0%';

    const nombreCliente = integral.nombre_cliente.toUpperCase();
    const valores = this.getValoresIntegral(nombreCliente);

    if (!valores || !valores.compraMinimaInicial || valores.compraMinimaInicial <= 0) {
      return '0%';
    }

    const suma = (integral.avance_global_scott || 0) +
      (integral.acumulado_syncros || 0) +
      (integral.acumulado_apparel || 0) +
      (integral.acumulado_vittoria || 0);

    const porcentaje = (suma / valores.compraMinimaInicial) * 100;
    return Math.round(porcentaje) + '%';
  }

  calculoPorcentajeAvanceSynAppVit(integral: any): string {
    if (!integral || !integral.compromiso_apparel_syncros_vittoria || integral.compromiso_apparel_syncros_vittoria <= 0) {
      return '0%';
    }

    const suma = (integral.acumulado_syncros || 0) +
      (integral.acumulado_apparel || 0) +
      (integral.acumulado_vittoria || 0);

    const porcentaje = (suma / integral.compromiso_apparel_syncros_vittoria) * 100;
    return Math.round(porcentaje) + '%';
  }

  guardarDatosEnBackend() {
    this.cargando = true;

    const datosParaGuardar = [...this.clientesOriginal, ...this.integralesOriginal];

    const todosLosDatosConPorcentajes = datosParaGuardar.map(item => {
      return this.calcularPorcentajes(item);
    });

    this.previoService.actualizarPrevio(todosLosDatosConPorcentajes)
      .subscribe({
        next: (response) => {
          this.cargando = false;
          this.mensajeAlerta = 'Datos actualizados correctamente';
          this.tipoAlerta = 'exito';
        },
        error: (err) => {
          this.cargando = false;
          this.mensajeAlerta = 'Error al actualizar datos: ' + (err.error?.message || err.message || 'Error desconocido');
          this.tipoAlerta = 'error';
        }
      });
  }

  private calcularPorcentajes(cliente: any): any {
    // Calcular cada porcentaje basado en avance/compromiso
    const calcular = (avance: number, compromiso: number): number => {
      if (!compromiso || compromiso === 0) return 0;
      return Math.round((avance / compromiso) * 100);
    };

    return {
      ...cliente,
      porcentaje_anual: calcular(
        (cliente.avance_global_scott || 0) +
        (cliente.acumulado_syncros || 0) +
        (cliente.acumulado_apparel || 0) +
        (cliente.acumulado_vittoria || 0),
        cliente.compra_minima_anual || 1
      ),
      porcentaje_global: calcular(
        (cliente.avance_global_scott || 0) +
        (cliente.acumulado_syncros || 0) +
        (cliente.acumulado_apparel || 0) +
        (cliente.acumulado_vittoria || 0),
        cliente.compra_minima_inicial || 1
      ),
      porcentaje_scott: calcular(
        cliente.avance_global_scott || 0,
        cliente.compromiso_scott || 1
      ),
      porcentaje_jul_ago: calcular(
        cliente.avance_jul_ago || 0,
        cliente.compromiso_jul_ago || 1
      ),
      porcentaje_sep_oct: calcular(
        cliente.avance_sep_oct || 0,
        cliente.compromiso_sep_oct || 1
      ),
      porcentaje_nov_dic: calcular(
        cliente.avance_nov_dic || 0,
        cliente.compromiso_nov_dic || 1
      ),
      porcentaje_apparel_syncros_vittoria: calcular(
        (cliente.acumulado_syncros || 0) +
        (cliente.acumulado_apparel || 0) +
        (cliente.acumulado_vittoria || 0),
        cliente.compromiso_apparel_syncros_vittoria || 1
      ),
      porcentaje_jul_ago_app: calcular(
        cliente.avance_jul_ago_app || 0,
        cliente.compromiso_jul_ago_app || 1
      ),
      porcentaje_sep_oct_app: calcular(
        cliente.avance_sep_oct_app || 0,
        cliente.compromiso_sep_oct_app || 1
      ),
      porcentaje_nov_dic_app: calcular(
        cliente.avance_nov_dic_app || 0,
        cliente.compromiso_nov_dic_app || 1
      )
    };
  }

  exportarAExcel() {
    try {
      this.cargando = true;

      this.previoService.obtenerPrevio().subscribe({
        next: (datos) => {
          if (!datos || datos.length === 0) {
            this.mensajeAlerta = 'No hay datos para exportar';
            this.tipoAlerta = 'error';
            this.cargando = false;
            return;
          }

          // Función helper para formatear números con comas
          const formatearNumero = (valor: string | number): string => {
            const num = typeof valor === 'string' ? parseFloat(valor) : valor;
            return num.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          };

          // Función helper para formatear porcentajes
          const formatearPorcentaje = (valor: string | number): string => {
            const num = typeof valor === 'string' ? parseFloat(valor) : valor;
            return `${num}%`;
          };

          // Mapear los datos al formato deseado para Excel
          const datosParaExcel = datos.map(item => ({
            'Clave': item.clave || '',
            'EVAC': item.evac || '',
            'Cliente': item.nombre_cliente || '',
            'Acumulado Compra Anticipada': formatearNumero(item.acumulado_anticipado || 0),
            'Elección NIVEL': item.nivel || '',
            'Cumplimiento de compra minima inicial': this.verificarCumplimientoCompraInicial(item),
            'Compra Mínima ANUAL': formatearNumero(item.compra_minima_anual || 0),
            '% Compra Anual': formatearPorcentaje(item.porcentaje_anual || 0),
            'Compra Mínima INICIAL': formatearNumero(item.compra_minima_inicial || 0),
            'Avance GLOBAL': formatearNumero(item.avance_global || 0),
            '% Avance Global': formatearPorcentaje(item.porcentaje_global || 0),
            'Compromiso SCOTT': formatearNumero(item.compromiso_scott || 0),
            'Avance GLOBAL SCOTT': formatearNumero(item.avance_global_scott || 0),
            '% Scott': formatearPorcentaje(item.porcentaje_scott || 0),
            'Compromiso JUL-AGO': formatearNumero(item.compromiso_jul_ago || 0),
            'Avance Jul-Ago': formatearNumero(item.avance_jul_ago || 0),
            '% Jul-Ago': formatearPorcentaje(item.porcentaje_jul_ago || 0),
            'Compromiso SEPT-OCT': formatearNumero(item.compromiso_sep_oct || 0),
            'Avance Sep-Oct': formatearNumero(item.avance_sep_oct || 0),
            '% Sep-Oct': formatearPorcentaje(item.porcentaje_sep_oct || 0),
            'Compromiso NOV-DIC': formatearNumero(item.compromiso_nov_dic || 0),
            'Avance Nov-Dic': formatearNumero(item.avance_nov_dic || 0),
            '% Nov-Dic': formatearPorcentaje(item.porcentaje_nov_dic || 0),
            'Compromiso APPAREL, SYNCROS, VITTORIA': formatearNumero(item.compromiso_apparel_syncros_vittoria || 0),
            'Avance GLOBAL App/Syn/Vit': formatearNumero(item.avance_global_apparel_syncros_vittoria || 0),
            '% App/Syn/Vit': formatearPorcentaje(item.porcentaje_apparel_syncros_vittoria || 0),
            'Compromiso JUL-AGO App': formatearNumero(item.compromiso_jul_ago_app || 0),
            'Avance Jul-Ago App': formatearNumero(item.avance_jul_ago_app || 0),
            '% Jul-Ago App': formatearPorcentaje(item.porcentaje_jul_ago_app || 0),
            'Compromiso SEPT-OCT App': formatearNumero(item.compromiso_sep_oct_app || 0),
            'Avance Sep-Oct App': formatearNumero(item.avance_sep_oct_app || 0),
            '% Sep-Oct App': formatearPorcentaje(item.porcentaje_sep_oct_app || 0),
            'Compromiso NOV-DIC App': formatearNumero(item.compromiso_nov_dic_app || 0),
            'Avance Nov-Dic App': formatearNumero(item.avance_nov_dic_app || 0),
            '% Nov-Dic App': formatearPorcentaje(item.porcentaje_nov_dic_app || 0),
            'SYNCROS Acumulado': formatearNumero(item.acumulado_syncros || 0),
            'APPAREL Acumulado': formatearNumero(item.acumulado_apparel || 0),
            'VITTORIA Acumulado': formatearNumero(item.acumulado_vittoria || 0),
            'BOLD Acumulado': formatearNumero(item.acumulado_bold || 0)
          }));

          const ws = XLSX.utils.json_to_sheet(datosParaExcel);
          const wb = XLSX.utils.book_new();

          // ===> LÓGICA PARA CALCULAR ANCHOS DINÁMICOS <===
          const anchosDeColumna = Object.keys(datosParaExcel[0]).map(header => {
            const anchoMaximo = datosParaExcel.reduce((max, row) => {
              const valor = row[header as keyof typeof row];
              const longitud = String(valor).length;
              return Math.max(max, longitud);
            }, header.length); // Comienza con la longitud del encabezado
            return { wch: anchoMaximo + 2 }; // Añade un espacio extra
          });

          ws['!cols'] = anchosDeColumna;
          // ===> FIN DE LA LÓGICA DE ANCHOS DINÁMICOS <===

          XLSX.utils.book_append_sheet(wb, ws, 'Monitor Previo');

          const fecha = new Date();
          const fechaHora = fecha.getFullYear().toString() +
            ('0' + (fecha.getMonth() + 1)).slice(-2) +
            ('0' + fecha.getDate()).slice(-2);
          const nombreArchivo = `previo-${fechaHora}.xlsx`;

          XLSX.writeFile(wb, nombreArchivo);

          this.mensajeAlerta = `Datos exportados exitosamente`;
          this.tipoAlerta = 'exito';
          this.cargando = false;

        },
        error: (err) => {
          console.error('Error al obtener datos para exportar:', err);
          this.mensajeAlerta = 'Error al obtener los datos para exportar';
          this.tipoAlerta = 'error';
          this.cargando = false;
        }
      });

    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      this.mensajeAlerta = 'Error al exportar los datos a Excel';
      this.tipoAlerta = 'error';
      this.cargando = false;
    }
  }

  getPercentageValue(cliente: any, tipo: string): number {
    switch (tipo) {
      case 'anual':
        return ((cliente?.avance_global_scott || 0) +
          (cliente?.acumulado_syncros || 0) +
          (cliente?.acumulado_apparel || 0) +
          (cliente?.acumulado_vittoria || 0)) / (cliente?.compra_minima_anual || 1) * 100;
      case 'inicial':
        return ((cliente.avance_global_scott || 0) +
          (cliente.acumulado_syncros || 0) +
          (cliente.acumulado_apparel || 0) +
          (cliente.acumulado_vittoria || 0)) / (cliente.compra_minima_inicial || 1) * 100;
      case 'scott':
        return (cliente.avance_global_scott || 0) / (cliente.compromiso_scott || 1) * 100;
      case 'scott_jul_ago':
        return (cliente.avance_jul_ago || 0) / (cliente.compromiso_jul_ago || 1) * 100;
      case 'scott_sep_oct':
        return (cliente.avance_sep_oct || 0) / (cliente.compromiso_sep_oct || 1) * 100;
      case 'scott_nov_dic':
        return (cliente.avance_nov_dic || 0) / (cliente.compromiso_nov_dic || 1) * 100;
      case 'apparel_global':
        return ((cliente.acumulado_syncros || 0) +
          (cliente.acumulado_apparel || 0) +
          (cliente.acumulado_vittoria || 0)) / (cliente.compromiso_apparel_syncros_vittoria || 1) * 100;
      case 'apparel_jul_ago':
        return (cliente.avance_jul_ago_app || 0) / (cliente.compromiso_jul_ago_app || 1) * 100;
      case 'apparel_sep_oct':
        return (cliente.avance_sep_oct_app || 0) / (cliente.compromiso_sep_oct_app || 1) * 100;
      case 'apparel_nov_dic':
        return (cliente.avance_nov_dic_app || 0) / (cliente.compromiso_nov_dic_app || 1) * 100;
      default:
        return 0;
    }
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 100) return 'progress-excellent';
    if (percentage >= 80) return 'progress-very-good';
    if (percentage >= 60) return 'progress-good';
    if (percentage >= 40) return 'progress-warning';
    return 'progress-danger';
  }

  getTextClass(percentage: number): string {
    if (percentage >= 100) return 'text-excellent';
    if (percentage >= 80) return 'text-very-good';
    if (percentage >= 60) return 'text-good';
    if (percentage >= 40) return 'text-warning';
    return 'text-danger';
  }

  getStatusIcon(percentage: number): string {
    if (percentage >= 100) return 'fa-trophy status-icon';
    if (percentage >= 80) return 'fa-arrow-up status-icon';
    if (percentage >= 60) return 'fa-arrow-right status-icon';
    if (percentage >= 40) return 'fa-exclamation-triangle status-icon';
    return 'fa-exclamation-circle status-icon';
  }

  getTooltipText(cliente: any, tipo: string): string {
    const percentage = this.getPercentageValue(cliente, tipo);
    if (percentage >= 100) return 'Excelente cumplimiento';
    if (percentage >= 80) return 'Muy buen progreso';
    if (percentage >= 60) return 'Buen avance';
    if (percentage >= 40) return 'Requiere atención';
    return 'Crítico - necesita mejora';
  }

  mostrarTooltip(event: MouseEvent, cliente: any) {
    this.tooltipPosition = {
      x: event.clientX,
      y: event.clientY
    };

    // Si es un integral, buscar las fechas del cliente de referencia
    if (cliente.esIntegral) {
      let claveReferencia = '';

      if (cliente.nombre_cliente.includes('MARCO TULIO ANDRADE NAVARRO')) {
        claveReferencia = 'JC539';
      } else if (cliente.nombre_cliente.includes('VICTOR HUGO VILLANUEVA GUZMAN')) {
        claveReferencia = 'LC657';
      } else if (cliente.nombre_cliente.includes('NARUCO')) {
        claveReferencia = 'LC625';
      }

      // Buscar el cliente con la clave de referencia en tus datos originales
      const clienteReferencia = this.clientesOriginal.find(c => c.clave === claveReferencia);

      if (clienteReferencia) {
        // Crear una copia del cliente integral con las fechas del cliente de referencia
        this.clienteParaTooltip = {
          ...cliente,
          f_inicio: clienteReferencia.f_inicio,
          f_fin: clienteReferencia.f_fin
        };
      } else {
        this.clienteParaTooltip = cliente;
      }
    } else {
      this.clienteParaTooltip = cliente;
    }
  }

  ocultarTooltip() {
    this.clienteParaTooltip = null;
  }

  // Agrega esta función al inicio de tu clase component
  limpiarNumero(valor: any): number {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
    if (typeof valor === 'string') {
      // Remover todo excepto números y el primer punto decimal
      let cleaned = valor.replace(/[^\d.]/g, '');

      // Manejar múltiples puntos decimales
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        // Si hay múltiples puntos, tomar solo la parte entera y la primera decimal
        cleaned = parts[0] + '.' + parts[1];
      } else if (parts.length === 1) {
        // Si no hay punto, es un número entero
        cleaned = parts[0];
      }

      const numero = parseFloat(cleaned);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  calcularTotales(): void {
    // Resetear totales
    Object.keys(this.totales).forEach(key => {
      (this.totales as any)[key] = 0;
    });

    // Llamar a cada método de cálculo específico
    this.calcularTotalesAnticipado();
    this.calcularTotalesCompraMinimaAnual();
    this.calcularTotalesCompraMinimaInicial();
    this.calcularTotalesAvanceGlobal();
    this.calcularTotalCompromisoScott();
    this.calcularTotalesScott();
    this.calcularTotalCompromisoJulAgo();
    this.calcularTotalAvanceJulAgo();
    this.calcularTotalCompromisoSepOct();
    this.calcularTotalAvanceSepOct();
    this.calcularTotalCompromisoNovDic();
    this.calcularTotalAvanceNovDic();

    // Apparel

    this.calcularTotalCompromisoAppSynVittoria();
    this.calcularTotalGlobalAppSynVittoria();
    this.calcularTotalCompromisoJulAgoApp();
    this.calcularTotalAvanceJulAgoApp();
    this.calcularTotalCompromisoSepOctApp();
    this.calcularTotalAvanceSepOctApp();
    this.calcularTotalCompromisoNovDicApp();
    this.calcularTotalAvanceNovDicApp();

    this.calcularTotalSyncros();
    this.calcularTotalApparel();
    this.calcularTotalVittoria();
    this.calcularTotalBold();
  }

  // 1. Totales de anticipado - ejemplo: excluir integrales
  private calcularTotalesAnticipado(): void {
    // Excluir las claves individuales que forman parte de los integrales
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.acumulado_anticipado += cliente.acumulado_anticipado || 0;
    });
  }

  // 2. Totales de compra mínima - ejemplo: solo distribuidores
  private calcularTotalesCompraMinimaAnual(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    let sumaIntegrales = 0;
    let sumaClientesNormales = 0;

    clientesValidos.forEach(cliente => {
      const valor = cliente.compra_minima_anual || 0;

      if (['Integral 1', 'Integral 2', 'Integral 3'].includes(cliente.clave)) {
        sumaIntegrales += valor;
      } else {
        sumaClientesNormales += valor;
      }

      this.totales.compra_minima_anual += valor;
    });
  }

  private calcularTotalesCompraMinimaInicial(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    let sumaIntegrales = 0;
    let sumaClientesNormales = 0;

    clientesValidos.forEach(cliente => {
      const valor = cliente.compra_minima_inicial || 0;

      if (['Integral 1', 'Integral 2', 'Integral 3'].includes(cliente.clave)) {
        sumaIntegrales += valor;
      } else {
        sumaClientesNormales += valor;
      }

      this.totales.compra_minima_inicial += valor;
    });
  }

  private calcularTotalesAvanceGlobal(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    let sumaTotal = 0;
    clientesValidos.forEach(cliente => {
      const valorApparel = Number(cliente.avance_global_apparel_syncros_vittoria) || 0;
      const valorScott = Number(cliente.avance_global_scott) || 0;
      const sumaCliente = valorApparel + valorScott;

      sumaTotal += sumaCliente;
    });

    this.totales.avance_global = sumaTotal;
  }

  private calcularTotalCompromisoScott(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_scott += cliente.compromiso_scott || 0;
    });
  }

  private calcularTotalesScott(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_global_scott += cliente.avance_global_scott || 0;
    });
  }

  private calcularTotalCompromisoJulAgo(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_jul_ago += cliente.compromiso_jul_ago || 0;
    });
  }

  private calcularTotalAvanceJulAgo(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_jul_ago += cliente.avance_jul_ago || 0;
    });
  }

  // 6. Totales SEP-OCT
  private calcularTotalCompromisoSepOct(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_sep_oct += cliente.compromiso_sep_oct || 0;
    });
  }

  private calcularTotalAvanceSepOct(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_sep_oct += cliente.avance_sep_oct || 0;
    });
  }

  private calcularTotalCompromisoNovDic(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_nov_dic += cliente.compromiso_nov_dic || 0;
    });
  }

  private calcularTotalAvanceNovDic(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_nov_dic += cliente.avance_nov_dic || 0;
    });
  }

  private calcularTotalCompromisoAppSynVittoria(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_apparel_syncros_vittoria += cliente.compromiso_apparel_syncros_vittoria || 0;
    });
  }

  private calcularTotalGlobalAppSynVittoria(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_global_apparel_syncros_vittoria += cliente.avance_global_apparel_syncros_vittoria || 0;
    });
  }

  private calcularTotalCompromisoJulAgoApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_jul_ago_app += cliente.compromiso_jul_ago_app || 0;
    });
  }

  private calcularTotalAvanceJulAgoApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    const totalEvacA = clientesValidos
      .filter(cliente => cliente.evac === 'A')
      .reduce((total, cliente) => total + (cliente.avance_jul_ago_app || 0), 0);

    const totalEvacB = clientesValidos
      .filter(cliente => cliente.evac === 'B')
      .reduce((total, cliente) => total + (cliente.avance_jul_ago_app || 0), 0);

    const clavesIntegral = ['Integral 1', 'Integral 2', 'Integral 3'];
    const totalIntegral = clientesValidos
      .filter(cliente => clavesIntegral.includes(cliente.clave))
      .reduce((total, cliente) => total + (cliente.avance_jul_ago_app || 0), 0);

    const totalGeneral = clientesValidos
      .reduce((total, cliente) => total + (cliente.avance_jul_ago_app || 0), 0);

    clientesValidos.forEach(cliente => {
      this.totales.avance_jul_ago_app += cliente.avance_jul_ago_app || 0;
    });
  }

  private calcularTotalCompromisoSepOctApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_sep_oct_app += cliente.compromiso_sep_oct_app || 0;
    });
  }

  private calcularTotalAvanceSepOctApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_sep_oct_app += cliente.avance_sep_oct_app || 0;
    });
  }

  private calcularTotalCompromisoNovDicApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.compromiso_nov_dic_app += cliente.compromiso_nov_dic_app || 0;
    });
  }

  private calcularTotalAvanceNovDicApp(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.avance_nov_dic_app += cliente.avance_nov_dic_app || 0;
    });
  }

  private calcularTotalSyncros(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.acumulado_syncros += cliente.acumulado_syncros || 0;
    });
  }

  private calcularTotalApparel(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.acumulado_apparel += cliente.acumulado_apparel || 0;
    });
  }

  private calcularTotalVittoria(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.acumulado_vittoria += cliente.acumulado_vittoria || 0;
    });
  }

  private calcularTotalBold(): void {
    const clavesExcluidas = ['JC539', 'EC216', 'LC657', 'GC411', 'MC679', 'MC677', 'LC625', 'LC626', 'LC627'];

    const clientesValidos = this.clientesFiltrados.filter(cliente =>
      !clavesExcluidas.includes(cliente.clave)
    );

    clientesValidos.forEach(cliente => {
      this.totales.acumulado_bold += cliente.acumulado_bold || 0;
    });
  }

  limpiarValorNumerico(valor: any): number {
    if (typeof valor === 'number') {
      return valor;
    }

    if (typeof valor === 'string') {
      // Remover caracteres no numéricos excepto puntos y guiones
      let valorLimpio = valor.replace(/[^\d.-]/g, '');

      // Si hay múltiples puntos, mantener solo el primero
      const puntos = valorLimpio.split('.').length - 1;
      if (puntos > 1) {
        const partes = valorLimpio.split('.');
        valorLimpio = partes[0] + '.' + partes.slice(1).join('');
      }

      const numero = parseFloat(valorLimpio);
      return isNaN(numero) ? 0 : numero;
    }

    return 0;
  }

  verificarCumplimientoCompraInicial(cliente: ClienteConAcumulado): string {
    // 1. Obtener los valores de forma segura, convirtiendo a número y estableciendo 0 si no son válidos
    const avanceGlobal = this.limpiarNumero(cliente.avance_global);
    const compraMinima = this.limpiarNumero(cliente.compra_minima_inicial);

    // 2. Realizar la comparación estricta
    if (avanceGlobal >= compraMinima && compraMinima > 0) {
      return 'SI';
    }

    return 'NO';
  }
}
