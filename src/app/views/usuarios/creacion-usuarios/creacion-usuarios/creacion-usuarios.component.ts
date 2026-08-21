import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSistemaService, UsuarioHijoItem, CupoResponse } from '../../../../services/admin-sistema.service';
import { AuthService } from '../../../../services/auth.service';
import { TopBarUsuariosComponent } from '../../../../components/top-bar-usuarios/top-bar-usuarios.component';

@Component({
  selector: 'app-creacion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarUsuariosComponent],
  templateUrl: './creacion-usuarios.component.html',
  styleUrl: './creacion-usuarios.component.css'
})
export class CreacionUsuariosComponent implements OnInit {
  private readonly adminService = inject(AdminSistemaService);
  private readonly authService = inject(AuthService);

  cargando: boolean = false;
  alertMsj: string | null = null;
  alertTipo: 'success' | 'error' = 'success';

  padreId: number | null = null;
  cupo: CupoResponse | null = null;
  usuariosHijos: UsuarioHijoItem[] = [];

  // Modal Crear Usuario
  modalCrearVisible: boolean = false;
  formNombre: string = '';
  formCorreo: string = '';
  formUsuario: string = '';
  formContrasena: string = '';

  // Modal Cambiar Contraseña
  modalPassVisible: boolean = false;
  usuarioSeleccionadoId: number | null = null;
  formNuevaContrasena: string = '';

  ngOnInit(): void {
    this.padreId = this.authService.getUserId();
    if (this.padreId) {
      this.cargarDatos();
    } else {
      this.mostrarAlerta('No se identificó el ID de la sesión actual.', 'error');
    }
  }

  cargarDatos(): void {
    if (!this.padreId) return;
    this.cargando = true;

    this.adminService.getCupoPadre(this.padreId).subscribe({
      next: (resCupo) => {
        this.cupo = resCupo;
        this.adminService.getUsuariosHijos(this.padreId!).subscribe({
          next: (resHijos) => {
            this.usuariosHijos = resHijos.usuarios || [];
            this.cargando = false;
          },
          error: () => {
            this.cargando = false;
            this.mostrarAlerta('Error al obtener el listado de usuarios.', 'error');
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.mostrarAlerta('Error al consultar disponibilidad de cupo.', 'error');
      }
    });
  }

  abrirModalCrear(): void {
    if (this.cupo && !this.cupo.tiene_cupo) {
      this.mostrarAlerta('Has alcanzado el límite máximo de usuarios permitidos.', 'error');
      return;
    }
    this.formNombre = '';
    this.formCorreo = '';
    this.formUsuario = '';
    this.formContrasena = '';
    this.modalCrearVisible = true;
  }

  cerrarModal() {
    this.modalCrearVisible = false;
  }

  guardarNuevoUsuario(): void {
    if (!this.padreId) return;
    if (!this.formNombre.trim() || !this.formCorreo.trim() || !this.formUsuario.trim() || !this.formContrasena.trim()) {
      this.mostrarAlerta('Todos los campos son obligatorios.', 'error');
      return;
    }

    this.adminService.crearUsuarioHijo({
      padre_id: this.padreId,
      nombre: this.formNombre.trim(),
      correo: this.formCorreo.trim(),
      usuario: this.formUsuario.trim(),
      contrasena: this.formContrasena.trim()
    }).subscribe({
      next: () => {
        this.mostrarAlerta('Usuario hijo creado exitosamente.', 'success');
        this.cerrarModal();
        this.cargarDatos();
      },
      error: (err) => this.mostrarAlerta(err.error?.error || 'Error al crear el usuario.', 'error')
    });
  }

  cambiarEstado(hijo: UsuarioHijoItem, nuevoEstado: number): void {
    if (!this.padreId) return;
    this.adminService.cambiarEstadoHijo(hijo.id, this.padreId, nuevoEstado).subscribe({
      next: () => {
        hijo.activo = nuevoEstado;
        this.mostrarAlerta(`Usuario ${nuevoEstado === 1 ? 'activado' : 'desactivado'}.`, 'success');
        this.cargarDatos();
      },
      error: () => this.mostrarAlerta('Error al cambiar estado.', 'error')
    });
  }

  abrirModalContrasena(hijoId: number): void {
    this.usuarioSeleccionadoId = hijoId;
    this.formNuevaContrasena = '';
    this.modalPassVisible = true;
  }

  cerrarModalContrasena(): void {
    this.modalPassVisible = false;
    this.usuarioSeleccionadoId = null;
  }

  guardarNuevaContrasena(): void {
    if (!this.padreId || !this.usuarioSeleccionadoId) return;
    if (!this.formNuevaContrasena.trim()) {
      this.mostrarAlerta('Ingresa la nueva contraseña.', 'error');
      return;
    }

    this.adminService.cambiarContrasenaHijo(this.usuarioSeleccionadoId, this.padreId, this.formNuevaContrasena.trim()).subscribe({
      next: () => {
        this.mostrarAlerta('Contraseña actualizada correctamente.', 'success');
        this.cerrarModalContrasena();
      },
      error: () => this.mostrarAlerta('Error al cambiar contraseña.', 'error')
    });
  }

  mostrarAlerta(msj: string, tipo: 'success' | 'error'): void {
    this.alertMsj = msj;
    this.alertTipo = tipo;
    setTimeout(() => (this.alertMsj = null), 4000);
  }
}