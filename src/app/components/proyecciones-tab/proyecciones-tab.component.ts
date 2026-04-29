import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────
export interface AvanceRow {
  id: number;
  sku: string;
  producto: string;
  marca: string;
  modelo: string;
  color: string;
  talla: string;
  forecast_total: number;
  pedido_total: number;
  restante: number;
  pct_cubierto: number;
  estados: Record<string, number>;
}

export interface ProductoBusqueda {
  sku: string;
  producto: string;
  marca: string;
  modelo: string;
  color: string;
  talla: string;
  label: string;
}

export interface VarianteColor {
  color: string;
  tallas: { talla: string; sku: string; producto: string }[];
}

export interface ProductoGrupo {
  producto: string;
  modelo: string;
  marca: string;
  colores: VarianteColor[];
  soloUna?: ProductoBusqueda;
}

export interface ForecastRow {
  id?: number;
  sku: string;
  producto: string;
  marca: string;
  modelo: string;
  color: string;
  talla: string;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  total?: number;
  precio?: number;
  nivel_precio?: string;
  // UI-only
  _editado?: boolean;
  _nuevo?: boolean;
  _eliminar?: boolean;
  _searchSeleccionado?: boolean;
}

const MESES: (keyof ForecastRow)[] = [
  'mayo','junio','julio','agosto','septiembre','octubre',
  'noviembre','diciembre','enero','febrero','marzo','abril'
];
const MESES_LABELS = ['May','Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr'];

