import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RetroactivosService } from '../../../services/retroactivos.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

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
  selector: 'app-caratula-retroactivos-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeBarComponent],
  templateUrl: './caratula-retroactivos-usuarios.component.html',
  styleUrl: './caratula-retroactivos-usuarios.component.css' 
})
export class CaratulaRetroactivosUsuarioComponent implements OnInit {

  isLoading = true;
  error: string | null = null;
  datosCliente: DatosRetroactivo | null = null;

  constructor(private retroactivosService: RetroactivosService) { }

  ngOnInit() {
    this.cargarDatosUsuarioActual();
  }

  cargarDatosUsuarioActual() {
    this.isLoading = true;
    this.error = null;

    // ====================================================================
    // AQUÍ TOMAS LA CLAVE DEL TOKEN O SESIÓN.
    // Reemplaza esto con tu servicio de Autenticación o LocalStorage.
    // Ejemplo: const claveUsuario = this.authService.getUsuario().clave;
    // ====================================================================
    const claveUsuario = localStorage.getItem('clave_usuario') || 'EA219'; 

    if (!claveUsuario) {
      this.error = 'No se pudo identificar al usuario actual.';
      this.isLoading = false;
      return;
    }

    this.retroactivosService.getRetroactivoCliente(claveUsuario).subscribe({
      next: (data) => {
        this.datosCliente = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'No se encontró información de retroactivos para tu cuenta en este momento.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}