import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { IntegralesService, Grupo, ClientesPorGrupo, ClienteConGrupo } from '../../../services/integrales.service';
import { ClientesService } from '../../../services/clientes.service';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-integrales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeBarComponent],
  templateUrl: './integrales.component.html',
  styleUrls: ['./integrales.component.css']
})
export class IntegralesComponent implements OnInit {
  busqueda: string = '';
  grupoSeleccionado: Grupo | null = null;
  grupos: Grupo[] = [];
  clientesGrupo: ClienteConGrupo[] = [];
  todosLosClientes: { clave: string; nombre_cliente: string }[] = [];
  sugerencias: string[] = [];
  
  nuevoGrupo = {
    nombre_grupo: ''
  };

  mostrarFormulario = false;
  cargando: boolean = false;
  confirmacionVisible: boolean = false;
  confirmacionEliminarVisible = false;
  confirmacionRemoverClienteVisible = false; // Nueva confirmación para remover cliente
  intentoBusqueda = false;

  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' | null = null;

  // Para asignar/remover clientes
  clienteParaAsignar: any = null;
  mostrarAsignarCliente = false;
  busquedaClienteAsignar: string = '';
  sugerenciasClientes: string[] = [];
  clienteParaRemover: number | null = null; // Para guardar el ID del cliente a remover

  constructor(
    private integralesService: IntegralesService,
    private clientesService: ClientesService,
    private alertaService: AlertaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarGrupos();
    this.obtenerTodosLosClientes();
  }

  cargarGrupos() {
    this.integralesService.obtenerGrupos().subscribe({
      next: (data) => {
        this.grupos = data;
      },
      error: (error) => {
        console.error('Error al cargar grupos:', error);
        this.alertaService.mostrarError('Error al cargar los grupos');
      }
    });
  }

  obtenerTodosLosClientes() {
    this.clientesService.getNombresClientes().subscribe({
      next: (res) => this.todosLosClientes = res,
      error: () => console.error('No se pudieron cargar los nombres de clientes')
    });
  }

  // BUSCAR GRUPO
  buscarGrupo() {
    if (this.busqueda.trim().length === 0) {
      this.grupoSeleccionado = null;
      this.clientesGrupo = [];
      this.intentoBusqueda = false;
      this.mostrarFormulario = false;
      return;
    }

    this.mostrarFormulario = false;
    this.cargando = true;
    this.intentoBusqueda = true;

    const grupoEncontrado = this.grupos.find(g => 
      g.nombre_grupo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      g.id.toString() === this.busqueda
    );

    if (grupoEncontrado) {
      this.seleccionarGrupo(grupoEncontrado);
    } else {
      this.grupoSeleccionado = null;
      this.clientesGrupo = [];
      this.cargando = false;
    }
  }

  seleccionarGrupo(grupo: Grupo) {
    this.grupoSeleccionado = { ...grupo };
    this.cargarClientesGrupo(grupo.id);
  }

  cargarClientesGrupo(idGrupo: number) {
    this.integralesService.obtenerClientesPorGrupo(idGrupo).subscribe({
      next: (data: ClientesPorGrupo) => {
        this.clientesGrupo = data.clientes;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes del integral:', error);
        this.alertaService.mostrarError('Error al cargar clientes del integral');
        this.cargando = false;
      }
    });
  }

  mostrarFormularioAgregar() {
    if (this.mostrarFormulario) {
      this.mostrarFormulario = false;
    } else {
      this.grupoSeleccionado = null;
      this.clientesGrupo = [];
      this.mostrarFormulario = true;
      this.busqueda = '';
      this.sugerencias = [];
      this.intentoBusqueda = false;
    }
  }

  // AUTOCOMPLETE PARA BUSCAR GRUPOS
  filtrarSugerencias() {
    const texto = this.busqueda.toLowerCase().trim();
    this.sugerencias = this.grupos
      .filter(g => 
        g.nombre_grupo.toLowerCase().includes(texto) ||
        g.id.toString().includes(texto)
      )
      .slice(0, 10)
      .map(g => `${g.nombre_grupo}`);
  }

  // AUTOCOMPLETE PARA BUSCAR CLIENTES
  filtrarSugerenciasClientes() {
    const texto = this.busquedaClienteAsignar.toLowerCase().trim();
    this.sugerenciasClientes = this.todosLosClientes
      .filter(c =>
        c.nombre_cliente.toLowerCase().includes(texto) ||
        c.clave.toLowerCase().includes(texto)
      )
      .slice(0, 10)
      .map(c => `${c.nombre_cliente} (${c.clave})`);
  }

  seleccionarSugerencia(sugerencia: string) {
    this.busqueda = sugerencia;
    this.sugerencias = [];

    const grupoEncontrado = this.grupos.find(g => 
      g.nombre_grupo === sugerencia
    );

    if (grupoEncontrado) {
      this.seleccionarGrupo(grupoEncontrado);
    }
  }