@Component({
  selector: 'app-proyecciones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyecciones-tab.component.html',
  styleUrls: ['./proyecciones-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProyeccionesTabComponent implements OnChanges, OnInit {

  @Input() clienteClave: string | null = null;
  @Input() idCliente: number | null = null;
  @Output() rowCountChange = new EventEmitter<number>();

  private apiUrl = environment.apiUrl;

  // Period
  periodos: string[] = [];
  periodoSeleccionado = '';

  // Data
  rows: ForecastRow[] = [];
  rowsOriginal: ForecastRow[] = [];
  cargando = false;
  error: string | null = null;
  mensajeExito: string | null = null;

  // Filters
  filtroMarca = '';
  filtroModelo = '';
  filtroCategoria = '';

  // View state
  modoExpandido = false;   // false = compact (total only), true = 12 meses
  modoEdicion = false;
  vistaActiva: 'forecast' | 'avance' = 'forecast';

  // OTP dialog + permisos
  otpDialog = { abierto: false, codigo: '', error: '', verificando: false };
  permisoEdicion: 'super' | 'eliminar' | 'meses' | null = null;

  get puedeEliminar(): boolean {
    return this.permisoEdicion === 'super' || this.permisoEdicion === 'eliminar';
  }

  get puedeEditarMeses(): boolean {
    return this.permisoEdicion === 'super' || this.permisoEdicion === 'meses';
  }

  // Avance vs Pedidos
  avanceRows: AvanceRow[] = [];
  avanceCargando = false;
  avanceError: string | null = null;

  // Product search modal
  searchModal = {
    abierto: false,
    rowTarget: null as ForecastRow | null,
    query: '',
    cargando: false,
    timer: null as any,
    grupos: [] as ProductoGrupo[],
    grupoActivo: null as ProductoGrupo | null,
    colorActivo: null as string | null,
    offset: 0,
    hasMore: false,
  };

  // Import state
  importando = false;
  importError: string | null = null;
  importAdvertencias: string[] = [];
  mensajeImportGlobal: string | null = null;

  // Computed options for filters
  get marcasDisponibles(): string[] {
    return [...new Set(this.rows.map(r => r.marca).filter(Boolean))].sort();
  }
  get modelosDisponibles(): string[] {
    return [...new Set(this.rows.map(r => r.modelo).filter(Boolean))].sort();
  }

  get rowsFiltrados(): ForecastRow[] {
    return this.rows.filter(r => {
      if (r._eliminar) return false;
      if (this.filtroMarca && r.marca !== this.filtroMarca) return false;
      if (this.filtroModelo && r.modelo !== this.filtroModelo) return false;
      return true;
    });
  }

  get avanceRowsFiltrados(): AvanceRow[] {
    return this.avanceRows.filter(r => {
      if (this.filtroMarca && r.marca !== this.filtroMarca) return false;
      if (this.filtroModelo && r.modelo !== this.filtroModelo) return false;
      return true;
    });
  }

  get totalAvanceForecast(): number {
    return this.avanceRowsFiltrados.reduce((s, r) => s + r.forecast_total, 0);
  }

  get totalAvancePedido(): number {
    return this.avanceRowsFiltrados.reduce((s, r) => s + r.pedido_total, 0);
  }

  get pctGlobal(): number {
    const f = this.totalAvanceForecast;
    if (!f) return 0;
    return Math.round(this.totalAvancePedido / f * 1000) / 10;
  }

  get mesesKeys(): (keyof ForecastRow)[] { return MESES; }
  get mesesLabels(): string[] { return MESES_LABELS; }

  get totalGeneral(): number {
    return this.rowsFiltrados.reduce((s, r) => s + this.calcTotal(r), 0);
  }

  /** Mapa sku → AvanceRow para acceso O(1) desde la plantilla */
  get avanceMap(): Map<string, AvanceRow> {
    const m = new Map<string, AvanceRow>();
    for (const r of this.avanceRows) { m.set(r.sku, r); }
    return m;
  }

  /** Devuelve el restante (forecast − pedido) si ya se cargó avance, o el total bruto. */
  getRestante(row: ForecastRow): number {
    const av = this.avanceMap.get(row.sku);
    return av != null ? av.restante : this.calcTotal(row);
  }

  /** Total de restantes para el footer (usa avance cuando está disponible). */
  get totalRestante(): number {
    if (this.avanceRows.length === 0) { return this.totalGeneral; }
    return this.rowsFiltrados.reduce((s, r) => s + this.getRestante(r), 0);
  }

  calcTotal(row: ForecastRow): number {
    return MESES.reduce((s, m) => s + (Number(row[m]) || 0), 0);
  }

  totalMes(mes: keyof ForecastRow): number {
    return this.rowsFiltrados.reduce((s, r) => s + (Number(r[mes]) || 0), 0);
  }

  totalPrecioMes(mes: keyof ForecastRow): number {
    return this.rowsFiltrados.reduce((s, r) => {
      const qty    = Number(r[mes]) || 0;
      const precio = Number(r['precio']) || 0;
      return s + qty * precio;
    }, 0);
  }

  get totalPrecioGeneral(): number {
    return this.rowsFiltrados.reduce((s, r) => {
      const total  = MESES.reduce((t, m) => t + (Number(r[m]) || 0), 0);
      const precio = Number(r['precio']) || 0;
      return s + total * precio;
    }, 0);
  }

  constructor(private http: HttpClient, protected cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._initPeriodo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteClave'] && this.clienteClave) {
      this._initPeriodo();
    }
  }

  // ─────────────────────────────────────────
  // Period helpers
  // ─────────────────────────────────────────

  private _initPeriodo(): void {
    if (!this.clienteClave) return;
    this.periodoSeleccionado = this._periodoActual();
    this._cargarPeriodos();
    this.cdr.markForCheck();
    this.cargarForecast();
  }

  /** Returns the current commercial period (May-April) as "YYYY-YYYY".
   *  From April onward we already plan the NEXT cycle starting in May. */
  private _periodoActual(): string {
    const now = new Date();
    const mes = now.getMonth() + 1; // 1-12
    const anio = now.getFullYear();
    // Apr(4)..Dec(12): current/upcoming period starts this year
    // Jan(1)..Mar(3): period started last year
    const inicio = mes >= 4 ? anio : anio - 1;
    return `${inicio}-${inicio + 1}`;
  }

  /** Show only the current period plus any periods that already have data saved */
  get periodosDisponibles(): string[] {
    const curr = this._periodoActual();
    return [...new Set([curr, ...this.periodos])].sort();
  }

  private _cargarPeriodos(): void {
    if (!this.clienteClave) return;
    const params = new HttpParams().set('clave', this.clienteClave);
    this.http.get<string[]>(`${this.apiUrl}/forecast/periodos`, { params }).subscribe({
      next: p => { this.periodos = p; this.cdr.markForCheck(); },
      error: () => { this.periodos = []; }
    });
  }

  onPeriodoChange(): void {
    this.avanceRows = [];
    this.avanceError = null;
    if (this.vistaActiva === 'avance') {
      this.activarAvance();
    } else {
      this.cargarForecast();
    }
  }

  // ─────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────

  cargarForecast(): void {
    if (!this.clienteClave || !this.periodoSeleccionado) return;
    this.cargando = true;
    this.error = null;
    this.modoEdicion = false;
    this.avanceRows = [];
    this.cdr.markForCheck();

    const params = new HttpParams()
      .set('clave', this.clienteClave)
      .set('periodo', this.periodoSeleccionado);

    // Ambas peticiones en paralelo; el spinner se mantiene hasta que las DOS
    // responden. El backend cachea Odoo 3 min, así que en recargas es rápido.
    forkJoin({
      forecast: this.http.get<ForecastRow[]>(`${this.apiUrl}/forecast`, { params }),
      avance:   this.http.get<AvanceRow[]>(`${this.apiUrl}/forecast/avance`, { params })
    }).subscribe({
      next: ({ forecast, avance }) => {
        this.avanceRows   = avance;
        this.rows         = forecast.map(r => ({ ...r, _editado: false, _nuevo: false, _eliminar: false }));
        this.rowsOriginal = JSON.parse(JSON.stringify(this.rows));
        this.cargando     = false;
        this.rowCountChange.emit(this.rows.length);
        this.cdr.markForCheck();
      },
      error: err => {
        this.error    = err?.error?.error || 'Error al cargar proyecciones';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────
  // Template export
  // ─────────────────────────────────────────

  exportarPlantilla(): void {
    if (!this.clienteClave || !this.periodoSeleccionado) return;
    const url = `${this.apiUrl}/forecast/template?clave=${encodeURIComponent(this.clienteClave)}&periodo=${encodeURIComponent(this.periodoSeleccionado)}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `Forecast_${this.clienteClave}_${this.periodoSeleccionado}.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        }, 200);
      },
      error: () => alert('Error al generar la plantilla. Intenta nuevamente.')
    });
  }

  // ─────────────────────────────────────────
  // Template import
  // ─────────────────────────────────────────

  abrirSelector(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.importarArchivo(file);
    };
    input.click();
  }

  abrirSelectorGlobal(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.importarArchivoGlobal(file);
    };
    input.click();
  }

  importarArchivoGlobal(file: File): void {
    this.importando = true;
    this.importError = null;
    this.importAdvertencias = [];
    this.mensajeImportGlobal = null;
    this.mensajeExito = null;
    this.cdr.markForCheck();

    const fd = new FormData();
    // Sin clave_cliente ni periodo — el backend los lee del archivo
    fd.append('file', file);

    this.http.post<any>(`${this.apiUrl}/forecast/importar`, fd).subscribe({
      next: res => {
        this.importando = false;
        this.importAdvertencias = res.advertencias || [];
        const clave   = res.clave_cliente || '?';
        const periodo = res.periodo || '?';
        this.mensajeImportGlobal =
          `Plantilla global importada: ${res.guardados} producto(s) para distribuidor "${clave}" — periodo ${periodo}.`;
        // Si la plantilla era del cliente activo, refrescar la tabla
        if (clave === this.clienteClave) {
          this.cargarForecast();
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.importando = false;
        this.importError = err?.error?.error || 'Error al importar la plantilla global';
        this.cdr.markForCheck();
      }
    });
  }

  importarArchivo(file: File): void {
    if (!this.clienteClave || !this.periodoSeleccionado) return;
    this.importando = true;
    this.importError = null;
    this.importAdvertencias = [];
    this.mensajeExito = null;
    this.cdr.markForCheck();

    const fd = new FormData();
    fd.append('clave_cliente', this.clienteClave);
    fd.append('periodo', this.periodoSeleccionado);
    fd.append('file', file);

    this.http.post<any>(`${this.apiUrl}/forecast/importar`, fd).subscribe({
      next: res => {
        this.importando = false;
        this.importAdvertencias = res.advertencias || [];
        this.mensajeExito = `Se importaron ${res.guardados} producto(s) correctamente.`;
        this.cargarForecast();
        this.cdr.markForCheck();
      },
      error: err => {
        this.importando = false;
        this.importError = err?.error?.error || 'Error al importar el archivo';
        if (err?.error?.errores) {
          this.importAdvertencias = err.error.errores;
        }
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────
  // View toggles
  // ─────────────────────────────────────────

  toggleMeses(): void {
    this.modoExpandido = !this.modoExpandido;
  }

  // ─────────────────────────────────────────
  // Avance vs Pedidos
  // ─────────────────────────────────────────

  activarAvance(): void {
    if (!this.periodoSeleccionado) return;
    this.vistaActiva = 'avance';
    this._cargarAvance();
  }

  private _cargarAvance(): void {
    if (!this.clienteClave || !this.periodoSeleccionado) return;
    this.avanceCargando = true;
    this.avanceError = null;
    this.cdr.markForCheck();

    const params = new HttpParams()
      .set('clave', this.clienteClave)
      .set('periodo', this.periodoSeleccionado);

    this.http.get<AvanceRow[]>(`${this.apiUrl}/forecast/avance`, { params }).subscribe({
      next: data => {
        this.avanceRows = data;
        this.avanceCargando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.avanceError = err?.error?.error || 'Error al cargar avance';
        this.avanceCargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Returns CSS class name (without prefix) based on coverage % */
  getAvanceClase(pct: number): string {
    if (pct === 0)   return 'avance-sin';
    if (pct < 50)    return 'avance-bajo';
    if (pct < 100)   return 'avance-medio';
    return 'avance-completo';
  }

  /** Converts estados Record to an array of {key, val} for template iteration */
  getEstadosEntries(estados: Record<string, number>): { key: string; val: number }[] {
    return Object.entries(estados || {}).map(([key, val]) => ({ key, val }));
  }

  /** Returns a CSS-safe key for the status badge class */
  getEstadoBadgeKey(estado: string): string {
    const map: Record<string, string> = {
      'posted':       'posted',
      'En tránsito':  'transito',
      'Almacén EB':   'almacen',
      'Entregado':    'entregado',
    };
    return map[estado] ?? 'default';
  }

  /** Math.min helper for template */
  minVal(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ─────────────────────────────────────────
  // Edit mode
  // ─────────────────────────────────────────

  activarEdicion(): void {
    this.otpDialog = { abierto: true, codigo: '', error: '', verificando: false };
    this.cdr.markForCheck();
  }

  verificarOtp(): void {
    const codigo = this.otpDialog.codigo.trim();
    if (!codigo) { this.otpDialog.error = 'Ingresa el código.'; return; }
    this.otpDialog.verificando = true;
    this.otpDialog.error = '';
    this.cdr.markForCheck();
    this.http.post<{ valid: boolean; tipo?: string; error?: string }>(
      `${this.apiUrl}/edicion/verificar-otp`, { codigo }
    ).subscribe({
      next: res => {
        if (res.valid && res.tipo) {
          this.permisoEdicion = res.tipo as 'super' | 'eliminar' | 'meses';
          this.otpDialog.abierto = false;
          this.modoEdicion = true;
          this.rowsOriginal = JSON.parse(JSON.stringify(this.rows));
          this.mensajeExito = null;
        } else {
          this.otpDialog.error = res.error ?? 'Código inválido o expirado.';
        }
        this.otpDialog.verificando = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.otpDialog.error = err?.error?.error ?? 'Código inválido o expirado.';
        this.otpDialog.verificando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarOtpDialog(): void {
    this.otpDialog.abierto = false;
    this.cdr.markForCheck();
  }

  cancelarEdicion(): void {
    this.rows = JSON.parse(JSON.stringify(this.rowsOriginal));
    this.modoEdicion = false;
    this.permisoEdicion = null;
    this.importError = null;
    this.importAdvertencias = [];
    this.cdr.markForCheck();
  }

  markEdited(row: ForecastRow): void {
    row._editado = true;
  }

  agregarProducto(): void {
    if (!this.modoEdicion) {
      // Activar modo edición sólo para agregar (sin OTP — acción no destructiva)
      this.rowsOriginal = JSON.parse(JSON.stringify(this.rows));
      this.modoEdicion = true;
      this.mensajeExito = null;
    }
    const nuevo: ForecastRow = {
      sku: '', producto: '', marca: '', modelo: '', color: '', talla: '',
      mayo: 0, junio: 0, julio: 0, agosto: 0, septiembre: 0, octubre: 0,
      noviembre: 0, diciembre: 0, enero: 0, febrero: 0, marzo: 0, abril: 0,
      _nuevo: true, _editado: false, _eliminar: false, _searchSeleccionado: false,
    };
    this.rows = [nuevo, ...this.rows];
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────
  // Product search modal
  // ─────────────────────────────────────────

  abrirModalBusqueda(row: ForecastRow): void {
    clearTimeout(this.searchModal.timer);
    this.searchModal.abierto = true;
    this.searchModal.rowTarget = row;
    this.searchModal.query = '';
    this.searchModal.grupos = [];
    this.searchModal.grupoActivo = null;
    this.searchModal.colorActivo = null;
    this.searchModal.offset = 0;
    this.searchModal.hasMore = false;
    this.cdr.markForCheck();
  }

  cerrarModalBusqueda(): void {
    clearTimeout(this.searchModal.timer);
    this.searchModal.abierto = false;
    this.searchModal.rowTarget = null;
    this.cdr.markForCheck();
  }

  buscarEnModal(q: string): void {
    this.searchModal.query = q;
    this.searchModal.offset = 0;
    this.searchModal.hasMore = false;
    this.searchModal.grupoActivo = null;
    this.searchModal.colorActivo = null;
    if (!q || q.length < 2) {
      this.searchModal.grupos = [];
      this.searchModal.cargando = false;
      this.cdr.markForCheck();
      return;
    }
    this.searchModal.cargando = true;
    this.cdr.markForCheck();
    clearTimeout(this.searchModal.timer);
    this.searchModal.timer = setTimeout(() => this._ejecutarBusqueda(false), 350);
  }

  cargarMas(): void {
    this.searchModal.offset += 50;
    this._ejecutarBusqueda(true);
  }

  private _ejecutarBusqueda(append: boolean): void {
    const params = new HttpParams()
      .set('q', this.searchModal.query)
      .set('offset', this.searchModal.offset);
    this.searchModal.cargando = true;
    this.cdr.markForCheck();
    this.http.get<{ results: ProductoBusqueda[]; has_more: boolean }>(
      `${this.apiUrl}/forecast/buscar-producto`, { params }
    ).subscribe({
      next: resp => {
        const nuevos = this._agruparResultados(resp.results);
        this.searchModal.grupos = append
          ? [...this.searchModal.grupos, ...nuevos]
          : nuevos;
        this.searchModal.hasMore = resp.has_more;
        this.searchModal.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        if (!append) this.searchModal.grupos = [];
        this.searchModal.hasMore = false;
        this.searchModal.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  private _agruparResultados(results: ProductoBusqueda[]): ProductoGrupo[] {
    const map = new Map<string, ProductoBusqueda[]>();
    for (const r of results) {
      const key = (r.modelo || r.producto).toUpperCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const grupos: ProductoGrupo[] = [];
    for (const [, variantes] of map.entries()) {
      const primer = variantes[0];
      const colorMap = new Map<string, { talla: string; sku: string; producto: string }[]>();
      for (const v of variantes) {
        const c = v.color || 'N/A';
        if (!colorMap.has(c)) colorMap.set(c, []);
        colorMap.get(c)!.push({ talla: v.talla, sku: v.sku, producto: v.producto });
      }
      const colores: VarianteColor[] = [];
      for (const [color, tallas] of colorMap.entries()) {
        colores.push({ color, tallas });
      }
      grupos.push({
        producto: primer.producto,
        modelo: primer.modelo,
        marca: primer.marca,
        colores,
        soloUna: variantes.length === 1 ? primer : undefined,
      });
    }
    return grupos;
  }

  seleccionarGrupo(grupo: ProductoGrupo): void {
    if (grupo.soloUna) {
      this._llenarFila(grupo.soloUna);
      return;
    }
    this.searchModal.grupoActivo = grupo;
    this.searchModal.colorActivo = grupo.colores.length === 1 ? grupo.colores[0].color : null;
    this.cdr.markForCheck();
  }

  seleccionarColor(color: string): void {
    this.searchModal.colorActivo = color;
    this.cdr.markForCheck();
  }

  getTallasParaColor(grupo: ProductoGrupo, color: string): { talla: string; sku: string; producto: string }[] {
    return grupo.colores.find(c => c.color === color)?.tallas ?? [];
  }

  confirmarVariante(grupo: ProductoGrupo, color: string, talla: string): void {
    const v = this.getTallasParaColor(grupo, color).find(t => t.talla === talla);
    if (!v) return;
    this._llenarFila({
      sku: v.sku,
      producto: v.producto || grupo.producto,
      marca: grupo.marca,
      modelo: grupo.modelo,
      color,
      talla,
      label: v.sku,
    });
  }

  private _llenarFila(prod: ProductoBusqueda): void {
    const row = this.searchModal.rowTarget;
    if (!row) return;
    row.sku      = prod.sku;
    row.producto = prod.producto;
    row.marca    = prod.marca;
    row.modelo   = prod.modelo;
    row.color    = prod.color;
    row.talla    = prod.talla;
    row._searchSeleccionado = true;
    row._editado = true;
    
    // Limpiar errores previos cuando se selecciona un producto válido
    this.importError = null;
    this.importAdvertencias = [];
    
    this.cerrarModalBusqueda();
  }

  limpiarBusqueda(row: ForecastRow): void {
    row.sku = ''; row.producto = ''; row.marca = '';
    row.modelo = ''; row.color = ''; row.talla = '';
    row._searchSeleccionado = false;
    row._editado = false;
    this.cdr.markForCheck();
  }

  marcarEliminar(row: ForecastRow): void {
    if (row._nuevo) {
      this.rows = this.rows.filter(r => r !== row);
    } else {
      row._eliminar = true;
    }
    this.cdr.markForCheck();
  }

  restaurar(row: ForecastRow): void {
    row._eliminar = false;
    this.cdr.markForCheck();
  }

  trackById(_: number, row: ForecastRow): any {
    return row.id ?? row.sku;
  }

  /** Type-safe getter for month value on a row */
  getMes(row: ForecastRow, mes: keyof ForecastRow): number {
    return Number(row[mes]) || 0;
  }

  /** Type-safe setter for month value on a row */
  setMes(row: ForecastRow, mes: keyof ForecastRow, value: any): void {
    (row as any)[mes] = Number(value) || 0;
  }

  guardarCambios(): void {
    if (!this.clienteClave || !this.idCliente || !this.periodoSeleccionado) return;

    const toDelete = this.rows.filter(r => r._eliminar && r.id);
    const toSave   = this.rows.filter(r => !r._eliminar && (r._editado || r._nuevo));

    if (toDelete.length === 0 && toSave.length === 0) {
      this.modoEdicion = false;
      this.permisoEdicion = null;
      this.cdr.markForCheck();
      return;
    }

    // Validar que todos los productos tengan SKU
    const sinSKU = toSave.filter(r => !r.sku || r.sku.trim() === '');
    if (sinSKU.length > 0) {
      this.importError = `No se puede guardar: ${sinSKU.length} producto(s) sin SKU seleccionado. Por favor selecciona un producto válido para cada fila.`;
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;
    this.importError = null;
    this.cdr.markForCheck();

    const deleteOps = toDelete.map(r =>
      this.http.delete(`${this.apiUrl}/forecast/${r.id}`).toPromise()
    );

    Promise.all(deleteOps).then(() => {
      if (toSave.length === 0) {
        this.mensajeExito = 'Cambios guardados correctamente.';
        this.cargando = false;
        this.modoEdicion = false;
      this.permisoEdicion = null;
        this.cargarForecast();
        return;
      }

      const body = {
        clave_cliente: this.clienteClave,
        id_cliente: this.idCliente,
        periodo: this.periodoSeleccionado,
        rows: toSave.map(r => {
          const { _editado, _nuevo, _eliminar, _searchSeleccionado, id, total, ...clean } = r as any;
          return clean;
        })
      };

      this.http.post<any>(`${this.apiUrl}/forecast/guardar`, body).subscribe({
        next: res => {
          this.cargando = false;
          this.modoEdicion = false;
      this.permisoEdicion = null;
          this.importAdvertencias = res.advertencias || [];
          this.mensajeExito = `Cambios guardados: ${res.guardados} producto(s).`;
          this.cargarForecast();
          this.cdr.markForCheck();
        },
        error: err => {
          this.cargando = false;
          this.importError = err?.error?.error || 'Error al guardar cambios';
          if (err?.error?.errores) this.importAdvertencias = err.error.errores;
          this.cdr.markForCheck();
        }
      });
    }).catch(err => {
      this.cargando = false;
      this.importError = 'Error al eliminar registros';
      this.cdr.markForCheck();
    });
  }
}
