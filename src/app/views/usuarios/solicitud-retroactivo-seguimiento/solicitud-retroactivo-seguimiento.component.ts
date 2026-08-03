import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import {
  SolicitudRetroactivoService,
  SolicitudRetroactivo
} from '../../../services/solicitud-retroactivo.service';

// GUÍA: colores de badge por estatus -- mismo patrón que COLOR_ESTATUS en
// garantias-usuario.component.ts.
const COLOR_ESTATUS: Record<string, string> = {
  pendiente: '#f0ad4e',
  validado:  '#4caf50',
  rechazado: '#e53935',
};

// GUÍA: mismo patrón de 2 estados que la vista de garantias-usuario (lista
// <-> detalle), pero DENTRO de esta página en vez de navegar al formulario
// -- info completa, estatus por archivo con preview, historial de cambios,
// y reenvío inline de los archivos rechazados sin salir de aquí.
@Component({
  selector: 'app-solicitud-retroactivo-seguimiento',
  imports: [CommonModule, FormsModule, RouterModule, TopBarUsuariosComponent],
  templateUrl: './solicitud-retroactivo-seguimiento.component.html',
  styleUrl: './solicitud-retroactivo-seguimiento.component.css'
})
export class SolicitudRetroactivoSeguimientoComponent implements OnInit {
  cargando = true;
  error = '';
  solicitudes: SolicitudRetroactivo[] = [];

  vista: 'lista' | 'detalle' = 'lista';
  seleccionada: SolicitudRetroactivo | null = null;

  archivosNuevos: { [key: string]: File } = {};
  reenviando = false;
  errorReenvio = '';
  mensajeReenvioExito = '';

  // ── Filtros y paginación de lista (mismo patrón que garantias-usuario) ──
  busqueda = '';
  filtroEstatus = '';
  filtroCampana = '';
  paginaActual = 1;
  readonly tamPagina = 15;

  camposArchivos = [
    { key: 'ticket_compra', label: 'Ticket de compra', accept: 'image/*,.pdf' },
    { key: 'voucher', label: 'Voucher de pago', accept: 'image/*,.pdf' },
    { key: 'factura_pdf', label: 'Factura (PDF)', accept: '.pdf' },
    { key: 'factura_xml', label: 'Factura (XML)', accept: '.xml' }
  ];

  constructor(private service: SolicitudRetroactivoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.misSolicitudes().subscribe({
      next: (res) => {
        this.solicitudes = res;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar tus solicitudes.';
        this.cargando = false;
      }
    });
  }

  private docsRechazados(s: SolicitudRetroactivo): string[] {
    return Object.entries(s.validacion_docs ?? {})
      .filter(([, estatus]) => estatus === 'rechazado')
      .map(([doc]) => doc);
  }

  colorEstatus(estatus: string): string {
    return COLOR_ESTATUS[estatus?.toLowerCase()] ?? '#888';
  }

  // ── Filtrado y paginación de lista ───────────────────────────────────────────

  get campanasDisponibles(): string[] {
    const set = new Set(this.solicitudes.map(s => s.nombre_formulario).filter(Boolean));
    return Array.from(set).sort();
  }

  get estatusDisponibles(): string[] {
    const set = new Set(this.solicitudes.map(s => s.estatus).filter(Boolean));
    return Array.from(set).sort();
  }

  get solicitudesFiltradas(): SolicitudRetroactivo[] {
    const q = this.busqueda.toLowerCase().trim();
    return this.solicitudes.filter(s => {
      if (q && !s.modelo_bicicleta?.toLowerCase().includes(q) && !s.numero_serie?.toLowerCase().includes(q)) return false;
      if (this.filtroEstatus && s.estatus !== this.filtroEstatus) return false;
      if (this.filtroCampana && s.nombre_formulario !== this.filtroCampana) return false;
      return true;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.solicitudesFiltradas.length / this.tamPagina));
  }

  get solicitudesPaginadas(): SolicitudRetroactivo[] {
    const inicio = (this.paginaActual - 1) * this.tamPagina;
    return this.solicitudesFiltradas.slice(inicio, inicio + this.tamPagina);
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  resetFiltros(): void {
    this.busqueda = '';
    this.filtroEstatus = '';
    this.filtroCampana = '';
    this.paginaActual = 1;
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  onFiltroChange(): void {
    this.paginaActual = 1;
  }

  // ═══════════════ Vista de detalle ═══════════════

  verDetalle(s: SolicitudRetroactivo): void {
    this.seleccionada = s;
    this.vista = 'detalle';
    this.archivosNuevos = {};
    this.errorReenvio = '';
    this.mensajeReenvioExito = '';
  }

  volverALista(): void {
    this.vista = 'lista';
    this.seleccionada = null;
  }

  documentos(s: SolicitudRetroactivo) {
    return this.camposArchivos.map(c => ({
      ...c,
      url: s.archivos?.[c.key]?.url ?? null,
      estatus: s.archivos?.[c.key]?.estatus ?? s.validacion_docs?.[c.key] ?? 'pendiente'
    }));
  }

  // GUÍA: el backend regresa fecha_venta como string RFC ("Sat, 01 Aug 2026
  // 00:00:00 GMT"), no ISO -- ver el mismo fix en solicitud-retroactivo.component.ts.
  private formatFechaISO(fecha: string): string {
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  onFileSelect(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivosNuevos[key] = input.files[0];
    }
  }

  faltanArchivosPorSeleccionar(s: SolicitudRetroactivo): boolean {
    return this.docsRechazados(s).some(key => !this.archivosNuevos[key]);
  }

  // GUÍA: el backend exige TODOS los archivos rechazados en un solo PUT (ver
  // editar_venta en el backend) -- no se puede reenviar uno a la vez si hay
  // más de uno marcado rechazado.
  reenviar(s: SolicitudRetroactivo): void {
    this.errorReenvio = '';
    if (this.faltanArchivosPorSeleccionar(s)) {
      this.errorReenvio = 'Selecciona todos los archivos rechazados antes de reenviar.';
      return;
    }

    const formData = new FormData();
    formData.append('id_formulario', String(s.id_formulario));
    formData.append('id_msi', String(s.id_msi));
    formData.append('nombre_sucursal', s.nombre_sucursal);
    formData.append('correo_electronico', s.correo_electronico);
    formData.append('nombre_completo', s.nombre_completo);
    formData.append('fecha_venta', this.formatFechaISO(s.fecha_venta));
    formData.append('modelo_bicicleta', s.modelo_bicicleta);
    formData.append('numero_serie', s.numero_serie);
    formData.append('precio_publico', s.precio_publico);
    if (s.id_marca_bicicleta) formData.append('id_marca_bicicleta', String(s.id_marca_bicicleta));

    this.docsRechazados(s).forEach(key => {
      formData.append(key, this.archivosNuevos[key], this.archivosNuevos[key].name);
    });

    this.reenviando = true;
    this.service.actualizarVenta(s.id, formData).subscribe({
      next: () => {
        this.reenviando = false;
        this.mensajeReenvioExito = '¡Solicitud actualizada y enviada de nuevo a revisión!';
        this.archivosNuevos = {};
        this.recargarSeleccionada(s.id);
      },
      error: (err) => {
        this.reenviando = false;
        this.errorReenvio = err.error?.error || 'Ocurrió un error al reenviar la solicitud.';
      }
    });
  }

  private recargarSeleccionada(id: number): void {
    this.service.misSolicitudes().subscribe({
      next: (res) => {
        this.solicitudes = res;
        this.seleccionada = res.find(s => s.id === id) ?? null;
      }
    });
  }
}
