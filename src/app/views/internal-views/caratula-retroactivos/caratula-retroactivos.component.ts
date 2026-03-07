import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, EMPTY, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { RetroactivosService } from '../../../services/retroactivos.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

// Interfaz para el buscador
interface SugerenciaCliente {
  CLAVE: string;
  CLIENTE: string;
}

// Interfaz con los datos exactos que devuelve Python
interface DatosRetroactivo {
  CLAVE: string;
  ZONA: string;
  CLIENTE: string;
  CATEGORIA: string;
  
  COMPRA_MINIMA_ANUAL: number;
  COMPRA_GLOBAL_SCOTT: number;
  porcentaje_avance_scott: number;
  
  COMPRA_MINIMA_APPAREL: number;
  COMPRA_GLOBAL_APPAREL: number;
  porcentaje_avance_apparel: number;
  
  COMPRAS_TOTALES_CRUDO: number;
  notas_credito: number;
  garantias: number;
  acumulado_global_calculado: number;
  
  productos_ofertados: number;
  bicicleta_demo: number;
  bicicletas_bold: number;
  importe_final: number;
  
  compra_adicional: number;
  porcentaje_retroactivo: number;
  porcentaje_retroactivo_apparel: number;
  retroactivo_total: number;
  importe: number;

  porcentaje_avance_general: number;
  total_bicis_deduccion: number;
}

@Component({
  selector: 'app-caratula-retroactivos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HomeBarComponent],
  templateUrl: './caratula-retroactivos.component.html',
  styleUrl: './caratula-retroactivos.component.css' 
})
export class CaratulaRetroactivosComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  terminoBusqueda: string = '';
  sugerenciasFiltradas: SugerenciaCliente[] = [];
  mostrarSugerencias: boolean = false;
  isLoading = false;
  error: string | null = null;

  datosCliente: DatosRetroactivo | null = null;

  private searchSubject = new Subject<string>();
  private allClientes: SugerenciaCliente[] = []; // Caché para el buscador
  private isSearchingDirectly = false;

  constructor(private retroactivosService: RetroactivosService) { }

  ngOnInit() {
    this.cargarCacheClientes();
    this.configurarBuscador();
  }

  // Carga todos los clientes una sola vez para que la búsqueda sea ultra rápida
  private cargarCacheClientes() {
    this.retroactivosService.getRetroactivos().subscribe({
      next: (data) => {
        this.allClientes = data.map(item => ({ CLAVE: item.CLAVE, CLIENTE: item.CLIENTE }));
      },
      error: (err) => console.error('Error al cargar caché:', err)
    });
  }

  private configurarBuscador() {
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(term => {
      if (!term || term.length < 2 || this.isSearchingDirectly) {
        this.sugerenciasFiltradas = [];
        this.mostrarSugerencias = false;
        return;
      }

      const termLower = term.toLowerCase();
      this.sugerenciasFiltradas = this.allClientes.filter(c => 
        (c.CLAVE && c.CLAVE.toLowerCase().includes(termLower)) || 
        (c.CLIENTE && c.CLIENTE.toLowerCase().includes(termLower))
      ).slice(0, 10); // Máximo 10 sugerencias

      this.mostrarSugerencias = this.sugerenciasFiltradas.length > 0;
    });
  }

  onInputChange(event: any) {
    this.isSearchingDirectly = false;
    this.searchSubject.next(event.target.value);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.mostrarSugerencias = false;
      this.buscarCliente();
    }
  }

  seleccionarSugerencia(sugerencia: SugerenciaCliente) {
    this.terminoBusqueda = sugerencia.CLAVE;
    this.mostrarSugerencias = false;
    this.isSearchingDirectly = true;
    this.buscarCliente(sugerencia.CLAVE);
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.datosCliente = null;
    this.sugerenciasFiltradas = [];
    this.error = null;
    this.searchInput.nativeElement.focus();
  }

  buscarCliente(claveForzada?: string) {
    const identificador = claveForzada || this.terminoBusqueda.trim();
    if (!identificador) return;

    this.isLoading = true;
    this.error = null;
    this.datosCliente = null;
    this.mostrarSugerencias = false;

    this.retroactivosService.getRetroactivoCliente(identificador).subscribe({
      next: (data) => {
        this.datosCliente = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'No se encontró información para este cliente.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}