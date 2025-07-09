import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { UsuariosService } from '../../../services/usuarios.service';
import { SocketService } from '../../../services/socket.service';
import { AlertaService } from '../../../services/alerta.service';
import { ClientesService } from '../../../services/clientes.service';
import { AlertaComponent } from '../../../components/alerta/alerta.component';

interface Usuario {
  id: number | null;
  usuario: string;
  contrasena?: string;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Usuario';
  activo: boolean;
}

interface ClienteNombre {
  clave: string;
  nombre_cliente: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBarComponent, AlertaComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private socketService = inject(SocketService);
  private alerta = inject(AlertaService);
  private clientesService = inject(ClientesService);

  readonly ROLES = {
    ADMIN: { backendValue: 'Administrador' as const, display: 'Administrador' as const },
    USUARIO: { backendValue: 'Usuario' as const, display: 'Usuario' as const }
  };

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  nuevoUsuario: Usuario = {
    id: null,
    usuario: '',
    contrasena: '',
    nombre: '',
    correo: '',
    rol: this.ROLES.USUARIO.backendValue,
    activo: true
  };

  mostrarFormularioRegistroVisible = false;
  mostrarFormularioEdicion = false;
  cargandoUsuarios = false;

  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';

  filtros = {
    clave: '',
    nombre: '',
    correo: '',
    usuario: '',
    rol: ''
  };

  paginaActual = 1;
  usuariosPorPagina = 5;

  filtroAbierto: string | null = null;

  usuarioAEliminar: Usuario | null = null;
  mostrarConfirmacion = false;

  asociarCliente = false;
  clienteBusqueda = '';
  clienteSugerencias: ClienteNombre[] = [];
  clienteSeleccionadoId: number | null = null;

