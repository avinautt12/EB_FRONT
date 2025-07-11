import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FiltroPorTextoPipe } from '../../../pipes/filtro-por-texto.pipe';
import { ViewChild, ElementRef, } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AlertaService } from '../../../services/alerta.service';

interface Factura {
  numero_factura: string;
  referencia_interna: string;
  nombre_producto: string;
  contacto_referencia: string;
  contacto_nombre: string;
  fecha_factura: string;
  precio_unitario: number;
  cantidad: number;
  categoria_producto: string;
  estado_factura: string;
  costo_producto: number;
}

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, FormsModule, FiltroPorTextoPipe, RouterModule],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.css',
  providers: [MonitorOdooService]
})
export class MonitorComponent {
  facturas: any[] = [];
  cargando: boolean = false;

  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;
  @ViewChild('dialogoExportar') dialogoExportar!: ElementRef;

  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  elementosPorPagina: number = 20;
  facturasPaginadas: any[] = [];

  filtros: any = {
    numero_factura: '',
    referencia_interna: '',
    nombre_producto: '',
    contacto_referencia: '',
    contacto_nombre: '',
    fecha_factura: '',
    precio_unitario: '',
    cantidad: '',
    categoria_producto: '',
    estado_factura: '',
    costo_producto: ''
  };

  facturasFiltradas: any[] = [];

  filtroAbierto: string | null = null;
  ordenDescendente: boolean = true;
  ordenFechaAscendente = false;

  filtroFechaAbierto: boolean = false;

  categoriasUnicas: string[] = [];
  estadosUnicos: string[] = [];

  filtrosCheckbox = {
    categoriasSeleccionadas: new Set<string>(),
    estadosSeleccionados: new Set<string>(),
    marcasSeleccionadas: new Set<string>(),
    subcategoriasSeleccionadas: new Set<string>(),
    erideSeleccionados: new Set<string>(),
    apparelSeleccionados: new Set<string>()
  };

  filtroCategoriaAbierto: boolean = false;
  busquedaCategoria: string = '';

  totalPaginas: number = 1;

  marcasUnicas: string[] = [];
  subcategoriasUnicas: string[] = [];
  erideUnicos: string[] = ['SI', 'NO'];
  apparelUnicos: string[] = ['SI', 'NO'];

  columnasDisponibles = [
    { nombre: 'numero_factura', etiqueta: 'Líneas de factura/Número', seleccionado: true },
    { nombre: 'referencia_interna', etiqueta: 'Líneas de factura/Producto/Referencia interna', seleccionado: true },
    { nombre: 'nombre_producto', etiqueta: 'Líneas de factura/Producto/Nombre', seleccionado: true },
    { nombre: 'contacto_referencia', etiqueta: 'Líneas de factura/Contacto/Referencia', seleccionado: true },
    { nombre: 'contacto_nombre', etiqueta: 'Líneas de factura/Contacto/Nombre', seleccionado: true },
    { nombre: 'fecha_factura', etiqueta: 'Líneas de factura/Fecha de factura', seleccionado: true },
    { nombre: 'precio_unitario', etiqueta: 'Líneas de factura/Precio unitario', seleccionado: true },
    { nombre: 'cantidad', etiqueta: 'Líneas de factura/Cantidad', seleccionado: true },
    { nombre: 'venta_total', etiqueta: 'Líneas de factura/Venta Total', seleccionado: true },
    { nombre: 'marca', etiqueta: 'Líneas de factura/Marca', seleccionado: true },
    { nombre: 'subcategoria', etiqueta: 'Líneas de factura/Subcategoría', seleccionado: true },
    { nombre: 'eride', etiqueta: 'Líneas de factura/ERIDE', seleccionado: true },
    { nombre: 'apparel', etiqueta: 'Líneas de factura/APPAREL', seleccionado: true },
    { nombre: 'categoria_producto', etiqueta: 'Líneas de factura/Producto/Categoría del producto', seleccionado: true },
    { nombre: 'estado_factura', etiqueta: 'Líneas de factura/Estado', seleccionado: true },
    { nombre: 'costo_producto', etiqueta: 'Líneas de factura/Producto/Costo', seleccionado: true }
  ];

  constructor(private monitorService: MonitorOdooService, private alertaService: AlertaService) { }

  ngOnInit() {
    this.obtenerFacturas();
  }

