import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaratulasService } from '../../../services/caratulas.service';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FiltroComponent } from '../../../components/filtro/filtro.component';

interface Cliente {
  nombre_cliente: string;
  nivel: string;
  compra_minima_anual: number;
  acumulado_anticipado: number;
  avance_proyectado?: number;
}

@Component({
  selector: 'app-caratula-evac-b',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeBarComponent, FiltroComponent],
  templateUrl: './caratula-evac-b.component.html',
  styleUrl: './caratula-evac-b.component.css'
})
export class CaratulaEvacBComponent implements OnInit {
  @Output() onInit = new EventEmitter<void>();

  meta = ''
  clientes: any[] = [];
  loading = false;
  error: string | null = null;

  my25_monto1 = 0;
  my25_monto2 = 0;
  my25_monto3 = 0;
  my25_monto4 = 0;
  avance_proyectado_monto1 = 0;
  avance_proyectado_monto2 = 0;

  montoCompromisoApparel = 0;
  montoCompromisoScott = 0;

  avanceGlobalScott = 0;
  avanceGlobaApparel = 0;

  avance_proyectado_scott = 0;
  avance_proyectado_apparel = 0;

  facturas: any[] = [];

  acumuladoTotalCalculado: string = '$0.00';
  facturasLoaded: boolean = false;

  clientesFiltrados: any[] = [];

  filtroOpciones = {
    nombre_cliente: [] as any[],
    nivel: [] as any[]
  };

  filtrosAplicados = {
    nombre_cliente: [] as string[],
    nivel: [] as string[]
  };

