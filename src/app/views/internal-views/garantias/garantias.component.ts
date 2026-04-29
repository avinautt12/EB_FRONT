import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { GarantiasService, GarantiasDashboard } from '../../../services/garantias.service';

Chart.register(...registerables);

const ORANGE     = '#EB5E28';
const ORANGE_DIM = 'rgba(235,94,40,0.65)';
const BG_CARD    = '#1e1e1e';
const GRID       = 'rgba(255,255,255,0.06)';
const TEXT_2     = '#CCC5B9';
const TEXT_3     = '#8a8077';

const PALETA = [
  '#EB5E28','#5c9bd6','#4caf50','#9b59b6','#f0ad4e',
  '#e53935','#26c6da','#ff7043','#66bb6a','#ab47bc',
  '#ef5350','#42a5f5','#ffa726','#26a69a','#ec407a',
];

const COLORES_ESTATUS: Record<string, string> = {
  cerrada:           '#4caf50',
  cerrado:           '#4caf50',
  abierta:           '#e53935',
  abierto:           '#e53935',
  'en proceso':      '#f0ad4e',
  pendiente:         '#5c9bd6',
  'en revision':     '#26c6da',
  'sin estatus':     '#555',
};

export interface RankItem { key: string; value: number; pct: number; color: string; }
export type ModalKey = 'garantias_cliente' | 'latencia_cliente' | 'descripcion_dano' | 'ubicacion_dano';

const MODAL_META: Record<ModalKey, { titulo: string; icono: string; label: string; sublabel: string }> = {
  garantias_cliente: { titulo: 'Garantías por Cliente',    icono: 'fa-store',         label: 'Garantías',    sublabel: 'Número de garantías registradas' },
  latencia_cliente:  { titulo: 'Latencia por Cliente',     icono: 'fa-stopwatch',      label: 'Días prom.',   sublabel: 'Promedio de días de atención' },
  descripcion_dano:  { titulo: 'Descripción del Daño',     icono: 'fa-tools',          label: 'Cantidad',     sublabel: 'Frecuencia por tipo de daño' },
  ubicacion_dano:    { titulo: 'Ubicación del Daño',       icono: 'fa-map-marker-alt', label: 'Cantidad',     sublabel: 'Frecuencia por ubicación' },
};

