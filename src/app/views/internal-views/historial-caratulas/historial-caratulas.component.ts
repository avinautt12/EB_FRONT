import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FiltroComponent } from '../../../components/filtro/filtro.component';
import { FiltroFechaComponent } from '../../../components/filtro-fecha/filtro-fecha.component';
import { EmailService, HistorialCaratula } from '../../../services/email.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-historial-caratulas',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBarComponent, FiltroComponent, FiltroFechaComponent, RouterModule],
  templateUrl: './historial-caratulas.component.html',
  styleUrls: ['./historial-caratulas.component.css']
})
export class HistorialCaratulasComponent implements OnInit {
  historial: HistorialCaratula[] = [];
  historialFiltrado: HistorialCaratula[] = [];
  isLoading = true;
  error: string | null = null;

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 50;
  totalPaginas = 1;

  // Opciones para los filtros
  nombreEvacOptions: any[] = [];
  usuariosOptions: any[] = [];
  clientesOptions: any[] = [];
  correosOptions: any[] = [];

  // Filtros aplicados
  filtroNombreEvac: string[] = [];
  filtroUsuario: string[] = [];
  filtroCliente: string[] = [];
  filtroCorreo: string[] = [];
  filtroFecha: any = { orden: null, fechaDesde: '', fechaHasta: '' };

  // Estados de dropdown
  showNombreEvacFilter = false;
  showUsuarioFilter = false;
  showClienteFilter = false;
  showCorreoFilter = false;

  constructor(
    private emailService: EmailService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.isLoading = true;
    this.error = null;
    this.emailService.historialCaratulas().subscribe({
      next: (data) => {
        this.historial = data;
        this.prepararOpcionesFiltros();
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar el historial. Por favor, intente de nuevo.';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  prepararOpcionesFiltros() {
    const crearOpciones = (campo: keyof HistorialCaratula) => {
      const valoresUnicos = new Set(this.historial.map(item => item[campo]));
      return Array.from(valoresUnicos).map(valor => ({ value: valor, selected: false }));
    };
    this.nombreEvacOptions = crearOpciones('nombre_usuario');
    this.usuariosOptions = crearOpciones('usuario_envio');
    this.clientesOptions = crearOpciones('cliente_nombre');
    this.correosOptions = crearOpciones('correo_destinatario');
  }

  aplicarFiltros() {
    let datosFiltrados = this.historial;

    if (this.filtroNombreEvac.length > 0) {
      datosFiltrados = datosFiltrados.filter(item => this.filtroNombreEvac.includes(item.nombre_usuario));
    }
    if (this.filtroUsuario.length > 0) {
      datosFiltrados = datosFiltrados.filter(item => this.filtroUsuario.includes(item.usuario_envio));
    }
    if (this.filtroCliente.length > 0) {
      datosFiltrados = datosFiltrados.filter(item => this.filtroCliente.includes(item.cliente_nombre));
    }
    if (this.filtroCorreo.length > 0) {
      datosFiltrados = datosFiltrados.filter(item => this.filtroCorreo.includes(item.correo_destinatario));
    }
    if (this.filtroFecha.orden || this.filtroFecha.fechaDesde || this.filtroFecha.fechaHasta) {
      datosFiltrados = this.aplicarFiltroFechaADatos(datosFiltrados);
    }

    this.historialFiltrado = datosFiltrados;
    this.paginaActual = 1; // Siempre volver a la página 1 al aplicar un filtro
    this.actualizarPaginacion();
  }

  aplicarFiltroFechaADatos(datos: HistorialCaratula[]): HistorialCaratula[] {
    let datosFiltrados = [...datos];
    if (this.filtroFecha.fechaDesde) {
      const desde = new Date(this.filtroFecha.fechaDesde);
      datosFiltrados = datosFiltrados.filter(item => new Date(item.fecha_envio) >= desde);
    }
    if (this.filtroFecha.fechaHasta) {
      const hasta = new Date(this.filtroFecha.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      datosFiltrados = datosFiltrados.filter(item => new Date(item.fecha_envio) <= hasta);
    }
    if (this.filtroFecha.orden) {
      datosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.fecha_envio).getTime();
        const fechaB = new Date(b.fecha_envio).getTime();
        return this.filtroFecha.orden === 'asc' ? fechaA - fechaB : fechaB - fechaA;
      });
    }
    return datosFiltrados;
  }

  aplicarFiltroFecha(filtro: any) {
    this.filtroFecha = filtro;
    this.aplicarFiltros();
  }

  limpiarFiltroFecha() {
    this.filtroFecha = { orden: null, fechaDesde: '', fechaHasta: '' };
    this.aplicarFiltros();
  }

  onFiltroNombreEvacChange(nombres: string[]) { this.filtroNombreEvac = nombres; this.aplicarFiltros(); }
  onFiltroUsuarioChange(usuarios: string[]) { this.filtroUsuario = usuarios; this.aplicarFiltros(); }
  onFiltroClienteChange(clientes: string[]) { this.filtroCliente = clientes; this.aplicarFiltros(); }
  onFiltroCorreoChange(correos: string[]) { this.filtroCorreo = correos; this.aplicarFiltros(); }

  limpiarTodosFiltros() {
    this.filtroNombreEvac = [];
    this.filtroUsuario = [];
    this.filtroCliente = [];
    this.filtroCorreo = [];
    this.limpiarFiltroFecha();
    // No es necesario llamar a aplicarFiltros() de nuevo si limpiarFiltroFecha ya lo hace.
  }

  get historialPaginado(): HistorialCaratula[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.historialFiltrado.slice(inicio, fin);
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.historialFiltrado.length / this.itemsPorPagina);
    if (this.totalPaginas === 0) {
      this.totalPaginas = 1;
    }
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarItemsPorPagina(items: any) {
    this.itemsPorPagina = Number(items);
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
  }

  formatearHora(hora: string): string {
    if (!hora || !hora.includes(':')) return hora;
    const [horas, minutos] = hora.split(':');
    let horasNum = parseInt(horas, 10);
    const ampm = horasNum >= 12 ? 'pm' : 'am';
    horasNum = horasNum % 12 || 12;
    return `${horasNum}:${minutos} ${ampm}`;
  }
  
  get tieneFiltrosActivos(): boolean {
    return this.filtroNombreEvac.length > 0 || this.filtroUsuario.length > 0 ||
           this.filtroCliente.length > 0 || this.filtroCorreo.length > 0 ||
           this.filtroFecha.orden !== null || this.filtroFecha.fechaDesde !== '' || this.filtroFecha.fechaHasta !== '';
  }

  exportarAExcel(): void {
    const dataParaExcel = this.historialFiltrado.map(item => ({
      'Nombre Evac': item.nombre_usuario,
      'Usuario Evac': item.usuario_envio,
      'Distribuidor': item.cliente_nombre,
      'Clave Distribuidor': item.clave_cliente,
      'Correo Remitente': item.correo_remitente,
      'Correo Destinatario': item.correo_destinatario,
      'Fecha de Envío': this.formatearFecha(item.fecha_envio),
      'Hora de Envío': this.formatearHora(item.hora_envio)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const anchosDeColumna = Object.keys(dataParaExcel[0]).map(columna => {
      const anchoMaximo = dataParaExcel.reduce((max, fila) => Math.max(max, String(fila[columna as keyof typeof fila] || '').length), columna.length);
      return { wch: anchoMaximo + 2 };
    });
    worksheet['!cols'] = anchosDeColumna;
    const workbook: XLSX.WorkBook = { Sheets: { 'Historial': worksheet }, SheetNames: ['Historial'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, `historial_caratulas_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}