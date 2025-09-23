import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import * as XLSX from 'xlsx';
import { Observable } from 'rxjs';

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

  @Input() idGrupo: number | null = null;

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

  }

  ngOnChanges() {
    if (this.isOpen) {
      this.obtenerFacturas();
    }
  }

  obtenerFacturas() {
    this.cargando = true;
    this.error = null;
    this.facturas = [];
    this.facturasFiltradas = [];
    this.facturasPaginadas = [];

    let servicioObservable: Observable<any>;

    if (this.idGrupo) {
      console.log(`Buscando facturas para el GRUPO con ID: ${this.idGrupo}`);
      servicioObservable = this.clientesService.getFacturasGrupo(this.idGrupo);
    } else {
      console.log('Buscando facturas para el cliente INDIVIDUAL del token.');
      servicioObservable = this.clientesService.getFacturasCliente();
    }

    servicioObservable.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.facturas = response.data || [];
          this.infoCliente = response.cliente;

          if (this.facturas.length === 0) {
            this.error = 'No se encontraron facturas.';
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
    const datosExportar = this.facturasFiltradas.map(factura => {
      // La preparación de datos ya es correcta, la dejamos como está.
      const fila: any = {};
      fila['Número Factura'] = factura.numero_factura ?? '';
      fila['Clave producto'] = factura.referencia_interna ?? '';
      fila['Producto'] = factura.nombre_producto ?? '';

      if (factura.fecha_factura) {
        const fecha = new Date(factura.fecha_factura);
        fila['Fecha'] = fecha.toISOString().slice(0, 10);
      } else {
        fila['Fecha'] = '';
      }

      // Es crucial que estos valores sean de tipo número para que Excel aplique el formato
      fila['Precio Unit.'] = this.formatearNumeroParaExcel(factura.precio_unitario);
      fila['Cantidad'] = factura.cantidad ?? 0;
      fila['Total'] = this.formatearNumeroParaExcel(factura.venta_total);

      fila['Marca'] = factura.marca ?? '';
      fila['Subcategoría'] = factura.subcategoria ?? ''; // Corregido el nombre de la columna

      return fila;
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExportar);

    // Definimos las cabeceras una sola vez para reutilizarlas
    const headers = [
      'Número Factura', 'Clave producto', 'Producto', 'Fecha',
      'Precio Unit.', 'Cantidad', 'Total', 'Marca', 'Subcategoría'
    ];

    // Ajuste de anchos (tu lógica es correcta)
    const colWidths = headers.map(header => {
      const valores = datosExportar.map(row => row[header]?.toString() ?? '');
      valores.push(header); // Incluir la cabecera en el cálculo
      const maxLength = Math.max(...valores.map(v => v.length));
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    // --- INICIO DE LA CORRECCIÓN ---

    // 1. Obtenemos el rango de la hoja para iterar
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

    // 2. Definimos las columnas que queremos formatear
    const columnasMoneda = ['Precio Unit.', 'Total'];

    // 3. Iteramos sobre cada celda de la hoja
    for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Empezamos en +1 para saltar la cabecera
      for (let C = range.s.c; C <= range.e.c; ++C) {

        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const celda = worksheet[cell_ref];

        // Obtenemos el nombre de la cabecera para esta columna
        const headerName = headers[C];

        // Si la celda existe, es un número y su cabecera está en nuestra lista de columnas de moneda
        if (celda && celda.t === 'n' && columnasMoneda.includes(headerName)) {
          celda.t = 'n'; // Confirmamos que el tipo es numérico
          // MEJORA: Aplicamos un formato de moneda con separador de miles y dos decimales
          celda.z = '#,##0.00';
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Compras');

    const fileName = `compras_${this.infoCliente?.clave || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private formatearNumeroParaExcel(valor: any): number {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'string') {
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