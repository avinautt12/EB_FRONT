import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { FiltroPorTextoPipe } from '../../../pipes/filtro-por-texto.pipe';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, FormsModule, FiltroPorTextoPipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.css',
  providers: [MonitorOdooService]
})
export class MonitorComponent {
  facturas: any[] = [];
  cargando: boolean = false;

  paginaActual: number = 1;
  paginaActualTemp: number = 1;
  elementosPorPagina: number = 20;
  facturasPaginadas: any[] = [];

  filtros: any = {
    numero_factura: '',
    referencia_interna: '',
    nombre_producto: '',
    contacto_referencia: '',
    contacto_nombre: '',
    fecha_factura: '',
    precio_unitario: '',
    cantidad: '',
    categoria_producto: '',
    estado_factura: '',
    costo_producto: ''
  };

  facturasFiltradas: any[] = [];

  filtroAbierto: string | null = null;
  ordenDescendente: boolean = true;
  ordenFechaAscendente = false;

  filtroFechaAbierto: boolean = false;

  categoriasUnicas: string[] = [];
  estadosUnicos: string[] = [];
  filtrosCheckbox = {
    categoriasSeleccionadas: new Set<string>(),
    estadosSeleccionados: new Set<string>()
  };

  filtroCategoriaAbierto: boolean = false;
  busquedaCategoria: string = '';

  totalPaginas: number = 1;

  constructor(private monitorService: MonitorOdooService) { }

  ngOnInit() {
    this.obtenerFacturas();
  }