  ngOnInit(): void {
    this.cargarUsuarios();

    this.alerta.alerta$.subscribe(({ mensaje, tipo }) => {
      this.mensajeAlerta = mensaje;
      this.tipoAlerta = tipo;
      setTimeout(() => this.mensajeAlerta = null, 4000);
    });

    this.clientesService.getNombresClientes().subscribe({
      next: (res: ClienteNombre[]) => {
        this.clienteSugerencias = res;
      },
      error: () => console.error('Error al obtener los nombres de clientes')
    });

    this.socketService.on<Usuario>('usuarioActualizado', (actualizado) => {
      const idx = this.usuarios.findIndex(u => u.id === actualizado.id);
      if (idx !== -1) {
        this.usuarios[idx] = actualizado;
        this.filtrarUsuarios();
      }
      console.log('✅ Usuario actualizado recibido vía socket:', actualizado);
    });
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data.map((u: any) => ({
          ...u,
          rol: u.rol === 'Administrador' ? this.ROLES.ADMIN.backendValue : this.ROLES.USUARIO.backendValue
        }));
        this.cargandoUsuarios = false;
        this.filtrarUsuarios(); // inicializa usuariosFiltrados con todos
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargandoUsuarios = false;
      }
    });
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.usuariosPorPagina);
  }

  filtrarUsuarios() {
    this.paginaActual = 1; // Reset paginación al filtrar

    this.usuariosFiltrados = this.usuarios.filter(u => {
      const coincideClave = u.id?.toString().toLowerCase().includes(this.filtros.clave.toLowerCase());
      const coincideNombre = u.nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase());
      const coincideCorreo = u.correo.toLowerCase().includes(this.filtros.correo.toLowerCase());
      const coincideUsuario = u.usuario.toLowerCase().includes(this.filtros.usuario.toLowerCase());
      const coincideRol = this.filtros.rol === '' || u.rol === this.filtros.rol;

      return coincideClave && coincideNombre && coincideCorreo && coincideUsuario && coincideRol;
    });
  }

  filtrarClientes(): ClienteNombre[] {
    const texto = this.clienteBusqueda.toLowerCase().trim();
    return this.clienteSugerencias.filter(c =>
      c.clave.toLowerCase().includes(texto) ||
      c.nombre_cliente.toLowerCase().includes(texto)
    ).slice(0, 8);
  }

  seleccionarCliente(cliente: ClienteNombre) {
    this.clienteBusqueda = `${cliente.nombre_cliente} (${cliente.clave})`;

    this.clientesService.buscarCliente(cliente.clave).subscribe({
      next: (clienteCompleto) => {
        this.clienteSeleccionadoId = clienteCompleto.id;
      },
      error: () => {
        console.error('Error al buscar cliente completo');
        this.clienteSeleccionadoId = null;
      }
    });
  }

  usuariosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.usuariosPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.usuariosPorPagina);
  }

  mostrarFormularioRegistro(): void {
    this.nuevoUsuario = {
      id: null,
      usuario: '',
      contrasena: '',
      nombre: '',
      correo: '',
      rol: this.ROLES.USUARIO.backendValue,
      activo: true
    };
    this.mostrarFormularioRegistroVisible = true;
    this.mostrarFormularioEdicion = false;
  }

  editarUsuario(usuario: Usuario): void {
    this.nuevoUsuario = {
      ...usuario,
      contrasena: '' // Limpiar contraseña para no mostrarla
    };
    this.mostrarFormularioEdicion = true;
    this.mostrarFormularioRegistroVisible = false;
  }

  volverALista(): void {
    this.mostrarFormularioRegistroVisible = false;
    this.mostrarFormularioEdicion = false;
  }

  agregarUsuario(): void {
    if (this.validarFormulario()) {
      this.cargandoUsuarios = true;

      const usuarioParaCrear: any = {
        usuario: this.nuevoUsuario.usuario,
        contrasena: this.nuevoUsuario.contrasena,
        nombre: this.nuevoUsuario.nombre,
        correo: this.nuevoUsuario.correo,
        rol: this.nuevoUsuario.rol,
        activo: this.nuevoUsuario.activo
      };

      if (this.asociarCliente && this.clienteSeleccionadoId) {
        usuarioParaCrear.cliente_id = this.clienteSeleccionadoId;
      }

      this.usuariosService.crearUsuario(usuarioParaCrear).subscribe({
        next: (usuarioCreado) => {
          this.usuarios.push(usuarioCreado);
          this.filtrarUsuarios();
          this.alerta.mostrarExito('✅ Usuario creado con éxito');
          this.volverALista();
          this.cargandoUsuarios = false;
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          if (error.status === 400 && error.error?.error) {
            this.alerta.mostrarError(error.error.error);
          } else {
            this.alerta.mostrarError('Ocurrió un error inesperado.');
          }
          this.cargandoUsuarios = false;
        }
      });
    }
  }

  actualizarUsuario(): void {
    if (this.validarFormulario()) {
      if (this.nuevoUsuario.id == null) {
        this.alerta.mostrarError('ID de usuario no válido para la actualización');
        return;
      }

      this.cargandoUsuarios = true;

      const datosActualizacion: any = {
        nombre: this.nuevoUsuario.nombre,
        rol: this.nuevoUsuario.rol,
        activo: this.nuevoUsuario.activo,
        usuario: this.nuevoUsuario.usuario,
        correo: this.nuevoUsuario.correo
      };

      if (this.nuevoUsuario.contrasena?.trim()) {
        datosActualizacion.contrasena = this.nuevoUsuario.contrasena;
      }

      // 👇 Aquí decides si actualizar o eliminar el cliente_id
      if (this.asociarCliente && this.clienteSeleccionadoId) {
        datosActualizacion.cliente_id = this.clienteSeleccionadoId;
      } else {
        datosActualizacion.cliente_id = null; // ❗ Para eliminarlo si no hay checkbox marcado
      }

      this.usuariosService.actualizarUsuario(this.nuevoUsuario.id, datosActualizacion).subscribe({
        next: (usuarioActualizado) => {
          const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
          if (index !== -1) {
            this.usuarios[index] = usuarioActualizado;
            this.filtrarUsuarios();
          }
          this.alerta.mostrarExito('✅ Usuario actualizado con éxito');
          this.volverALista();
          this.cargandoUsuarios = false;
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          if (error.status === 400 && error.error?.errores) {
            this.alerta.mostrarError(error.error.errores.join('\n'));
          } else {
            this.alerta.mostrarError('Error al actualizar usuario');
          }
          this.cargandoUsuarios = false;
        }
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.nuevoUsuario.nombre) {
      alert('El nombre es obligatorio');
      return false;
    }

    if (this.mostrarFormularioRegistroVisible) {
      if (!this.nuevoUsuario.usuario) {
        alert('El nombre de usuario es obligatorio');
        return false;
      }
      if (!this.nuevoUsuario.correo) {
        alert('El correo electrónico es obligatorio');
        return false;
      }
      if (!this.nuevoUsuario.contrasena) {
        alert('La contraseña es requerida');
        return false;
      }
      if (this.nuevoUsuario.contrasena.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }

    if (this.nuevoUsuario.correo && !this.validarEmail(this.nuevoUsuario.correo)) {
      alert('El correo electrónico no es válido');
      return false;
    }

    return true;
  }

  validarEmail(email: string): boolean {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  }

  confirmarEliminacion(usuario: Usuario): void {
    this.usuarioAEliminar = usuario;
    this.mostrarConfirmacion = true;
  }

  cancelarEliminacion(): void {
    this.usuarioAEliminar = null;
    this.mostrarConfirmacion = false;
  }

  eliminarUsuario(): void {
    if (this.usuarioAEliminar && this.usuarioAEliminar.id) {
      this.cargandoUsuarios = true;
      this.usuariosService.eliminarUsuario(this.usuarioAEliminar.id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.id !== this.usuarioAEliminar?.id);
          this.filtrarUsuarios();
          this.mostrarConfirmacion = false;
          this.usuarioAEliminar = null;
          this.cargandoUsuarios = false;

          if (this.paginaActual > 1 && this.usuariosPaginados().length === 0) {
            this.paginaActual--;
          }
          this.alerta.mostrarExito('✅ Usuario eliminado con éxito');
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.alerta.mostrarError(error.error?.error || 'Error al eliminar usuario');
          this.cargandoUsuarios = false;
        }
      });
    }
  }

  verDetalles(usuario: Usuario): void {
    console.log('Ver detalles de:', usuario);
    // Aquí puedes mostrar un modal, redirigir, etc.
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  toggleFiltro(campo: string) {
    if (this.filtroAbierto === campo) {
      this.filtroAbierto = null;
    } else {
      this.filtroAbierto = campo;
    }
  }
}
