import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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

  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  itemsPorPagina: number = 10;
  totalPaginas: number = 0;

  filtros = {
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

  proyeccionesCompleta: any[] = [];

  exportarTodo: boolean = false;
  mostrarDialogoExportar: boolean = false;

  columnasDisponibles = [
    { nombre: 'referencia', label: 'Referencia', seleccionado: true },
    { nombre: 'clave_factura', label: 'Clave Factura', seleccionado: true },
    { nombre: 'clave_6_digitos', label: 'Clave 6 Dígitos', seleccionado: true },
    { nombre: 'ean', label: 'EAN', seleccionado: true },
    { nombre: 'clave_odoo', label: 'Clave Odoo', seleccionado: true },
    { nombre: 'descripcion', label: 'Descripción', seleccionado: true },
    { nombre: 'modelo', label: 'Modelo', seleccionado: true },
    { nombre: 'precio_publico_iva', label: 'Precio Público', seleccionado: true },
    { nombre: 'q1_oct_2025', label: '1ER QUINCENA DE OCTUBRE 2025', seleccionado: true },
    { nombre: 'q2_oct_2025', label: '2DA QUINCENA DE OCTUBRE 2025', seleccionado: true },
    { nombre: 'q1_nov_2025', label: '1ER QUINCENA DE NOVIEMBRE 2025', seleccionado: true },
    { nombre: 'q2_nov_2025', label: '2DA QUINCENA DE NOVIEMBRE 2025', seleccionado: true },
    { nombre: 'q1_dic_2025', label: '1ER QUINCENA DE DICIEMBRE 2025', seleccionado: true },
    { nombre: 'q2_dic_2025', label: '2DA QUINCENA DE DICIEMBRE 2025', seleccionado: true },
    { nombre: 'orden_total_cant', label: 'Total Cantidad', seleccionado: true },
    { nombre: 'orden_total_importe', label: 'Total Importe', seleccionado: true },
  ];

  constructor(private proyeccionService: ProyeccionService, private router: Router) { }

  ngOnInit(): void {
    this.proyeccionService.getProyecciones().subscribe({
      next: (data) => {
        this.proyecciones = data;
        this.proyeccionesOriginal = data;
        this.proyeccionesFiltradas = data;
        this.proyeccionesCompleta = data;
        this.totalPaginas = Math.ceil(data.length / this.itemsPorPagina);
        this.actualizarPaginado();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones:', error);
        this.cargando = false;
      }
    });
  }

  actualizarPaginado() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.proyeccionesPaginadas = this.proyeccionesFiltradas.slice(inicio, fin);  // <-- ahora usa el filtrado
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  toggleFiltro(campo: string) {
    this.filtroAbierto = this.filtroAbierto === campo ? null : campo;
  }

  filtrarProyecciones() {
    this.proyeccionesFiltradas = this.proyeccionesOriginal.filter(item =>
      item.clave_factura?.toLowerCase().includes(this.filtros.clave_factura.toLowerCase()) &&
      item.clave_6_digitos?.toLowerCase().includes(this.filtros.clave_6_digitos.toLowerCase()) &&
      item.descripcion?.toLowerCase().includes(this.filtros.descripcion.toLowerCase()) &&
      item.modelo?.toLowerCase().includes(this.filtros.modelo.toLowerCase())
      && item.clave_odoo?.toLowerCase().includes(this.filtros.clave_odoo.toLowerCase()) &&
      item.ean?.toLowerCase().includes(this.filtros.ean.toLowerCase())
    );

    this.totalPaginas = Math.ceil(this.proyeccionesFiltradas.length / this.itemsPorPagina);
    this.paginaActual = 1;
    this.actualizarPaginado();
  }

  verDetalles(item: any) {
    this.router.navigate(['proyeccion/detalles', item.id]);
  }

  exportarExcel() {
    // Escoge los datos según la opción: todo o filtrado
    const datosParaExportar = this.exportarTodo ? this.proyeccionesCompleta : this.proyeccionesFiltradas;

    // Columnas seleccionadas para exportar
    const columnasSeleccionadas = this.columnasDisponibles
      .filter(c => c.seleccionado)
      .map(c => c.nombre);

    // Mapear filas para el excel según columnas seleccionadas
    const datosFormateados = datosParaExportar.map(item => {
      const fila: any = {};
      columnasSeleccionadas.forEach(col => {
        // Ejemplo: si tienes columnas calculadas puedes hacer un switch aquí (igual que en tu código)
        switch (col) {
          case 'precio_publico_iva':
            fila[col] = item[col] ? Number(item[col]) : 0;
            break;
          // más casos si necesitas formateos especiales
          default:
            fila[col] = item[col] ?? '';
        }
      });
      return fila;
    });

    // Crear worksheet de XLSX
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosFormateados);

    // Ajuste automático ancho columnas
    const columnWidths = columnasSeleccionadas.map(col => {
      const maxLength = Math.max(
        col.length,
        ...datosFormateados.map(f => (f[col] ? f[col].toString().length : 0))
      );
      return { wch: maxLength + 5 };
    });
    worksheet['!cols'] = columnWidths;

    // Crear libro
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Proyecciones': worksheet },
      SheetNames: ['Proyecciones']
    };

    // Guardar archivo
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'proyecciones_exportadas.xlsx');

    this.cerrarDialogoExportar();
  }

  abrirDialogoExportar() {
    this.mostrarDialogoExportar = true;
  }

  cerrarDialogoExportar() {
    this.mostrarDialogoExportar = false;
  }

}
