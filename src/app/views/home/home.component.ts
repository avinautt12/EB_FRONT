import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorOdooService } from '../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../home-bar/home-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeBarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  facturas: any[] = [];

  constructor(private monitorService: MonitorOdooService) {}

  verMonitor() {
    this.monitorService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        console.log('Facturas:', data);
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
      }
    });
  }
}
