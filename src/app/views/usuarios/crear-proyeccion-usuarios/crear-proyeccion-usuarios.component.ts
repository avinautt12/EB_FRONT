import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { RouterModule } from '@angular/router';
import { TopBarUsuariosComponent } from "../../../components/top-bar-usuarios/top-bar-usuarios.component";
import { MatDialog } from '@angular/material/dialog';
import { ConfirmacionDialogComponent } from '../../../components/confirmacion-dialog/confirmacion-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { AlertaService } from '../../../services/alerta.service';
import { AlertaComponent } from '../../../components/alerta/alerta.component';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-crear-proyeccion-usuario',
  templateUrl: './crear-proyeccion-usuarios.component.html',
  styleUrl: './crear-proyeccion-usuarios.component.css',
  imports: [CommonModule, FormsModule, RouterModule, TopBarUsuariosComponent, AlertaComponent]
})
export class CrearProyeccionUsuariosComponent implements OnInit {

  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';

  proyecciones: any[] = [];
  cargando: boolean = true;
  seleccionados: any = {};
  mostrarConfirmacion: boolean = false;
  proyeccionConfirmada: boolean = false;

  // Filtros y paginación
  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  itemsPorPagina: number = 10;
  totalPaginas: number = 0;
  filtros = {
    clave_factura: '',
    clave_6_digitos: '',
    clave_odoo: '',
    ean: '',
    descripcion: '',
    modelo: ''
  };
  filtroAbierto: string | null = null;
  proyeccionesOriginal: any[] = [];
  proyeccionesFiltradas: any[] = [];
  proyeccionesPaginadas: any[] = [];

  constructor(
    private proyeccionService: ProyeccionService,
    private authService: AuthService,
    private dialog: MatDialog,
    private alertaService: AlertaService
  ) { }

  ngOnInit(): void {
    this.cargarProyecciones();

    this.alertaService.alerta$.subscribe(({ mensaje, tipo }) => {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;

    setTimeout(() => {
      this.mensajeAlerta = null;
    }, 4000);
  });
  }

  cargarProyecciones(): void {
    this.proyeccionService.getProyeccionesLimpias().subscribe({
      next: (data) => {
        this.proyecciones = data;
        this.proyeccionesOriginal = data;
        this.proyeccionesFiltradas = data;
        this.totalPaginas = Math.ceil(data.length / this.itemsPorPagina);
        this.actualizarPaginado();
        this.inicializarSeleccionados();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones:', error);
        this.cargando = false;
      }
    });
  }

  inicializarSeleccionados(): void {
    this.proyecciones.forEach(item => {
      this.seleccionados[item.id] = {
        seleccionado: false,
        q1_oct_2025: 0,
        q2_oct_2025: 0,
        q1_nov_2025: 0,
        q2_nov_2025: 0,
        q1_dic_2025: 0,
        q2_dic_2025: 0
      };
    });
  }

  actualizarPaginado(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.proyeccionesPaginadas = this.proyeccionesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  toggleFiltro(campo: string): void {
    this.filtroAbierto = this.filtroAbierto === campo ? null : campo;
  }

  filtrarProyecciones(): void {
    this.proyeccionesFiltradas = this.proyeccionesOriginal.filter(item =>
      item.clave_factura?.toLowerCase().includes(this.filtros.clave_factura.toLowerCase()) &&
      item.clave_6_digitos?.toLowerCase().includes(this.filtros.clave_6_digitos.toLowerCase()) &&
      item.descripcion?.toLowerCase().includes(this.filtros.descripcion.toLowerCase()) &&
      item.modelo?.toLowerCase().includes(this.filtros.modelo.toLowerCase()) &&
      item.clave_odoo?.toLowerCase().includes(this.filtros.clave_odoo.toLowerCase()) &&
      item.ean?.toLowerCase().includes(this.filtros.ean.toLowerCase())
    );

    this.totalPaginas = Math.ceil(this.proyeccionesFiltradas.length / this.itemsPorPagina);
    this.paginaActual = 1;
    this.actualizarPaginado();
  }

  // Métodos para manejar la selección y cantidades
  toggleSeleccion(id: number): void {
    this.seleccionados[id].seleccionado = !this.seleccionados[id].seleccionado;
  }

  incrementarCantidad(id: number, campo: string): void {
    this.seleccionados[id][campo]++;
  }

  decrementarCantidad(id: number, campo: string): void {
    if (this.seleccionados[id][campo] > 0) {
      this.seleccionados[id][campo]--;
    }
  }

  actualizarCantidad(event: Event, id: number, campo: string): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    this.seleccionados[id][campo] = isNaN(value) ? 0 : Math.max(0, value);
  }

