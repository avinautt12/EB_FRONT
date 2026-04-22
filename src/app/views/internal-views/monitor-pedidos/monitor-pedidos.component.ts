import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FacturasClienteComponent } from '../../../components/facturas-cliente/facturas-cliente.component';
import { UsuariosService } from '../../../services/usuarios.service';

interface UsuarioMonitor {
  id: number | null;
  id_cliente: number | null;
  nombre: string;
  usuario: string | null;
  rol: string;
  activo: boolean;
  clave: string | null;
  id_grupo: number | null;
  nombre_grupo: string | null;
}

interface GrupoIntegral {
  id: number;
  nombre_grupo: string;
}

@Component({
  selector: 'app-monitor-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeBarComponent, FacturasClienteComponent],
  templateUrl: './monitor-pedidos.component.html',
  styleUrls: ['./monitor-pedidos.component.css']
})
export class MonitorPedidosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  // ── Modo de búsqueda ─────────────────────────────────────────────────────
  modo: 'usuario' | 'integral' = 'usuario';

  // ── Datos ─────────────────────────────────────────────────────────────────
  usuarios: UsuarioMonitor[] = [];
  grupos: GrupoIntegral[] = [];
  cargando = true;
  error: string | null = null;

  // ── Búsqueda / filtro ─────────────────────────────────────────────────────
  textoBusqueda = '';
  ocultarAdmins = true;
  private sinAcentos = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  get usuariosFiltrados(): UsuarioMonitor[] {
    const base = this.ocultarAdmins
      ? this.usuarios.filter(u => u.rol !== 'Administrador')
      : this.usuarios;
    const q = this.sinAcentos(this.textoBusqueda.trim().toLowerCase());
    if (!q) return base;
    return base.filter(u =>
      this.sinAcentos(u.nombre.toLowerCase()).includes(q) ||
      this.sinAcentos((u.usuario ?? '').toLowerCase()).includes(q) ||
      this.sinAcentos((u.clave ?? '').toLowerCase()).includes(q) ||
      this.sinAcentos((u.nombre_grupo ?? '').toLowerCase()).includes(q)
    );
  }

  // ── Modal FacturasCliente ─────────────────────────────────────────────────
  modalAbierto = false;
  /** Clave para búsqueda directa (usuario normal con clave asignada) */
  modalClave: string | null = null;
  /** ID numérico del cliente (para tab Proyecciones) */
  modalIdCliente: number | null = null;
  /** ID grupo para Vista Global integral */
  modalGrupoOdoo: number | null = null;
  /** Etiqueta que se muestra en el header del modal */
  modalEtiqueta = '';
  /** Búsqueda exacta por ref (usuario con clave propia) */
  modalClaveExacta = false;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;
    // Cargamos usuarios y grupos en paralelo
    let usuariosCargados = false;
    let gruposCargados = false;
    const verificarListo = () => {
      if (usuariosCargados && gruposCargados) this.cargando = false;
    };

    this.usuariosService.getUsuariosParaMonitor().subscribe({
      next: (data) => { this.usuarios = data; usuariosCargados = true; verificarListo(); },
      error: () => { this.error = 'Error al cargar usuarios'; this.cargando = false; }
    });

    this.usuariosService.getGruposIntegrales().subscribe({
      next: (data) => { this.grupos = data; gruposCargados = true; verificarListo(); },
      error: () => { this.error = 'Error al cargar grupos'; this.cargando = false; }
    });
  }

  cambiarModo(m: 'usuario' | 'integral'): void {
    this.modo = m;
    this.textoBusqueda = '';
  }

  /** Abre el modal para un usuario específico */
  verPedidosUsuario(u: UsuarioMonitor): void {
    this.modalClave = null;
    this.modalGrupoOdoo = null;
    this.modalClaveExacta = false;
    this.modalIdCliente = u.id_cliente ?? null;

    if (u.clave) {
      this.modalClave = u.clave;
      this.modalClaveExacta = true;
      this.modalEtiqueta = `${u.nombre} (${u.clave})`;
    } else {
      this.modalClave = '__sin_clave__';
      this.modalClaveExacta = true;
      this.modalEtiqueta = u.nombre;
    }
    this.modalAbierto = true;
  }

  /** Abre el modal para un grupo integral completo */
  verPedidosGrupo(g: GrupoIntegral): void {
    this.modalClave = null;
    this.modalGrupoOdoo = g.id;
    this.modalClaveExacta = false;
    this.modalEtiqueta = g.nombre_grupo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalClave = null;
    this.modalGrupoOdoo = null;
    this.modalIdCliente = null;
  }
}
