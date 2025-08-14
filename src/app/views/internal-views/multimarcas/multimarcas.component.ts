import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultimarcasService } from '../../../services/multimarcas.service';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-multimarcas',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBarComponent, RouterModule],
  templateUrl: './multimarcas.component.html',
  styleUrls: ['./multimarcas.component.css']
})
export class MultimarcasComponent implements OnInit {

  clientesPaginados: any[] = [];
  facturasOriginales: any[] = [];
  cargando: boolean = false;

  constructor(
    private multimarcasService: MultimarcasService,
    private monitorOdooService: MonitorOdooService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;

    // Cargamos primero los clientes
    this.multimarcasService.getMultimarcas().subscribe({
      next: (clientes) => {
        this.clientesPaginados = [...clientes];

        // Luego cargamos las facturas
        this.monitorOdooService.getFacturas().pipe(
          finalize(() => this.cargando = false)
        ).subscribe({
          next: (facturas) => {
            this.facturasOriginales = facturas;
            this.calcularAvanceGlobalScott();
            this.calcularAvanceGlobalSyncros();
            this.calcularAvanceGlobalApparel();
            this.calcularAvanceGlobalVittoria();
            this.calcularAvanceGlobalBold();
            this.calcularAvanceGlobalSoloJulio();
          },
          error: (error) => {
            console.error('Error al cargar facturas:', error);
          }
        });
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  calcularAvanceGlobalScott() {
    const avancesPorCliente = new Map<string, number>();

    // Filtramos facturas SCOTT con apparel NO y dentro del rango de fechas
    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'SCOTT' &&
          factura.apparel === 'NO' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_scott: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSyncros() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'SYNCROS' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_syncros: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalApparel() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.apparel === 'SI' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_apparel: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalVittoria() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'VITTORIA' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_vittoria: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalBold() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'BOLD' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_bold: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloJulio() {
    const avancesPorCliente = new Map<string, number>();

    const facturasJulio = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioJulio = new Date('2025-07-01');
        const finJulio = new Date('2025-07-31');

        return fechaFactura >= inicioJulio &&
          fechaFactura <= finJulio;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasJulio.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_julio: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}