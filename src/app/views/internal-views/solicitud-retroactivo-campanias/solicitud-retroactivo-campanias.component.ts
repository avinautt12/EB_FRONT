import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';

// Servicio central de campañas
import { SolicitudRetroactivoCampaniasService } from '../../../services/solicitud-retroactivo-campanias.service';

// Componente Modal y sus modelos
import { ProductoCatalogoModalComponent } from '../../../components/producto-catalogo-modal/producto-catalogo-modal/producto-catalogo-modal.component';
import { ProductoDetalle } from '../../../components/producto-catalogo-modal/models/producto-catalogo.model';

// Modelos locales de la vista
import { CampaniaItem, FiltrosCampania, MsiOption } from './models/solicitud-campania.model';

@Component({
  selector: 'app-solicitud-retroactivo-campanias',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarUsuariosComponent, ProductoCatalogoModalComponent],
  templateUrl: './solicitud-retroactivo-campanias.component.html',
  styleUrl: './solicitud-retroactivo-campanias.component.css'
})
export class SolicitudRetroactivoCampaniasComponent implements OnInit {
  private readonly campaniasService = inject(SolicitudRetroactivoCampaniasService);

  // Control del Flujo de Pantallas
  modoVista: 'LISTADO' | 'FORMULARIO' = 'LISTADO';

  // Mensajes de estado inline (Sin Toasts ni Popups)
  mensajeListadoExito: string | null = null;
  mensajeListadoError: string | null = null;
  mensajeFormError: string | null = null;
  formEnviado: boolean = false;

  // Listas de datos
  campanias: CampaniaItem[] = [];
  campaniasFiltradas: CampaniaItem[] = [];
  msiList: MsiOption[] = [];
  productosSeleccionados: ProductoDetalle[] = [];

  // Filtros
  filtros: FiltrosCampania = {
    query: '',
    msi_id: null,
    activa: null,
    fecha_inicio: '',
    fecha_fin: ''
  };

  // Formulario local
  editandoId: number | null = null;
  formNombre: string = '';
  formFechaInicio: string = '';
  formFechaFin: string = '';
  formMsiId: number | null = null;
  formActiva: number = 1;

  // Modales y loaders
  modalVisible: boolean = false;
  loading: boolean = false;
  saving: boolean = false;

  ngOnInit(): void {
    this.cargarOpcionesMsi();
    this.cargarCampanias();
  }

  /**
   * Carga la lista de opciones MSI para los selects.
   */
  cargarOpcionesMsi(): void {
    this.campaniasService.getMsi().subscribe({
      next: (msi) => (this.msiList = msi),
      error: () => (this.mensajeListadoError = 'Error al consultar las opciones de MSI.')
    });
  }

  /**
   * Carga el listado de campañas desde la API.
   */
  cargarCampanias(): void {
    this.loading = true;
    this.mensajeListadoError = null;
    this.campaniasService.getCampanias().subscribe({
      next: (res) => {
        this.campanias = res;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.mensajeListadoError = 'Error al consultar el listado de campañas.';
      }
    });
  }

  /**
   * Aplica los filtros de Búsqueda, MSI y Estado en memoria.
   */
  aplicarFiltros(): void {
    this.campaniasFiltradas = this.campanias.filter((item) => {
      // 1. Filtro por nombre
      const queryVal = (this.filtros.query || '').trim().toLowerCase();
      const matchQuery = !queryVal || item.nombre.toLowerCase().includes(queryVal);

      // 2. Filtro por MSI
      const matchMsi =
        this.filtros.msi_id === null ||
        this.filtros.msi_id === undefined ||
        String(this.filtros.msi_id) === '' ||
        Number(item.msi_id) === Number(this.filtros.msi_id);

      // 3. Filtro por Estado (1 = Activa, 0 = Inactiva)
      const matchActiva =
        this.filtros.activa === null ||
        this.filtros.activa === undefined ||
        String(this.filtros.activa) === '' ||
        Number(item.activa) === Number(this.filtros.activa);

      return matchQuery && matchMsi && matchActiva;
    });
  }

  /**
   * Formatea la representación de MSI en texto legible (Ej. '12 MSI - 8.50%').
   */
  obtenerTextoMsi(msiId: number): string {
    const msi = this.msiList.find((m) => m.id === Number(msiId));
    if (!msi) return `${msiId} MSI`;
    return `${msi.plazo_meses} MSI - ${Number(msi.porcentaje).toFixed(2)}%`;
  }

