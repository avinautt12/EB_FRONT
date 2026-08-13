import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudRetroactivoCampaniasService } from '../../../services/solicitud-retroactivo-campanias.service';
import { Marca, ProductoDetalle } from '../models/producto-catalogo.model';

@Component({
  selector: 'app-producto-catalogo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-catalogo-modal.component.html',
  styleUrl: './producto-catalogo-modal.component.css'
})
export class ProductoCatalogoModalComponent implements OnInit {
  private readonly campaniasService = inject(SolicitudRetroactivoCampaniasService);

  @Input() visible: boolean = false;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() productosSeleccionados = new EventEmitter<ProductoDetalle[]>();

  marcasList: Marca[] = [];
  productosList: ProductoDetalle[] = [];
  seleccionadosMap: Map<number, ProductoDetalle> = new Map();

  filtroQuery: string = '';
  filtroMarcaId: number | null = null;
  filtroSku: string = '';

  loading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  ngOnInit(): void {
    this.cargarMarcas();
    this.buscarProductos();
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

  cargarMarcas(): void {
    this.campaniasService.getMarcas().subscribe({
      next: (marcas) => (this.marcasList = marcas),
      error: (err) => console.error('Error al cargar marcas:', err)
    });
  }

  buscarProductos(page: number = 1): void {
    this.currentPage = page;
    this.loading = true;

    const filtros = {
      query: this.filtroQuery.trim() || undefined,
      marca_id: this.filtroMarcaId || undefined,
      sku: this.filtroSku.trim() || undefined,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.campaniasService.getCatalogoProductos(filtros).subscribe({
      next: (res) => {
        this.productosList = res.data;
        this.totalRecords = res.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al consultar catálogo:', err);
        this.loading = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroQuery = '';
    this.filtroMarcaId = null;
    this.filtroSku = '';
    this.buscarProductos(1);
  }

  toggleSeleccion(producto: ProductoDetalle): void {
    if (this.seleccionadosMap.has(producto.id)) {
      this.seleccionadosMap.delete(producto.id);
    } else {
      this.seleccionadosMap.set(producto.id, producto);
    }
  }

  isSeleccionado(id: number): boolean {
    return this.seleccionadosMap.has(id);
  }

  anteriorPagina(): void {
    if (this.currentPage > 1) {
      this.buscarProductos(this.currentPage - 1);
    }
  }

  siguientePagina(): void {
    if (this.currentPage < this.totalPages) {
      this.buscarProductos(this.currentPage + 1);
    }
  }

  confirmarSeleccion(): void {
    const lista = Array.from(this.seleccionadosMap.values());
    this.productosSeleccionados.emit(lista);
    this.cerrar();
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}