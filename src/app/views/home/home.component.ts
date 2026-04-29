import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MonitorOdooService } from '../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../components/home-bar/home-bar.component';
import { environment } from '../../../environments/environment';

interface CargaResult {
  cargados: number;
  total_filas_procesadas: number;
  duplicados_actualizados: number;
  advertencias: string[];
}

interface TokenSlot {
  codigo: string | null;
  expira_en: string | null;
  creado_en: string | null;
}

interface UsuarioToken {
  id: number;
  nombre: string;
  usuario: string;
  activo: boolean;
  clave: string | null;
  nombre_grupo: string | null;
  tokens: {
    super: TokenSlot | null;
    eliminar: TokenSlot | null;
    meses: TokenSlot | null;
  };
}

type TipoToken = 'super' | 'eliminar' | 'meses';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  facturas: any[] = [];

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private timerInterval: any;

  // ── Modal catálogo ────────────────────────────────────────────────────────
  modalCatalogoAbierto = false;
  totalProductosCatalogo = 0;
  archivoSeleccionado: File | null = null;
  subiendoCatalogo = false;
  resultadoCarga: CargaResult | null = null;
  errorCarga: string | null = null;
  arrastrando = false;
  mostrarConfirmLimpiar = false;
  limpiandoCatalogo = false;

  // ── Modal tokens ──────────────────────────────────────────────────────────
  modalTokensAbierto = false;
  cargandoTokens = false;
  usuariosTokens: UsuarioToken[] = [];
  generandoToken: Record<string, boolean> = {};
  copiado: Record<string, boolean> = {};
  busquedaToken = '';

  get usuariosTokensFiltrados(): UsuarioToken[] {
    const q = this.busquedaToken.trim().toLowerCase();
    if (!q) return this.usuariosTokens;
    return this.usuariosTokens.filter(u =>
      u.nombre.toLowerCase().includes(q) || u.usuario.toLowerCase().includes(q)
    );
  }

  tokenKey(userId: number, tipo: TipoToken): string {
    return `${userId}-${tipo}`;
  }

  constructor(private monitorService: MonitorOdooService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  verMonitor() {
    this.monitorService.getFacturas().subscribe({
      next: (data) => { this.facturas = data; },
      error: (error) => { console.error('Error al obtener facturas:', error); }
    });
  }

  // ── Modal catálogo ────────────────────────────────────────────────────────

  abrirModalCatalogo(): void {
    this.modalCatalogoAbierto = true;
    this.resetearEstadoCatalogo();
    this.cargarConteo();
  }

  cerrarModalCatalogo(): void {
    this.modalCatalogoAbierto = false;
    this.resetearEstadoCatalogo();
  }

  private resetearEstadoCatalogo(): void {
    this.archivoSeleccionado = null;
    this.resultadoCarga = null;
    this.errorCarga = null;
    this.arrastrando = false;
    this.mostrarConfirmLimpiar = false;
  }

  cargarConteo(): void {
    this.http.get<{ total_productos: number }>(`${this.apiUrl}/forecast/catalogo-excel`)
      .subscribe({
        next: r => { this.totalProductosCatalogo = r.total_productos; },
        error: () => {}
      });
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.arrastrando = true; }
  onDragLeave(): void { this.arrastrando = false; }

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

  subirCatalogo(): void {
    if (!this.archivoSeleccionado) return;
    this.subiendoCatalogo = true;
    this.resultadoCarga = null;
    this.errorCarga = null;

    const fd = new FormData();
    fd.append('file', this.archivoSeleccionado);

    this.http.post<CargaResult>(`${this.apiUrl}/forecast/catalogo-excel`, fd).subscribe({
      next: r => {
        this.resultadoCarga = r;
        this.subiendoCatalogo = false;
        this.archivoSeleccionado = null;
        this.cargarConteo();
      },
      error: err => {
        this.errorCarga = err.error?.error || 'Error al subir el archivo';
        this.subiendoCatalogo = false;
      }
    });
  }

  confirmarLimpiarCatalogo(): void { this.mostrarConfirmLimpiar = true; }
  cancelarLimpiar(): void { this.mostrarConfirmLimpiar = false; }

  ejecutarLimpiar(): void {
    this.limpiandoCatalogo = true;
    this.http.delete<{ eliminados: number }>(`${this.apiUrl}/forecast/catalogo-excel`).subscribe({
      next: () => {
        this.limpiandoCatalogo = false;
        this.mostrarConfirmLimpiar = false;
        this.totalProductosCatalogo = 0;
      },
      error: err => {
        this.errorCarga = err.error?.error || 'Error al limpiar el catálogo';
        this.limpiandoCatalogo = false;
        this.mostrarConfirmLimpiar = false;
      }
    });
  }

  // ── Modal tokens ──────────────────────────────────────────────────────────

  abrirModalTokens(): void {
    this.modalTokensAbierto = true;
    this.cargarTokens();
    // Refresca el tiempo restante cada 30s
    this.timerInterval = setInterval(() => {
      if (this.modalTokensAbierto) this.usuariosTokens = [...this.usuariosTokens];
    }, 30000);
  }

  cerrarModalTokens(): void {
    this.modalTokensAbierto = false;
    this.busquedaToken = '';
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  cargarTokens(): void {
    this.cargandoTokens = true;
    this.http.get<UsuarioToken[]>(`${this.apiUrl}/edicion/tokens-monitor`).subscribe({
      next: lista => { this.usuariosTokens = lista; this.cargandoTokens = false; },
      error: () => { this.cargandoTokens = false; }
    });
  }

  generarToken(u: UsuarioToken, tipo: TipoToken): void {
    const key = this.tokenKey(u.id, tipo);
    this.generandoToken[key] = true;
    this.http.post<{ codigo: string; tipo: TipoToken }>(
      `${this.apiUrl}/edicion/generar-otp`,
      { usuario_id: u.id, tipo }
    ).subscribe({
      next: r => {
        const expira = new Date(Date.now() + 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        u.tokens[tipo] = { codigo: r.codigo, expira_en: expira, creado_en: null };
        this.generandoToken[key] = false;
      },
      error: () => { this.generandoToken[key] = false; }
    });
  }

  onGenerarToken(event: { usuario: UsuarioToken; tipo: TipoToken }): void {
    this.generarToken(event.usuario, event.tipo);
  }

  onCopiarToken(event: { codigo: string; usuarioId: number; tipo: TipoToken }): void {
    this.copiarToken(event.codigo, event.usuarioId, event.tipo);
  }

  copiarToken(codigo: string, userId: number, tipo: TipoToken): void {
    const key = this.tokenKey(userId, tipo);
    navigator.clipboard.writeText(codigo).then(() => {
      this.copiado[key] = true;
      setTimeout(() => { this.copiado[key] = false; }, 2000);
    });
  }

  calcularTiempoRestante(expiraEn: string | null): string {
    if (!expiraEn) return '';
    const diff = new Date(expiraEn).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const min = Math.floor(diff / 60000);
    const seg = Math.floor((diff % 60000) / 1000);
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
    return `${min}m ${seg}s`;
  }
}
