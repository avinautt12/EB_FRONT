import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

import { Router } from '@angular/router';
import {
  SolicitudRetroactivoService,
  DashboardSolicitudRetroactivo,
  GrupoDashboard,
  SolicitudRetroactivo,
  EstatusSolicitud
} from '../../../services/solicitud-retroactivo.service';

Chart.register(...registerables);

const BG_CARD = '#1e1e1e';
const TEXT_2 = '#CCC5B9';

// GUÍA: mismo mapeo que colorEstatus en el resto del módulo (badge-pendiente/
// validado/rechazado) -- se usa para pintar el donut de "Conteo por Estado".
const COLOR_ESTATUS: Record<string, string> = {
  pendiente: '#f59e0b',
  validado: '#4caf50',
  rechazado: '#e53935'
};

type Orden = 'monto' | 'solicitudes';
type PanelKey = 'campana' | 'cliente' | 'anioModelo';
type FiltroKpi = 'todos' | EstatusSolicitud;
type ColLista = 'nombre_completo' | 'modelo_bicicleta' | 'nombre_formulario' | 'estatus' | 'monto_pagar' | 'fecha_venta';

const ETIQUETAS_VISTA: Record<FiltroKpi, string> = {
  todos: 'Todas las Solicitudes',
  pendiente: 'Solicitudes Pendientes',
  validado: 'Solicitudes Validadas',
  rechazado: 'Solicitudes Rechazadas'
};

// GUÍA: estructura y orden calcados del dashboard de garantías
// (views/internal-views/garantias/garantias.component) -- KPI grid de 5
// tarjetas con barra superior de color, section-header divisorio, y
// ranking-grid de rank-cards con su propio select de orden + lista con
// scroll interno (rank-list-scroll) en vez de paginar/truncar.
export const SORT_OPCIONES: { value: Orden; label: string }[] = [
  { value: 'monto', label: 'Por monto' },
  { value: 'solicitudes', label: 'Por solicitudes' }
];

