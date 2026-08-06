import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import {
  ProyeccionesMY27Service,
  ProyeccionesMY27Response,
  ArticuloMY27,
  DesgloseDist,
} from '../../../services/proyecciones-my27.service';

@Component({
  selector: 'app-proyecciones-my27',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HomeBarComponent],
  templateUrl: './proyecciones-my27.component.html',
  styleUrl: './proyecciones-my27.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProyeccionesMY27Component implements OnInit {

  datos: ProyeccionesMY27Response | null = null;
  cargando = true;
  error = '';

  // Filtro de búsqueda
  busqueda = '';

  // Expansión de desglose por SKU
  expandidos = new Set<string>();

  // SKU seleccionado para modal de desglose
  articuloModal: ArticuloMY27 | null = null;
  modalAbierto = false;

  readonly mesesLabels = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
  readonly mesesKeys   = ['mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'enero', 'febrero', 'marzo', 'abril'];
  readonly periodo = '2026-2027';

  // --- Tab system ---
  activeTab: 'monitor' | 'inventario' = 'monitor';

  // --- Upload state ---
  archivoInventario: File | null = null;
  uploadEstado: 'idle' | 'cargando' | 'ok' | 'error' = 'idle';
  uploadResultado: { total: number; insertados: number; actualizados: number; errores: string[] } | null = null;

  // --- Inventario y cobertura ---
  inventarioMegamo: any[] = [];
  coberturaMegamo: any[] = [];
  coberturaFiltrada: any[] = [];
  cargandoCobertura = false;
  errorCobertura: string | null = null;
  filtroBusqueda = '';

  readonly MESES = [
    { key: 'mayo', label: 'May' }, { key: 'junio', label: 'Jun' },
    { key: 'julio', label: 'Jul' }, { key: 'agosto', label: 'Ago' },
    { key: 'septiembre', label: 'Sep' }, { key: 'octubre', label: 'Oct' },
    { key: 'noviembre', label: 'Nov' }, { key: 'diciembre', label: 'Dic' },
    { key: 'enero', label: 'Ene' }, { key: 'febrero', label: 'Feb' },
    { key: 'marzo', label: 'Mar' }, { key: 'abril', label: 'Abr' },
  ];

  constructor(
    private svc: ProyeccionesMY27Service,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(refresh = false): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();
    this.svc.getDatos('2026-2027', refresh).subscribe({
      next: (d) => {
        this.datos = d;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar proyecciones MY27.';
        this.cargando = false;
        this.cdr.markForCheck();
        console.error(err);
      },
    });
  }

  exportar(): void {
    window.open(this.svc.getExportUrl(), '_blank');
  }

  exportarMegamo(): void {
    window.open(this.svc.getExportUrl(this.datos?.periodo ?? '2026-2027', 'MEGAMO'), '_blank');
  }

  get articulosFiltrados(): ArticuloMY27[] {
    if (!this.datos) return [];
    const q = this.busqueda.toLowerCase().trim();
    if (!q) return this.datos.articulos;
    return this.datos.articulos.filter(
      (a) =>
        a.sku.toLowerCase().includes(q) ||
        a.producto.toLowerCase().includes(q) ||
        a.marca.toLowerCase().includes(q) ||
        a.modelo.toLowerCase().includes(q),
    );
  }

  getCantidad(art: ArticuloMY27, mes: string): number {
    return art.meses[mes]?.cantidad ?? 0;
  }

  isDisponible(art: ArticuloMY27, mes: string): boolean {
    return art.meses[mes]?.disponible ?? true;
  }

  getCelClass(art: ArticuloMY27, mes: string): string {
    if (!this.isDisponible(art, mes)) return 'cel-bloqueado';
    const v = this.getCantidad(art, mes);
    return v > 0 ? 'cel-con-valor' : 'cel-vacio';
  }

  toggleExpandir(sku: string): void {
    if (this.expandidos.has(sku)) {
      this.expandidos.delete(sku);
    } else {
      this.expandidos.add(sku);
    }
    this.cdr.markForCheck();
  }

  estaExpandido(sku: string): boolean {
    return this.expandidos.has(sku);
  }

  abrirModal(art: ArticuloMY27): void {
    this.articuloModal = art;
    this.modalAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.articuloModal = null;
    this.cdr.markForCheck();
  }

  trackBySku(_: number, art: ArticuloMY27): string {
    return art.sku;
  }

  trackByCliente(_: number, d: DesgloseDist): string {
    return d.clave_cliente;
  }

  getTotalMes(mes: string): number {
    return this.datos?.totales_mes[mes] ?? 0;
  }

  getTotalCostoMes(mes: string): number {
    return this.datos?.total_costo_mes?.[mes] ?? 0;
  }

  formatPrecio(v: number): string {
    return v > 0 ? '$' + v.toLocaleString('es-MX', { minimumFractionDigits: 0 }) : '—';
  }

  formatCosto(v: number): string {
    if (!v || v === 0) return '—';
    return '$' + v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- Métodos de inventario y cobertura ---

  setTab(tab: 'monitor' | 'inventario'): void {
    this.activeTab = tab;
    if (tab === 'inventario' && this.coberturaMegamo.length === 0) {
      this.cargarCobertura();
    }
    this.cdr.markForCheck();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.archivoInventario = files[0];
      this.uploadEstado = 'idle';
      this.uploadResultado = null;
      this.cdr.markForCheck();
    }
  }

  subirInventario(): void {
    if (!this.archivoInventario) return;
    this.uploadEstado = 'cargando';
    this.uploadResultado = null;
    this.cdr.markForCheck();
    this.svc.subirInventarioMegamo(this.archivoInventario, this.periodo)
      .subscribe({
        next: (res) => {
          this.uploadEstado = 'ok';
          this.uploadResultado = res;
          this.cdr.markForCheck();
          this.cargarCobertura();
        },
        error: (err) => {
          this.uploadEstado = 'error';
          this.uploadResultado = { total: 0, insertados: 0, actualizados: 0, errores: [err?.error?.error || 'Error al subir el archivo'] };
          this.cdr.markForCheck();
        }
      });
  }

  cargarCobertura(): void {
    this.cargandoCobertura = true;
    this.errorCobertura = null;
    this.cdr.markForCheck();
    this.svc.getCoberturaMegamo(this.periodo)
      .subscribe({
        next: (res) => {
          this.coberturaMegamo = res.cobertura || [];
          this.cargandoCobertura = false;
          this.cdr.markForCheck();
          this.filtrarCobertura();
        },
        error: () => {
          this.errorCobertura = 'No se pudo cargar el análisis de cobertura.';
          this.cargandoCobertura = false;
          this.cdr.markForCheck();
        }
      });
  }

  filtrarCobertura(): void {
    const q = this.filtroBusqueda.toLowerCase().trim();
    if (!q) {
      this.coberturaFiltrada = this.coberturaMegamo;
    } else {
      this.coberturaFiltrada = this.coberturaMegamo.filter(c =>
        c.sku.toLowerCase().includes(q) || (c.producto || '').toLowerCase().includes(q)
      );
    }
    this.cdr.markForCheck();
  }

  resumenCobertura(item: any): string {
    const mesesCompletos = item.cobertura.filter((c: any) => c.estado === 'completo' && c.proyectado > 0);
    const mesParcial     = item.cobertura.find((c: any) => c.estado === 'parcial');
    const mesesLabels: Record<string, string> = {
      mayo: 'Mayo', junio: 'Junio', julio: 'Julio', agosto: 'Agosto',
      septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dic',
      enero: 'Ene', febrero: 'Feb', marzo: 'Mar', abril: 'Abr'
    };
    const partes: string[] = mesesCompletos.map((c: any) => mesesLabels[c.mes] || c.mes);
    if (mesParcial) {
      partes.push(`${mesesLabels[mesParcial.mes] || mesParcial.mes} (${mesParcial.cubierto}/${mesParcial.proyectado})`);
    }
    if (partes.length === 0) return item.total_proyectado === 0 ? 'Sin demanda' : 'Sin cobertura';
    return partes.join(', ');
  }

  getCoberturaColor(estado: string): string {
    switch (estado) {
      case 'completo':      return '#22c55e';
      case 'parcial':       return '#f59e0b';
      case 'sin_cobertura': return '#ef4444';
      default:              return '#d1d5db';
    }
  }

}
