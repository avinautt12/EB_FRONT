import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { ClientesService } from '../../../services/clientes.service';
import { PrevioService } from '../../../services/previo.service';

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
  fecha_inicio_calculo?: string;
}

@Component({
  selector: 'app-previo',
  standalone: true,
  imports: [HomeBarComponent, RouterModule, CommonModule, FormsModule],
  templateUrl: './previo.component.html',
  styleUrl: './previo.component.css'
})
export class PrevioComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesOriginal: ClienteConAcumulado[] = [];
  clientesFiltrados: ClienteConAcumulado[] = [];
  clientesPaginados: ClienteConAcumulado[] = [];

  facturas: FacturaOdoo[] = [];

  paginaActual = 1;
  paginaActualTemp = 1;
  itemsPorPagina = 100;
  totalPaginas = 0;
  cargando = true;

  filtros = {
    clave: '',
    zona: '',
    nombre_cliente: '',
    nivel: ''
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

  constructor(
    private clientesService: ClientesService,
    private previoService: PrevioService
  ) { }

  ngOnInit(): void {
    Promise.all([
      this.clientesService.getClientes().toPromise(),
      this.previoService.getFacturasCalculadas().toPromise()
    ]).then(([clientes, facturas]) => {
      this.facturas = facturas ?? [];

      // Primero mapear todos los clientes con sus acumulados
      const todosClientes = clientes.map((cliente: Cliente) => {
        const { acumulado, scott, avance_jul_ago, avance_sep_oct, avance_nov_dic } = this.calcularAcumulados(cliente, this.facturas);
        const fechaInicio = this.obtenerFechaInicio(cliente);

        return {
          ...cliente,
          acumulado_anticipado: acumulado,
          avance_global_scott: scott,
          avance_jul_ago: avance_jul_ago,
          avance_sep_oct: avance_sep_oct,
          avance_nov_dic: avance_nov_dic,
          fecha_inicio_calculo: fechaInicio.toISOString().split('T')[0]
        };
      });

      // Luego procesar los integrales
      this.clientesOriginal = this.procesarIntegrales(todosClientes);

      // Configurar filtros y paginación
      this.zonasUnicas = Array.from(new Set(this.clientesOriginal.map(c => c.zona ?? '').filter(Boolean)));
      this.nivelesUnicos = Array.from(new Set(this.clientesOriginal.map(c => c.nivel ?? '').filter(Boolean)));

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
    this.clientesFiltrados = this.clientesOriginal.filter(cliente => {
      const zonaValida = this.filtrosCheckbox.zonasSeleccionadas.size === 0 ||
        this.filtrosCheckbox.zonasSeleccionadas.has(cliente.zona);

      const nivelValido = this.filtrosCheckbox.nivelesSeleccionados.size === 0 ||
        this.filtrosCheckbox.nivelesSeleccionados.has(cliente.nivel);

      return cliente.clave?.toLowerCase().includes(this.filtros.clave.toLowerCase()) &&
        zonaValida &&
        cliente.nombre_cliente?.toLowerCase().includes(this.filtros.nombre_cliente.toLowerCase()) &&
        nivelValido &&
        cliente.nivel?.toLowerCase().includes(this.filtros.nivel.toLowerCase());
    });

    this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
    this.actualizarPaginado();
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

    // Procesar clientes normales
    const clientesProcesados = clientes.map(cliente => {
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

      const clienteConValores: ClienteConAcumulado = {
        ...cliente,
        acumulado_anticipado: acumuladoAnticipado,
        avance_global_scott: acumuladoScott, // Corregido: usar el acumulado, no el array
        compra_minima_anual: this.calcularCompraMinimaPorNivel(cliente.nivel),
        compra_minima_inicial: this.calcularCompraMinimaInicial(cliente.nivel),
        compromiso_scott: this.calcularCompromisoScott(cliente.nivel),
        compromiso_jul_ago: this.calcularCompromisoJulAgo(cliente.nivel, cliente.nombre_cliente),
        compromiso_sep_oct: this.calcularCompromisoSepOct(cliente.nivel, cliente.nombre_cliente),
        compromiso_nov_dic: this.calcularCompromisoNovDic(cliente.nivel, cliente.nombre_cliente),
        compromiso_apparel_syncros_vittoria: this.calcularCompromisoApparelSyncrosVittoria(cliente.nivel, cliente.nombre_cliente),
        compromiso_jul_ago_app: this.calcularCompromisoJulAgoApp(cliente.nivel, cliente.nombre_cliente),
        compromiso_sep_oct_app: this.calcularCompromisoSepOctApp(cliente.nivel, cliente.nombre_cliente),
        compromiso_nov_dic_app: this.calcularCompromisoNovDicApp(cliente.nivel, cliente.nombre_cliente),
        fecha_inicio_calculo: fechaInicio.toISOString().split('T')[0]
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

    // Procesar grupos integrales
    this.integrales = gruposIntegrales.map((grupo, index) => {
      const clientesGrupo = clientesProcesados.filter(cliente =>
        grupo.claves.includes(cliente.clave) ||
        cliente.nombre_cliente.includes(grupo.nombre)
      );

      const sumaAcumulado = clientesGrupo.reduce((sum, c) => sum + (c.acumulado_anticipado || 0), 0);
      const sumaScott = clientesGrupo.reduce((sum, c) => sum + (c.avance_global_scott || 0), 0);
      const sumaJulAgo = clientesGrupo.reduce((sum, c) => sum + (c.avance_jul_ago || 0), 0);
      const sumaSepOct = clientesGrupo.reduce((sum, c) => sum + (c.avance_sep_oct || 0), 0);
      const sumaNovDic = clientesGrupo.reduce((sum, c) => sum + (c.avance_nov_dic || 0), 0);

      return {
        clave: grupo.nombreIntegral,
        zona: clientesGrupo[0]?.zona || '',
        evac: clientesGrupo[0]?.evac,
        nombre_cliente: grupo.nombre,
        nivel: 'Integral',
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
        avance_jul_ago: sumaJulAgo,
        avance_sep_oct: sumaSepOct,
        avance_nov_dic: sumaNovDic,
        grupoIntegral: index + 1
      };
    });

    // Devolver ambos: clientes normales y grupos integrales
    return [...clientesProcesados, ...this.integrales];
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
    acumulado: number, scott: number, avance_jul_ago: number, avance_sep_oct: number, avance_nov_dic: number
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

    // Calcular totales
    const acumulado = facturasCliente.reduce((total, factura) => total + (+factura.venta_total || 0), 0);
    const acumuladoScott = facturasScott.reduce((total, factura) => total + (+factura.venta_total || 0), 0);

    return {
      acumulado,
      scott: acumuladoScott,
      avance_jul_ago: avanceJulAgo,
      avance_sep_oct: avanceSepOct,
      avance_nov_dic: avanceNovDic
    };
  }

  private calcularAvanceJulAgo(cliente: Cliente, facturas: FacturaOdoo[]): number {
    const clave = cliente.clave;
    const fechaInicio = new Date('2025-07-01');
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
      const esClienteCorrecto = factura.contacto_referencia === clave ||
        factura.contacto_referencia === `${clave}-CA` ||
        factura.contacto_nombre?.includes(cliente.nombre_cliente);

      const fechaFactura = new Date(factura.fecha_factura);
      const enRangoFechas = fechaFactura >= fechaInicio && fechaFactura <= fechaFin;

      const esProductoValido = factura.apparel !== 'SI' &&
        (factura.marca === 'SCOTT' ||
          factura.categoria_producto?.includes('SCOTT') ||
          factura.nombre_producto?.includes('SCOTT'));

      return esClienteCorrecto && enRangoFechas && esProductoValido;
    });

    return facturasValidas.reduce((total, factura) => total + (Number(factura.venta_total) || 0), 0);
  }
}
