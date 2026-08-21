import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { AdminSistemaService, AdminClienteItem, AccionBase, ModuloItem } from '../../../../services/admin-sistema.service';
import { TopBarUsuariosComponent } from '../../../../components/top-bar-usuarios/top-bar-usuarios.component';

export interface PermisoDelegableFila {
  modulo_id: number;
  modulo: string;
  accion_id: number;
  accion: string;
  asignado: boolean;
}

@Component({
  selector: 'app-gestion-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarUsuariosComponent],
  templateUrl: './gestion-clientes.component.html',
  styleUrl: './gestion-clientes.component.css'
})
export class GestionClientesComponent implements OnInit {
  private readonly adminService = inject(AdminSistemaService);

  cargando: boolean = false;
  cargandoModal: boolean = false;
  guardandoPermisos: boolean = false;
  alertMsj: string | null = null;
  alertTipo: 'success' | 'error' = 'success';

  administradores: AdminClienteItem[] = [];
  modulos: ModuloItem[] = [];
  catalogoModulosAcciones: PermisoDelegableFila[] = [];
  
  // Guardado de estado inicial para detectar cambios
  estadoInicial: { [key: string]: boolean } = {};

  modalBolsaVisible: boolean = false;
  clienteSeleccionado: AdminClienteItem | null = null;
  filtroTexto: string = '';

  modulosExpandidos = new Set<number>();

  ngOnInit(): void {
    this.cargarAdministradores();
  }

  get administradoresFiltrados(): AdminClienteItem[] {
    if (!this.filtroTexto.trim()) return this.administradores;
    const txt = this.filtroTexto.toLowerCase();
    return this.administradores.filter(a =>
      a.nombre.toLowerCase().includes(txt) ||
      a.usuario.toLowerCase().includes(txt) ||
      a.correo.toLowerCase().includes(txt)
    );
  }

  cargarAdministradores(): void {
    this.cargando = true;
    this.adminService.getAdministradores().subscribe({
      next: (res) => {
        this.administradores = res.administradores || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mostrarAlerta('Error al cargar la lista de administradores cliente.', 'error');
      }
    });
  }

  actualizarCupo(admin: AdminClienteItem, nuevoLimite: number): void {
    if (nuevoLimite < 0) {
      this.mostrarAlerta('El límite de cupo no puede ser negativo.', 'error');
      return;
    }

    this.adminService.actualizarCupoAdmin(admin.id, nuevoLimite).subscribe({
      next: () => {
        admin.max_hijos = nuevoLimite;
        this.mostrarAlerta(`Cupo actualizado a ${nuevoLimite} para ${admin.nombre}.`, 'success');
      },
      error: () => this.mostrarAlerta('Error al actualizar el límite de cupo.', 'error')
    });
  }

  cambiarEstadoUsuario(admin: AdminClienteItem, nuevoEstado: number): void {
    this.adminService.cambiarEstadoUsuarioGlobal(admin.id, nuevoEstado).subscribe({
      next: () => {
        admin.activo = nuevoEstado;
        const txt = nuevoEstado === 1 ? 'activado' : 'desactivado';
        this.mostrarAlerta(`Administrador ${admin.nombre} ${txt} correctamente.`, 'success');
      },
      error: () => this.mostrarAlerta('Error al cambiar el estado del usuario.', 'error')
    });
  }

  toggleExpandir(id: number): void {
    if (this.modulosExpandidos.has(id)) {
      this.modulosExpandidos.delete(id);
    } else {
      this.modulosExpandidos.add(id);
    }
  }

  isExpandido(id: number): boolean {
    return this.modulosExpandidos.has(id);
  }

  get modulosRaiz(): ModuloItem[] {
    return (this.modulos || []).filter(m => !m.padre_id);
  }

  getSubmodulos(padreId: number): ModuloItem[] {
    return (this.modulos || []).filter(m => m.padre_id === padreId);
  }

  isPermisoAsignado(moduloId: number, accionId: number): boolean {
    const item = this.catalogoModulosAcciones.find(
      p => p.modulo_id === moduloId && p.accion_id === accionId
    );
    return item ? item.asignado : false;
  }

