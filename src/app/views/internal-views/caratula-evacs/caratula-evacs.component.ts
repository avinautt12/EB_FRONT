import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-caratula-evacs',
  imports: [CommonModule, RouterModule, HomeBarComponent, FormsModule],
  templateUrl: './caratula-evacs.component.html',
  styleUrl: './caratula-evacs.component.css'
})
export class CaratulaEvacsComponent implements OnInit {
  clientesA: any[] = [];
  clientesB: any[] = [];
  clientesGO: any[] = [];
  facturas: any[] = [];
  loading = true;
  loadingFacturas = false;

  // Fechas para el filtro
  fechaInicio: string = '';
  fechaFin: string = '';

  // Totales generales
  totalGeneral: number = 0;
  totalScott: number = 0;
  totalApparel: number = 0;
  totalVittoria: number = 0;
  totalSyncros: number = 0;
  totalBold: number = 0;

  constructor(
    private caratulasService: CaratulasService,
    private monitorOdooService: MonitorOdooService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.establecerFechasPorDefecto();
    this.cargarClientes();
  }

  establecerFechasPorDefecto(): void {
    const hoy = new Date();
    // Establecer el primer día del mes actual como fecha inicial
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.fechaInicio = this.formatearFecha(primerDiaMes);
    this.fechaFin = this.formatearFecha(hoy);
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = ('0' + (fecha.getMonth() + 1)).slice(-2);
    const dia = ('0' + fecha.getDate()).slice(-2);
    return `${año}-${mes}-${dia}`;
  }

  cargarClientes(): void {
    this.loading = true;
    
    // Cargar clientes de EVAC A
    this.caratulasService.getClientesEvacA().subscribe({
      next: (data) => {
        this.clientesA = data.filter((cliente: any) => 
          !cliente.clave.includes('Integral')
        ).map((cliente: any) => this.inicializarTotalesCliente(cliente));
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('Error al cargar clientes EVAC A:', error);
        this.verificarCargaCompleta();
      }
    });

    // Cargar clientes de EVAC B
    this.caratulasService.getClientesEvacB().subscribe({
      next: (data) => {
        this.clientesB = data.filter((cliente: any) => 
          !cliente.clave.includes('Integral')
        ).map((cliente: any) => this.inicializarTotalesCliente(cliente));
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('Error al cargar clientes EVAC B:', error);
        this.verificarCargaCompleta();
      }
    });

    // Cargar clientes de EVAC GO
    this.caratulasService.getClientesEvacGO().subscribe({
      next: (data) => {
        this.clientesGO = data.filter((cliente: any) => 
          !cliente.clave.includes('Integral')
        ).map((cliente: any) => this.inicializarTotalesCliente(cliente));
        this.verificarCargaCompleta();
      },
      error: (error) => {
        console.error('Error al cargar clientes EVAC GO:', error);
        this.verificarCargaCompleta();
      }
    });
  }

  inicializarTotalesCliente(cliente: any): any {
    return {
      ...cliente,
      totalGeneral: 0,
      totalScott: 0,
      totalApparel: 0,
      totalVittoria: 0,
      totalSyncros: 0,
      totalBold: 0
    };
  }

  verificarCargaCompleta(): void {
    if (this.clientesA.length >= 0 && this.clientesB.length >= 0 && this.clientesGO.length >= 0) {
      this.loading = false;
      this.cargarFacturas();
    }
  }

  cargarFacturas(): void {
    this.loadingFacturas = true;
    this.monitorOdooService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        this.procesarFacturas();
        this.loadingFacturas = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.loadingFacturas = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.procesarFacturas();
  }

  procesarFacturas(): void {
    // Reiniciar totales
    this.totalGeneral = 0;
    this.totalScott = 0;
    this.totalApparel = 0;
    this.totalVittoria = 0;
    this.totalSyncros = 0;
    this.totalBold = 0;

    // Reiniciar totales de clientes
    this.reiniciarTotalesClientes();

    // Filtrar facturas por fecha
    const facturasFiltradas = this.filtrarFacturasPorFecha();

    // Procesar clientes de cada EVAC
    this.procesarClientesConFacturas(this.clientesA, facturasFiltradas);
    this.procesarClientesConFacturas(this.clientesB, facturasFiltradas);
    this.procesarClientesConFacturas(this.clientesGO, facturasFiltradas);

    // Calcular totales generales
    this.calcularTotalesGenerales(facturasFiltradas);
  }

