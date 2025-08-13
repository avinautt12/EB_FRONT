import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { ClientesService } from '../../../services/clientes.service';
import { PrevioService } from '../../../services/previo.service';
import { FiltroPrevioComponent } from '../../../components/filtro-previo/filtro-previo.component';
import { AlertaService } from '../../../services/alerta.service';
import * as XLSX from 'xlsx';

interface Cliente {
  clave: string;
  zona: string;
  evac: string;
  nombre_cliente: string;
  nivel: string;
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
}

interface ClienteConAcumulado extends Cliente {
  acumulado_anticipado: number;
  avance_global_scott?: number;
  esIntegral?: boolean;
  grupoIntegral?: number;
  compra_minima_anual?: number;
  compra_minima_inicial?: number;
  compromiso_scott?: number;
  compromiso_jul_ago?: number;
  compromiso_sep_oct?: number;
  compromiso_nov_dic?: number;
  compromiso_apparel_syncros_vittoria?: number;
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
  fecha_inicio_calculo?: string;
  esParteDeIntegral?: boolean;
}

@Component({
  selector: 'app-previo',
  standalone: true,
  imports: [HomeBarComponent, RouterModule, CommonModule, FormsModule, FiltroPrevioComponent],
  templateUrl: './previo.component.html',
  styleUrl: './previo.component.css'
})
export class PrevioComponent implements OnInit {
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


  filtroAbierto: string | null = null;

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

  constructor(
    private clientesService: ClientesService,
    private previoService: PrevioService,
    private alertaService: AlertaService
  ) { }