  abrirModalBolsaDelegable(admin: AdminClienteItem): void {
    this.clienteSeleccionado = admin;
    this.modalBolsaVisible = true;
    this.cargarPermisosDelegables(admin.id);
  }

  cerrarModalBolsa(): void {
    this.modalBolsaVisible = false;
    this.clienteSeleccionado = null;
    this.catalogoModulosAcciones = [];
    this.modulos = [];
    this.estadoInicial = {};
    this.modulosExpandidos.clear();
  }

  cargarPermisosDelegables(adminId: number): void {
    this.cargandoModal = true;

    this.adminService.getModulos().subscribe({
      next: (resModulos) => {
        this.modulos = resModulos.modulos || [];
        const listaPlana: PermisoDelegableFila[] = [];

        this.modulos.forEach(m => {
          (m.acciones || []).forEach((a: AccionBase) => {
            listaPlana.push({
              modulo_id: m.id,
              modulo: m.nombre,
              accion_id: a.id,
              accion: a.nombre,
              asignado: false
            });
          });
        });

        this.adminService.getPermisosDelegables(adminId).subscribe({
          next: (resDelegables) => {
            this.cargandoModal = false;
            const asignados = resDelegables.permisos_delegables || [];

            this.estadoInicial = {};
            listaPlana.forEach(item => {
              const estaAsignado = asignados.some(
                d => d.modulo_id === item.modulo_id && d.accion_id === item.accion_id
              );
              item.asignado = estaAsignado;
              this.estadoInicial[`${item.modulo_id}_${item.accion_id}`] = estaAsignado;
            });

            this.catalogoModulosAcciones = listaPlana;
          },
          error: () => {
            this.cargandoModal = false;
            this.mostrarAlerta('Error al cargar la bolsa de permisos asignada.', 'error');
          }
        });
      },
      error: () => {
        this.cargandoModal = false;
        this.mostrarAlerta('Error al obtener el catálogo de módulos.', 'error');
      }
    });
  }

  // Cambia el estado localmente sin peticiones instantáneas
  togglePermiso(moduloId: number, accionId: number): void {
    const item = this.catalogoModulosAcciones.find(
      p => p.modulo_id === moduloId && p.accion_id === accionId
    );
    if (item) {
      item.asignado = !item.asignado;
    }
  }

  // Guarda únicamente los permisos modificados
  guardarPermisos(): void {
    if (!this.clienteSeleccionado) return;
    this.guardandoPermisos = true;

    const peticiones: Observable<any>[] = [];

    this.catalogoModulosAcciones.forEach(item => {
      const key = `${item.modulo_id}_${item.accion_id}`;
      const estadoOriginal = !!this.estadoInicial[key];

      if (item.asignado !== estadoOriginal) {
        if (item.asignado) {
          peticiones.push(
            this.adminService.asignarPermisoDelegable(this.clienteSeleccionado!.id, item.modulo_id, item.accion_id)
          );
        } else {
          peticiones.push(
            this.adminService.revocarPermisoDelegable(this.clienteSeleccionado!.id, item.modulo_id, item.accion_id)
          );
        }
      }
    });

    if (peticiones.length === 0) {
      this.mostrarAlerta('No se realizaron cambios en los permisos.', 'success');
      this.cerrarModalBolsa();
      this.guardandoPermisos = false;
      return;
    }

    forkJoin(peticiones).subscribe({
      next: () => {
        this.guardandoPermisos = false;
        this.mostrarAlerta('Permisos actualizados correctamente.', 'success');
        this.cerrarModalBolsa();
      },
      error: () => {
        this.guardandoPermisos = false;
        this.mostrarAlerta('Error al guardar algunos permisos.', 'error');
      }
    });
  }

  mostrarAlerta(msj: string, tipo: 'success' | 'error'): void {
    this.alertMsj = msj;
    this.alertTipo = tipo;
    setTimeout(() => (this.alertMsj = null), 4000);
  }
}