  prepararEnvio(): void {
    const itemsConCantidad = this.proyecciones
      .filter(item =>
        (item.q1_oct_2025 || 0) > 0 ||
        (item.q2_oct_2025 || 0) > 0 ||
        (item.q1_nov_2025 || 0) > 0 ||
        (item.q2_nov_2025 || 0) > 0 ||
        (item.q1_dic_2025 || 0) > 0 ||
        (item.q2_dic_2025 || 0) > 0
      )
      .map(item => {
        return {
          id_proyeccion: item.id,
          q1_oct_2025: item.q1_oct_2025 || 0,
          q2_oct_2025: item.q2_oct_2025 || 0,
          q1_nov_2025: item.q1_nov_2025 || 0,
          q2_nov_2025: item.q2_nov_2025 || 0,
          q1_dic_2025: item.q1_dic_2025 || 0,
          q2_dic_2025: item.q2_dic_2025 || 0,
          producto: {
            clave_factura: item.clave_factura,
            descripcion: item.descripcion,
            precio: item.precio_publico_iva
          }
        };
      });

    if (itemsConCantidad.length === 0) {
      this.alertaService.mostrarError('Por favor ingresa al menos una cantidad para enviar la proyección.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmacionDialogComponent, {
      width: '600px',
      data: {
        titulo: 'Confirmar Proyección',
        mensaje: '¿Estás seguro de enviar esta proyección?',
        detalles: itemsConCantidad
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.enviarProyeccion(itemsConCantidad);
      }
    });
  }

  enviarProyeccion(proyeccionData: any[]): void {
    const token = this.authService.getToken();

    if (!token) {
      console.error('No se encontró el token de autenticación');
      this.alertaService.mostrarError('No estás autenticado. Por favor inicia sesión nuevamente.');
      return;
    }

    const datosCorregidos = proyeccionData.map(item => ({
      id_proyeccion: item.id_proyeccion || item.id_producto,
      q1_oct_2025: item.q1_oct_2025 || 0,
      q2_oct_2025: item.q2_oct_2025 || 0,
      q1_nov_2025: item.q1_nov_2025 || 0,
      q2_nov_2025: item.q2_nov_2025 || 0,
      q1_dic_2025: item.q1_dic_2025 || 0,
      q2_dic_2025: item.q2_dic_2025 || 0
    }));

    this.proyeccionService.agregarProyeccionCliente(datosCorregidos, token).subscribe({
      next: () => {
        this.proyeccionConfirmada = true;

        // ✅ Limpiar valores
        this.proyecciones.forEach(item => {
          item.q1_oct_2025 = 0;
          item.q2_oct_2025 = 0;
          item.q1_nov_2025 = 0;
          item.q2_nov_2025 = 0;
          item.q1_dic_2025 = 0;
          item.q2_dic_2025 = 0;
        });

        this.inicializarSeleccionados();

        // ✅ Forzar re-render con nuevas referencias
        this.proyeccionesFiltradas = [...this.proyeccionesFiltradas];
        this.actualizarPaginado();

        this.alertaService.mostrarExito('Proyección enviada exitosamente');

        setTimeout(() => {
          this.proyeccionConfirmada = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error al enviar proyección:', error);
        this.alertaService.mostrarError('Ocurrió un error al enviar la proyección');
      }
    });
  }

  getTotalSeleccionados(): number {
    return Object.values(this.seleccionados).filter((s: any) => s.seleccionado).length;
  }

  getCantidadProyectada(): number {
    return this.proyecciones.filter(item =>
      (item.q1_oct_2025 || 0) > 0 ||
      (item.q2_oct_2025 || 0) > 0 ||
      (item.q1_nov_2025 || 0) > 0 ||
      (item.q2_nov_2025 || 0) > 0 ||
      (item.q1_dic_2025 || 0) > 0 ||
      (item.q2_dic_2025 || 0) > 0
    ).length;
  }


}