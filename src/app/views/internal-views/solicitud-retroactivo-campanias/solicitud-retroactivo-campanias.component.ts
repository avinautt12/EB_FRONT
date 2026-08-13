import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudRetroactivoCampaniasService } from '../../../services/solicitud-retroactivo-campanias.service';
import { CampaniaItem, MsiOption, CrearCampaniaPayload } from './models/solicitud-campania.model';
import { ProductoDetalle } from '../../../components/producto-catalogo-modal/models/producto-catalogo.model';
import { ProductoCatalogoModalComponent } from '../../../components/producto-catalogo-modal/producto-catalogo-modal/producto-catalogo-modal.component';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';

@Component({
  selector: 'app-solicitud-retroactivo-campanias',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarUsuariosComponent, ProductoCatalogoModalComponent],
  templateUrl: './solicitud-retroactivo-campanias.component.html',
  styleUrl: './solicitud-retroactivo-campanias.component.css'
})
export class SolicitudRetroactivoCampaniasComponent implements OnInit {
  private readonly campaniasService = inject(SolicitudRetroactivoCampaniasService);

  // Estados de vista
  modoFormulario: boolean = false;
  editandoId: number | null = null;
  guardando: boolean = false;

  // Mensajes de alerta
  alertMsj: string | null = null;
  alertTipo: 'success' | 'error' = 'success';

  // Catálogos y Datos
  campanias: CampaniaItem[] = [];
  msiList: MsiOption[] = [];
  selectedProductos: ProductoDetalle[] = [];

  // Control del Modal de Catálogo
  modalCatalogoVisible: boolean = false;

  // Filtros del Listado
  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';

  // Formulario
  formNombre: string = '';
  formFechaInicio: string = '';
  formFechaFin: string = '';
  formMsiId: number | null = null;
  formActiva: boolean = true;

  ngOnInit(): void {
    this.cargarMsi();
    this.cargarCampanias();
  }

  // --- MÉTODOS DE CARGA DE DATOS ---
  cargarMsi(): void {
    this.campaniasService.getMsi().subscribe({
      next: (res) => (this.msiList = res),
      error: (err) => console.error('Error al cargar MSI:', err)
    });
  }

  cargarCampanias(): void {
    this.campaniasService.getCampanias().subscribe({
      next: (res) => (this.campanias = res),
      error: () => this.mostrarAlerta('Error al cargar la lista de campañas.', 'error')
    });
  }

