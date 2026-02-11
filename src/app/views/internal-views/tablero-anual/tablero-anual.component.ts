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

  categoriasExpandidas: Set<string> = new Set(['Ingresos']);
  filasAgrupadas: { categoria: string, filas: any[] }[] = [];

  // ===========================================================================
  // 1. DEFINIR LOS NOMBRES NUEVOS EN LA LISTA "SIN AGRUPAR"
  // ===========================================================================
  readonly CATEGORIAS_SIN_AGRUPAR = new Set<string>([
    'Saldo',
    'Ingresos Operativos',
    'TOTAL INGRESOS', // <-- Nuevo nombre visual
    'TOTAL EGRESOS',  // <-- Nuevo nombre visual
    'Saldo Final'
  ]);

  // ===========================================================================
  // 2. DEFINIR EL ORDEN EXACTO CON LOS NOMBRES NUEVOS
  // ===========================================================================
  readonly ORDEN_CATEGORIAS = [
    'Saldo',
    'Ingresos Operativos',
    'Ingresos Financieros',
    'Movimientos',
    'Ingresos Otros',
    'TOTAL INGRESOS',    // <-- Debajo de Ingresos Otros (Posición 1)
    'Egresos Proveedores',
    'Egresos Operativos',
    'Egresos Laborales',
    'Impuestos',
    'Egresos Financieros',
    'TOTAL EGRESOS',     // <-- Debajo de Egresos Financieros (Posición 2)
    'Total',
    'Saldo Final'
  ];

  ngOnInit(): void {
    this.cargarDatosAnuales();
  }

  cargarDatosAnuales() {
    this.cargando = true;
    this.flujoService.obtenerProyeccionAnual().subscribe({
      next: (data) => {
        this.columnas = data.columnas;

        // 1. FILTRADO: Eliminamos todo lo que sea "Subtotal" antes de procesar
        const filasLimpias = data.filas.filter((f: any) =>
          f.categoria !== 'Subtotal' &&
          !f.concepto.includes('TOTAL DE RECUPERACION') &&
          !f.concepto.includes('TOTAL DE GASTOS OPERATIVOS')
        );

        // 2. RENOMBRADO (Tu lógica actual)
        filasLimpias.forEach((f: any) => {
          if (f.concepto === 'TOTAL ENTRADAS') {
            f.categoria = 'TOTAL INGRESOS';
            f.concepto = 'TOTAL INGRESOS';
          }
          if (f.concepto === 'TOTAL SALIDAS') {
            f.categoria = 'TOTAL EGRESOS';
            f.concepto = 'TOTAL EGRESOS';
          }
        });

        // 3. AGRUPAR (Usamos el array filtrado 'filasLimpias')
        this.agruparPorCategoria(filasLimpias);
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

  esSinAgrupar(categoria: string): boolean {
    return this.CATEGORIAS_SIN_AGRUPAR.has(categoria);
  }

  agruparPorCategoria(filas: any[]) {
    const grupos = new Map<string, any[]>();

    filas.forEach(f => {
      // Truco de seguridad: Si tu BD trae espacios o mezclas, usa .trim() y .toUpperCase()
      // O déjalo como está si ya corregiste el array ORDEN_CATEGORIAS
      const cat = f.categoria ? f.categoria : 'SIN CATEGORÍA';

      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)?.push(f);
    });

    this.filasAgrupadas = Array.from(grupos.entries())
      .map(([categoria, filas]) => ({ categoria, filas }))
      .sort((a, b) => {
        // Aquí es donde ocurría el error. Ahora al coincidir mayúsculas, funcionará.
        const indexA = this.ORDEN_CATEGORIAS.indexOf(a.categoria);
        const indexB = this.ORDEN_CATEGORIAS.indexOf(b.categoria);

        // Debug rápido: Si sigue fallando, descomenta esto para ver qué nombre trae real
        // console.log(`Cat: ${a.categoria} index: ${indexA}`);

        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
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

    // 4. CAMBIO: Agregamos los nuevos nombres para el color naranja
    if (categoria === 'Total' || categoria.includes('SALIDAS') || categoria === 'TOTAL INGRESOS' || categoria === 'TOTAL EGRESOS') return 'fila-naranja';

    if (categoria === 'Saldo Final' || categoria.includes('DISPONIBLE')) return 'fila-azul';
    return '';
  }

  // Texto rojo para negativos
  esNegativo(valor: number): boolean {
    return valor < 0;
  }
}