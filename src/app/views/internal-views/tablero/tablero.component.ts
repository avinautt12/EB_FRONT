import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoService, RenglonDashboard } from '../../../services/flujo.service';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, FormsModule, RouterLink],
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.css'
})
export class TableroComponent implements OnInit {

  private flujoService = inject(FlujoService);

  renglones: RenglonDashboard[] = [];
  saldoFinalProyectado: number = 0;
  saldoFinalReal: number = 0;
  cargando: boolean = true;

  sincronizando: boolean = false;

  // Filtros de fecha
  meses = [
    { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
  ];
  anios = Array.from({ length: 6 }, (_, i) => 2024 + i);
  mesSeleccionado: number = new Date().getMonth() + 1;
  anioSeleccionado: number = new Date().getFullYear();

  // --- NUEVO: ESTADO DE EDICIÓN ---
  // Guardamos qué celda se está editando actualmente
  celdaEditando: { id: number, columna: 'real' | 'proyectado' } | null = null;
  valorTemp: number = 0; // Para binding temporal del input

  ngOnInit(): void {
    this.cargarDatos();
  }

  onFiltroChange(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    const fechaQuery = this.obtenerFechaQuery();

    this.flujoService.obtenerTableroMensual(fechaQuery).subscribe({
      next: (res) => {
        this.renglones = res.datos;
        this.calcularTotales();
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // --- MÉTODOS DE EDICIÓN (LA MAGIA) ---

  // 1. Activar el input al hacer clic
  iniciarEdicion(item: RenglonDashboard, columna: 'real' | 'proyectado'): void {
    // No permitimos editar filas calculadas (Totales/Saldos)
    if (this.esFilaNegrita(item.categoria)) return;

    this.celdaEditando = { id: item.id, columna: columna };
    this.valorTemp = columna === 'real' ? item.col_real : item.col_proyectado;
  }

  // 2. Guardar al dar Enter o salir del foco
  guardarEdicion(item: RenglonDashboard, columna: 'real' | 'proyectado'): void {
    if (!this.celdaEditando) return;

    // Solo guardamos si el valor cambió
    const valorOriginal = columna === 'real' ? item.col_real : item.col_proyectado;

    if (this.valorTemp !== valorOriginal) {
      // Optimismo: Actualizamos la vista inmediatamente
      if (columna === 'real') item.col_real = this.valorTemp;
      else item.col_proyectado = this.valorTemp;

      // Recalculamos la diferencia visualmente
      item.col_diferencia = item.col_real - item.col_proyectado;
      this.calcularTotales();

      // Enviamos a BD
      const fecha = this.obtenerFechaQuery();
      this.flujoService.guardarValor(item.id, fecha, this.valorTemp, columna).subscribe({
        error: (err) => {
          alert("Error guardando valor");
          // Revertir si falla (opcional)
        }
      });
    }

    // Cerramos el input
    this.celdaEditando = null;
  }

  cancelarEdicion(): void {
    this.celdaEditando = null;
  }

  // --- AUXILIARES ---

  obtenerFechaQuery(): string {
    return `${this.anioSeleccionado}-${this.mesSeleccionado.toString().padStart(2, '0')}-01`;
  }

  calcularTotales() {
    const filaTotal = this.renglones.find(r => r.concepto === 'TOTAL EFECTIVO DISPONIBLE');
    if (filaTotal) {
      this.saldoFinalProyectado = filaTotal.col_proyectado;
      this.saldoFinalReal = filaTotal.col_real;
    } else {
      this.saldoFinalProyectado = 0;
      this.saldoFinalReal = 0;
    }
  }

  esFilaNegrita(categoria: string): boolean {
    return ['Saldo', 'Total', 'Subtotal', 'Saldo Final'].includes(categoria);
  }

  // Helper para el HTML: saber si mostrar input o texto
  esEditando(id: number, columna: string): boolean {
    return this.celdaEditando?.id === id && this.celdaEditando?.columna === columna;
  }

  sincronizar() {
    if (!confirm(`¿Deseas descargar los datos reales de Odoo para ${this.meses[this.mesSeleccionado - 1].nombre} ${this.anioSeleccionado}?`)) return;

    this.sincronizando = true;

    // Llamamos al servicio (asegúrate de tener este método en flujo.service.ts)
    this.flujoService.sincronizarOdoo(this.anioSeleccionado, this.mesSeleccionado).subscribe({
      next: (res) => {
        this.sincronizando = false;
        alert(res.mensaje); // O usa Swal.fire si lo tienes
        this.cargarDatos(); // ¡Importante! Recargamos la tabla para ver los cambios
      },
      error: (err) => {
        this.sincronizando = false;
        console.error(err);
        alert("Error en la sincronización. Revisa la consola.");
      }
    });
  }
}