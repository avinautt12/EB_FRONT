import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { TopBarUsuariosComponent } from "../../../components/top-bar-usuarios/top-bar-usuarios.component";
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-proyeccion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopBarUsuariosComponent],
  templateUrl: './proyeccion-usuarios.component.html',
  styleUrls: ['./proyeccion-usuarios.component.css']
})
export class ProyeccionUsuariosComponent implements OnInit {
  proyecciones: any[] = [];
  cargando: boolean = true;

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

  yaProyectado: boolean = false;

  constructor(private proyeccionService: ProyeccionService, private alertaService: AlertaService, private router: Router) { }

  ngOnInit(): void {
    this.verificarSiYaProyectado();
    this.proyeccionService.getProyecciones().subscribe({
      next: (data) => {
        this.proyecciones = data;
        this.proyeccionesOriginal = data;
        this.proyeccionesFiltradas = data;
        this.totalPaginas = Math.ceil(data.length / this.itemsPorPagina);
        this.actualizarPaginado();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener proyecciones:', error);
        this.cargando = false;
      }
    });
  }

  manejarClickCrear() {
    if (this.yaProyectado) {
      this.alertaService.mostrarError('Ya has enviado tu proyección. Solo puedes realizarla una vez.');
      return;
    }

    this.router.navigate(['/usuarios/crear-proyeccion']);
  }


  verificarSiYaProyectado() {
    this.proyeccionService.verificarProyeccionCliente().subscribe({
      next: (res) => {
        this.yaProyectado = res.yaEnviada;
      },
      error: (err) => {
        console.error('Error al verificar proyección', err);
      }
    });
  }

  actualizarPaginado() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.proyeccionesPaginadas = this.proyeccionesFiltradas.slice(inicio, fin);  // <-- ahora usa el filtrado
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  toggleFiltro(campo: string) {
    this.filtroAbierto = this.filtroAbierto === campo ? null : campo;
  }

  filtrarProyecciones() {
    this.proyeccionesFiltradas = this.proyeccionesOriginal.filter(item =>
      item.clave_factura?.toLowerCase().includes(this.filtros.clave_factura.toLowerCase()) &&
      item.clave_6_digitos?.toLowerCase().includes(this.filtros.clave_6_digitos.toLowerCase()) &&
      item.descripcion?.toLowerCase().includes(this.filtros.descripcion.toLowerCase()) &&
      item.modelo?.toLowerCase().includes(this.filtros.modelo.toLowerCase())
      && item.clave_odoo?.toLowerCase().includes(this.filtros.clave_odoo.toLowerCase()) &&
      item.ean?.toLowerCase().includes(this.filtros.ean.toLowerCase())
    );

    this.totalPaginas = Math.ceil(this.proyeccionesFiltradas.length / this.itemsPorPagina);
    this.paginaActual = 1;
    this.actualizarPaginado();
  }

  abrirDialogoExportar() {
    console.log('Aquí abrirías un diálogo o iniciarías la exportación.');
  }

  getCantidadProyectada(): number {
    return this.proyecciones.filter(item =>
      (item.q1_sep_2025 || 0) > 0 ||
      (item.q2_sep_2025 || 0) > 0 ||
      (item.q1_oct_2025 || 0) > 0 ||
      (item.q2_oct_2025 || 0) > 0 ||
      (item.q1_nov_2025 || 0) > 0 ||
      (item.q2_nov_2025 || 0) > 0 ||
      (item.q1_dic_2025 || 0) > 0 ||
      (item.q2_dic_2025 || 0) > 0
    ).length;
  }
}