  // SELECCIONAR SUGERENCIA DE CLIENTE
  seleccionarSugerenciaCliente(sugerencia: string) {
    this.busquedaClienteAsignar = sugerencia;
    this.sugerenciasClientes = [];
    
    const match = sugerencia.match(/\(([^)]+)\)$/);
    const clave = match ? match[1] : sugerencia;
    
    this.buscarClienteParaAsignar(clave);
  }

  // CRUD OPERATIONS
  agregarGrupo() {
    if (!this.nuevoGrupo.nombre_grupo.trim()) {
      this.alertaService.mostrarError('El nombre del integral es requerido');
      return;
    }

    this.integralesService.agregarGrupo(this.nuevoGrupo.nombre_grupo).subscribe({
      next: (response) => {
        this.alertaService.mostrarExito('Integral agregado correctamente');
        this.mostrarFormulario = false;
        this.nuevoGrupo.nombre_grupo = '';
        this.cargarGrupos();
      },
      error: (error) => {
        this.alertaService.mostrarError(error.error?.error || 'Error al agregar integral');
      }
    });
  }

  editarGrupo() {
    if (!this.grupoSeleccionado) return;

    this.integralesService.editarGrupo(
      this.grupoSeleccionado.id,
      this.grupoSeleccionado.nombre_grupo
    ).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Integral editado correctamente');
        this.confirmacionVisible = false;
        this.cargarGrupos();
      },
      error: (error) => {
        this.alertaService.mostrarError(error.error?.error || 'Error al editar integral');
        this.confirmacionVisible = false;
      }
    });
  }

  eliminarGrupo() {
    if (!this.grupoSeleccionado) return;

    this.integralesService.eliminarGrupo(this.grupoSeleccionado.id).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Integral eliminado correctamente');
        this.confirmacionEliminarVisible = false;
        this.grupoSeleccionado = null;
        this.clientesGrupo = [];
        this.cargarGrupos();
      },
      error: (error) => {
        this.alertaService.mostrarError(error.error?.error || 'Error al eliminar integral');
        this.confirmacionEliminarVisible = false;
      }
    });
  }

  // ASIGNAR/REMOVER CLIENTES
  mostrarFormularioAsignarCliente() {
    this.mostrarAsignarCliente = true;
    this.clienteParaAsignar = null;
    this.busquedaClienteAsignar = '';
    this.sugerenciasClientes = [];
  }

  buscarClienteParaAsignar(clave?: string) {
    const valorBusqueda = clave || this.busquedaClienteAsignar.trim();
    
    if (!valorBusqueda) {
      this.clienteParaAsignar = null;
      return;
    }

    this.clientesService.buscarCliente(valorBusqueda).subscribe({
      next: (cliente) => {
        this.clienteParaAsignar = cliente;
      },
      error: () => {
        this.clienteParaAsignar = null;
        this.alertaService.mostrarError('Cliente no encontrado');
      }
    });
  }

  asignarCliente() {
    if (!this.clienteParaAsignar || !this.grupoSeleccionado) return;

    this.integralesService.asignarGrupoCliente(
      this.clienteParaAsignar.id,
      this.grupoSeleccionado.id
    ).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Cliente asignado al integral correctamente');
        this.mostrarAsignarCliente = false;
        this.clienteParaAsignar = null;
        this.busquedaClienteAsignar = '';
        this.sugerenciasClientes = [];
        this.cargarClientesGrupo(this.grupoSeleccionado!.id);
      },
      error: (error) => {
        this.alertaService.mostrarError(error.error?.error || 'Error al asignar cliente');
      }
    });
  }

  // NUEVO: Confirmación para remover cliente
  confirmarRemoverCliente(idCliente: number) {
    this.clienteParaRemover = idCliente;
    this.confirmacionRemoverClienteVisible = true;
  }

  removerCliente() {
    if (!this.grupoSeleccionado || !this.clienteParaRemover) return;

    this.integralesService.removerGrupoCliente(this.clienteParaRemover).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Cliente removido del integral correctamente');
        this.confirmacionRemoverClienteVisible = false;
        this.clienteParaRemover = null;
        this.cargarClientesGrupo(this.grupoSeleccionado!.id);
      },
      error: (error) => {
        this.alertaService.mostrarError(error.error?.error || 'Error al remover cliente');
        this.confirmacionRemoverClienteVisible = false;
        this.clienteParaRemover = null;
      }
    });
  }

  cancelarRemoverCliente() {
    this.confirmacionRemoverClienteVisible = false;
    this.clienteParaRemover = null;
  }

  // CONFIRMACIONES
  confirmarEdicion() {
    this.confirmacionVisible = true;
  }

  cancelarEdicion() {
    this.confirmacionVisible = false;
  }

  confirmarEliminacion() {
    this.confirmacionEliminarVisible = true;
  }

  cancelarEliminacion() {
    this.confirmacionEliminarVisible = false;
  }
}