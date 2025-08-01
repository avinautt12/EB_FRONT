import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyeccionService } from '../../../services/proyeccion.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-proyeccion-detalles',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBarComponent],
  templateUrl: './proyeccion-detalles.component.html',
  styleUrls: ['./proyeccion-detalles.component.css']
})
export class ProyeccionDetallesComponent implements OnInit {
  idProyeccion!: number;
  detalle: any = null;
  cargando: boolean = true;

  // Mapeo de meses para mostrar nombres completos
  meses = {
    'sep': 'Septiembre',
    'oct': 'Octubre',
    'nov': 'Noviembre',
    'dic': 'Diciembre',
    'mar': 'Marzo',
    'abr': 'Abril',
    'may': 'Mayo'
  };

  constructor(
    private route: ActivatedRoute,
    private proyeccionService: ProyeccionService,
    private router: Router
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
        // Corregir formato de fechas en el historial
        if (this.detalle.historial_clientes) {
          this.detalle.historial_clientes.forEach((h: any) => {
            if (h.fecha_registro.includes('%Y')) {
              // Si viene mal formateada desde el backend
              h.fecha_registro = new Date().toISOString(); // Usar fecha actual como fallback
            }
          });
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando detalles:', err);
        this.detalle = null;
        this.cargando = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/proyeccion']);
  }

  tieneHistorialValido(): boolean {
    return this.detalle?.historial_clientes?.length > 0;
  }

  // Formatear nombre de quincena (ej: "q1_sep_2025" -> "1er Quincena Septiembre 2025")
  formatearQuincena(key: string): string {
    const [q, mes, año] = key.split('_');
    const quincena = q === 'q1' ? '1er Quincena' : '2da Quincena';
    return `${quincena} ${this.meses[mes as keyof typeof this.meses] || mes} ${año}`;
  }

  // Obtener cantidad total para una quincena específica
  getCantidadQuincena(quincena: string): number {
    return this.detalle[quincena as keyof typeof this.detalle] || 0;
  }
}