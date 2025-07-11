import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { AlertaService } from '../../../services/alerta.service';
import { RouterModule } from '@angular/router';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';

@Component({
  selector: 'app-proyeccion-historial',
  standalone: true,
  templateUrl: './proyeccion-historial.component.html',
  styleUrl: './proyeccion-historial.component.css',
  imports: [CommonModule, RouterModule, TopBarUsuariosComponent]
})
export class ProyeccionHistorialComponent implements OnInit {

  historial: any[] = [];
  cargando: boolean = true;

  constructor(
    private proyeccionService: ProyeccionService,
    private alertaService: AlertaService
  ) { }

  ngOnInit(): void {
    this.proyeccionService.getHistorialCliente().subscribe({
      next: (res) => {
        this.historial = res;
        this.cargando = false;
      },
      error: (err) => {
        this.alertaService.mostrarError('No se pudo cargar el historial.');
        console.error(err);
        this.cargando = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalPorItem(item: any): number {
    return item.q1_oct_2025 + item.q2_oct_2025 +
      item.q1_nov_2025 + item.q2_nov_2025 +
      item.q1_dic_2025 + item.q2_dic_2025;
  }

  formatearFechaUTC(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