  constructor(private caratulasService: CaratulasService,
    private router: Router,
    private monitorOdooService: MonitorOdooService) { }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarFacturas();
    this.calcularMontos();
    this.onInit.emit();
  }

  cargarFacturas(): void {
    this.monitorOdooService.getFacturas().subscribe({
      next: (facturas) => {
        this.facturas = facturas;
        this.facturasLoaded = true;
        this.acumuladoTotalCalculado = this.obtenerAcumuladoTotal();
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.facturasLoaded = true; // Asegurar que no quede en estado de carga
      }
    });
  }

  cargarClientes(): void {
    this.loading = true;
    this.error = null;

    this.caratulasService.getClientesEvacB().subscribe({
      next: (data) => {

        const ordenNiveles: { [key: string]: number } = {
          'Partner Elite Plus': 1,
          'Partner Elite': 2,
          'Partner': 3,
          'Distribuidor': 4
        };

        data.sort((a: Cliente, b: Cliente) => {
          const nivelA = ordenNiveles[a.nivel] || 99; // Si un nivel no existe, se va al final
          const nivelB = ordenNiveles[b.nivel] || 99;
          return nivelA - nivelB;
        });

        this.clientes = data;
        this.loading = false;

        this.prepararOpcionesFiltros();
        this.filtrarClientes();
        this.calcularMontos();
        this.actualizarDatosCaratula();
      },
      error: (error) => {
        this.error = 'Error al cargar los clientes';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  private prepararOpcionesFiltros(): void {
    const nombresUnicos = [...new Set(this.clientes.map(c => c.nombre_cliente))];
    this.filtroOpciones.nombre_cliente = nombresUnicos.map(nombre => ({ value: nombre, selected: false }));

    const nivelesUnicos = [...new Set(this.clientes.map(c => c.nivel))];
    this.filtroOpciones.nivel = nivelesUnicos.map(nivel => ({ value: nivel, selected: false }));
  }

  public aplicarFiltro(campo: 'nombre_cliente' | 'nivel', valores: string[]): void {
    this.filtrosAplicados[campo] = valores;
    this.filtrarClientes();
  }

  public limpiarFiltro(campo: 'nombre_cliente' | 'nivel'): void {
    this.filtrosAplicados[campo] = [];
    this.filtrarClientes();
  }

  public limpiarTodosFiltros(): void {
    this.filtrosAplicados.nombre_cliente = [];
    this.filtrosAplicados.nivel = [];
    this.filtrarClientes();
  }

  private filtrarClientes(): void {
    this.clientesFiltrados = this.clientes.filter(cliente => {
      const cumpleFiltroNombre = this.filtrosAplicados.nombre_cliente.length === 0 ||
        this.filtrosAplicados.nombre_cliente.includes(cliente.nombre_cliente);

      const cumpleFiltroNivel = this.filtrosAplicados.nivel.length === 0 ||
        this.filtrosAplicados.nivel.includes(cliente.nivel);

      return cumpleFiltroNombre && cumpleFiltroNivel;
    });
  }


  actualizarDatosCaratula(): void {
    if (this.clientes.length === 0) {
      console.warn('No hay datos de clientes cargados');
      return;
    }

    this.loading = true;
    this.error = null;

    this.calcularMontos();

    // Calcular valores totales para EB
    const metaEB = this.clientes.reduce((sum, cliente) => sum + (cliente.compra_minima_anual || 0), 0);
    const acumuladoEB = this.clientes.reduce((sum, cliente) => sum + (cliente.acumulado_anticipado || 0), 0);
    const avanceProyectadoEB = this.clientes.reduce((sum, cliente) => {
      return sum + this.calcularAvanceProyectadoCliente(cliente.compra_minima_anual);
    }, 0);

    // Calcular porcentajes
    const porcentajeEB = this.calcularPorcentajeEB();
    const porcentajeMY25_1 = this.calcularPorcentajeMonto1();
    const porcentajeMY25_2 = this.calcularPorcentajeMonto2();
    const porcentajeScott = this.calcularPorcentajeScott();
    const porcentajeApparel = this.calcularPorcentajeApparel();

    // Preparar datos para enviar
    const datos = [
      {
        categoria: 'EB',
        meta: metaEB,
        acumulado_real: acumuladoEB,
        avance_proyectado: avanceProyectadoEB,
        porcentaje: parseFloat(porcentajeEB.replace('%', '')) || 0
      },
      {
        categoria: 'MY25',
        meta: this.my25_monto1,
        acumulado_real: this.my25_monto3,
        avance_proyectado: this.avance_proyectado_monto1,
        porcentaje: parseFloat(porcentajeMY25_1.replace('%', '')) || 0
      },
      {
        categoria: 'MY25_2',
        meta: this.my25_monto2,
        acumulado_real: this.my25_monto4,
        avance_proyectado: this.avance_proyectado_monto2,
        porcentaje: parseFloat(porcentajeMY25_2.replace('%', '')) || 0
      },
      {
        categoria: 'SCOTT',
        meta: this.montoCompromisoScott,
        acumulado_real: this.avanceGlobalScott,
        avance_proyectado: this.avance_proyectado_scott,
        porcentaje: parseFloat(porcentajeScott.replace('%', '')) || 0
      },
      {
        categoria: 'APPAREL',
        meta: this.montoCompromisoApparel,
        acumulado_real: this.avanceGlobaApparel,
        avance_proyectado: this.avance_proyectado_apparel,
        porcentaje: parseFloat(porcentajeApparel.replace('%', '')) || 0
      }
    ];

    this.caratulasService.actualizarCaratulaEvacB(datos).subscribe({
      next: (response) => {
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error al actualizar los datos: ' + (error.error?.error || error.message);
      }
    });
  }

  obtenerSemanaISO(fecha: Date = new Date()): number {
    const date = new Date(fecha.getTime());
    date.setHours(0, 0, 0, 0);

    // Jueves de la semana actual
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

    // Enero 4 siempre está en la semana 1
    const week1 = new Date(date.getFullYear(), 0, 4);

    // Calcular el número de semana
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  obtenerSemanasTranscurridas(): number {
    const semanaActual = this.obtenerSemanaISO();
    const semanaInicioTemporada = 26;

    if (semanaActual < semanaInicioTemporada) {
      return (52 - semanaInicioTemporada) + semanaActual;
    }

    return semanaActual - semanaInicioTemporada;
  }

  calcularAvanceProyectadoMonto1(): void {
    const semanaActual = this.obtenerSemanaISO();
    if (this.my25_monto1 === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    this.avance_proyectado_monto1 = (semanasTranscurridas / semanasEnTemporada) * this.my25_monto1;

    this.avance_proyectado_monto1 = Math.round(this.avance_proyectado_monto1 * 100) / 100;
  }

  calcularAvanceProyectadoMonto2(): void {
    if (this.my25_monto2 === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    this.avance_proyectado_monto2 = (semanasTranscurridas / semanasEnTemporada) * this.my25_monto2;

    this.avance_proyectado_monto2 = Math.round(this.avance_proyectado_monto2 * 100) / 100;
  }

  calcularAvanceProyectadoScott(): void {
    if (!this.montoCompromisoScott) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    // Avance proyectado BASADO ÚNICAMENTE EN EL COMPROMISO SCOTT
    this.avance_proyectado_scott = (semanasTranscurridas / semanasEnTemporada) * this.montoCompromisoScott;
    this.avance_proyectado_scott = Math.round(this.avance_proyectado_scott * 100) / 100;
  }

  calcularAvanceProyectadoApparel(): void {
    if (!this.montoCompromisoApparel) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    // Cálculo basado en el compromiso Apparel (igual que con Scott)
    this.avance_proyectado_apparel = (semanasTranscurridas / semanasEnTemporada) * this.montoCompromisoApparel;
    this.avance_proyectado_apparel = Math.round(this.avance_proyectado_apparel * 100) / 100;
  }

  calcularPorcentajeScott(): string {
    if (!this.avance_proyectado_scott || this.avance_proyectado_scott === 0) return "0%";

    const resultado = (this.avanceGlobalScott / this.avance_proyectado_scott) - 1;
    const porcentaje = Math.round(resultado * 100);  // Convierte a porcentaje (ej: 0.15 → 15%)

    return `${porcentaje}%`;
  }

  calcularPorcentajeApparel(): string {
    if (!this.avance_proyectado_apparel || this.avance_proyectado_apparel === 0) return "0%";

    const resultado = (this.avanceGlobaApparel / this.avance_proyectado_apparel) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  // Método para calcular el avance proyectado semanal por cliente
  calcularAvanceProyectadoCliente(compraMinimaAnual: number): number {
    if (!compraMinimaAnual) return 0;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    const avanceProyectado = (semanasTranscurridas / semanasEnTemporada) * compraMinimaAnual;
    return Math.round(avanceProyectado * 100) / 100;
  }

  calcularDiferencia(cliente: any): number {
    const avanceProyectado = this.calcularAvanceProyectadoCliente(cliente.compra_minima_anual);
    const acumuladoReal = cliente.acumulado_anticipado;

    // =SI(J30>H30, (J30-H30), 0)
    return avanceProyectado > acumuladoReal ? avanceProyectado - acumuladoReal : 0;
  }

  recargarClientes(): void {
    this.cargarClientes();
  }

  calcularMontos(): void {
    this.calcularMonto1();
    this.calcularMonto2();
    this.calcularMonto3();
    this.calcularMonto4();
    this.calcularAvanceProyectadoMonto1();
    this.calcularAvanceProyectadoMonto2();
    this.obtenerMetaTotal();
    this.obtenerAcumuladoTotal();
    this.calcularAvanceProyectadoTotal();
    this.calcularPorcentajeEB();

    this.calcularCompromisoApparel();
    this.calcularCompromisoScott();
    this.calcularAvanceGlobalScott();
    this.calcularAvanceGlobalApparel();

    this.calcularAvanceProyectadoScott();
    this.calcularAvanceProyectadoApparel();
    this.calcularPorcentajeScott();
    this.calcularPorcentajeApparel();
  }

  calcularCompromisoApparel(): void {
    this.montoCompromisoApparel = 0;

    // Lista de claves a excluir
    const clavesExcluidas = ['JC539', 'EC216', 'LC625', 'LC626', 'LC627'];

    this.clientes.forEach(cliente => {
      // Verificar si la clave del cliente NO está en la lista de excluidos
      if (!clavesExcluidas.includes(cliente.clave)) {
        const compromiso = cliente.compromiso_apparel_syncros_vittoria || 0;
        this.montoCompromisoApparel += compromiso;
      }
    });

    this.montoCompromisoApparel = Math.round(this.montoCompromisoApparel * 100) / 100;
  }

  calcularAvanceGlobalScott(): void {
    this.avanceGlobalScott = 0;
    const clavesExcluidas = ['JC539', 'EC216', 'LC625', 'LC626', 'LC627'];

    this.clientes.forEach(cliente => {
      if (!clavesExcluidas.includes(cliente.clave)) {
        const avance = cliente.avance_global_scott || 0;
        this.avanceGlobalScott += avance;
      }
    });

    // Redondear a 2 decimales
    this.avanceGlobalScott = Math.round(this.avanceGlobalScott * 100) / 100;
  }

  calcularAvanceGlobalApparel(): void {
    this.avanceGlobaApparel = 0;

    // Lista de claves a excluir (la misma que en el método anterior)
    const clavesExcluidas = ['JC539', 'EC216', 'LC625', 'LC626', 'LC627'];

    this.clientes.forEach(cliente => {
      // Solo sumar si la clave del cliente NO está en la lista de excluidos
      if (!clavesExcluidas.includes(cliente.clave)) {
        const avance = cliente.avance_global_apparel_syncros_vittoria || 0;
        this.avanceGlobaApparel += avance;
      }
    });

    // Redondear a 2 decimales
    this.avanceGlobaApparel = Math.round(this.avanceGlobaApparel * 100) / 100;
  }

  calcularCompromisoScott(): void {
    // Primero asegúrate que los otros montos están calculados
    this.calcularMonto1();
    this.calcularMonto2();
    this.calcularCompromisoApparel();

    // Realiza el cálculo una sola vez fuera del bucle
    this.montoCompromisoScott = (this.my25_monto1 + this.my25_monto2) - this.montoCompromisoApparel;

    // Redondear a 2 decimales
    this.montoCompromisoScott = Math.round(this.montoCompromisoScott * 100) / 100;
  }

  // Método para calcular monto1 (Partner, Partner Elite, Partner Elite Plus)
  calcularMonto1(): void {
    this.my25_monto1 = 0;
    const nivelesPermitidos = ['Partner', 'Partner Elite', 'Partner Elite Plus'];
    const clavesExcluidas = ['JC539', 'EC216', 'LC625', 'LC626', 'LC627'];

    this.clientes.forEach(cliente => {
      // Solo sumar si el cliente cumple con los niveles permitidos Y no está en la lista de excluidos
      if (nivelesPermitidos.includes(cliente.nivel) && !clavesExcluidas.includes(cliente.clave)) {
        const compraMinima = cliente.compra_minima_anual || 0;
        this.my25_monto1 += compraMinima;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto1 = Math.round(this.my25_monto1 * 100) / 100;
  }

  // Método para calcular monto2 (solo Distribuidor)
  calcularMonto2(): void {
    this.my25_monto2 = 0;

    this.clientes.forEach(cliente => {
      const compraMinima = cliente.compra_minima_anual || 0;

      if (cliente.nivel === 'Distribuidor') {
        this.my25_monto2 += compraMinima;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto2 = Math.round(this.my25_monto2 * 100) / 100;
  }

  calcularMonto3(): void {
    this.my25_monto3 = 0;
    const nivelesPermitidos = ['Partner', 'Partner Elite', 'Partner Elite Plus'];
    const clavesExcluidas = ['JC539', 'EC216', 'LC625', 'LC626', 'LC627'];

    this.clientes.forEach(cliente => {
      // Solo sumar si el nivel es permitido Y la clave no está excluida
      if (nivelesPermitidos.includes(cliente.nivel) && !clavesExcluidas.includes(cliente.clave)) {
        const compraAcumulado = cliente.acumulado_anticipado || 0;
        this.my25_monto3 += compraAcumulado;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto3 = Math.round(this.my25_monto3 * 100) / 100;
  }

  // Método para calcular monto2 (solo Distribuidor)
  calcularMonto4(): void {
    this.my25_monto4 = 0;

    this.clientes.forEach(cliente => {
      const compraAcumulado = cliente.acumulado_anticipado || 0;

      if (cliente.nivel === 'Distribuidor') {
        this.my25_monto4 += compraAcumulado;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto4 = Math.round(this.my25_monto4 * 100) / 100;
  }

  calcularAvanceProyectadoTotal(): void {
    const metaTotal = this.my25_monto1 + this.my25_monto2;

    if (metaTotal === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    // Calcular el avance proyectado total
    const avanceProyectadoTotal = (semanasTranscurridas / semanasEnTemporada) * metaTotal;

    // Redondear a 2 decimales
    const avanceProyectadoTotalRedondeado = Math.round(avanceProyectadoTotal * 100) / 100;

    // Ahora distribuir proporcionalmente entre monto1 y monto2
    if (metaTotal > 0) {
      const proporcionMonto1 = this.my25_monto1 / metaTotal;
      const proporcionMonto2 = this.my25_monto2 / metaTotal;

      this.avance_proyectado_monto1 = Math.round((avanceProyectadoTotalRedondeado * proporcionMonto1) * 100) / 100;
      this.avance_proyectado_monto2 = Math.round((avanceProyectadoTotalRedondeado * proporcionMonto2) * 100) / 100;
    }
  }

  obtenerAvanceProyectadoTotalFormateado(): string {
    const metaTotal = this.my25_monto1 + this.my25_monto2;

    if (metaTotal === 0) return this.formatearMoneda(0);

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    const avanceProyectadoTotal = (semanasTranscurridas / semanasEnTemporada) * metaTotal;
    const avanceProyectadoTotalRedondeado = Math.round(avanceProyectadoTotal * 100) / 100;

    return this.formatearMoneda(avanceProyectadoTotalRedondeado);
  }

  calcularPorcentajeEB(): string {
    const acumuladoStr = this.obtenerAcumuladoTotal();
    const proyectadoStr = this.obtenerAvanceProyectadoTotalFormateado();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = parseFloat(acumuladoStr.replace(/[$,]/g, ''));
    const proyectado = parseFloat(proyectadoStr.replace(/[$,]/g, ''));

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  calcularPorcentajeMonto1(): string {
    const acumuladoStr = this.calcularMonto1();
    const proyectadoStr = this.calcularMonto3();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = this.my25_monto3;
    const proyectado = this.avance_proyectado_monto1;

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  // Función para calcular porcentaje de monto2
  calcularPorcentajeMonto2(): string {
    const acumuladoStr = this.calcularMonto2();
    const proyectadoStr = this.calcularMonto4();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = this.my25_monto4;
    const proyectado = this.avance_proyectado_monto2;

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Función para obtener el día de la temporada (semana ISO - 26)
  obtenerDiaTemporada(): number {
    const semanaISO = this.obtenerSemanaISO();
    return semanaISO - 26;
  }

  calcularYFormatearAvanceProyectado(metaValor: number): string {
    if (metaValor === 0) return this.formatearMoneda(0);

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    const avanceProyectado = (semanasTranscurridas / semanasEnTemporada) * metaValor;
    const avanceProyectadoRedondeado = Math.round(avanceProyectado * 100) / 100;

    return this.formatearMoneda(avanceProyectadoRedondeado);
  }


  obtenerMetaTotal(): string {
    return this.formatearMoneda(this.my25_monto1 + this.my25_monto2);
  }

  obtenerAcumuladoTotal(): string {
    if (!this.facturasLoaded || this.facturas.length === 0) {
      return this.formatearMoneda(this.my25_monto3 + this.my25_monto4);
    }

    try {
      const facturasFiltradas = this.facturas.filter((factura: any) => {
        // Verificación más robusta de EVAC
        if (!factura.evac || factura.evac.toString().trim() !== 'B Multimarcas') {
          return false;
        }

        // Manejo seguro de fechas
        let fechaFactura: Date;
        try {
          fechaFactura = new Date(factura.fecha_factura);
          if (isNaN(fechaFactura.getTime())) {
            console.warn('Fecha inválida:', factura.fecha_factura);
            return false;
          }
        } catch (e) {
          console.warn('Error al parsear fecha:', factura.fecha_factura, e);
          return false;
        }

        const fechaInicio = new Date('2025-07-01T00:00:00');
        const fechaFin = new Date('2026-06-30T23:59:59');

        return fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
      });

      const sumaVentaTotal = facturasFiltradas.reduce((suma: number, factura: any) => {
        return suma + (parseFloat(factura.venta_total) || 0);
      }, 0);

      const total = this.my25_monto3 + this.my25_monto4 + sumaVentaTotal;
      return this.formatearMoneda(total);

    } catch (error) {
      console.error('Error al calcular acumulado:', error);
      return this.formatearMoneda(this.my25_monto3 + this.my25_monto4);
    }
  }

  formatearMoneda(valor: number): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }
}