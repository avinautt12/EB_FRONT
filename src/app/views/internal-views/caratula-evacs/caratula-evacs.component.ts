import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { CaratulasService } from '../../../services/caratulas.service';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx'

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
  totalEvacA: number = 0;
  totalEvacB: number = 0;
  totalEvacGO: number = 0;
  totalScott: number = 0;
  totalApparel: number = 0;
  totalVittoria: number = 0;
  totalSyncros: number = 0;
  totalBold: number = 0;

  constructor(
    private caratulasService: CaratulasService,
    private monitorOdooService: MonitorOdooService,
    private router: Router
  ) { }

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
    this.totalEvacA = 0;
    this.totalEvacB = 0;
    this.totalEvacGO = 0;
    this.totalScott = 0;
    this.totalApparel = 0;
    this.totalVittoria = 0;
    this.totalSyncros = 0;
    this.totalBold = 0;

    // Reiniciar totales de clientes
    this.reiniciarTotalesClientes();

    // Filtrar facturas por fecha
    const facturasFiltradas = this.filtrarFacturasPorFecha();

    // Procesar cada EVAC y obtener sus totales
    this.totalEvacA = this.procesarYCalcularTotalEvac(this.clientesA, facturasFiltradas);
    this.totalEvacB = this.procesarYCalcularTotalEvac(this.clientesB, facturasFiltradas);
    this.totalEvacGO = this.procesarYCalcularTotalEvac(this.clientesGO, facturasFiltradas);

    // Calcular totales generales
    this.calcularTotalesGenerales(facturasFiltradas);
  }

  // Nueva función que procesa los clientes y retorna el total del EVAC
  procesarYCalcularTotalEvac(clientes: any[], facturas: any[]): number {
    let totalEvac = 0;

    clientes.forEach(cliente => {
      // PRIMERO: Buscar por clave exacta (máxima prioridad)
      let facturasCliente = facturas.filter(factura =>
        factura.contacto_referencia === cliente.clave
      );

      // SEGUNDO: Si no hay resultados por clave, buscar por nombre COMPLETO exacto
      if (facturasCliente.length === 0) {
        const nombreCliente = cliente.nombre_cliente?.toLowerCase().trim() || '';
        
        facturasCliente = facturas.filter(factura => {
          const nombreFactura = factura.contacto_nombre?.toLowerCase().trim() || '';
          
          // Coincidencia exacta de nombre completo
          return nombreFactura === nombreCliente;
        });
      }

      // Calcular totales para este cliente
      cliente.totalGeneral = this.calcularTotalGeneral(facturasCliente);
      cliente.totalScott = this.calcularTotalScott(facturasCliente);
      cliente.totalApparel = this.calcularTotalApparel(facturasCliente);
      cliente.totalVittoria = this.calcularTotalVittoria(facturasCliente);
      cliente.totalSyncros = this.calcularTotalSyncros(facturasCliente);
      cliente.totalBold = this.calcularTotalBold(facturasCliente);

      // Sumar al total del EVAC
      totalEvac += cliente.totalGeneral;
    });

    return totalEvac;
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

  exportarExcel(): void {
    const workbook = XLSX.utils.book_new();
    
    // 1. Hoja de Metadatos y Filtros
    this.crearHojaMetadatos(workbook);
    
    // 2. Hoja de Resumen de Totales
    this.crearHojaResumenTotales(workbook);
    
    // 3. Hojas para cada EVAC
    this.crearHojaEvac(workbook, 'EVAC A', this.clientesA);
    this.crearHojaEvac(workbook, 'EVAC B', this.clientesB);
    this.crearHojaEvac(workbook, 'EVAC GO', this.clientesGO);
    
    // Generar el archivo Excel
    XLSX.writeFile(workbook, `Caratula_EVACs_${this.formatearFechaExcel(new Date())}.xlsx`);
  }

  private crearHojaMetadatos(workbook: XLSX.WorkBook): void {
    const metadata = [
      ['CARÁTULA EVACs - REPORTE'],
      [''],
      ['Fecha de generación:', new Date().toLocaleString('es-MX')],
      // ['Período filtrado:', `${this.fechaInicio} al ${this.fechaFin}`],
      [''],
      ['Filtros aplicados:'],
      ['Desde:', this.fechaInicio],
      ['Hasta:', this.fechaFin],
      [''],
      ['Totales generales del período:'],
      ['Total General:', { v: this.totalGeneral, t: 'n', z: '#,##0.00' }],
      ['Total EVAC A:', { v: this.totalEvacA, t: 'n', z: '#,##0.00' }],
      ['Total EVAC B:', { v: this.totalEvacB, t: 'n', z: '#,##0.00' }],
      ['Total EVAC GO:', { v: this.totalEvacGO, t: 'n', z: '#,##0.00' }],
      [''],
      ['Totales por marca:'],
      ['SCOTT (No Apparel):', { v: this.totalScott, t: 'n', z: '#,##0.00' }],
      ['APPAREL:', { v: this.totalApparel, t: 'n', z: '#,##0.00' }],
      ['VITTORIA:', { v: this.totalVittoria, t: 'n', z: '#,##0.00' }],
      ['SYNCROS:', { v: this.totalSyncros, t: 'n', z: '#,##0.00' }],
      ['BOLD:', { v: this.totalBold, t: 'n', z: '#,##0.00' }]
    ];

    const ws = XLSX.utils.aoa_to_sheet(metadata);
    
    // Estilos básicos para la hoja de metadatos
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Datos');
  }

  private crearHojaResumenTotales(workbook: XLSX.WorkBook): void {
    const resumenData = [
      ['RESUMEN DE TOTALES'],
      [''],
      ['TOTAL GENERAL', { v: this.totalGeneral, t: 'n', z: '#,##0.00' }],
      [''],
      ['TOTALES POR EVAC'],
      ['EVAC A', { v: this.totalEvacA, t: 'n', z: '#,##0.00' }],
      ['EVAC B', { v: this.totalEvacB, t: 'n', z: '#,##0.00' }],
      ['EVAC GO', { v: this.totalEvacGO, t: 'n', z: '#,##0.00' }],
      [''],
      ['TOTALES POR MARCA'],
      ['SCOTT (No Apparel)', { v: this.totalScott, t: 'n', z: '#,##0.00' }],
      ['APPAREL', { v: this.totalApparel, t: 'n', z: '#,##0.00' }],
      ['VITTORIA', { v: this.totalVittoria, t: 'n', z: '#,##0.00' }],
      ['SYNCROS', { v: this.totalSyncros, t: 'n', z: '#,##0.00' }],
      ['BOLD', { v: this.totalBold, t: 'n', z: '#,##0.00' }]
    ];

    const ws = XLSX.utils.aoa_to_sheet(resumenData);
    
    // Formato de columnas
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Resumen Totales');
  }

  private crearHojaEvac(workbook: XLSX.WorkBook, nombreEvac: string, clientes: any[]): void {
    const datos: any[] = [
        [nombreEvac],
        [''],
        ['CLAVE', 'NOMBRE DEL CLIENTE', 'TOTAL', 'SCOTT', 'APPAREL', 'VITTORIA', 'SYNCROS', 'BOLD']
    ];

    // Agregar datos de clientes
    clientes.forEach(cliente => {
        datos.push([
            cliente.clave,
            cliente.nombre_cliente,
            { v: cliente.totalGeneral, t: 'n', z: '#,##0.00' },
            { v: cliente.totalScott, t: 'n', z: '#,##0.00' },
            { v: cliente.totalApparel, t: 'n', z: '#,##0.00' },
            { v: cliente.totalVittoria, t: 'n', z: '#,##0.00' },
            { v: cliente.totalSyncros, t: 'n', z: '#,##0.00' },
            { v: cliente.totalBold, t: 'n', z: '#,##0.00' }
        ]);
    });

    // Agregar total al final
    datos.push(['']);
    datos.push(['TOTAL CLIENTES:', clientes.length]);
    datos.push(['TOTAL MONETARIO:', 
        { v: clientes.reduce((sum, cl) => sum + cl.totalGeneral, 0), t: 'n', z: '#,##0.00' }
    ]);

    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Ajustar anchos de columnas
    ws['!cols'] = [
        { wch: 10 },  // Clave
        { wch: 35 },  // Nombre cliente
        { wch: 15 },  // Total
        { wch: 15 },  // Scott
        { wch: 15 },  // Apparel
        { wch: 15 },  // Vittoria
        { wch: 15 },  // Syncros
        { wch: 15 }   // Bold
    ];
    
    XLSX.utils.book_append_sheet(workbook, ws, nombreEvac);
  }

  private formatearFechaExcel(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = ('0' + (fecha.getMonth() + 1)).slice(-2);
    const dia = ('0' + fecha.getDate()).slice(-2);
    const horas = ('0' + fecha.getHours()).slice(-2);
    const minutos = ('0' + fecha.getMinutes()).slice(-2);
    return `${año}${mes}${dia}_${horas}${minutos}`;
  }
}