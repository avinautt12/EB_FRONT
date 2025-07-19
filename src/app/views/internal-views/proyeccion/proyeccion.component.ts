import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

interface ProductoDetallado {
  folio: string;
  referencia: string;
  clave_factura: string;
  clave_6_digitos: string;
  ean: string;
  clave_odoo: string;
  modelo: string;
  descripcion: string;
  precio_aplicado: number;
  precio_publico_con_iva: number;
  q1_sep_2025: number;
  q2_sep_2025: number;
  q1_oct_2025: number;
  q2_oct_2025: number;
  q1_nov_2025: number;
  q2_nov_2025: number;
  q1_dic_2025: number;
  q2_dic_2025: number;
  orden_total_cant: number;
  orden_total_importe: number;
  fecha_registro: string;
}

interface ClienteDetallado {
  nombre_cliente: string;
  clave_cliente: string;
  zona: string;
  nivel: string;
  productos: ProductoDetallado[];
}

@Component({
  selector: 'app-proyeccion',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, FormsModule, RouterModule],
  templateUrl: './proyeccion.component.html',
  styleUrls: ['./proyeccion.component.css']
})
export class ProyeccionComponent implements OnInit {
  proyecciones: any[] = [];
  cargando: boolean = true;

  // Variables de paginación
  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  itemsPorPagina: number = 10;
  totalPaginas: number = 0;

  // Filtros
  filtros = {
    referencia: '',
    clave_factura: '',
    clave_6_digitos: '',
    clave_odoo: '',
    ean: '',
    descripcion: '',
    modelo: ''
  };

  filtroAbierto: string | null = null;
  proyeccionesOriginal: any[] = [];
  proyeccionesFiltradas: any[] = [];
  proyeccionesPaginadas: any[] = [];
  proyeccionesDetalladas: any[] = [];
  proyeccionesCompleta: any[] = [];

  // Diálogos
  mostrarDialogoExportar: boolean = false;
  mostrarDialogoImportar: boolean = false;
  archivoSeleccionado: File | null = null;

  constructor(private proyeccionService: ProyeccionService, private router: Router) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    this.proyeccionService.getProyeccionesDetalladas().subscribe({
      next: (data) => {
        this.proyeccionesDetalladas = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones detalladas:', error);
        this.cargando = false;
      }
    });