  obtenerFacturas() {
    this.cargando = true;
    this.monitorService.getFacturas().subscribe({
      next: (data: Factura[]) => {
        this.facturas = data.filter(f =>
          f.numero_factura && f.numero_factura !== '/' &&
          f.fecha_factura && f.fecha_factura !== '0001-01-01 00:00:00'
        );

        this.categoriasUnicas = [...new Set(
          this.facturas
            .map(f => f.categoria_producto)
            .filter(c => c && c.toUpperCase().trim() !== 'SERVICIOS')
        )];
        this.estadosUnicos = [...new Set(
          this.facturas
            .map(f => f.estado_factura)
            .filter(e => e && e !== '0001-01-01 00:00:00')
        )];
        this.marcasUnicas = [...new Set(
          this.facturas
            .map(f => this.extraerPrimeraParte(f.categoria_producto))
            .filter(m => m && m.trim() !== '' && m !== '0001-01-01 00:00:00')
        )];
        this.subcategoriasUnicas = [...new Set(
          this.facturas
            .map(f => this.obtenerSegundaParte(f.categoria_producto))
            .filter(sub => sub && sub.trim() !== '' && sub !== '0001-01-01 00:00:00')
        )];

        this.totalPaginas = Math.ceil(this.facturas.length / this.elementosPorPagina);
        this.actualizarFacturasPaginadas();
        this.filtrarFacturas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
        this.cargando = false;
      }
    });
  }

  seleccionarArchivo() {
    this.inputArchivo.nativeElement.click();
  }

  importarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      const formData = new FormData();
      formData.append('file', archivo);

