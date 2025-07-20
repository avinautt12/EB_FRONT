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
import { ClientesService } from '../../../services/clientes.service';
import { Router } from '@angular/router';

interface Disponibilidad {
  q1_sep_2025: boolean;
  q2_sep_2025: boolean;
  q1_oct_2025: boolean;
  q2_oct_2025: boolean;
  q1_nov_2025: boolean;
  q2_nov_2025: boolean;
  q1_dic_2025: boolean;
  q2_dic_2025: boolean;
}

interface Proyeccion {
  id: number;
  clave_factura: string;
  clave_6_digitos: string;
  clave_odoo: string;
  descripcion: string;
  modelo: string;
  ean: string;
  referencia: string;
  q1_sep_2025: number | null;
  q2_sep_2025: number | null;
  q1_oct_2025: number | null;
  q2_oct_2025: number | null;
  q1_nov_2025: number | null;
  q2_nov_2025: number | null;
  q1_dic_2025: number | null;
  q2_dic_2025: number | null;
  disponibilidad: Disponibilidad;
  precio_publico_con_iva: number;
  precio_distribuidor_con_iva: number;
  precio_partner_con_iva: number;
  precio_elite_con_iva: number;
  precio_elite_plus_con_iva: number;
}

@Component({
  standalone: true,
  selector: 'app-crear-proyeccion-usuario',
  templateUrl: './crear-proyeccion-usuarios.component.html',
  styleUrls: ['./crear-proyeccion-usuarios.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, TopBarUsuariosComponent, AlertaComponent]
})
export class CrearProyeccionUsuariosComponent implements OnInit {
  proyecciones: Proyeccion[] = [];
  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';
  cargando: boolean = true;

  // Paginación
  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  itemsPorPagina: number = 10;
  totalPaginas: number = 0;
  proyeccionesPaginadas: Proyeccion[] = [];

  // Datos del cliente
  nivelCliente: string = '';
  compromisoCliente: number = 0;

  mostrarMontos: boolean = false; // Controla si se muestra o no el contenido

  mostrarModal: boolean = false;

  constructor(
    private proyeccionService: ProyeccionService,
    private authService: AuthService,
    private dialog: MatDialog,
    private alertaService: AlertaService,
    private clientesService: ClientesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarProyecciones();
    this.obtenerDatosCliente();
  }

  cargarProyecciones(): void {
    this.cargando = true;
    this.proyeccionService.getProyeccionesLimpias().subscribe({
      next: (data: any[]) => {
        this.proyecciones = this.mapearDatosProyecciones(data);
        this.configurarPaginacion();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones:', error);
        this.cargando = false;
        this.alertaService.mostrarError('Error al cargar las proyecciones');
      }
    });
  }

  mapearDatosProyecciones(data: any[]): Proyeccion[] {
    // Primero mapeamos los datos
    const proyeccionesMapeadas = data.map(item => ({
      ...item,
      q1_sep_2025: null,
      q2_sep_2025: null,
      q1_oct_2025: null,
      q2_oct_2025: null,
      q1_nov_2025: null,
      q2_nov_2025: null,
      q1_dic_2025: null,
      q2_dic_2025: null,
      disponibilidad: {
        q1_sep_2025: item.disp_q1_sep_2025 !== undefined ? Boolean(item.disp_q1_sep_2025) : true,
        q2_sep_2025: item.disp_q2_sep_2025 !== undefined ? Boolean(item.disp_q2_sep_2025) : true,
        q1_oct_2025: item.disp_q1_oct_2025 !== undefined ? Boolean(item.disp_q1_oct_2025) : true,
        q2_oct_2025: item.disp_q2_oct_2025 !== undefined ? Boolean(item.disp_q2_oct_2025) : true,
        q1_nov_2025: item.disp_q1_nov_2025 !== undefined ? Boolean(item.disp_q1_nov_2025) : true,
        q2_nov_2025: item.disp_q2_nov_2025 !== undefined ? Boolean(item.disp_q2_nov_2025) : true,
        q1_dic_2025: item.disp_q1_dic_2025 !== undefined ? Boolean(item.disp_q1_dic_2025) : true,
        q2_dic_2025: item.disp_q2_dic_2025 !== undefined ? Boolean(item.disp_q2_dic_2025) : true
      }
    }));

    // Luego ordenamos por modelo
    return proyeccionesMapeadas.sort((a, b) => {
      // Manejo de casos donde modelo podría ser null/undefined
      const modeloA = (a.modelo || '').toString().toLowerCase().trim();
      const modeloB = (b.modelo || '').toString().toLowerCase().trim();

      // Ordenamos primero por si alguno está vacío
      if (!modeloA && !modeloB) return 0;
      if (!modeloA) return 1;
      if (!modeloB) return -1;

      // Orden alfabético normal
      return modeloA.localeCompare(modeloB);
    });
  }

  obtenerDatosCliente(): void {
    this.clientesService.getNivelCliente().subscribe({
      next: (res) => {
        this.nivelCliente = res.nivel;
        this.compromisoCliente = res.compromiso;
      },
      error: (err) => {
        console.error('Error al obtener el nivel del cliente:', err);
      }
    });
  }

  // Función para obtener el precio según el nivel del cliente
  getPrecioCliente(proyeccion: Proyeccion): number {
    switch (this.nivelCliente) {
      case 'Partner Elite Plus':
        return proyeccion.precio_elite_plus_con_iva;
      case 'Partner Elite':
        return proyeccion.precio_elite_con_iva;
      case 'Partner':
        return proyeccion.precio_partner_con_iva;
      case 'Distribuidor':
        return proyeccion.precio_distribuidor_con_iva;
      default:
        return proyeccion.precio_publico_con_iva;
    }
  }

  // Ejemplo de precio para mostrar en el resumen
  getPrecioEjemplo(): number {
    if (this.proyecciones.length > 0) {
      return this.getPrecioCliente(this.proyecciones[0]);
    }
    return 0;
  }

  // Ejemplo de precio público para mostrar en el resumen
  getPrecioPublicoEjemplo(): number {
    if (this.proyecciones.length > 0) {
      return this.proyecciones[0].precio_publico_con_iva;
    }
    return 0;
  }

  configurarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.proyecciones.length / this.itemsPorPagina);
    this.actualizarPaginado();
  }

  actualizarPaginado(): void {
    // Asegurarnos de que las proyecciones están ordenadas
    this.proyecciones = [...this.proyecciones].sort((a, b) => {
      const modeloA = (a.modelo || '').toString().toLowerCase().trim();
      const modeloB = (b.modelo || '').toString().toLowerCase().trim();
      return modeloA.localeCompare(modeloB);
    });

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.proyeccionesPaginadas = this.proyecciones.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  // Métodos para validación y envío
  prepararEnvio(): void {
    const itemsConCantidad = this.proyecciones.filter(item =>
      Object.keys(item.disponibilidad).some(key =>
        (item[key as keyof Proyeccion] as number) > 0
      )
    );

    if (itemsConCantidad.length === 0) {
      this.alertaService.mostrarError('Por favor ingresa al menos una cantidad para enviar la proyección.');
      return;
    }

    // Calcular totales
    const totalBicicletas = this.calcularTotalBicicletas();
    const totalProyeccion = this.calcularTotalProyeccion();

    // Preparar detalles con precios correctos
    const detalles = itemsConCantidad.map(item => {
      const precioUnitario = this.getPrecioCliente(item);
      const cantidades = [
        item.q1_sep_2025 || 0,
        item.q2_sep_2025 || 0,
        item.q1_oct_2025 || 0,
        item.q2_oct_2025 || 0,
        item.q1_nov_2025 || 0,
        item.q2_nov_2025 || 0,
        item.q1_dic_2025 || 0,
        item.q2_dic_2025 || 0
      ];
      const cantidadTotal = cantidades.reduce((sum, cantidad) => sum + cantidad, 0);

      return {
        id_proyeccion: item.id,
        producto: {
          clave_factura: item.clave_factura,
          descripcion: item.descripcion
        },
        precioUnitario: precioUnitario,
        subtotal: cantidadTotal * precioUnitario,
        q1_sep_2025: item.q1_sep_2025 || 0,
        q2_sep_2025: item.q2_sep_2025 || 0,
        q1_oct_2025: item.q1_oct_2025 || 0,
        q2_oct_2025: item.q2_oct_2025 || 0,
        q1_nov_2025: item.q1_nov_2025 || 0,
        q2_nov_2025: item.q2_nov_2025 || 0,
        q1_dic_2025: item.q1_dic_2025 || 0,
        q2_dic_2025: item.q2_dic_2025 || 0
      };
    });

    const dialogRef = this.dialog.open(ConfirmacionDialogComponent, {
      width: '700px',
      data: {
        titulo: 'Confirmar Proyección',
        mensaje: '¿Estás seguro de enviar esta proyección?',
        nivelCliente: this.nivelCliente,
        precioCliente: this.getPrecioEjemplo(),
        precioPublico: this.getPrecioPublicoEjemplo(),
        compromisoCliente: this.compromisoCliente,
        totalBicicletas: totalBicicletas,
        totalProyeccion: totalProyeccion,
        detalles: detalles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.enviarProyeccion(itemsConCantidad);
    });
  }

  enviarProyeccion(proyeccionData: any[]): void {
    const token = this.authService.getToken();
    if (!token) {
      this.alertaService.mostrarError('No estás autenticado. Por favor inicia sesión nuevamente.');
      return;
    }

    // Prepara los datos para enviar al backend
    const datosParaEnviar = proyeccionData.map(item => ({
      id_proyeccion: item.id,
      q1_sep_2025: item.q1_sep_2025 || 0,
      q2_sep_2025: item.q2_sep_2025 || 0,
      q1_oct_2025: item.q1_oct_2025 || 0,
      q2_oct_2025: item.q2_oct_2025 || 0,
      q1_nov_2025: item.q1_nov_2025 || 0,
      q2_nov_2025: item.q2_nov_2025 || 0,
      q1_dic_2025: item.q1_dic_2025 || 0,
      q2_dic_2025: item.q2_dic_2025 || 0
    }));

    this.proyeccionService.agregarProyeccionCliente(datosParaEnviar, token).subscribe({
      next: (response: any) => {
        const mensaje = `Proyección enviada exitosamente.`;
        this.alertaService.mostrarExito(mensaje);

        // Mostrar resumen de la proyección
        setTimeout(() => {
          this.router.navigate(['/usuarios/proyeccion-compras'], {
            state: {
              proyeccionEnviada: true,
              folio: response.folio,
              totalBicicletas: response.total_bicicletas,
              totalProyeccion: response.total_proyeccion,
              nivelCliente: this.nivelCliente,
              compromisoCliente: this.compromisoCliente
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Error al enviar proyección:', error);
        this.alertaService.mostrarError('Ocurrió un error al enviar la proyección');
      }
    });
  }

  // Métodos de ayuda para la UI
  getCantidadProyectada(): number {
    return this.proyecciones.filter(item =>
      Object.keys(item.disponibilidad).some(key =>
        (item[key as keyof Proyeccion] as number) > 0
      )
    ).length;
  }

  calcularTotalProyeccion(): number {
    return this.proyecciones.reduce((total, item) => {
      const sumaCantidades = Object.keys(item.disponibilidad).reduce((sum, key) =>
        sum + (item[key as keyof Proyeccion] as number || 0), 0);
      return total + (sumaCantidades * this.getPrecioCliente(item));
    }, 0);
  }

  calcularTotalBicicletas(): number {
    return this.proyecciones.reduce((total, item) =>
      total + Object.keys(item.disponibilidad).reduce((sum, key) =>
        sum + (item[key as keyof Proyeccion] as number || 0), 0), 0);
  }

  // Agregar este nuevo método a la clase CrearProyeccionUsuariosComponent
  calcularMontosPorQuincena(): { [key: string]: number } {
    const montos: { [key: string]: number } = {
      'q1_sep_2025': 0,
      'q2_sep_2025': 0,
      'q1_oct_2025': 0,
      'q2_oct_2025': 0,
      'q1_nov_2025': 0,
      'q2_nov_2025': 0,
      'q1_dic_2025': 0,
      'q2_dic_2025': 0
    };

    this.proyecciones.forEach(item => {
      const precio = this.getPrecioCliente(item);
      Object.keys(montos).forEach(quincena => {
        const cantidad = item[quincena as keyof Proyeccion] as number || 0;
        montos[quincena] += cantidad * precio;
      });
    });

    return montos;
  }

  // Agregar este método auxiliar
  formatearNombreQuincena(key: string): string {
    const [quincena, mes, año] = key.split('_');

    const meses: { [key: string]: string } = {
      'sep': 'Septiembre',
      'oct': 'Octubre',
      'nov': 'Noviembre',
      'dic': 'Diciembre'
    };

    const numeroQuincena = quincena === 'q1' ? '1er' : '2da';

    return `${numeroQuincena} Quincena ${meses[mes] || mes} ${año}`;
  }

  contarMontosPositivos(): number {
    const montos = this.calcularMontosPorQuincena();
    return Object.values(montos).filter(monto => monto > 0).length;
  }

  mostrarModalMontos(): void {
    this.mostrarModal = true;
    document.body.style.overflow = 'hidden'; // Evita el scroll del body
  }

  cerrarModal(event?: MouseEvent): void {
    // Cierra solo si se hace clic fuera del contenido o en el botón de cerrar
    if (!event || (event.target as HTMLElement).classList.contains('modal-montos')) {
      this.mostrarModal = false;
      document.body.style.overflow = '';
    }
  }

  tieneMontos(): boolean {
    if (!this.proyecciones) return false;
    return this.proyecciones.some(item =>
      (item.q1_sep_2025 && item.q1_sep_2025 > 0) ||
      (item.q2_sep_2025 && item.q2_sep_2025 > 0) ||
      (item.q1_oct_2025 && item.q1_oct_2025 > 0) ||
      (item.q2_oct_2025 && item.q2_oct_2025 > 0) ||
      (item.q1_nov_2025 && item.q1_nov_2025 > 0) ||
      (item.q2_nov_2025 && item.q2_nov_2025 > 0) ||
      (item.q1_dic_2025 && item.q1_dic_2025 > 0) ||
      (item.q2_dic_2025 && item.q2_dic_2025 > 0)
    );
  }

}