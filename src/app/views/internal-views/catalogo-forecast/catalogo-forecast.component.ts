import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface ProductoExcel {
  sku: string;
  nombre: string;
  color: string | null;
  talla: string | null;
  cargado_en: string;
}

interface CargaResult {
  cargados: number;
  total_filas_procesadas: number;
  duplicados_actualizados: number;
  advertencias: string[];
}

@Component({
  selector: 'app-catalogo-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogo-forecast.component.html',
  styleUrls: ['./catalogo-forecast.component.css']
})
export class CatalogoForecastComponent implements OnInit {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Estado general
  totalCargados = 0;
  cargandoEstado = false;

  // Upload
  archivoSeleccionado: File | null = null;
  subiendo = false;
  resultadoCarga: CargaResult | null = null;
  errorCarga: string | null = null;
  arrastrando = false;

  // Tabla de productos
  productos: ProductoExcel[] = [];
  cargandoProductos = false;
  busqueda = '';
  paginaActual = 1;
  elementosPorPagina = 50;
  totalProductos = 0;

  // Confirmación limpiar
  mostrarConfirmLimpiar = false;
  limpiando = false;

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalProductos / this.elementosPorPagina));
  }

  ngOnInit(): void {
    this.cargarEstado();
    this.cargarProductos();
  }

  cargarEstado(): void {
    this.cargandoEstado = true;
    this.http.get<{ total_productos: number }>(`${this.apiUrl}/forecast/catalogo-excel`)
      .subscribe({
        next: r => {
          this.totalCargados = r.total_productos;
          this.cargandoEstado = false;
        },
        error: () => { this.cargandoEstado = false; }
      });
  }

  cargarProductos(): void {
    this.cargandoProductos = true;
    const offset = (this.paginaActual - 1) * this.elementosPorPagina;
    const params: Record<string, string | number> = {
      limit: this.elementosPorPagina,
      offset
    };
    if (this.busqueda.trim()) params['q'] = this.busqueda.trim();

    this.http.get<{ total: number; productos: ProductoExcel[] }>(
      `${this.apiUrl}/forecast/catalogo-excel/lista`, { params }
    ).subscribe({
      next: r => {
        this.productos = r.productos;
        this.totalProductos = r.total;
        this.cargandoProductos = false;
      },
      error: () => { this.cargandoProductos = false; }
    });
  }

  onBusqueda(): void {
    this.paginaActual = 1;
    this.cargarProductos();
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
    this.cargarProductos();
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.arrastrando = true;
  }

  onDragLeave(): void {
    this.arrastrando = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.arrastrando = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.seleccionarArchivo(file);
  }

  onFileInput(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.seleccionarArchivo(file);
  }

  seleccionarArchivo(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) {
      this.errorCarga = 'Solo se aceptan archivos Excel (.xlsx o .xls)';
      return;
    }
    this.archivoSeleccionado = file;
    this.resultadoCarga = null;
    this.errorCarga = null;
  }

  limpiarSeleccion(): void {
    this.archivoSeleccionado = null;
    this.resultadoCarga = null;
    this.errorCarga = null;
  }

  subirArchivo(): void {
    if (!this.archivoSeleccionado) return;
    this.subiendo = true;
    this.resultadoCarga = null;
    this.errorCarga = null;

    const fd = new FormData();
    fd.append('file', this.archivoSeleccionado);

    this.http.post<CargaResult>(`${this.apiUrl}/forecast/catalogo-excel`, fd)
      .subscribe({
        next: r => {
          this.resultadoCarga = r;
          this.subiendo = false;
          this.archivoSeleccionado = null;
          this.cargarEstado();
          this.paginaActual = 1;
          this.cargarProductos();
        },
        error: err => {
          this.errorCarga = err.error?.error || 'Error al subir el archivo';
          this.subiendo = false;
        }
      });
  }

  // ── Limpiar catálogo ─────────────────────────────────────────────────────

  confirmarLimpiar(): void {
    this.mostrarConfirmLimpiar = true;
  }

  cancelarLimpiar(): void {
    this.mostrarConfirmLimpiar = false;
  }

  ejecutarLimpiar(): void {
    this.limpiando = true;
    this.http.delete<{ eliminados: number }>(`${this.apiUrl}/forecast/catalogo-excel`)
      .subscribe({
        next: () => {
          this.limpiando = false;
          this.mostrarConfirmLimpiar = false;
          this.productos = [];
          this.totalProductos = 0;
          this.cargarEstado();
        },
        error: err => {
          this.errorCarga = err.error?.error || 'Error al limpiar el catálogo';
          this.limpiando = false;
          this.mostrarConfirmLimpiar = false;
        }
      });
  }

  formatearFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
