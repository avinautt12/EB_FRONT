import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoService, RenglonDashboard } from '../../../services/flujo.service';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { RouterLink } from '@angular/router';
import { ModalConfirmacionFlujoComponent } from '../../../components/modal-confirmacion-flujo/modal-confirmacion-flujo.component';
import { AlertaService } from '../../../services/alerta.service';

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, FormsModule, RouterLink, ModalConfirmacionFlujoComponent],
  templateUrl: './tablero.component.html',
  styleUrl: './tablero.component.css'
})
export class TableroComponent implements OnInit {

  private flujoService = inject(FlujoService);
  private alertaService = inject(AlertaService);

  renglones: RenglonDashboard[] = [];
  saldoFinalProyectado: number = 0;
  saldoFinalReal: number = 0;
  cargando: boolean = true;

  sincronizando: boolean = false;
  mostrarModalSync: boolean = false;

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

  guardarEdicion(item: RenglonDashboard, columna: 'real' | 'proyectado'): void {
    if (!this.celdaEditando) return;

    // Solo guardamos si el valor cambió
    const valorOriginal = columna === 'real' ? item.col_real : item.col_proyectado;

    if (this.valorTemp !== valorOriginal) {

      // 1. Optimismo visual: Actualizamos la celda editada inmediatamente
      // para que el usuario no vea que "regresa" al valor anterior
      if (columna === 'real') item.col_real = this.valorTemp;
      else item.col_proyectado = this.valorTemp;

      // 2. Recalculamos la diferencia de esa fila visualmente
      item.col_diferencia = item.col_real - item.col_proyectado;

      // 3. Enviamos a BD
      const fecha = this.obtenerFechaQuery();

      // Pone el estado en 'cargando' silencioso si quieres, o déjalo así
      this.flujoService.guardarValor(item.id, fecha, this.valorTemp, columna).subscribe({
        next: (res) => {
          // ================================================================
          // ¡AQUÍ ESTÁ LA SOLUCIÓN!
          // Una vez que Python dice "Ya guardé y recalculé",
          // volvemos a pedir la tabla para ver los NUEVOS TOTALES.
          // ================================================================
          this.cargarDatos();
        },
        error: (err) => {
          alert("Error guardando valor");
          // Opcional: Revertir el valor si falla
          if (columna === 'real') item.col_real = valorOriginal;
          else item.col_proyectado = valorOriginal;
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

  pedirConfirmacionSync() {
    this.mostrarModalSync = true;
  }

  ejecutarSincronizacion() {
    this.mostrarModalSync = false;
    this.sincronizando = true;

    this.flujoService.sincronizarOdoo(this.anioSeleccionado, this.mesSeleccionado).subscribe({
      next: (res) => {
        this.sincronizando = false;
        // Mensaje de éxito verde
        this.alertaService.mostrarExito(res.mensaje);
        this.cargarDatos();
      },
      error: (err) => {
        this.sincronizando = false;
        console.error(err);

        // --- MANEJO DE TOKEN VENCIDO ---
        if (err.status === 401) {
          // Mensaje específico para token expirado
          this.alertaService.mostrarError("⚠️ Tu sesión ha expirado. Por favor, recarga la página.");
        } else {
          // Mensaje genérico para otros errores
          this.alertaService.mostrarError("Error al conectar con Odoo.");
        }
      }
    });
  }
}