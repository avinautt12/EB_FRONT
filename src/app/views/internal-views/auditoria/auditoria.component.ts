import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlujoService, AuditoriaLog } from '../../../services/flujo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, HomeBarComponent, RouterLink], 
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  
  // Inyectamos el servicio
  private flujoService = inject(FlujoService);

  // Variables de estado
  logs: AuditoriaLog[] = []; // Aquí se guardará el historial
  cargando: boolean = true;  // Para mostrar el spinner

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  cargarAuditoria() {
    this.cargando = true;
    
    this.flujoService.obtenerAuditoria().subscribe({
      next: (data) => {
        this.logs = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error cargando auditoría:", err);
        this.cargando = false;
        // Opcional: Podrías mostrar un mensaje de error en pantalla
      }
    });
  }

  // --- Lógica Visual ---
  
  // Esta función decide qué clase CSS usar según el texto de la acción
  // Se conecta con el [ngClass] del HTML
  getBadgeClass(accion: string): string {
    if (!accion) return 'badge-gris';

    const act = accion.toUpperCase();

    // 1. Ediciones (Azul)
    if (act.includes('EDICION') || act.includes('EDITAR') || act.includes('UPDATE')) {
      return 'badge-azul';
    }
    
    // 2. Creaciones (Verde)
    if (act.includes('NUEVO') || act.includes('CREAR') || act.includes('INSERT')) {
      return 'badge-verde';
    }
    
    // 3. Eliminaciones o Errores (Rojo)
    if (act.includes('ELIMINAR') || act.includes('BORRAR') || act.includes('DELETE')) {
      return 'badge-rojo';
    }

    // 4. Login/Accesos (Opcional, por si auditas logins después)
    if (act.includes('LOGIN') || act.includes('ACCESO')) {
      return 'badge-gris';
    }

    // Default
    return 'badge-gris';
  }
}