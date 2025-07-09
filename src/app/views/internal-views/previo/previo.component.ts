import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { ClientesService } from '../../../services/clientes.service';
import { PrevioService } from '../../../services/previo.service';

interface Cliente {
  clave: string;
  zona: string;
  nombre_cliente: string;
  nivel: string;
  compromiso_scott?: number;
  compromiso_syncros?: number;
  compromiso_apparel?: number;
  compromiso_vittoria?: number;
}

interface FacturaOdoo {
  contacto_referencia: string;
  contacto_nombre: string;
  cantidad: number;
  precio_unitario: string;
  fecha_factura: string;
  categoria_producto: string;
  numero_factura: string;
  nombre_producto: string;
  estado_factura: string;
  costo_producto: string;
  venta_total: number;
}

interface ClienteConAcumulado extends Cliente {
  acumulado_anticipado: number;
}

@Component({
  selector: 'app-previo',
  standalone: true,
  imports: [HomeBarComponent, RouterModule, CommonModule, FormsModule],
  templateUrl: './previo.component.html',
  styleUrl: './previo.component.css'
})
export class PrevioComponent implements OnInit {
  clientes: Cliente[] = [];
  clientesOriginal: ClienteConAcumulado[] = [];
  clientesFiltrados: ClienteConAcumulado[] = [];
  clientesPaginados: ClienteConAcumulado[] = [];

  facturas: FacturaOdoo[] = [];

  paginaActual = 1;
  paginaActualTemp = 1;
  itemsPorPagina = 15;
  totalPaginas = 0;
  cargando = true;

  filtros = {
    clave: '',
    zona: '',
    nombre_cliente: '',
    nivel: ''
  };
  filtroAbierto: string | null = null;

  zonasUnicas: string[] = [];
  nivelesUnicos: string[] = [];
  filtrosCheckbox = {
    zonasSeleccionadas: new Set<string>(),
    nivelesSeleccionados: new Set<string>()
  };

  fechaEspecialClientes: Set<string> = new Set(['FA318', 'JC554', 'MD670', 'NE724']);

  constructor(
    private clientesService: ClientesService,
    private previoService: PrevioService
  ) { }

  ngOnInit(): void {
    Promise.all([
      this.clientesService.getClientes().toPromise(),
      this.previoService.getFacturasCalculadas().toPromise()
    ]).then(([clientes, facturas]) => {
      this.facturas = facturas ?? [];

      this.clientesOriginal = clientes.map((cliente: Cliente) => {
        const clave = cliente.clave;
        const usaFechasEspeciales = this.fechaEspecialClientes.has(clave);

        const fechaInicio = usaFechasEspeciales ? new Date('2024-07-01') : new Date('2024-06-17');
        const fechaFin = new Date('2025-06-30');

        const facturasCliente = this.facturas.filter(factura =>
          (factura.contacto_referencia === clave || factura.contacto_referencia === `${clave}-CA`) &&
          new Date(factura.fecha_factura) >= fechaInicio &&
          new Date(factura.fecha_factura) <= fechaFin
        );

        const acumulado = facturasCliente.reduce((total, factura) => {
          return total + (+factura.venta_total || 0);
        }, 0);

        return {
          ...cliente,
          acumulado_anticipado: acumulado
        };
      });

      this.zonasUnicas = Array.from(new Set(this.clientesOriginal.map(c => c.zona ?? '').filter(Boolean)));
      this.nivelesUnicos = Array.from(new Set(this.clientesOriginal.map(c => c.nivel ?? '').filter(Boolean)));

      this.aplicarFiltros();
      this.cargando = false;
    });
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    this.filtrarClientes();
  }

  filtrarClientes() {
    this.clientesFiltrados = this.clientesOriginal.filter(cliente => {
      const zonaValida = this.filtrosCheckbox.zonasSeleccionadas.size === 0 ||
        this.filtrosCheckbox.zonasSeleccionadas.has(cliente.zona);

      const nivelValido = this.filtrosCheckbox.nivelesSeleccionados.size === 0 ||
        this.filtrosCheckbox.nivelesSeleccionados.has(cliente.nivel);

      return cliente.clave?.toLowerCase().includes(this.filtros.clave.toLowerCase()) &&
        zonaValida &&
        cliente.nombre_cliente?.toLowerCase().includes(this.filtros.nombre_cliente.toLowerCase()) &&
        nivelValido &&
        cliente.nivel?.toLowerCase().includes(this.filtros.nivel.toLowerCase());
    });

    this.totalPaginas = Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
    this.actualizarPaginado();
  }

  actualizarPaginado() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.clientesPaginados = this.clientesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.paginaActualTemp = pagina;
    this.actualizarPaginado();
  }

  toggleFiltro(columna: string) {
    this.filtroAbierto = this.filtroAbierto === columna ? null : columna;
  }

  toggleZona(zona: string, event: any) {
    if (event.target.checked) {
      this.filtrosCheckbox.zonasSeleccionadas.add(zona);
    } else {
      this.filtrosCheckbox.zonasSeleccionadas.delete(zona);
    }
    this.filtrarClientes();
  }

  seleccionarTodasZonas() {
    this.zonasUnicas.forEach(z => this.filtrosCheckbox.zonasSeleccionadas.add(z));
    this.filtrarClientes();
  }

  borrarSeleccionZonas() {
    this.filtrosCheckbox.zonasSeleccionadas.clear();
    this.filtrarClientes();
  }

  toggleNivel(nivel: string, event: any) {
    if (event.target.checked) {
      this.filtrosCheckbox.nivelesSeleccionados.add(nivel);
    } else {
      this.filtrosCheckbox.nivelesSeleccionados.delete(nivel);
    }
    this.aplicarFiltros();
  }

  seleccionarTodosNiveles() {
    this.nivelesUnicos.forEach(nivel => this.filtrosCheckbox.nivelesSeleccionados.add(nivel));
    this.aplicarFiltros();
  }

  borrarSeleccionNiveles() {
    this.filtrosCheckbox.nivelesSeleccionados.clear();
    this.aplicarFiltros();
  }
}
