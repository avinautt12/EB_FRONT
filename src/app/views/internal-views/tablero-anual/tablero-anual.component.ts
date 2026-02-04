import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlujoService } from '../../../services/flujo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tablero-anual',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, RouterLink],
  templateUrl: './tablero-anual.component.html',
  styleUrls: ['./tablero-anual.component.css']
})
export class TableroAnualComponent implements OnInit {

  private flujoService = inject(FlujoService);

  columnas: string[] = [];
  filas: any[] = []; // Aquí guardaremos la estructura lista para pintar
  cargando: boolean = true;

  mesesExpandidos: Set<string> = new Set();

  categoriasExpandidas: Set<string> = new Set(['Ingresos']); // 'Ingresos' abierta por defecto
  filasAgrupadas: { categoria: string, filas: any[] }[] = [];

  ngOnInit(): void {
    this.cargarDatosAnuales();
  }

  cargarDatosAnuales() {
    this.cargando = true;
    this.flujoService.obtenerProyeccionAnual().subscribe({
      next: (data) => {
        this.columnas = data.columnas;
        this.agruparPorCategoria(data.filas);
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error cargando proyección anual:", err);
        this.cargando = false;
      }
    });
  }

  toggleMes(fecha: string): void {
    if (this.mesesExpandidos.has(fecha)) {
      this.mesesExpandidos.delete(fecha); // Si está abierto, lo cierra
    } else {
      this.mesesExpandidos.add(fecha); // Si está cerrado, lo abre
    }
  }

  estaExpandido(fecha: string): boolean {
    return this.mesesExpandidos.has(fecha);
  }

  agruparPorCategoria(filas: any[]) {
    const grupos = new Map<string, any[]>();
    filas.forEach(f => {
      const cat = f.categoria || 'Sin Categoría';
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)?.push(f);
    });
    
    this.filasAgrupadas = Array.from(grupos.entries()).map(([categoria, filas]) => ({
      categoria,
      filas
    }));
  }

  toggleCategoria(cat: string) {
    if (this.categoriasExpandidas.has(cat)) {
      this.categoriasExpandidas.delete(cat);
    } else {
      this.categoriasExpandidas.add(cat);
    }
  }

  catEstaExpandida(cat: string): boolean {
    return this.categoriasExpandidas.has(cat);
  }

  // --- ESTILOS DINÁMICOS ---

  // Colores de fondo según categoría (Replica tu Excel)
  getClaseFila(categoria: string): string {
    if (!categoria) return '';
    // Ajusta estos strings exactos a como vengan de tu BD
    if (categoria.includes('Saldo') && categoria.includes('INICIAL')) return 'fila-amarilla';
    if (categoria === 'Total' || categoria.includes('SALIDAS')) return 'fila-naranja';
    if (categoria === 'Saldo Final' || categoria.includes('DISPONIBLE')) return 'fila-azul';
    if (categoria === 'Subtotal') return 'fila-gris';
    return '';
  }

  // Texto rojo para negativos
  esNegativo(valor: number): boolean {
    return valor < 0;
  }
}