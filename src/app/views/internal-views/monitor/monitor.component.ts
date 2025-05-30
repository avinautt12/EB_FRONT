import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../../home-bar/home-bar.component';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, HomeBarComponent],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.css',
  providers: [MonitorOdooService]
})
export class MonitorComponent {
 facturas: any[] = [];
  cargando: boolean = false;

  constructor(private monitorService: MonitorOdooService) {}

  ngOnInit() {
    this.obtenerFacturas();
  }

  obtenerFacturas() {
    this.cargando = true;
    this.monitorService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
        this.cargando = false;
      }
    });
  }
}