  ngOnInit(): void {
    Promise.all([
      this.clientesService.getClientes().toPromise(),
      this.previoService.getFacturasCalculadas().toPromise()
    ]).then(([clientes, facturas]) => {
      this.facturas = facturas ?? [];

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
          //avance_global_1
        } = this.calcularAcumulados(cliente, this.facturas);
        const fechaInicio = this.obtenerFechaInicio(cliente);

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
    }).catch(error => {
      console.error('Error al cargar datos:', error);
      this.cargando = false;
    });
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    this.filtrarClientes();
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
  }

  limpiarFiltroEvac(): void {
    this.filtros.evac = [];
    this.opcionesEvac.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();
  }

  limpiarFiltroCliente(): void {
    this.filtros.cliente = [];
    this.opcionesCliente.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();
  }

  aplicarFiltroEleccionNivel(nivelesSeleccionados: string[]): void {
    this.filtros.nivel = nivelesSeleccionados;
    this.aplicarFiltros();
  }

  limpiarFiltroEleccionNivel(): void {
    this.filtros.nivel = [];
    this.opcionesEleccionNivel.forEach(opcion => opcion.selected = false);
    this.aplicarFiltros();
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

  private obtenerFechaInicio(cliente: Cliente): Date {
    const nombreUpper = cliente.nombre_cliente.toUpperCase();
    const claveUpper = cliente.clave.toUpperCase();

    // Buscar en los patrones definidos
    for (const grupo of this.fechasEspeciales) {
      const encontrado = grupo.patrones.some(patron =>
        nombreUpper.includes(patron.toUpperCase()) ||
        claveUpper.includes(patron.toUpperCase())
      );

      if (encontrado) {
        return new Date(grupo.fecha);
      }
    }

    // Fecha por defecto (1 de julio 2025)  
    return new Date('2025-07-01');
  }

  private procesarIntegrales(clientes: ClienteConAcumulado[]): ClienteConAcumulado[] {
    // Definir los grupos integrales con sus valores específicos
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
        compromisoJulAgo: 1061775,
        compromisoSepOct: 2808000,
        compromisoNovDic: 2808000,
        compromisoSynApaVit: 750000,
        compromisoJulAgoApp: 123750,
        compromisoSepOctApp: 260750,
        compromisoNovDicApp: 238400
      }
    ];

    // 1. Procesar TODOS los clientes (incluyendo los que son parte de integrales)
    const todosClientesProcesados = clientes.map(cliente => {
      const clave = cliente.clave;
      const fechaInicio = this.obtenerFechaInicio(cliente);
      const fechaFin = new Date('2026-06-30');

      // Filtrar facturas para el cliente (por clave o nombre)
      const facturasCliente = this.facturas.filter(factura => {
        const esClienteCorrecto =
          factura.contacto_referencia === clave ||
          factura.contacto_referencia === `${clave}-CA` ||
          factura.contacto_nombre.includes(cliente.nombre_cliente);

        const fechaFactura = new Date(factura.fecha_factura);

        return esClienteCorrecto &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      });

      // Filtrar facturas Scott (excluyendo apparel y que sean marca SCOTT)
      const facturasScott = facturasCliente.filter(factura =>
        factura.apparel === 'NO' &&
        (factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT') ||
          factura.marca === 'SCOTT')
      );

      const acumuladoAnticipado = facturasCliente.reduce((total, factura) => {
        return total + (+factura.venta_total || 0);
      }, 0);

      const acumuladoScott = facturasScott.reduce((total, factura) => {
        return total + (+factura.venta_total || 0);
      }, 0);

      // Verificar si el cliente es parte de un grupo integral
      const grupoIntegral = gruposIntegrales.find(grupo =>
        grupo.claves.includes(cliente.clave) ||
        cliente.nombre_cliente.includes(grupo.nombre)
      );

      const clienteConValores: ClienteConAcumulado = {
        ...cliente,
        acumulado_anticipado: acumuladoAnticipado,
        avance_global_scott: acumuladoScott,
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
        fecha_inicio_calculo: fechaInicio.toISOString().split('T')[0],
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

    const clientesIndividuales = todosClientesProcesados.filter(cliente => !cliente.esParteDeIntegral);

    // 2. Procesar los grupos integrales (para el concentrado)
    this.integralesOriginal = gruposIntegrales.map((grupo, index) => {
      const clientesGrupo = todosClientesProcesados.filter(cliente =>
        grupo.claves.includes(cliente.clave) ||
        cliente.nombre_cliente.includes(grupo.nombre)
      );

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
      const avance_global_1 = clientesGrupo.reduce((sum, c) => sum + (c.avance_global_1 || 0), 0);

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
        avance_global_1: avance_global_1,
        grupoIntegral: index + 1
      };
    })

    return todosClientesProcesados;
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
    acumulado_bold: number
  } {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente);
    const fechaFin = new Date('2026-06-30');

    // Filtrar facturas para el cliente dentro del rango de fechas
    const facturasCliente = facturas.filter(factura => {
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      return esClienteCorrecto && fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
    });

    // Filtrar facturas Scott (NO apparel y marca SCOTT)
    const facturasScott = facturasCliente.filter(factura =>
      factura.apparel === 'NO' &&
      (factura.categoria_producto?.includes('SCOTT') || factura.nombre_producto?.includes('SCOTT')) &&
      factura.marca === 'SCOTT'
    );

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

    // Calcular totales
    const acumulado = facturasCliente.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
    const acumuladoScott = facturasScott.reduce((total, factura) => total + (+factura.venta_total || 0), 0);

    return {
      acumulado,
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
      acumulado_bold: acumuladoBold
    };
  }

  private calcularAvanceJulAgo(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente);
    const fechaFin = new Date('2025-08-31');

    const facturasValidas = facturas.filter(factura => {
      // Verificar cliente
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Verificar fechas
      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      // Verificar criterios de producto
      const esProductoValido = factura.apparel === 'NO' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceSepOct(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = new Date('2025-09-01');
    const fechaFin = new Date('2025-10-31');

    const facturasValidas = facturas.filter(factura => {
      // Verificar cliente
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Verificar fechas
      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      // Verificar criterios de producto
      const esProductoValido = factura.apparel === 'NO' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceNovDic(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = new Date('2025-11-01');
    const fechaFin = new Date('2025-12-31');


    const facturasValidas = facturas.filter(factura => {
      // Verificar cliente
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Verificar fechas
      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      // Verificar criterios de producto
      const esProductoValido = factura.apparel === 'NO' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceJulAgoApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente); // <-- fecha de inicio real
    const fechaFin = new Date('2025-08-31');

    const facturasValidas = facturas.filter(factura => {
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

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAvanceSepOctApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = new Date('2025-09-01');
    const fechaFin = new Date('2025-10-31');

    const facturasValidas = facturas.filter(factura => {
      // Verificar cliente
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Verificar fechas
      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      // Verificar criterios de producto
      const esProductoValido = factura.apparel === 'NO' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAvanceNovDicApp(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = new Date('2025-11-01');
    const fechaFin = new Date('2025-12-31');

    const facturasValidas = facturas.filter(factura => {
      // Verificar cliente
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      // Verificar fechas
      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      // Verificar criterios de producto
      const esProductoValido = factura.apparel === 'NO' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
  }

  private calcularAcumuladoSyncros(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente); // <-- fecha de inicio real
    const fechaFin = new Date('2026-06-30');

    const facturasValidas = facturas.filter(factura => {
      const esClienteCorrecto =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      const esProductoValido =
        factura.marca === 'SYNCROS';

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAcumuladoApparel(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente); // <-- fecha de inicio real
    const fechaFin = new Date('2026-06-30');

    const facturasValidas = facturas.filter(factura => {
      const esClienteCorrecto =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      const esProductoValido =
        factura.apparel === 'SI';

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAcumuladoVittoria(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente); // <-- fecha de inicio real
    const fechaFin = new Date('2026-06-30');

    const facturasValidas = facturas.filter(factura => {
      const esClienteCorrecto =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      const esProductoValido =
        factura.marca === 'VITTORIA';

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
    );
  }

  private calcularAcumuladoBold(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = this.obtenerFechaInicio(cliente); // <-- fecha de inicio real
    const fechaFin = new Date('2026-06-30');

    const facturasValidas = facturas.filter(factura => {
      const esClienteCorrecto =
        factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA`;

      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      const esProductoValido =
        factura.marca === 'BOLD';

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce(
      (total, factura) => total + (Number(factura.venta_total) || 0),
      0
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

    const todosLosDatosConPorcentajes = datosParaGuardar.map(item =>
      this.calcularPorcentajes(item)
    );

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
      // Repetir para los demás periodos...
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

      // Llamar al endpoint que ya tiene todos los datos calculados
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

          // Mapear los datos al formato deseado para Excel usando el orden especificado
          const datosParaExcel = datos.map(item => ({
            'Clave': item.clave || '',
            'EVAC': item.evac || '',
            'Cliente': item.nombre_cliente || '',
            'Acumulado Compra Anticipada': formatearNumero(item.acumulado_anticipado || 0),
            'Elección NIVEL': item.nivel || '',
            'Nivel Cierre Compra Inicial': item.nivel_cierre_compra_inicial || '',
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

          // Crear el libro de trabajo
          const ws = XLSX.utils.json_to_sheet(datosParaExcel);
          const wb = XLSX.utils.book_new();

          // Configurar anchos de columna
          const columnWidths = [
            { wch: 12 }, // Clave
            { wch: 15 }, // EVAC
            { wch: 30 }, // Cliente
            { wch: 18 }, // Acumulado Compra Anticipada
            { wch: 20 }, // Elección NIVEL
            { wch: 20 }, // Nivel Cierre Compra Inicial
            { wch: 18 }, // Compra Mínima ANUAL
            { wch: 12 }, // % Compra Anual
            { wch: 18 }, // Compra Mínima INICIAL
            { wch: 15 }, // Avance GLOBAL
            { wch: 12 }, // % Avance Global
            { wch: 18 }, // Compromiso SCOTT
            { wch: 18 }, // Avance GLOBAL SCOTT
            { wch: 10 }, // % Scott
            { wch: 18 }, // Compromiso JUL-AGO
            { wch: 15 }, // Avance Jul-Ago
            { wch: 12 }, // % Jul-Ago
            { wch: 18 }, // Compromiso SEPT-OCT
            { wch: 15 }, // Avance Sep-Oct
            { wch: 12 }, // % Sep-Oct
            { wch: 18 }, // Compromiso NOV-DIC
            { wch: 15 }, // Avance Nov-Dic
            { wch: 12 }, // % Nov-Dic
            { wch: 25 }, // Compromiso APPAREL, SYNCROS, VITTORIA
            { wch: 18 }, // Avance GLOBAL App/Syn/Vit
            { wch: 12 }, // % App/Syn/Vit
            { wch: 18 }, // Compromiso JUL-AGO App
            { wch: 15 }, // Avance Jul-Ago App
            { wch: 12 }, // % Jul-Ago App
            { wch: 18 }, // Compromiso SEPT-OCT App
            { wch: 15 }, // Avance Sep-Oct App
            { wch: 12 }, // % Sep-Oct App
            { wch: 18 }, // Compromiso NOV-DIC App
            { wch: 15 }, // Avance Nov-Dic App
            { wch: 12 }, // % Nov-Dic App
            { wch: 18 }, // SYNCROS Acumulado
            { wch: 18 }, // APPAREL Acumulado
            { wch: 18 }, // VITTORIA Acumulado
            { wch: 15 }, // BOLD Acumulado
          ];

          ws['!cols'] = columnWidths;

          // Agregar la hoja al libro
          XLSX.utils.book_append_sheet(wb, ws, 'Monitor Previo');

          // Generar el nombre del archivo con fecha y hora
          const fecha = new Date();
          const fechaHora = fecha.getFullYear().toString() +
            ('0' + (fecha.getMonth() + 1)).slice(-2) +
            ('0' + fecha.getDate()).slice(-2);
          const nombreArchivo = `previo-${fechaHora}.xlsx`;

          // Guardar el archivo
          XLSX.writeFile(wb, nombreArchivo);

          // Mostrar mensaje de éxito
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
}
