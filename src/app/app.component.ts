import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { AlertaService } from './services/alerta.service';
import { AuthService } from './services/auth.service';
import { AlertaComponent } from './components/alerta/alerta.component';
import { MonitorOdooService } from './services/monitor-odoo.service';
import { PrevioService } from './services/previo.service';
import { CaratulasService } from './services/caratulas.service';
import { UpdateService } from './services/update.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertaComponent, ConfirmDialogComponent],
  template: `
    <!-- Banner de nueva versión disponible -->
    <div *ngIf="hayActualizacion" class="update-banner">
      <span>🔄 Hay una nueva versión del sistema disponible.</span>
      <button (click)="actualizarAhora()">Actualizar ahora</button>
      <button class="btn-cerrar" (click)="hayActualizacion = false">✕</button>
    </div>
    <router-outlet></router-outlet>
    <app-alerta *ngIf="mensajeVisible" [mensaje]="mensaje" [tipo]="tipo"></app-alerta>
    <app-confirm-dialog></app-confirm-dialog>
  `,
  styles: [`
    .update-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #1a56db;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
    }
    .update-banner span { flex: 1; }
    .update-banner button {
      background: #fff;
      color: #1a56db;
      border: none;
      border-radius: 6px;
      padding: 6px 16px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .update-banner .btn-cerrar {
      background: transparent;
      color: #fff;
      padding: 4px 8px;
      font-size: 16px;
      opacity: .8;
    }
  `],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  private renewalSub?: Subscription;
  mensaje = '';
  tipo: 'exito' | 'error' = 'exito';
  mensajeVisible = false;
  hayActualizacion = false;

  constructor(
    public authService: AuthService,
    private alerta: AlertaService,
    private router: Router,
    private monitorService: MonitorOdooService,
    private previoService: PrevioService,
    private caratulasService: CaratulasService,
    private updateService: UpdateService
  ) {
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }

    this.alerta.alerta$.subscribe(data => {
      this.mensaje = data.mensaje;
      this.tipo = data.tipo;
      this.mensajeVisible = true;
      setTimeout(() => this.mensajeVisible = false, 3000);
    });

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          const navbar = document.querySelector('app-home-bar') as HTMLElement | null;
          const offset = navbar ? navbar.offsetHeight + 2 : 64;
          window.scrollTo({ top: offset, behavior: 'instant' });
        }, 100);
      });
  }

  ngOnInit() {
    // Iniciar detector de actualizaciones del sistema
    this.updateService.iniciar();
    this.updateService.hayActualizacion$.subscribe(hay => {
      this.hayActualizacion = hay;
    });

    if (this.authService.isLoggedIn()) {
      this.iniciarPrecargaDatos();
      this._iniciarRenovacionProactiva();
    }

    this.authSubscription = this.authService.authState$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.iniciarPrecargaDatos();
        this._iniciarRenovacionProactiva();
      } else {
        this.renewalSub?.unsubscribe();
      }
    });
  }

  actualizarAhora(): void {
    this.updateService.recargar();
  }

  private iniciarPrecargaDatos() {
    this.monitorService.precargarDatos();
    this.previoService.precargarDatos();
    this.caratulasService.precargarDatos();
  }

  // Revisa cada 15 minutos: si quedan menos de 60 min, renueva silenciosamente
  private _iniciarRenovacionProactiva(): void {
    this.renewalSub?.unsubscribe();
    this.renewalSub = interval(15 * 60 * 1000).subscribe(() => {
      if (!this.authService.isLoggedIn()) return;
      const segsRestantes = this.authService.getTokenExpirySeconds();
      if (segsRestantes > 0 && segsRestantes < 60 * 60) {
        this.authService.renovarToken().subscribe({
          next: res => this.authService.setToken(res.token),
          error: () => {}
        });
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.renewalSub?.unsubscribe();
  }
}
