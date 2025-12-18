import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertaService } from './services/alerta.service';
import { AuthService } from './services/auth.service';
import { AlertaComponent } from './components/alerta/alerta.component';
// Importamos los servicios de datos
import { MonitorOdooService } from './services/monitor-odoo.service'; // Asumiendo nombre del archivo
import { PrevioService } from './services/previo.service';
import { CaratulasService } from './services/caratulas.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertaComponent],
  template: `
    <router-outlet></router-outlet>
    <app-alerta *ngIf="mensajeVisible" [mensaje]="mensaje" [tipo]="tipo"></app-alerta>
    `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  mensaje = '';
  tipo: 'exito' | 'error' = 'exito';
  mensajeVisible = false;

  constructor(
    public authService: AuthService,
    private alerta: AlertaService,
    // Inyectamos los servicios para iniciar la precarga
    private monitorService: MonitorOdooService,
    private previoService: PrevioService,
    private caratulasService: CaratulasService
  ) {
    this.alerta.alerta$.subscribe(data => {
      this.mensaje = data.mensaje;
      this.tipo = data.tipo;
      this.mensajeVisible = true;
      setTimeout(() => this.mensajeVisible = false, 3000);
    });
  }

  ngOnInit() {
    // 1. Si ya estamos logueados al iniciar (F5), precargar.
    if (this.authService.isLoggedIn()) {
      this.iniciarPrecargaDatos();
    }

    // 2. Si nos logueamos en este momento, precargar.
    this.authSubscription = this.authService.authState$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.iniciarPrecargaDatos();
      }
    });
  }

  private iniciarPrecargaDatos() {
    this.monitorService.precargarDatos();
    this.previoService.precargarDatos();
    this.caratulasService.precargarDatos();
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }
}