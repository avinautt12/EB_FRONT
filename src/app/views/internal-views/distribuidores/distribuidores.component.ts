import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MetasService } from '../../../services/metas.service';
import { ClientesService } from '../../../services/clientes.service';
import { AlertaService } from '../../../services/alerta.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-distribuidores',
  standalone: true,
  imports: [HomeBarComponent, CommonModule, FormsModule,  RouterModule],
  templateUrl: './distribuidores.component.html',
  styleUrl: './distribuidores.component.css'
})
export class DistribuidoresComponent implements OnInit {
  busqueda: string = '';
  cliente: any = null;
  clienteOriginal: any = null;
  nuevoCliente = {
    clave: '',
    zona: '',
    nombre_cliente: '',
    nivel: ''
  };
  mostrarFormulario = false;
  nivelesDisponibles: any[] = [];

  sugerencias: string[] = [];
  todosLosNombres: string[] = [];
  todosLosClientes: { clave: string, nombre_cliente: string }[] = [];
  cargando: boolean = false;
  confirmacionVisible: boolean = false;
  confirmacionEliminarVisible = false;

  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' | null = null;

  intentoBusqueda = false;

  constructor(
    private clientesService: ClientesService,
    private metasService: MetasService,
    private alertaService: AlertaService,
    private router: Router
  ) { }

  ngOnInit() {
    this.obtenerNiveles();
    this.obtenerTodosLosNombres();
  }

  // BUSQUEDA COMPLETA
  buscarCliente() {
    if (this.busqueda.trim().length === 0) {
      this.cliente = null;
      this.intentoBusqueda = false;
      return;
    }
    this.cargando = true;
    this.intentoBusqueda = true;

    const match = this.busqueda.match(/\(([^)]+)\)$/);
    const clave = match ? match[1] : this.busqueda.trim();

    this.clientesService.buscarCliente(clave).subscribe({
      next: (res) => {
        this.cliente = res;
        this.cargando = false;
      },
      error: () => {
        this.cliente = null;
        this.cargando = false;
      }
    });
  }

  // OBTENER NIVELES
  obtenerNiveles() {
    this.metasService.getMetas().subscribe({
      next: (res) => this.nivelesDisponibles = res,
      error: () => console.error('No se pudieron cargar los niveles')
    });
  }

  // OBTENER NOMBRES DE CLIENTES PARA AUTOCOMPLETE
  obtenerTodosLosNombres() {
    this.clientesService.getNombresClientes().subscribe({
      next: (res) => this.todosLosClientes = res,
      error: () => console.error('No se pudieron cargar los nombres')
    });
  }

  // AUTOCOMPLETE
  filtrarSugerencias() {
    const texto = this.busqueda.toLowerCase().trim();
    this.sugerencias = this.todosLosClientes
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

    // const match = sugerencia.match(/\(([^)]+)\)$/);
    // const clave = match ? match[1] : sugerencia;

    // this.clientesService.buscarCliente(clave).subscribe({
    //   next: (res) => {
    //     this.cliente = res;
    //   },
    //   error: () => {
    //     this.cliente = null;
    //   }
    // });
  }

  agregarCliente() {
    this.clientesService.agregarCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Cliente agregado correctamente'); 
        this.mostrarFormulario = false;
        this.nuevoCliente = { clave: '', zona: '', nombre_cliente: '', nivel: '' };
      },
      error: (err) => this.alertaService.mostrarError(err.error?.error || 'Error al agregar')
    });
  }

  editarCliente() {
    if (!this.cliente?.id) return;
  }

  confirmarEdicion() {
    this.clientesService.editarCliente(this.cliente.id, this.cliente).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Cliente editado correctamente');
        this.clienteOriginal = JSON.stringify(this.cliente);
        this.confirmacionVisible = false;
      },
      error: () => this.alertaService.mostrarError('Error al editar cliente')
    });
  }

  cancelarEdicion() {
    this.confirmacionVisible = false;
  }

  eliminarCliente() {
    if (!this.cliente?.id) return;
    if (confirm('¿Seguro que deseas eliminar este cliente?')) {
      this.clientesService.eliminarCliente(this.cliente.id).subscribe({
        next: () => {
          this.alertaService.mostrarExito('Cliente eliminado');
          this.cliente = null;
        },
        error: () => this.alertaService.mostrarError('Error al eliminar cliente')
      });
    }
  }

  hayCambios(): boolean {
    return this.cliente && JSON.stringify(this.cliente) !== this.clienteOriginal;
  }

  confirmarEliminacion() {
    if (!this.cliente?.id) return;

    this.clientesService.eliminarCliente(this.cliente.id).subscribe({
      next: () => {
        this.alertaService.mostrarExito('Cliente eliminado');
        this.cliente = null;
        this.confirmacionEliminarVisible = false;
      },
      error: () => this.alertaService.mostrarError('Error al eliminar cliente')
    });
  }

  cancelarEliminacion() {
    this.confirmacionEliminarVisible = false;
  }
}