@Component({
  selector: 'app-garantias',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeBarComponent],
  templateUrl: './garantias.component.html',
  styleUrl: './garantias.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GarantiasComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chartEstatus')     chartEstatusRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('chartLatenciaMes') chartLatenciaMesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartModal')       chartModalRef?:       ElementRef<HTMLCanvasElement>;

  dashboard: GarantiasDashboard | null = null;
  cargando  = true;
  error     = '';

  // Rankings pre-calculados — evita llamar métodos en *ngFor (causa de crashes)
  topClientes:    RankItem[] = [];
  topLatencia:    RankItem[] = [];
  topDanos:       RankItem[] = [];
  topUbicaciones: RankItem[] = [];

  modalAbierto = false;
  modalKey: ModalKey | null = null;
  readonly modalMeta = MODAL_META;

  private charts: Chart[] = [];
  private modalChart?: Chart;
  private autoRefreshSub?: Subscription;

  constructor(private svc: GarantiasService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.autoRefreshSub = interval(300_000)
      .pipe(switchMap(() => this.svc.getDashboard()))
      .subscribe({
        next: (d) => {
          this.dashboard = d;
          this.procesarRankings();
          this.cdr.detectChanges();
          setTimeout(() => this.renderMainCharts(), 150);
        },
        error: () => {},
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyMainCharts();
    this.modalChart?.destroy();
    this.autoRefreshSub?.unsubscribe();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();
    this.svc.getDashboard().subscribe({
      next: (d) => {
        this.dashboard = d;
        this.cargando  = false;
        this.procesarRankings();
        this.cdr.detectChanges();       // fuerza ngIf a renderizar los canvas
        setTimeout(() => this.renderMainCharts(), 150);
      },
      error: (err) => {
        this.error    = 'Error al cargar datos de garantías.';
        this.cargando = false;
        this.cdr.markForCheck();
        console.error(err);
      },
    });
  }

  refrescarManual(): void { this.svc.refrescar().subscribe(() => this.cargar()); }
  exportar(): void        { window.open(this.svc.getExportUrl(), '_blank'); }

  private procesarRankings(): void {
    if (!this.dashboard) return;
    this.topClientes    = this.buildRank(this.dashboard.garantias_por_cliente, 10);
    this.topLatencia    = this.buildRank(this.dashboard.latencia_por_cliente,  10);
    this.topDanos       = this.buildRank(this.dashboard.descripcion_dano,       5);
    this.topUbicaciones = this.buildRank(this.dashboard.ubicacion_dano,         5);
  }

  buildRank(data: Record<string, number>, n = 5): RankItem[] {
    if (!data) return [];
    const entries = Object.entries(data).slice(0, n);
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([key, value], i) => ({
      key, value,
      pct:   Math.round((value / max) * 100),
      color: PALETA[i % PALETA.length],
    }));
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  abrirModal(key: ModalKey): void {
    this.modalKey    = key;
    this.modalAbierto = true;
    this.cdr.detectChanges();
    setTimeout(() => this.renderModalChart(), 80);
  }

  cerrarModal(): void {
    this.modalChart?.destroy();
    this.modalChart   = undefined;
    this.modalAbierto = false;
    this.modalKey     = null;
    this.cdr.markForCheck();
  }

  get modalItemCount(): number { return Object.keys(this.modalData).length; }

  get modalData(): Record<string, number> {
    if (!this.dashboard || !this.modalKey) return {};
    const map: Record<ModalKey, Record<string, number>> = {
      garantias_cliente: this.dashboard.garantias_por_cliente,
      latencia_cliente:  this.dashboard.latencia_por_cliente,
      descripcion_dano:  this.dashboard.descripcion_dano,
      ubicacion_dano:    this.dashboard.ubicacion_dano,
    };
    return map[this.modalKey];
  }

  // ── Chart lifecycle ──────────────────────────────────────────────────────
  private destroyMainCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private renderMainCharts(): void {
    if (!this.dashboard) return;
    if (!this.chartEstatusRef?.nativeElement || !this.chartLatenciaMesRef?.nativeElement) return;
    this.destroyMainCharts();
    const d = this.dashboard;
    this.charts.push(this.buildDonut(this.chartEstatusRef,     d.por_estatus));
    this.charts.push(this.buildBarV(this.chartLatenciaMesRef,  d.latencia_mensual));
  }

  private renderModalChart(): void {
    if (!this.chartModalRef?.nativeElement || !this.modalKey) return;
    this.modalChart?.destroy();
    const data  = this.modalData;
    const meta  = MODAL_META[this.modalKey];
    const items = Object.keys(data).length;
    const h = Math.max(380, items * 36 + 60);
    this.chartModalRef.nativeElement.style.height = `${h}px`;
    this.modalChart = this.buildBarH(this.chartModalRef, data, meta.label);
  }

  // ── Chart builders ───────────────────────────────────────────────────────
  private buildDonut(ref: ElementRef<HTMLCanvasElement>, data: Record<string, number>): Chart {
    const labels = Object.keys(data);
    const values = Object.values(data);
    const total  = values.reduce((a, b) => a + b, 0);
    const colors = labels.map((l, i) =>
      COLORES_ESTATUS[l.toLowerCase()] ?? PALETA[i % PALETA.length]
    );
    return new Chart(ref.nativeElement, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: BG_CARD }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'right', labels: { color: TEXT_2, boxWidth: 12, padding: 12, font: { size: 11 } } },
          tooltip: { ...this.tooltipStyle(), callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}  (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
          }},
        },
      },
    });
  }

  private buildBarV(ref: ElementRef<HTMLCanvasElement>, data: Record<string, number>): Chart {
    return new Chart(ref.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Días promedio',
          data: Object.values(data),
          backgroundColor: ORANGE_DIM, borderColor: ORANGE, borderWidth: 1,
          borderRadius: 5, hoverBackgroundColor: ORANGE,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle() },
        scales: { x: this.axisStyle(), y: { ...this.axisStyle(), beginAtZero: true } },
      },
    });
  }

  private buildBarH(ref: ElementRef<HTMLCanvasElement>, data: Record<string, number>, label: string): Chart {
    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = values.map((_, i) => {
      const alpha = Math.max(0.40, 1 - (i / Math.max(labels.length - 1, 1)) * 0.60);
      return `rgba(235,94,40,${alpha.toFixed(2)})`;
    });
    return new Chart(ref.nativeElement, {
      type: 'bar',
      data: { labels, datasets: [{ label, data: values, backgroundColor: colors, borderRadius: 4, borderSkipped: false, hoverBackgroundColor: ORANGE }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle() },
        scales: {
          x: { ...this.axisStyle(), beginAtZero: true },
          y: { ...this.axisStyle(), grid: { display: false }, ticks: { color: TEXT_2, font: { size: 11 } } },
        },
      },
    });
  }

  private tooltipStyle() {
    return { backgroundColor: '#2a2a2a', borderColor: '#444' as string, borderWidth: 1, titleColor: '#FFFCF2' as string, bodyColor: TEXT_2, padding: 10 };
  }

  private axisStyle() {
    return {
      grid: { color: GRID },
      ticks: { color: TEXT_3, font: { size: 11, family: "'Segoe UI',sans-serif" } as any },
      border: { color: 'rgba(255,255,255,0.08)' },
    };
  }
}
