import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ClientesService } from '../../services/clientes.service';

@Component({
  selector: 'app-tooltip',
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.css']
})
export class TooltipComponent implements OnInit, OnChanges {
  @Input() cliente: any;
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };

  fechasClientes: any[] = [];
  tooltipContent: string = '';
  showTooltip: boolean = false;

  constructor(
    private http: HttpClient,
    private clientesService: ClientesService
  ) { }

  ngOnInit() {
    this.obtenerFechasClientes();
  }

  // ¡ESTE MÉTODO ES CRÍTICO! Reacciona a cambios en los inputs
  ngOnChanges(changes: SimpleChanges) {
    if (changes['cliente'] && this.cliente) {
      this.mostrarTooltip();
    }
  }

  obtenerFechasClientes() {
    this.clientesService.ObtenerFechasClientes().subscribe({
      next: (data) => {
        this.fechasClientes = data;
        // Si ya tenemos un cliente cuando llegan los datos, mostrar tooltip
        if (this.cliente) {
          this.mostrarTooltip();
        }
      },
      error: (error) => {
        console.error('Error al obtener fechas de clientes:', error);
      }
    });
  }


  // En tooltip.component.ts, solo modifica el método mostrarTooltip():

  mostrarTooltip() {
    if (!this.cliente) return;

    // Si el cliente ya tiene las fechas (integrales con fechas asignadas), usarlas directamente
    if (this.cliente.f_inicio && this.cliente.f_fin) {
      const tipoCliente = this.cliente.esIntegral ? 'Integral' : 'Cliente Individual';
      this.tooltipContent = `
      <strong>Fechas de Temporada (${tipoCliente})</strong>
      <div>Inicio: ${this.cliente.f_inicio}</div>
      <div>Cierre: ${this.cliente.f_fin}</div>
    `;
      this.showTooltip = true;
      return;
    }

    // Para clientes normales sin fechas directas, buscar en fechasClientes
    const clienteInfo = this.fechasClientes.find(f => f.nombre_cliente === this.cliente.nombre_cliente);

    if (clienteInfo) {
      this.tooltipContent = `
      <strong>Fechas de Temporada</strong>
      <div>Inicio: ${clienteInfo.f_inicio || 'No definida'}</div>
      <div>Cierre: ${clienteInfo.f_fin || 'No definida'}</div>
    `;
    } else {
      this.tooltipContent = 'No hay información de fechas disponible';
    }

    this.showTooltip = true;
  }

  ocultarTooltip() {
    this.showTooltip = false;
  }

  getTooltipTopPosition(): number {
    const tooltipHeight = 120; // Altura estimada del tooltip
    const windowHeight = window.innerHeight;

    // Si hay suficiente espacio arriba, mostrar arriba
    if (this.position.y > tooltipHeight + 20) {
      return this.position.y - tooltipHeight;
    }
    // Si no, mostrar abajo como antes
    return this.position.y + 10;
  }

  shouldShowAbove(): boolean {
    const tooltipHeight = 120;
    return this.position.y > tooltipHeight + 20;
  }
}