@Component({
  selector: 'app-solicitud-retroactivo-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitud-retroactivo-dashboard.component.html',
  styleUrl: './solicitud-retroactivo-dashboard.component.css'
})
export class SolicitudRetroactivoDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartEstatus') chartEstatusRef?: ElementRef<HTMLCanvasElement>;
  private chartEstatus: Chart | null = null;

  cargando = true;
  error = '';
  datos: DashboardSolicitudRetroactivo | null = null;

  // GUÍA: se calcula UNA sola vez cuando llegan los datos (no un getter leído
  // en cada ciclo de detección de cambios) -- un getter usado directo en
  // *ngFor genera un arreglo nuevo en cada tick, lo que combinado con el
  // resize automático del canvas de Chart.js (ResizeObserver) formó un bucle
  // de re-render que congeló el tab la primera vez que se intentó este layout.
  estadoStats: { estatus: string; count: number; pct: number; barPct: number; color: string }[] = [];

  filtroCliente = '';
  filtroCampana = '';

  sortOpciones = SORT_OPCIONES;
  ordenPorPanel: Record<PanelKey, Orden> = {
    campana: 'monto',
    cliente: 'monto',
    anioModelo: 'monto'
  };

  // GUÍA: modal de detalle al hacer clic en una fila -- mismo patrón que el
  // Kardex de cliente en garantias.component (clic en una fila del ranking
  // abre un modal con el detalle real, no solo el agregado). Las filas del
  // dashboard vienen de una consulta GROUP BY, así que para mostrar "qué
  // registró" se pide el detalle completo vía listar() (ya lo tiene el
  // Gestor) y se filtra en el cliente por la entidad en la que se hizo clic.
  modalAbierto = false;
  modalCargando = false;
  modalTitulo = '';
  modalItems: SolicitudRetroactivo[] = [];
  private todasLasSolicitudes: SolicitudRetroactivo[] | null = null;

  // GUÍA: "vista de lista" calcada de garantias.component (vista:
  // 'dashboard'|'lista') -- clic en una KPI cambia la vista DENTRO del mismo
  // componente/URL, no navega a otra página. Así "Volver al Dashboard" nunca
  // termina en un lugar inesperado, porque no hay navegación real de por medio.
  vista: 'dashboard' | 'lista' = 'dashboard';
  filtroKpi: FiltroKpi = 'todos';
  cargandoLista = false;
  sortColLista: ColLista = 'fecha_venta';
  sortDirLista: 'asc' | 'desc' = 'desc';

  constructor(private service: SolicitudRetroactivoService, private router: Router) {}

  ngOnInit(): void {
    this.service.dashboard().subscribe({
      next: (res) => {
        this.datos = res;
        this.estadoStats = this.calcularEstadoStats(res);
        this.cargando = false;
        setTimeout(() => this.renderChartEstatus(), 0);
      },
      error: () => {
        this.error = 'No se pudo cargar el dashboard.';
        this.cargando = false;
      }
    });
  }

  private calcularEstadoStats(datos: DashboardSolicitudRetroactivo): { estatus: string; count: number; pct: number; barPct: number; color: string }[] {
    const t = datos.totales_generales;
    const data: Record<string, number> = { pendiente: t.pendientes, validado: t.validados, rechazado: t.rechazados };
    const total = t.total_solicitudes || 1;
    const max = Math.max(t.pendientes, t.validados, t.rechazados, 1);
    return Object.entries(data)
      .filter(([, count]) => count > 0)
      .map(([estatus, count]) => ({
        estatus, count,
        pct: (count / total) * 100,
        barPct: Math.max((count / max) * 100, 3),
        color: COLOR_ESTATUS[estatus]
      }));
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chartEstatus?.destroy();
  }

  // GUÍA: donut "Conteo por Estado" -- mismo patrón que buildDonut en
  // garantias.component (Chart.js, doughnut, cutout 62%, leyenda a la
  // derecha), alimentado con totales_generales en vez de un GROUP BY aparte.
  private renderChartEstatus(): void {
    if (!this.datos || !this.chartEstatusRef?.nativeElement) return;
    this.chartEstatus?.destroy();

    const t = this.datos.totales_generales;
    const data: Record<string, number> = { pendiente: t.pendientes, validado: t.validados, rechazado: t.rechazados };
    const labels = Object.keys(data).filter(k => data[k] > 0);
    const values = labels.map(l => data[l]);
    const total = values.reduce((a, b) => a + b, 0);
    const colors = labels.map(l => COLOR_ESTATUS[l]);

    this.chartEstatus = new Chart(this.chartEstatusRef.nativeElement, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: BG_CARD }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2a2a', borderColor: '#444', borderWidth: 1, titleColor: '#FFFCF2', bodyColor: TEXT_2, padding: 10,
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}  (${total ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)` }
          }
        }
      }
    });
  }

  trackEstado(_: number, e: { estatus: string }): string {
    return e.estatus;
  }

  setOrden(panel: PanelKey, valor: Orden): void {
    this.ordenPorPanel[panel] = valor;
  }

  private ordenar(grupos: GrupoDashboard[], panel: PanelKey): GrupoDashboard[] {
    const orden = this.ordenPorPanel[panel];
    return [...grupos].sort((a, b) => {
      if (orden === 'solicitudes') return b.total_solicitudes - a.total_solicitudes;
      return Number(b.monto_total) - Number(a.monto_total);
    });
  }

  // GUÍA: barra de magnitud por fila (dataviz skill) -- un solo hue, largo
  // proporcional al monto más alto del propio grupo.
  barPct(valor: string | number, grupo: GrupoDashboard[]): number {
    const max = Math.max(...grupo.map(g => Number(g.monto_total)), 1);
    return Math.max((Number(valor) / max) * 100, 3);
  }

  // GUÍA: el "total general" por panel (igual que .rank-total en
  // garantias.component: "Total: X garantías") -- suma de las filas visibles
  // del propio panel, no del dashboard completo, para que cuadre con el
  // filtro/orden activo en ese momento.
  totalGrupo(grupo: GrupoDashboard[]): { solicitudes: number; monto: number } {
    return grupo.reduce(
      (acc, g) => ({
        solicitudes: acc.solicitudes + g.total_solicitudes,
        monto: acc.monto + Number(g.monto_total)
      }),
      { solicitudes: 0, monto: 0 }
    );
  }

  get porCampanaFiltrado(): GrupoDashboard[] {
    if (!this.datos) return [];
    const termino = this.filtroCampana.trim().toLowerCase();
    const base = termino
      ? this.datos.por_campana.filter(f => String(f['nombre_formulario']).toLowerCase().includes(termino))
      : this.datos.por_campana;
    return this.ordenar(base, 'campana');
  }

  get porClienteFiltrado(): GrupoDashboard[] {
    if (!this.datos) return [];
    const termino = this.filtroCliente.trim().toLowerCase();
    const base = termino
      ? this.datos.por_cliente.filter(f =>
          String(f['nombre_completo']).toLowerCase().includes(termino) ||
          String(f['correo_electronico']).toLowerCase().includes(termino))
      : this.datos.por_cliente;
    return this.ordenar(base, 'cliente');
  }

  get porAnioModeloOrdenado(): GrupoDashboard[] {
    if (!this.datos) return [];
    return this.ordenar(this.datos.por_anio_modelo, 'anioModelo');
  }

  // GUÍA: cachea listar() una sola vez -- tanto el modal de detalle como la
  // vista de lista lo reusan, cada quien maneja su propio flag de "cargando".
  private conSolicitudes(cb: (todas: SolicitudRetroactivo[]) => void, onError?: () => void): void {
    if (this.todasLasSolicitudes) {
      cb(this.todasLasSolicitudes);
      return;
    }
    this.service.listar().subscribe({
      next: (res) => {
        this.todasLasSolicitudes = res;
        cb(res);
      },
      error: () => { if (onError) onError(); }
    });
  }

  abrirDetalleCliente(fila: GrupoDashboard): void {
    this.modalTitulo = String(fila['nombre_completo']);
    this.modalAbierto = true;
    this.modalCargando = true;
    this.conSolicitudes(todas => {
      this.modalCargando = false;
      this.modalItems = todas.filter(s =>
        s.nombre_completo === fila['nombre_completo'] && s.correo_electronico === fila['correo_electronico']
      );
    }, () => { this.modalCargando = false; });
  }

  abrirDetalleCampana(fila: GrupoDashboard): void {
    this.modalTitulo = `Campaña: ${fila['nombre_formulario']}`;
    this.modalAbierto = true;
    this.modalCargando = true;
    this.conSolicitudes(todas => {
      this.modalCargando = false;
      this.modalItems = todas.filter(s => s.id_formulario === fila['id_formulario']);
    }, () => { this.modalCargando = false; });
  }

  abrirDetalleAnioModelo(fila: GrupoDashboard): void {
    this.modalTitulo = `Año Modelo: ${fila['anio_modelo']}`;
    this.modalAbierto = true;
    this.modalCargando = true;
    this.conSolicitudes(todas => {
      this.modalCargando = false;
      this.modalItems = todas.filter(s => s.anio_modelo === fila['anio_modelo']);
    }, () => { this.modalCargando = false; });
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalItems = [];
  }

  // ═══════════════ Vista de lista (clic en una KPI) ═══════════════

  get etiquetaVista(): string {
    return ETIQUETAS_VISTA[this.filtroKpi];
  }

  verLista(kpi: FiltroKpi): void {
    this.filtroKpi = kpi;
    this.vista = 'lista';
    this.cargandoLista = true;
    this.conSolicitudes(() => { this.cargandoLista = false; }, () => { this.cargandoLista = false; });
  }

  volverADashboard(): void {
    this.vista = 'dashboard';
    this.filtroKpi = 'todos';
    setTimeout(() => this.renderChartEstatus(), 0);
  }

  get listaFiltradaOrdenada(): SolicitudRetroactivo[] {
    const todas = this.todasLasSolicitudes ?? [];
    const base = this.filtroKpi === 'todos' ? todas : todas.filter(s => s.estatus === this.filtroKpi);

    const col = this.sortColLista;
    const dir = this.sortDirLista === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      if (col === 'monto_pagar') return (Number(a.monto_pagar) - Number(b.monto_pagar)) * dir;
      if (col === 'fecha_venta') return (new Date(a.fecha_venta).getTime() - new Date(b.fecha_venta).getTime()) * dir;
      return String(a[col]).localeCompare(String(b[col])) * dir;
    });
  }

  toggleSortLista(col: ColLista): void {
    if (this.sortColLista === col) {
      this.sortDirLista = this.sortDirLista === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColLista = col;
      this.sortDirLista = col === 'fecha_venta' ? 'desc' : 'asc';
    }
  }

  sortIconLista(col: ColLista): string {
    if (this.sortColLista !== col) return 'fa-sort';
    return this.sortDirLista === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // La lista es un resumen de solo lectura; para validar/corregir se abre en
  // el Gestor (mismo patrón que garantías: irATicket -> Seguimiento).
  irAGestor(id: number): void {
    this.router.navigate(['/usuarios/solicitud-retroactivo/gestor'], { queryParams: { id } });
  }
}
