import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  rol: string;
  cliente_nombre?: string | null; // Nombre del cliente asociado, si aplica
  cliente_id?: number;
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
  private cdr = inject(ChangeDetectorRef);

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
  usuariosPorPagina = 25;

  filtroAbierto: string | null = null;

  usuarioAEliminar: Usuario | null = null;
  mostrarConfirmacion = false;

  asociarCliente = false;
  clienteBusqueda = '';
  clienteSugerencias: ClienteNombre[] = [];
  clienteSeleccionadoId: number | null = null;

  ngOnInit(): void {
    this.cargarUsuarios();

    // Manejo de alertas
    this.alerta.alerta$.subscribe(({ mensaje, tipo }) => {
      this.mensajeAlerta = mensaje;
      this.tipoAlerta = tipo;
      setTimeout(() => this.mensajeAlerta = null, 4000);
    });

    // Carga sugerencias de clientes
    this.clientesService.getNombresClientes().subscribe({
      next: (res: ClienteNombre[]) => {
        this.clienteSugerencias = res;
      },
      error: () => console.error('Error al obtener clientes')
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
    this.paginaActual = 1;

    this.usuariosFiltrados = this.usuarios.filter(u => {
      // Protege todos los campos que usan toLowerCase()
      const nombre = typeof u.nombre === 'string' ? u.nombre : '';
      const correo = typeof u.correo === 'string' ? u.correo : '';
      const usuarioStr = typeof u.usuario === 'string' ? u.usuario : '';
      const rol = typeof u.rol === 'string' ? u.rol : '';

      // Protege también el filtro de clave (ID)
      const claveFiltro = typeof this.filtros.clave === 'string' ? this.filtros.clave : '';
      const idStr = u.id ? u.id.toString() : '';

      const coincideClave = idStr.toLowerCase().includes(claveFiltro.toLowerCase());
      const coincideNombre = nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase());
      const coincideCorreo = correo.toLowerCase().includes(this.filtros.correo.toLowerCase());
      const coincideUsuario = usuarioStr.toLowerCase().includes(this.filtros.usuario.toLowerCase());
      const coincideRol = this.filtros.rol === '' || rol === this.filtros.rol;

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
    this.nuevoUsuario = { ...usuario };
    this.mostrarFormularioEdicion = true;

    if (usuario.cliente_id) {
      this.asociarCliente = true;
      this.clienteSeleccionadoId = usuario.cliente_id;

      // Opción 1: Si el usuario ya trae el nombre del cliente
      if (usuario.cliente_nombre) {
        this.clienteBusqueda = usuario.cliente_nombre;
      }
      // Opción 2: Buscar en clienteSugerencias
      else {
        const clienteEncontrado = this.buscarClientePorId(usuario.cliente_id);
        if (clienteEncontrado) {
          this.clienteBusqueda = `${clienteEncontrado.nombre_cliente}`;
        } else {
          this.clienteBusqueda = `Cliente ID: ${usuario.cliente_id}`;
        }
      }
    } else {
      this.asociarCliente = false;
      this.clienteSeleccionadoId = null;
      this.clienteBusqueda = '';
    }
  }

  // Método auxiliar para buscar cliente por ID
  buscarClientePorId(clienteId: number): ClienteNombre | undefined {
    // Intenta encontrar el cliente cuyo ID está en la clave (ej: "CLI-123")
    return this.clienteSugerencias.find(c => {
      try {
        const partes = c.clave.split('-');
        const idDeClave = parseInt(partes[partes.length - 1]);
        return idDeClave === clienteId;
      } catch {
        return false;
      }
    });
  }

  volverALista(): void {
    this.mostrarFormularioRegistroVisible = false;
    this.mostrarFormularioEdicion = false;
  }

  agregarUsuario(): void {
    if (this.validarFormulario()) {
      this.cargandoUsuarios = true;

      // Prepara el objeto para enviar
      const usuarioParaCrear: any = {
        usuario: this.nuevoUsuario.usuario,
        contrasena: this.nuevoUsuario.contrasena,
        nombre: this.nuevoUsuario.nombre,
        correo: this.nuevoUsuario.correo,
        rol: this.nuevoUsuario.rol,
        activo: true
      };

      // Añade cliente_id solo si está seleccionado y es válido
      if (this.asociarCliente && this.clienteSeleccionadoId) {
        usuarioParaCrear.cliente_id = this.clienteSeleccionadoId;
      } else {
        usuarioParaCrear.cliente_id = null; // Envía null explícitamente
      }

      this.usuariosService.crearUsuario(usuarioParaCrear).subscribe({
        next: (usuarioCreado) => {
          this.alerta.mostrarExito('✅ Usuario creado con éxito');
          this.cargandoUsuarios = false;
          this.volverALista();

          // Actualiza la lista
          this.usuarios.unshift(usuarioCreado);
          this.filtrarUsuarios();
        },
        error: (error) => {
          console.error('Error completo:', error); // Debug detallado
          const mensaje = error.error?.error || error.message || 'Error al crear usuario';
          this.alerta.mostrarError(mensaje);
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
        datosActualizacion.cliente_id = null;
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
    if (this.usuarioAEliminar?.id) {
      this.cargandoUsuarios = true;
      this.usuariosService.eliminarUsuario(this.usuarioAEliminar.id).subscribe({
        next: () => {
          // Actualización MANUAL
          this.usuarios = this.usuarios.filter(u => u.id !== this.usuarioAEliminar?.id);
          this.filtrarUsuarios();
          this.alerta.mostrarExito('✅ Usuario eliminado');
          this.mostrarConfirmacion = false;
          this.cargandoUsuarios = false;
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.alerta.mostrarError('Error al eliminar usuario');
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
