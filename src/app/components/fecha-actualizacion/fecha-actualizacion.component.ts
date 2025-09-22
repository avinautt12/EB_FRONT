import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MonitorOdooService } from '../../services/monitor-odoo.service';

@Component({
  selector: 'app-fecha-actualizacion',
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './fecha-actualizacion.component.html',
  styleUrl: './fecha-actualizacion.component.css',
})
export class FechaActualizacionComponent implements OnInit {

  // NUEVA VARIABLE: solo guardará la fecha si es válida.
  fechaValida: Date | null = null;
  
  // Variable para los mensajes de estado (Cargando, Error, etc.)
  mensajeEstado: string = 'Cargando...';

  constructor(private monitorOdooService: MonitorOdooService) { }

  ngOnInit(): void {
    this.cargarFecha();
  }

  cargarFecha(): void {
    this.monitorOdooService.getUltimaActualizacion().subscribe({
      next: (response) => {
        if (response.success && response.ultima_fecha_actualizacion) {
          this.fechaValida = new Date(response.ultima_fecha_actualizacion);
        } else {
          this.mensajeEstado = 'No disponible';
          this.fechaValida = null;
        }
      },
      error: (err) => {
        console.error('Error al cargar la fecha de actualización:', err);
        this.mensajeEstado = 'Error al cargar';
        this.fechaValida = null;
      }
    });
  }
}