  reiniciarTotalesClientes(): void {
    this.clientesA.forEach(cliente => {
      cliente.totalGeneral = 0;
      cliente.totalScott = 0;
      cliente.totalApparel = 0;
      cliente.totalVittoria = 0;
      cliente.totalSyncros = 0;
      cliente.totalBold = 0;
    });

    this.clientesB.forEach(cliente => {
      cliente.totalGeneral = 0;
      cliente.totalScott = 0;
      cliente.totalApparel = 0;
      cliente.totalVittoria = 0;
      cliente.totalSyncros = 0;
      cliente.totalBold = 0;
    });

    this.clientesGO.forEach(cliente => {
      cliente.totalGeneral = 0;
      cliente.totalScott = 0;
      cliente.totalApparel = 0;
      cliente.totalVittoria = 0;
      cliente.totalSyncros = 0;
      cliente.totalBold = 0;
    });
  }

  filtrarFacturasPorFecha(): any[] {
    if (!this.fechaInicio || !this.fechaFin) {
      return this.facturas;
    }

    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59, 999); // Hasta el final del día

    return this.facturas.filter(factura => {
      // Convertir la fecha de la factura a objeto Date
      const fechaFactura = new Date(factura.fecha_factura);
      return fechaFactura >= inicio && fechaFactura <= fin;
    });
  }

  procesarClientesConFacturas(clientes: any[], facturas: any[]): void {
    clientes.forEach(cliente => {
      // Buscar facturas por clave (prioridad) y luego por nombre
      const facturasCliente = facturas.filter(factura => {
        // Verificar si la clave coincide
        const claveCoincide = factura.contacto_referencia === cliente.clave;
        
        // Verificar si el nombre coincide (búsqueda parcial)
        const nombreCoincide = factura.contacto_nombre && 
                              cliente.nombre_cliente &&
                              factura.contacto_nombre.toLowerCase().includes(cliente.nombre_cliente.toLowerCase());
        
        return claveCoincide || nombreCoincide;
      });

      // Calcular totales para este cliente
      cliente.totalGeneral = this.calcularTotalGeneral(facturasCliente);
      cliente.totalScott = this.calcularTotalScott(facturasCliente);
      cliente.totalApparel = this.calcularTotalApparel(facturasCliente);
      cliente.totalVittoria = this.calcularTotalVittoria(facturasCliente);
      cliente.totalSyncros = this.calcularTotalSyncros(facturasCliente);
      cliente.totalBold = this.calcularTotalBold(facturasCliente);
    });
  }

  calcularTotalGeneral(facturas: any[]): number {
    return facturas.reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  calcularTotalScott(facturas: any[]): number {
    return facturas
      .filter(f => f.marca === 'SCOTT' && f.apparel === 'NO')
      .reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  calcularTotalApparel(facturas: any[]): number {
    return facturas
      .filter(f => f.apparel === 'SI')
      .reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  calcularTotalVittoria(facturas: any[]): number {
    return facturas
      .filter(f => f.marca === 'VITTORIA')
      .reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  calcularTotalSyncros(facturas: any[]): number {
    return facturas
      .filter(f => f.marca === 'SYNCROS')
      .reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  calcularTotalBold(facturas: any[]): number {
    return facturas
      .filter(f => f.marca === 'BOLD')
      .reduce((total, factura) => total + this.obtenerValorNumerico(factura.venta_total), 0);
  }

  obtenerValorNumerico(valor: any): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      // Eliminar caracteres no numéricos excepto punto decimal
      const numStr = valor.replace(/[^\d.]/g, '');
      return parseFloat(numStr) || 0;
    }
    return 0;
  }

  calcularTotalesGenerales(facturas: any[]): void {
    this.totalGeneral = this.calcularTotalGeneral(facturas);
    this.totalScott = this.calcularTotalScott(facturas);
    this.totalApparel = this.calcularTotalApparel(facturas);
    this.totalVittoria = this.calcularTotalVittoria(facturas);
    this.totalSyncros = this.calcularTotalSyncros(facturas);
    this.totalBold = this.calcularTotalBold(facturas);
  }

  obtenerFechaHoy(): string {
    return new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerSemanaISO(): number {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  obtenerDiaTemporada(): string {
    const fechaInicio = new Date(new Date().getFullYear(), 6, 1);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fechaInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `Día ${diffDays}`;
  }
}