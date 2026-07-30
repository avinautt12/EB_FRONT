import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { ProyeccionesTabComponent } from '../../../components/proyecciones-tab/proyecciones-tab.component';
import { ClientesService } from '../../../services/clientes.service';

@Component({
  selector: 'app-proyeccion-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, TopBarUsuariosComponent, ProyeccionesTabComponent],
  templateUrl: './proyeccion-usuarios.component.html',
  styleUrls: ['./proyeccion-usuarios.component.css']
})
export class ProyeccionUsuariosComponent implements OnInit {
  private clientesService = inject(ClientesService);

  clienteClave: string | null = null;
  idCliente: number | null = null;
  cargando = true;
  error: string | null = null;

  ngOnInit(): void {
    this.clientesService.getInfoClienteActual().subscribe({
      next: (info) => {
        this.clienteClave = info.clave ?? null;
        this.idCliente   = info.id   ?? null;
        this.cargando    = false;
      },
      error: () => {
        this.error    = 'No se pudo cargar la información del cliente.';
        this.cargando = false;
      }
    });
  }
}