  obtenerFacturas() {
    this.cargando = true;
    this.monitorService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        this.categoriasUnicas = [...new Set(
          this.facturas
            .map(f => f.categoria_producto)
            .filter(c => c && c.toUpperCase().trim() !== 'SERVICIOS')
        )];
        this.estadosUnicos = [...new Set(this.facturas.map(f => f.estado_factura).filter(Boolean))];
        this.totalPaginas = Math.ceil(this.facturas.length / this.elementosPorPagina);
        this.actualizarFacturasPaginadas();
        this.filtrarFacturas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
        this.cargando = false;
      }
    });
  }

  cambiarPagina(numero: number) {
    if (numero < 1 || numero > this.totalPaginas) return;
    this.paginaActual = numero;
    this.paginaActualTemp = numero;
    this.actualizarFacturasPaginadas();
  }

  // actualizarFacturasPaginadas() {
  //   const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
  //   const fin = inicio + this.elementosPorPagina;
  //   this.facturasPaginadas = this.facturas.slice(inicio, fin);
  // }

  filtrarFacturas() {
    let facturasFiltradas = [...this.facturas];

    facturasFiltradas = facturasFiltradas.filter(f =>
      f.categoria_producto && f.categoria_producto.toUpperCase().trim() !== 'SERVICIOS'
    );

    // Filtros específicos
    if (this.filtros.numero_factura) {
      facturasFiltradas = facturasFiltradas.filter(f => f.numero_factura?.includes(this.filtros.numero_factura));
    }
    if (this.filtros.referencia_interna) {
      facturasFiltradas = facturasFiltradas.filter(f => f.referencia_interna?.includes(this.filtros.referencia_interna));
    }
    if (this.filtros.nombre_producto) {
      facturasFiltradas = facturasFiltradas.filter(f => f.nombre_producto?.includes(this.filtros.nombre_producto));
    }
    if (this.filtros.contacto_referencia) {
      facturasFiltradas = facturasFiltradas.filter(f => f.contacto_referencia?.includes(this.filtros.contacto_referencia));
    }
    if (this.filtros.contacto_nombre) {
      facturasFiltradas = facturasFiltradas.filter(f => f.contacto_nombre?.toLowerCase().includes(this.filtros.contacto_nombre.toLowerCase()));
    }

    // Filtros de fecha
    if (this.filtros.fecha_desde) {
      const desde = new Date(this.filtros.fecha_desde);
      facturasFiltradas = facturasFiltradas.filter(f => new Date(f.fecha_factura) >= desde);
    }
    if (this.filtros.fecha_hasta) {
      const hasta = new Date(this.filtros.fecha_hasta);
      facturasFiltradas = facturasFiltradas.filter(f => new Date(f.fecha_factura) <= hasta);
    }

    if (this.filtrosCheckbox.categoriasSeleccionadas.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f => this.filtrosCheckbox.categoriasSeleccionadas.has(f.categoria_producto));
    }

    if (this.filtrosCheckbox.estadosSeleccionados.size > 0) {
      facturasFiltradas = facturasFiltradas.filter(f => this.filtrosCheckbox.estadosSeleccionados.has(f.estado_factura));
    }

    // Filtros genéricos para otros campos
    Object.keys(this.filtros).forEach(campo => {
      if (
        [
          'numero_factura',
          'referencia_interna',
          'nombre_producto',
          'contacto_referencia',
          'contacto_nombre',
          'fecha_desde',
          'fecha_hasta'
        ].includes(campo)
      ) return;
      const filtro = this.filtros[campo]?.toString().toLowerCase();
      if (!filtro) return;
      facturasFiltradas = facturasFiltradas.filter(f => (f[campo] ?? '').toString().toLowerCase().includes(filtro));
    });

    // Ordenar por fecha
    facturasFiltradas = facturasFiltradas.sort((a, b) => {
      const fechaA = new Date(a.fecha_factura).getTime();
      const fechaB = new Date(b.fecha_factura).getTime();
      return this.ordenFechaAscendente ? fechaA - fechaB : fechaB - fechaA;
    });

    this.facturasFiltradas = facturasFiltradas;
    this.totalPaginas = Math.ceil(this.facturasFiltradas.length / this.elementosPorPagina);
    this.actualizarFacturasPaginadas();
    this.cambiarPagina(1);
  }

  toggleFiltro(campo: string) {
    this.filtroAbierto = this.filtroAbierto === campo ? null : campo;
  }

  actualizarFacturasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    const fuente = this.facturasFiltradas.length ? this.facturasFiltradas : this.facturas;
    this.facturasPaginadas = fuente.slice(inicio, fin);
  }

  ordenarPorFecha() {
    this.ordenFechaAscendente = !this.ordenFechaAscendente;
    this.filtrarFacturas();
  }

  // Métodos adicionales
  toggleFechaFilter() {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  cambiarOrdenFecha(orden: string) {
    this.ordenFechaAscendente = orden === 'asc';
    this.filtrarFacturas();
    this.filtroFechaAbierto = false;
  }

  aplicarFiltroFecha() {
    this.filtrarFacturas();
    // Opcional: cerrar automáticamente después de aplicar
    // this.filtroFechaAbierto = false;
  }

  toggleCategoria(categoria: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.categoriasSeleccionadas.add(categoria);
    } else {
      this.filtrosCheckbox.categoriasSeleccionadas.delete(categoria);
    }
    this.filtrarFacturas();
  }

  toggleEstado(estado: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filtrosCheckbox.estadosSeleccionados.add(estado);
    } else {
      this.filtrosCheckbox.estadosSeleccionados.delete(estado);
    }
    this.filtrarFacturas();
  }

  toggleFiltroCategoria() {
    this.filtroCategoriaAbierto = !this.filtroCategoriaAbierto;
  }

  seleccionarTodasCategorias() {
    this.categoriasUnicas.forEach(c => this.filtrosCheckbox.categoriasSeleccionadas.add(c));
    this.filtrarFacturas();
  }

  borrarSeleccionCategorias() {
    this.filtrosCheckbox.categoriasSeleccionadas.clear();
    this.filtrarFacturas();
  }

  calcularVentaTotal(precio: number, cantidad: number, estado: string): number {
    const esCancelado = estado?.toLowerCase().trim().replace(/\s+/g, '') === 'cancel';
    const total = precio * cantidad * 1.16;
    return esCancelado ? -total : total;
  }

  extraerPrimeraParte(texto: string): string {
    if (!texto) return '';
    const indice = texto.indexOf(' /');
    return indice !== -1 ? texto.substring(0, indice) : texto;
  }

  obtenerSegundaParte(texto: string): string {
    if (!texto) return '';
    const primera = texto.indexOf(' /');
    const segunda = texto.indexOf(' /', primera + 2);
    if (primera !== -1 && segunda !== -1) {
      return texto.substring(primera + 2, segunda).trim();
    } else if (primera !== -1) {
      return texto.substring(primera + 2).trim();
    }
    return texto;
  }

  contieneERIDE(texto: string): string {
    if (!texto) return 'NO';
    return texto.includes('ERIDE') ? 'SI' : 'NO';
  }

  contieneAPPAREL(texto: string): string {
    if (!texto) return 'NO';
    return texto.includes('APPAREL') ? 'SI' : 'NO';
  }

}
