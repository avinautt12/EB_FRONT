import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-proyeccion-detalles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeBarComponent],
  templateUrl: './proyeccion-detalles.component.html',
  styleUrls: ['./proyeccion-detalles.component.css']
})
export class ProyeccionDetallesComponent implements OnInit {
  idProyeccion!: number;
  detalle: any = null;
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private proyeccionService: ProyeccionService
  ) { }

  ngOnInit(): void {
    this.idProyeccion = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDetalle();
  }

  cargarDetalle() {
    this.cargando = true;
    this.proyeccionService.getDetalleProducto(this.idProyeccion).subscribe({
      next: (data) => {
        this.detalle = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando detalles:', err);
        this.detalle = null; // En caso de error, no hay detalle
        this.cargando = false;
      }
    });
  }

  volver() {
    window.history.back();
  }

  tieneHistorialValido(): boolean {
    // Verificamos que detalle no sea null, tenga historial y que orden_total_cant sea mayor que 0
    return (
      this.detalle !== null &&
      Object.keys(this.detalle).length > 0 &&
      Array.isArray(this.detalle.historial_clientes) &&
      this.detalle.historial_clientes.length > 0 &&
      this.detalle.orden_total_cant != null &&
      this.detalle.orden_total_cant > 0
    );
  }
}