  // --- FILTRADO EN LISTADO ---
  get campaniasFiltradas(): CampaniaItem[] {
    return this.campanias.filter((c) => {
      const cumpleTexto =
        !this.filtroTexto.trim() ||
        c.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase());

      let cumpleEstado = true;
      if (this.filtroEstado === 'ACTIVAS') cumpleEstado = !!c.activa;
      if (this.filtroEstado === 'INACTIVAS') cumpleEstado = !c.activa;

      return cumpleTexto && cumpleEstado;
    });
  }

  // --- NAVEGACIÓN Y ACCIONES DEL FORMULARIO ---
  nuevaCampania(): void {
    this.limpiarFormulario();
    this.modoFormulario = true;
  }

  cancelarFormulario(): void {
    this.limpiarFormulario();
    this.modoFormulario = false;
  }

  limpiarFormulario(): void {
    this.formNombre = '';
    this.formFechaInicio = '';
    this.formFechaFin = '';
    this.formMsiId = null;
    this.formActiva = true;
    this.selectedProductos = [];
    this.editandoId = null;
  }

  editarCampania(c: CampaniaItem): void {
    this.editandoId = c.id;
    this.formNombre = c.nombre;
    this.formFechaInicio = this.normalizarFecha(c.fecha_inicio);
    this.formFechaFin = this.normalizarFecha(c.fecha_fin);
    this.formMsiId = c.msi_id;
    this.formActiva = !!c.activa;

    // Procesar la lista de productos asociando los datos completos desde la API
    if (Array.isArray(c.productos)) {
      this.selectedProductos = c.productos
        .map((p: any) => {
          if (typeof p === 'string') {
            try {
              return JSON.parse(p);
            } catch {
              return null;
            }
          }
          return p;
        })
        .filter((p: any) => p !== null && typeof p === 'object');
    } else {
      this.selectedProductos = [];
    }

    this.modoFormulario = true;
  }

  guardarCampania(): void {
    if (!this.formNombre.trim()) {
      this.mostrarAlerta('El nombre de la campaña es obligatorio.', 'error');
      return;
    }
    if (!this.formFechaInicio || !this.formFechaFin) {
      this.mostrarAlerta('Las fechas de inicio y fin son obligatorias.', 'error');
      return;
    }
    if (!this.formMsiId) {
      this.mostrarAlerta('Debe seleccionar una opción de MSI.', 'error');
      return;
    }

    this.guardando = true;

    const payload: CrearCampaniaPayload = {
      nombre: this.formNombre.trim(),
      fecha_inicio: this.formFechaInicio,
      fecha_fin: this.formFechaFin,
      msi_id: this.formMsiId,
      activa: this.formActiva ? 1 : 0,
      productos: this.selectedProductos.map((p) => p.id)
    };

    const peticion$ = this.editandoId
      ? this.campaniasService.updateCampania(this.editandoId, payload)
      : this.campaniasService.createCampania(payload);

    peticion$.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarAlerta(
          this.editandoId ? 'Campaña actualizada correctamente.' : 'Campaña creada correctamente.',
          'success'
        );
        this.cargarCampanias();
        this.modoFormulario = false;
      },
      error: (err) => {
        this.guardando = false;
        this.mostrarAlerta(err.error?.error || 'Error al guardar la campaña.', 'error');
      }
    });
  }

  eliminarCampania(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;

    this.campaniasService.deleteCampania(id).subscribe({
      next: () => {
        this.mostrarAlerta('Campaña eliminada correctamente.', 'success');
        this.cargarCampanias();
      },
      error: () => this.mostrarAlerta('Error al eliminar la campaña.', 'error')
    });
  }

  // --- GESTIÓN DEL MODAL DE CATÁLOGO DE PRODUCTOS ---
  abrirModalCatalogo(): void {
    this.modalCatalogoVisible = true;
  }

  cerrarModalCatalogo(): void {
    this.modalCatalogoVisible = false;
  }

  onProductosSeleccionados(productos: ProductoDetalle[]): void {
    const idsExistentes = new Set(this.selectedProductos.map((p) => p.id));
    const nuevosUnicos = productos.filter((p) => !idsExistentes.has(p.id));

    this.selectedProductos = [...this.selectedProductos, ...nuevosUnicos];
  }

  quitarProducto(id: number): void {
    this.selectedProductos = this.selectedProductos.filter((p) => p.id !== id);
  }

  // --- HELPERS DE RENDERIZADO Y FECHAS ---
  obtenerNombreProducto(prod: any): string {
    if (!prod) return '-';
    if (typeof prod === 'string') return prod;
    return prod.modelo || prod.codigo || prod.sku || '-';
  }

  obtenerSkuProducto(prod: any): string {
    if (!prod) return '-';
    return typeof prod === 'object' && prod.sku ? prod.sku : '-';
  }

  obtenerVarianteProducto(prod: any): string {
    if (!prod || typeof prod !== 'object') return '';
    const detalles: string[] = [];
    if (prod.talla && prod.talla !== '-') detalles.push(`Talla: ${prod.talla}`);
    if (prod.color && prod.color !== '-') detalles.push(`Color: ${prod.color}`);
    return detalles.length > 0 ? detalles.join(' | ') : '-';
  }

  /**
   * Normaliza cualquier formato de fecha devuelto por la API a 'YYYY-MM-DD'
   * para que sea compatible con <input type="date">.
   */
  normalizarFecha(fecha: any): string {
    if (!fecha) return '';

    const fechaStr = String(fecha).trim();

    // 1. Si ya viene en formato ISO (ej. "2026-08-14" o "2026-08-14T00:00:00")
    if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
      return fechaStr.substring(0, 10);
    }

    // 2. Si viene como objeto Date o RFC 1123 de Flask (ej. "Fri, 14 Aug 2026 00:00:00 GMT")
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  mostrarAlerta(msj: string, tipo: 'success' | 'error'): void {
    this.alertMsj = msj;
    this.alertTipo = tipo;
    setTimeout(() => (this.alertMsj = null), 4000);
  }
}