 /**
   * Convierte formatos GMT o cadenas de fecha a 'YYYY-MM-DD' para <input type="date">.
   */
  normalizarFechaInput(fechaRaw: any): string {
    if (!fechaRaw) return '';

    const fecha = new Date(fechaRaw);
    if (isNaN(fecha.getTime())) return '';

    const yyyy = fecha.getUTCFullYear();
    const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getUTCDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Prepara el formulario para registrar una nueva campaña.
   */
  nuevaCampania(): void {
    this.editandoId = null;
    this.formNombre = '';
    this.formFechaInicio = '';
    this.formFechaFin = '';
    this.formMsiId = null;
    this.formActiva = 1;
    this.productosSeleccionados = [];
    this.formEnviado = false;
    this.mensajeFormError = null;
    this.modoVista = 'FORMULARIO';
  }

  /**
  * Carga los datos de una campaña en el formulario para edición.
  */
  editarCampania(campania: CampaniaItem): void {
    this.editandoId = campania.id;
    this.formNombre = campania.nombre;

    // Asignación de fechas garantizando formato YYYY-MM-DD
    this.formFechaInicio = this.normalizarFechaInput(campania.fecha_inicio);
    this.formFechaFin = this.normalizarFechaInput(campania.fecha_fin);

    this.formMsiId = campania.msi_id;
    this.formActiva = campania.activa;
    this.productosSeleccionados = [...(campania.productos || [])];
    this.formEnviado = false;
    this.mensajeFormError = null;
    this.modoVista = 'FORMULARIO';
  }

  /**
   * Regresa de la pantalla de formulario al listado general.
   */
  volverAlListado(): void {
    this.modoVista = 'LISTADO';
    this.formEnviado = false;
    this.mensajeFormError = null;
  }

  /**
   * Elimina una campaña previa confirmación del usuario.
   */
  eliminarCampania(id: number): void {
    if (!confirm('¿Desea eliminar esta campaña?')) return;

    this.campaniasService.deleteCampania(id).subscribe({
      next: () => {
        this.mensajeListadoExito = 'Campaña eliminada correctamente.';
        this.cargarCampanias();
        setTimeout(() => (this.mensajeListadoExito = null), 4000);
      },
      error: () => {
        this.mensajeListadoError = 'No se pudo eliminar la campaña.';
      }
    });
  }

  /**
   * Agrega productos devueltos por el Modal evitando duplicados por ID.
   */
  onProductosAgregados(nuevosProductos: ProductoDetalle[]): void {
    const mapaActual = new Map(this.productosSeleccionados.map((p) => [p.id, p]));
    nuevosProductos.forEach((p) => mapaActual.set(p.id, p));
    this.productosSeleccionados = Array.from(mapaActual.values());
  }

  /**
   * Quita un producto de la tabla local del formulario.
   */
  quitarProducto(idProductoDetalle: number): void {
    this.productosSeleccionados = this.productosSeleccionados.filter((p) => p.id !== idProductoDetalle);
  }

  /**
   * Valida y guarda los datos de la campaña (POST / PUT).
   */
  guardarCampania(): void {
    this.formEnviado = true;
    this.mensajeFormError = null;

    if (!this.formNombre || !this.formFechaInicio || !this.formFechaFin || !this.formMsiId) {
      this.mensajeFormError = 'Por favor complete todos los campos obligatorios del formulario.';
      return;
    }

    const payload = {
      nombre: this.formNombre,
      fecha_inicio: this.formFechaInicio,
      fecha_fin: this.formFechaFin,
      msi_id: Number(this.formMsiId),
      activa: Number(this.formActiva),
      productos: this.productosSeleccionados.map((p) => p.id)
    };

    this.saving = true;

    if (this.editandoId) {
      this.campaniasService.updateCampania(this.editandoId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.mensajeListadoExito = `Campaña "${this.formNombre}" actualizada correctamente.`;
          this.volverAlListado();
          this.cargarCampanias();
          setTimeout(() => (this.mensajeListadoExito = null), 4000);
        },
        error: () => {
          this.saving = false;
          this.mensajeFormError = 'Ocurrió un error al intentar actualizar la campaña.';
        }
      });
    } else {
      this.campaniasService.createCampania(payload).subscribe({
        next: () => {
          this.saving = false;
          this.mensajeListadoExito = `Campaña "${this.formNombre}" creada correctamente.`;
          this.volverAlListado();
          this.cargarCampanias();
          setTimeout(() => (this.mensajeListadoExito = null), 4000);
        },
        error: () => {
          this.saving = false;
          this.mensajeFormError = 'Ocurrió un error al intentar crear la campaña.';
        }
      });
    }
  }
}