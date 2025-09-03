import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FiltroComponent } from '../../../components/filtro/filtro.component';
import { FiltroFechaComponent } from '../../../components/filtro-fecha/filtro-fecha.component';
import { EmailService, HistorialCaratula } from '../../../services/email.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

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
  itemsPorPagina = 30;
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

  // Filtro de fecha
  filtroFecha: any = {
    orden: null,
    fechaDesde: '',
    fechaHasta: ''
  };

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
        this.error = 'Error al cargar el historial';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  prepararOpcionesFiltros() {
    const nombresEvacUnicos = new Set(this.historial.map(item => item.nombre_usuario));
    this.nombreEvacOptions = Array.from(nombresEvacUnicos).map(nombre => ({
      value: nombre,
      selected: false
    }));

    // Preparar opciones para filtro de usuarios
    const usuariosUnicos = new Set(this.historial.map(item => item.usuario_envio));
    this.usuariosOptions = Array.from(usuariosUnicos).map(usuario => ({
      value: usuario,
      selected: false
    }));

    // Preparar opciones para filtro de clientes
    const clientesUnicos = new Set(this.historial.map(item => item.cliente_nombre));
    this.clientesOptions = Array.from(clientesUnicos).map(cliente => ({
      value: cliente,
      selected: false
    }));

    // Preparar opciones para filtro de correos
    const correosUnicos = new Set(this.historial.map(item => item.correo_destinatario));
    this.correosOptions = Array.from(correosUnicos).map(correo => ({
      value: correo,
      selected: false
    }));
  }

  aplicarFiltros() {
    let datosFiltrados = this.historial;

    // Aplicar filtro de nombres evacuados
    if (this.filtroNombreEvac.length > 0) {
      datosFiltrados = datosFiltrados.filter(item =>
        this.filtroNombreEvac.includes(item.nombre_usuario)
      );
    }

    // Aplicar filtro de usuarios
    if (this.filtroUsuario.length > 0) {
      datosFiltrados = datosFiltrados.filter(item =>
        this.filtroUsuario.includes(item.usuario_envio)
      );
    }

    // Aplicar filtro de clientes
    if (this.filtroCliente.length > 0) {
      datosFiltrados = datosFiltrados.filter(item =>
        this.filtroCliente.includes(item.cliente_nombre)
      );
    }

    // Aplicar filtro de correos
    if (this.filtroCorreo.length > 0) {
      datosFiltrados = datosFiltrados.filter(item =>
        this.filtroCorreo.includes(item.correo_destinatario)
      );
    }

    // Aplicar filtro de fecha
    if (this.filtroFecha.orden || this.filtroFecha.fechaDesde || this.filtroFecha.fechaHasta) {
      datosFiltrados = this.aplicarFiltroFechaADatos(datosFiltrados);
    }

    this.historialFiltrado = datosFiltrados;
    this.totalPaginas = Math.ceil(this.historialFiltrado.length / this.itemsPorPagina);

    // Asegurar que la página actual sea válida
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas > 0 ? this.totalPaginas : 1;
    }
  }

  aplicarFiltroFechaADatos(datos: HistorialCaratula[]): HistorialCaratula[] {
    let datosFiltrados = [...datos];

    // Filtrar por rango de fechas
    if (this.filtroFecha.fechaDesde) {
      const desde = new Date(this.filtroFecha.fechaDesde);
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaItem = new Date(item.fecha_envio);
        return fechaItem >= desde;
      });
    }

    if (this.filtroFecha.fechaHasta) {
      const hasta = new Date(this.filtroFecha.fechaHasta);
      // Ajustar para incluir todo el día
      hasta.setHours(23, 59, 59, 999);
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaItem = new Date(item.fecha_envio);
        return fechaItem <= hasta;
      });
    }

    // Ordenar por fecha
    if (this.filtroFecha.orden) {
      datosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.fecha_envio).getTime();
        const fechaB = new Date(b.fecha_envio).getTime();

        if (this.filtroFecha.orden === 'asc') {
          return fechaA - fechaB;
        } else {
          return fechaB - fechaA;
        }
      });
    }

    return datosFiltrados;
  }

  aplicarFiltroFecha(filtro: any) {
    this.filtroFecha = filtro;
    this.aplicarFiltros();
  }

  limpiarFiltroFecha() {
    this.filtroFecha = {
      orden: null,
      fechaDesde: '',
      fechaHasta: ''
    };
    this.aplicarFiltros();
  }

  onFiltroNombreEvacChange(nombres: string[]) {
    this.filtroNombreEvac = nombres;
    this.aplicarFiltros();
  }

  onFiltroUsuarioChange(usuarios: string[]) {
    this.filtroUsuario = usuarios;
    this.aplicarFiltros();
  }

  onFiltroClienteChange(clientes: string[]) {
    this.filtroCliente = clientes;
    this.aplicarFiltros();
  }

  onFiltroCorreoChange(correos: string[]) {
    this.filtroCorreo = correos;
    this.aplicarFiltros();
  }

  limpiarTodosFiltros() {
    this.filtroNombreEvac = [];
    this.filtroUsuario = [];
    this.filtroCliente = [];
    this.filtroCorreo = [];
    this.limpiarFiltroFecha();
  }

  get historialPaginado(): HistorialCaratula[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.historialFiltrado.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarItemsPorPagina(event: any) {
    this.itemsPorPagina = Number(event.target.value);
    this.totalPaginas = Math.ceil(this.historialFiltrado.length / this.itemsPorPagina);
    this.paginaActual = 1;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  get tieneFiltrosActivos(): boolean {
    return this.filtroNombreEvac.length > 0 ||
      this.filtroUsuario.length > 0 ||
      this.filtroCliente.length > 0 ||
      this.filtroCorreo.length > 0 ||
      this.filtroFecha.orden !== null ||
      this.filtroFecha.fechaDesde !== '' ||
      this.filtroFecha.fechaHasta !== '';
  }

  formatearHora(hora: string): string {
    if (hora.includes('am') || hora.includes('pm')) {
      return hora;
    }

    if (hora.includes(':')) {
      const [horas, minutos] = hora.split(':');
      let horasNum = parseInt(horas, 10);
      const ampm = horasNum >= 12 ? 'pm' : 'am';

      horasNum = horasNum % 12;
      horasNum = horasNum === 0 ? 12 : horasNum;

      return `${horasNum}:${minutos} ${ampm}`;
    }

    return hora;
  }
}