      this.cargando = true;
      this.monitorService.importarFacturas(formData).subscribe({
        next: (res: any) => {
          this.alertaService.mostrarExito(res.message);
          this.obtenerFacturas();
          this.cargando = false;
        },
        error: err => {
          if (err.status === 400) {
            this.alertaService.mostrarError(err.error?.error || 'Error de validación en archivo');
          } else if (err.status === 500) {
            this.alertaService.mostrarError('Error interno del servidor. Intenta más tarde.');
          } else {
            this.alertaService.mostrarError('Error desconocido al importar');
          }
          console.error(err);
          this.cargando = false;
        }
      });
    }
  }

  abrirDialogoExportar() {
    this.dialogoExportar.nativeElement.showModal();
  }

  cerrarDialogoExportar() {
    this.dialogoExportar.nativeElement.close();
  }

  formatearFecha(fechaStr: string): string {
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  exportarExcel() {
    const columnasSeleccionadas = this.columnasDisponibles
      .filter(c => c.seleccionado)
      .map(c => c.nombre);

    const datosFiltrados = this.facturasFiltradas.map(factura => {
      const fila: any = {};
      let filaValida = true;

      columnasSeleccionadas.forEach(col => {
        // Manejo especial para columnas calculadas
        switch (col) {
          case 'venta_total':
            fila[col] = this.calcularVentaTotal(factura.precio_unitario, factura.cantidad, factura.estado_factura);
            break;
          case 'marca':
            fila[col] = this.extraerPrimeraParte(factura.categoria_producto);
            break;
          case 'subcategoria':
            fila[col] = this.obtenerSegundaParte(factura.categoria_producto);
            break;
          case 'eride':
            fila[col] = this.contieneERIDE(factura.categoria_producto);
            break;
          case 'apparel':
            fila[col] = this.contieneAPPAREL(factura.categoria_producto);
            break;
          default:
            // Para las columnas normales
            const valor = factura[col];
            if (
              valor === '/' ||
              valor === '0001-01-01 00:00:00' ||
              valor === null ||
              valor === undefined ||
              valor === ''
            ) {
              fila[col] = '';
            } else if (col.toLowerCase().includes('fecha') && valor) {
              fila[col] = this.formatearFecha(valor);
            } else {
              fila[col] = valor;
            }
        }
      });
      return fila;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosFiltrados);

    // Ajuste automático del ancho de columnas
    const columnWidths = columnasSeleccionadas.map(col => {
      const maxLength = Math.max(
        col.length,
        ...datosFiltrados.map(f => (f[col] ? f[col].toString().length : 0))
      );
      return { wch: maxLength + 5 };
    });
    worksheet['!cols'] = columnWidths;

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Facturas': worksheet },
      SheetNames: ['Facturas']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'facturas_exportadas.xlsx');

    this.cerrarDialogoExportar();
  }

  cambiarPagina(numero: number) {
    if (numero < 1 || numero > this.totalPaginas) return;
    this.paginaActual = numero;
    this.paginaActualTemp = numero;
    this.actualizarFacturasPaginadas();
  }

  // actualizarFacturasPaginadas() {
  //   const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
  //   const fin = inicio + this.elementosPorPagina;
  //   this.facturasPaginadas = this.facturas.slice(inicio, fin);
  // }

  filtrarFacturas() {
    let facturasFiltradas = [...this.facturas];

    facturasFiltradas = facturasFiltradas.filter(f =>
      f.categoria_producto && f.categoria_producto.toUpperCase().trim() !== 'SERVICIOS'
    );

    // Filtros específicos
    if (this.filtros.numero_factura) {
      facturasFiltradas = facturasFiltradas.filter(f => f.numero_factura?.includes(this.filtros.numero_factura));
    }
    if (this.filtros.referencia_interna) {
      facturasFiltradas = facturasFiltradas.filter(f => f.referencia_interna?.includes(this.filtros.referencia_interna));
    }
    if (this.filtros.nombre_producto) {
      facturasFiltradas = facturasFiltradas.filter(f => f.nombre_producto?.includes(this.filtros.nombre_producto));
    }
    if (this.filtros.contacto_referencia) {
      facturasFiltradas = facturasFiltradas.filter(f => f.contacto_referencia?.includes(this.filtros.contacto_referencia));
    }
    if (this.filtros.contacto_nombre) {
      facturasFiltradas = facturasFiltradas.filter(f => f.contacto_nombre?.toLowerCase().includes(this.filtros.contacto_nombre.toLowerCase()));
    }

    // Filtros de fecha
    if (this.filtros.fecha_desde) {
      const desde = new Date(this.filtros.fecha_desde);
      facturasFiltradas = facturasFiltradas.filter(f => new Date(f.fecha_factura) >= desde);
    }
    if (this.filtros.fecha_hasta) {
      const hasta = new Date(this.filtros.fecha_hasta);
      facturasFiltradas = facturasFiltradas.filter(f => new Date(f.fecha_factura) <= hasta);
    }

    if (this.filtrosCheckbox.categoriasSeleccionadas.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f => this.filtrosCheckbox.categoriasSeleccionadas.has(f.categoria_producto));
    }

    if (this.filtrosCheckbox.estadosSeleccionados.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f => this.filtrosCheckbox.estadosSeleccionados.has(f.estado_factura));
    }

    if (this.filtrosCheckbox.marcasSeleccionadas.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f =>
        this.filtrosCheckbox.marcasSeleccionadas.has(this.extraerPrimeraParte(f.categoria_producto))
      );
    }

    if (this.filtrosCheckbox.subcategoriasSeleccionadas.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f =>
        this.filtrosCheckbox.subcategoriasSeleccionadas.has(this.obtenerSegundaParte(f.categoria_producto))
      );
    }

    if (this.filtrosCheckbox.erideSeleccionados.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f =>
        this.filtrosCheckbox.erideSeleccionados.has(this.contieneERIDE(f.nombre_producto))
      );
    }

    if (this.filtrosCheckbox.apparelSeleccionados.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f =>
        this.filtrosCheckbox.apparelSeleccionados.has(this.contieneAPPAREL(f.nombre_producto))
      );
    }

    // Filtros genéricos para otros campos
    Object.keys(this.filtros).forEach(campo => {
      if (
        [
          'numero_factura',
          'referencia_interna',
          'nombre_producto',
          'contacto_referencia',
          'contacto_nombre',
          'fecha_desde',
          'fecha_hasta'
        ].includes(campo)
      ) return;
      const filtro = this.filtros[campo]?.toString().toLowerCase();
      if (!filtro) return;
      facturasFiltradas = facturasFiltradas.filter(f => (f[campo] ?? '').toString().toLowerCase().includes(filtro));
    });

    // Ordenar por fecha
    facturasFiltradas = facturasFiltradas.sort((a, b) => {
      const fechaA = new Date(a.fecha_factura).getTime();
      const fechaB = new Date(b.fecha_factura).getTime();
      return this.ordenFechaAscendente ? fechaA - fechaB : fechaB - fechaA;
    });

    this.facturasFiltradas = facturasFiltradas;
    this.totalPaginas = Math.ceil(this.facturasFiltradas.length / this.elementosPorPagina);
    this.actualizarFacturasPaginadas();
    this.cambiarPagina(1);
  }

  toggleFiltro(filtro: string) {
    if (this.filtroAbierto === filtro) {
      this.filtroAbierto = null;
    } else {
      this.filtroAbierto = filtro;
    }
  }

  actualizarFacturasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    const fuente = this.facturasFiltradas.length ? this.facturasFiltradas : this.facturas;
    this.facturasPaginadas = fuente.slice(inicio, fin);
  }

  ordenarPorFecha() {
    this.ordenFechaAscendente = !this.ordenFechaAscendente;
    this.filtrarFacturas();
  }

  // Métodos adicionales
  toggleFechaFilter() {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  cambiarOrdenFecha(orden: string) {
    this.ordenFechaAscendente = orden === 'asc';
    this.filtrarFacturas();
    this.filtroFechaAbierto = false;
  }

  aplicarFiltroFecha() {
    this.filtrarFacturas();
    // Opcional: cerrar automáticamente después de aplicar
    // this.filtroFechaAbierto = false;
  }

  toggleCategoria(categoria: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.categoriasSeleccionadas.add(categoria);
    } else {
      this.filtrosCheckbox.categoriasSeleccionadas.delete(categoria);
    }
    this.filtrarFacturas();
  }

  toggleEstado(estado: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.estadosSeleccionados.add(estado);
    } else {
      this.filtrosCheckbox.estadosSeleccionados.delete(estado);
    }
    this.filtrarFacturas();
  }

  toggleFiltroCategoria() {
    this.filtroCategoriaAbierto = !this.filtroCategoriaAbierto;
  }

  seleccionarTodasCategorias() {
    this.categoriasUnicas.forEach(c => this.filtrosCheckbox.categoriasSeleccionadas.add(c));
    this.filtrarFacturas();
  }

  borrarSeleccionCategorias() {
    this.filtrosCheckbox.categoriasSeleccionadas.clear();
    this.filtrarFacturas();
  }

  calcularVentaTotal(precio: number, cantidad: number, estado: string): number {
    const esCancelado = estado?.toLowerCase().trim().replace(/\s+/g, '') === 'cancel';
    const total = precio * cantidad * 1.16;
    return esCancelado ? -total : total;
  }

  extraerPrimeraParte(texto: string): string {
    if (!texto) return '';
    const indice = texto.indexOf(' /');
    return indice !== -1 ? texto.substring(0, indice) : texto;
  }

  obtenerSegundaParte(texto: string): string {
    if (!texto) return '';
    const primera = texto.indexOf(' /');
    const segunda = texto.indexOf(' /', primera + 2);
    if (primera !== -1 && segunda !== -1) {
      return texto.substring(primera + 2, segunda).trim();
    } else if (primera !== -1) {
      return texto.substring(primera + 2).trim();
    }
    return texto;
  }

  contieneERIDE(texto: string): string {
    if (!texto) return 'NO';
    return texto.includes('ERIDE') ? 'SI' : 'NO';
  }

  contieneAPPAREL(texto: string): string {
    if (!texto) return 'NO';
    return texto.includes('APPAREL') ? 'SI' : 'NO';
  }

  toggleMarca(marca: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.marcasSeleccionadas.add(marca);
    } else {
      this.filtrosCheckbox.marcasSeleccionadas.delete(marca);
    }
    this.filtrarFacturas();
  }

  toggleSubcategoria(sub: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.subcategoriasSeleccionadas.add(sub);
    } else {
      this.filtrosCheckbox.subcategoriasSeleccionadas.delete(sub);
    }
    this.filtrarFacturas();
  }

  toggleERIDE(valor: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.erideSeleccionados.add(valor);
    } else {
      this.filtrosCheckbox.erideSeleccionados.delete(valor);
    }
    this.filtrarFacturas();
  }

  toggleAPPAREL(valor: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.apparelSeleccionados.add(valor);
    } else {
      this.filtrosCheckbox.apparelSeleccionados.delete(valor);
    }
    this.filtrarFacturas();
  }

  seleccionarTodasMarcas() {
    this.marcasUnicas.forEach(m => this.filtrosCheckbox.marcasSeleccionadas.add(m));
    this.filtrarFacturas();
  }

  borrarSeleccionMarcas() {
    this.filtrosCheckbox.marcasSeleccionadas.clear();
    this.filtrarFacturas();
  }

  seleccionarTodasSubcategorias() {
    this.subcategoriasUnicas.forEach(s => this.filtrosCheckbox.subcategoriasSeleccionadas.add(s));
    this.filtrarFacturas();
  }

  borrarSeleccionSubcategorias() {
    this.filtrosCheckbox.subcategoriasSeleccionadas.clear();
    this.filtrarFacturas();
  }
}
