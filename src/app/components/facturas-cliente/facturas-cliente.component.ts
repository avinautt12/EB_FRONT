import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import * as XLSX from 'xlsx';

interface Factura {
  id: number;
  numero_factura: string;
  referencia_interna: string;
  nombre_producto: string;
  contacto_referencia: string;
  contacto_nombre: string;
  fecha_factura: string;
  precio_unitario: number;
  cantidad: number;
  venta_total: number;
  marca: string;
  subcategoria: string;
  apparel: string;
  eride: string;
  evac: string;
  categoria_producto: string;
  estado_factura: string;
}

@Component({
  selector: 'app-facturas-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas-cliente.component.html',
  styleUrls: ['./facturas-cliente.component.css']
})
export class FacturasClienteComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Input() isOpen = false;

  facturas: Factura[] = [];
  facturasFiltradas: Factura[] = [];
  facturasPaginadas: Factura[] = [];
  cargando = false;
  error: string | null = null;
  infoCliente: any = null;

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 50;
  totalPaginas = 1;

  constructor(private clientesService: ClientesService) { }

  ngOnInit() {
    if (this.isOpen) {
      this.obtenerFacturasCliente();
    }
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.obtenerFacturasCliente();
    }
  }

  obtenerFacturasCliente() {
    this.cargando = true;
    this.error = null;

    this.clientesService.getFacturasCliente().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.facturas = response.data || [];
          this.infoCliente = response.cliente;

          if (this.facturas.length === 0) {
            this.error = 'No se encontraron facturas para este cliente';
          } else {
            this.filtrarFacturas();
          }
        } else {
          this.error = response.error || 'Error al obtener facturas';
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
        this.error = error.error?.error || 'Error al cargar las facturas';
        this.cargando = false;
      }
    });
  }

  filtrarFacturas() {
    this.facturasFiltradas = [...this.facturas];
    this.totalPaginas = Math.ceil(this.facturasFiltradas.length / this.elementosPorPagina);
    this.cambiarPagina(1);
  }

  cambiarPagina(numero: number) {
    if (numero < 1 || numero > this.totalPaginas) return;
    this.paginaActual = numero;
    this.actualizarFacturasPaginadas();
  }

  actualizarFacturasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.facturasPaginadas = this.facturasFiltradas.slice(inicio, fin);
  }

  exportarExcel() {
    // Preparar datos para exportar (similar al MonitorComponent)
    const datosExportar = this.facturasFiltradas.map(factura => {
      const fila: any = {};

      // Mapear todas las propiedades manteniendo los nombres originales
      fila['Número Factura'] = factura.numero_factura ?? '';
      fila['Clave producto'] = factura.referencia_interna ?? '';
      fila['Producto'] = factura.nombre_producto ?? '';

      // Formatear fecha en formato YYYY-MM-DD
      if (factura.fecha_factura) {
        const fecha = new Date(factura.fecha_factura);
        fila['Fecha'] = fecha.toISOString().slice(0, 10);
      } else {
        fila['Fecha'] = '';
      }

      // Convertir y formatear valores numéricos
      fila['Precio Unit.'] = this.formatearNumeroParaExcel(factura.precio_unitario);
      fila['Cantidad'] = factura.cantidad ?? 0;
      fila['Total'] = this.formatearNumeroParaExcel(factura.venta_total);

      fila['Marca'] = factura.marca ?? '';
      fila['subcategoria'] = factura.subcategoria ?? '';

      return fila;
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExportar);

    // Ajustar ancho automático de columnas (igual que en MonitorComponent)
    const columnas = [
      'Número Factura', 'Clave producto', 'Producto', 'Fecha',
      'Precio Unit.', 'Cantidad', 'Total', 'Marca', 'Subcategoría'
    ];

    const colWidths = columnas.map(col => {
      const valores = datosExportar.map(row => row[col]?.toString() ?? '');
      valores.push(col);
      const maxLength = Math.max(...valores.map(v => v.length));
      return { wch: Math.min(maxLength + 2, 50) }; // Limitar ancho máximo a 50
    });
    worksheet['!cols'] = colWidths;

    // Formatear columnas numéricas (precio_unitario y venta_total)
    ['precio_unitario', 'venta_total'].forEach(colName => {
      const idx = columnas.indexOf(colName);
      if (idx !== -1) {
        const letraCol = XLSX.utils.encode_col(idx);
        for (let i = 2; i <= datosExportar.length + 1; i++) {
          const celda = worksheet[`${letraCol}${i}`];
          if (celda && typeof celda.v === 'number') {
            celda.t = 'n';
            celda.z = '#,##0.00';
          }
        }
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');

    const fileName = `facturas_${this.infoCliente?.clave || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private formatearNumeroParaExcel(valor: any): number {
    if (valor === null || valor === undefined) return 0;

    if (typeof valor === 'string') {
      // Limpiar formato de moneda y convertir a número
      const numeroLimpio = valor.replace(/[^\d.-]/g, '');
      return parseFloat(numeroLimpio) || 0;
    }

    return Number(valor) || 0;
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-ES');
  }

  formatearFechaParaExcel(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD para Excel
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  closeModal() {
    this.onClose.emit();
  }
}