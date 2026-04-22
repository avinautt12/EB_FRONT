import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CatalogoExcelService, ProductoExcel, RespuestaUpload } from '../../services/catalogo-excel.service';
import { AlertaService } from '../../services/alerta.service';

@Component({
  selector: 'app-cargar-catalogo-proyecciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargar-catalogo-proyecciones.component.html',
  styleUrls: ['./cargar-catalogo-proyecciones.component.css']
})
export class CargarCatalogoproyeccionesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estado
  cargando = false;
  productos: ProductoExcel[] = [];
  productosFiltrados: ProductoExcel[] = [];
  archivo: File | null = null;
  busqueda = '';
  paginaActual = 1;
  registrosPorPagina = 20;
  totalProductos = 0;

  // Modal
  mostrarModal = false;
  modalCargando = false;
  mensajeCarga = '';
  estadoUpload: 'pendiente' | 'cargando' | 'exitoso' | 'error' = 'pendiente';

  constructor(
    private catalogoService: CatalogoExcelService,
    private alerta: AlertaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Abre el modal de carga
   */
  abrirModalCarga(): void {
    this.mostrarModal = true;
    this.estadoUpload = 'pendiente';
    this.archivo = null;
    this.mensajeCarga = '';
  }

  /**
   * Cierra el modal
   */
  cerrarModal(): void {
    this.mostrarModal = false;
    this.archivo = null;
    this.estadoUpload = 'pendiente';
    this.mensajeCarga = '';
  }

  /**
   * Maneja la selección de archivo
   */
  seleccionarArchivo(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const archivo = files[0];
      
      // Validar que sea Excel
      if (!this.esArchivoExcel(archivo)) {
        this.alerta.mostrarError('Por favor selecciona un archivo Excel (.xlsx)');
        return;
      }

      this.archivo = archivo;
      this.mensajeCarga = `Archivo seleccionado: ${archivo.name}`;
    }
  }

  /**
   * Valida si es un archivo Excel
   */
  private esArchivoExcel(archivo: File): boolean {
    const tiposPermitidos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const extensionValida = archivo.name.toLowerCase().endsWith('.xlsx') || 
                           archivo.name.toLowerCase().endsWith('.xls');
    
    return tiposPermitidos.includes(archivo.type) || extensionValida;
  }

  /**
   * Sube el archivo seleccionado
   */
  subirArchivo(): void {
    if (!this.archivo) {
      this.alerta.mostrarError('Por favor selecciona un archivo');
      return;
    }

    this.estadoUpload = 'cargando';
    this.modalCargando = true;
    this.mensajeCarga = 'Procesando archivo...';

    this.catalogoService.subirArchivo(this.archivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: RespuestaUpload) => {
          this.estadoUpload = 'exitoso';
          this.mensajeCarga = `✅ ${respuesta.message}\n• Productos cargados: ${respuesta.productos_cargados}\n• Duplicados: ${respuesta.duplicados}`;
          this.modalCargando = false;
          this.alerta.mostrarExito(`${respuesta.productos_cargados} productos cargados exitosamente`);
          
          // Recarga los productos en 2 segundos
          setTimeout(() => {
            this.cerrarModal();
            this.cargarProductos();
          }, 2000);
        },
        error: (error) => {
          this.estadoUpload = 'error';
          const mensajeError = error.error?.message || 'Error al cargar el archivo';
          this.mensajeCarga = `❌ ${mensajeError}`;
          this.modalCargando = false;
          this.alerta.mostrarError(mensajeError);
        }
      });
  }

  /**
   * Carga la lista de productos
   */
  cargarProductos(): void {
    this.cargando = true;
    const offset = (this.paginaActual - 1) * this.registrosPorPagina;
    
    this.catalogoService.obtenerProductos(this.busqueda, this.registrosPorPagina, offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productos = data.productos;
          this.totalProductos = data.total;
          this.aplicarFiltro();
          this.cargando = false;
        },
        error: () => {
          this.alerta.mostrarError('Error al cargar productos');
          this.cargando = false;
        }
      });
  }

  /**
   * Aplica filtro de búsqueda local
   */
  aplicarFiltro(): void {
    if (!this.busqueda.trim()) {
      this.productosFiltrados = this.productos;
      return;
    }

    const busquedaLower = this.busqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p =>
      p.sku.toLowerCase().includes(busquedaLower) ||
      p.nombre.toLowerCase().includes(busquedaLower) ||
      (p.color && p.color.toLowerCase().includes(busquedaLower))
    );
  }

  /**
   * Elimina un producto específico
   */
  eliminarProducto(sku: string, nombre: string): void {
    if (!confirm(`¿Eliminar "${nombre}"?`)) {
      return;
    }

    this.catalogoService.eliminarProducto(sku)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alerta.mostrarExito(`Producto "${nombre}" eliminado`);
          this.cargarProductos();
        },
        error: (error) => {
          const mensajeError = error.error?.message || 'Error al eliminar';
          this.alerta.mostrarError(mensajeError);
        }
      });
  }

  /**
   * Vacía el catálogo completo
   */
  vaciarCatalogo(): void {
    if (!confirm('⚠️ ¿Estás seguro de que deseas vaciar TODO el catálogo? Esta acción no se puede deshacer.')) {
      return;
    }

    this.cargando = true;
    this.catalogoService.vaciarCatalogo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alerta.mostrarExito('Catálogo vaciado correctamente');
          this.productos = [];
          this.productosFiltrados = [];
          this.totalProductos = 0;
          this.paginaActual = 1;
          this.cargando = false;
        },
        error: (error) => {
          const mensajeError = error.error?.message || 'Error al vaciar';
          this.alerta.mostrarError(mensajeError);
          this.cargando = false;
        }
      });
  }

  /**
   * Cambia de página
   */
  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarProductos();
  }

  /**
   * Calcula el total de páginas
   */
  get totalPaginas(): number {
    return Math.ceil(this.totalProductos / this.registrosPorPagina);
  }

  /**
   * Obtiene el rango de productos actual
   */
  get rango(): string {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.registrosPorPagina, this.totalProductos);
    return `${inicio}-${fin}`;
  }
}