    this.proyeccionService.getProyecciones().subscribe({
      next: (data) => {
        this.proyecciones = data;
        this.proyeccionesOriginal = [...data];
        this.proyeccionesFiltradas = [...data];
        this.proyeccionesCompleta = [...data];
        this.actualizarPaginacion();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones:', error);
        this.cargando = false;
      }
    });
  }

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.proyeccionesFiltradas.length / this.itemsPorPagina);
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.proyeccionesPaginadas = this.proyeccionesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginacion();
  }

  toggleFiltro(campo: string): void {
    this.filtroAbierto = this.filtroAbierto === campo ? null : campo;
  }

  filtrarProyecciones(): void {
    this.proyeccionesFiltradas = this.proyeccionesOriginal.filter(item =>
      Object.keys(this.filtros).every(key =>
        String(item[key] || '').toLowerCase().includes(String(this.filtros[key as keyof typeof this.filtros]).toLowerCase())
      )
    );
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  verDetalles(item: any): void {
    this.router.navigate(['proyeccion/detalles', item.id]);
  }

  // Métodos para exportación
  abrirDialogoExportar(): void {
    this.mostrarDialogoExportar = true;
  }

  cerrarDialogoExportar(): void {
    this.mostrarDialogoExportar = false;
  }

  exportarExcelGlobal(): void {
    const datosFormateados = this.proyeccionesCompleta.map(item => ({
      // Información básica del producto
      'Referencia': item.referencia,
      'Clave Factura': item.clave_factura,
      'Clave 6 Dígitos': item.clave_6_digitos,
      'EAN': item.ean,
      'Clave Odoo': item.clave_odoo,
      'Descripción': item.descripcion,
      'Modelo': item.modelo,

      // Precios con IVA
      'Precio Público con IVA': item.precio_publico_con_iva,
      'Precio Público MY26': item.precio_publico_con_iva_my26,
      'Distribuidor con IVA': item.precio_distribuidor_con_iva,
      'Partner con IVA': item.precio_partner_con_iva,
      'Elite con IVA': item.precio_elite_con_iva,
      'Elite Plus con IVA': item.precio_elite_plus_con_iva,

      // Precios sin IVA
      'Precio Público sin IVA': item.precio_publico_sin_iva,
      'Distribuidor sin IVA': item.precio_distribuidor_sin_iva,
      'Partner sin IVA': item.precio_partner_sin_iva,
      'Elite sin IVA': item.precio_elite_sin_iva,
      'Elite Plus sin IVA': item.precio_elite_plus_sin_iva,

      // Proyecciones por quincena
      '1Q Sep 2025': item.q1_sep_2025,
      '2Q Sep 2025': item.q2_sep_2025,
      '1Q Oct 2025': item.q1_oct_2025,
      '2Q Oct 2025': item.q2_oct_2025,
      '1Q Nov 2025': item.q1_nov_2025,
      '2Q Nov 2025': item.q2_nov_2025,
      '1Q Dic 2025': item.q1_dic_2025,
      '2Q Dic 2025': item.q2_dic_2025,

      // Totales
      'Total Cantidad': item.orden_total_cant,
      'Total Importe': item.orden_total_importe,

      // Información adicional
      'ID': item.id,
      'ID Disponibilidad': item.id_disponibilidad
    }));

    this.generarExcel(datosFormateados, 'Proyecciones_Globales');
    this.cerrarDialogoExportar();
  }

  exportarExcelDetallado(): void {
    this.cargando = true;
    this.proyeccionService.getProyeccionesDetalladas().subscribe({
      next: (clientes: ClienteDetallado[]) => {
        const datosFormateados = this.formatearDatosDetallados(clientes);
        this.generarExcel(datosFormateados, 'Proyecciones_Detalladas', true);
        this.cargando = false;
        this.cerrarDialogoExportar();
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.mostrarMensaje('Error al exportar datos detallados', 'error');
        this.cargando = false;
      }
    });
  }

  private formatearDatosDetallados(clientes: ClienteDetallado[]): any[] {
    const datosFormateados: any[] = [];

    clientes.forEach(cliente => {
      cliente.productos.forEach(producto => {
        datosFormateados.push({
          'Cliente': cliente.nombre_cliente,
          'Clave Cliente': cliente.clave_cliente,
          'Zona': cliente.zona,
          'Nivel': cliente.nivel,
          'Folio': producto.folio,
          'Referencia': producto.referencia,
          'Clave Factura': producto.clave_factura,
          'Clave 6 Dígitos': producto.clave_6_digitos,
          'EAN': producto.ean,
          'Clave Odoo': producto.clave_odoo,
          'Modelo': producto.modelo,
          'Descripción': producto.descripcion,
          'Precio Aplicado': producto.precio_aplicado?.toFixed(2),
          'Precio Público': producto.precio_publico_con_iva?.toFixed(2),
          '1Q Sep 2025': producto.q1_sep_2025,
          '2Q Sep 2025': producto.q2_sep_2025,
          '1Q Oct 2025': producto.q1_oct_2025,
          '2Q Oct 2025': producto.q2_oct_2025,
          '1Q Nov 2025': producto.q1_nov_2025,
          '2Q Nov 2025': producto.q2_nov_2025,
          '1Q Dic 2025': producto.q1_dic_2025,
          '2Q Dic 2025': producto.q2_dic_2025,
          'Total Unidades': producto.orden_total_cant,
          'Total Importe': producto.orden_total_importe?.toFixed(2),
          'Fecha Registro': producto.fecha_registro
        });
      });
    });

    return datosFormateados;
  }

  private generarExcel(datos: any[], nombreArchivo: string, conSaltos: boolean = false): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);

    // Configurar anchos de columnas automáticamente
    const columnWidths = Object.keys(datos[0] || {}).map(key => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...datos.map(row => (row[key]?.toString() || '').length)
        ) + 2,
        50 // Ancho máximo de 50 caracteres
      )
    }));
    worksheet['!cols'] = columnWidths;

    // Aplicar formato de moneda a campos numéricos
    Object.keys(datos[0] || {}).forEach((key, index) => {
      if (key.includes('Precio') || key.includes('Importe')) {
        const colLetter = XLSX.utils.encode_col(index);
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        for (let row = 1; row <= range.e.r; row++) {
          const cell = worksheet[`${colLetter}${row}`];
          if (cell && typeof cell.v === 'number') {
            cell.z = '"$"#,##0.00';
          }
        }
      }
    });

    // Habilitar saltos de línea para celdas largas
    if (conSaltos) {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = 0; col <= range.e.c; col++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
          if (cell && cell.v && typeof cell.v === 'string' && cell.v.length > 30) {
            cell.s = { ...cell.s, alignment: { wrapText: true } };
          }
        }
      }
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Datos': worksheet },
      SheetNames: ['Datos']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Métodos para importación
  abrirDialogoImportar(): void {
    this.mostrarDialogoImportar = true;
  }

  cerrarDialogoImportar(): void {
    this.mostrarDialogoImportar = false;
    this.archivoSeleccionado = null;
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.archivoSeleccionado = file;
    } else {
      this.mostrarMensaje('Solo se permiten archivos .xlsx', 'error');
      this.archivoSeleccionado = null;
    }
  }

  importarProyecciones(): void {
    if (!this.archivoSeleccionado) {
      this.mostrarMensaje('Selecciona un archivo antes de importar', 'error');
      return;
    }

    this.cargando = true;
    this.proyeccionService.subirArchivoProyecciones(this.archivoSeleccionado).subscribe({
      next: (res) => {
        this.mostrarMensaje(res.message || 'Archivo importado correctamente', 'success');
        this.cerrarDialogoImportar();
        this.cargarDatos(); // Recargar datos después de importar
      },
      error: (err) => {
        console.error(err);
        const mensajeError = err.error?.error || err.error?.message || 'Error al importar el archivo';
        this.mostrarMensaje(mensajeError, 'error');
        this.cargando = false;
      }
    });
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning'): void {
    // Implementar lógica de notificación (toast, snackbar, etc.)
    alert(tipo === 'error' ? `❌ ${mensaje}` : `✔️ ${mensaje}`);
  }
}