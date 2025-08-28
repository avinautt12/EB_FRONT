import { Component, ViewContainerRef, ComponentRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertaService } from './services/alerta.service';
import { AuthService } from './services/auth.service';
import { AlertaComponent } from './components/alerta/alerta.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertaComponent],
  template: `
    <router-outlet></router-outlet>
    <app-alerta *ngIf="mensajeVisible" [mensaje]="mensaje" [tipo]="tipo"></app-alerta>
    <div #componentContainer style="display: none;"></div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('componentContainer', { read: ViewContainerRef }) container!: ViewContainerRef;
  private componentRefs: ComponentRef<any>[] = [];
  private authSubscription?: Subscription;
  mensaje = '';
  tipo: 'exito' | 'error' = 'exito';
  mensajeVisible = false;

  constructor(
    public authService: AuthService,
    private alerta: AlertaService
  ) {
    this.alerta.alerta$.subscribe(data => {
      this.mensaje = data.mensaje;
      this.tipo = data.tipo;
      this.mensajeVisible = true;
      setTimeout(() => this.mensajeVisible = false, 3000);
    });
  }

  async ngAfterViewInit() {
    // Carga inicial si ya está logeado
    if (this.authService.isLoggedIn()) {
      await this.cargarComponentesInvisibles();
    }

    // ✅ SUSCRIBIRSE a cambios de autenticación
    this.authSubscription = this.authService.authState$.subscribe(
      async (isLoggedIn) => {
        if (isLoggedIn) {
          await this.cargarComponentesInvisibles();
        } else {
          this.limpiarComponentes();
        }
      }
    );
  }

  private limpiarComponentes() {
    this.componentRefs.forEach(ref => ref.destroy());
    this.componentRefs = [];
  }

  private async cargarComponentesInvisibles() {

    try {
      await Promise.all([
        this.cargarComponenteDinamico('MonitorComponent', () =>
          import('./views/internal-views/monitor/monitor.component')),
        this.cargarComponenteDinamico('PrevioComponent', () =>
          import('./views/internal-views/previo/previo.component')),
        this.cargarComponenteDinamico('CaratulaEvacAComponent', () =>
          import('./views/internal-views/caratula-evac-a/caratula-evac-a.component')),
        this.cargarComponenteDinamico('CaratulaEvacBComponent', () =>
          import('./views/internal-views/caratula-evac-b/caratula-evac-b.component'))
      ]);

    } catch (error) {
      console.error('❌ Error cargando componentes:', error);
    }
  }

  private async cargarComponenteDinamico(componentName: string, importFn: () => Promise<any>): Promise<void> {
    try {
      const componentModule = await importFn();
      const componentClass = componentModule[componentName];

      if (componentClass) {
        const componentRef = this.container.createComponent(componentClass);

        // Acceder al elemento host del componente
        const hostElement = componentRef.hostView as any;
        if (hostElement.rootNodes && hostElement.rootNodes[0]) {
          const rootElement: HTMLElement = hostElement.rootNodes[0];
          rootElement.style.display = 'none';
          rootElement.style.visibility = 'hidden';
        }

        this.componentRefs.push(componentRef);
      } else {
        console.error(`❌ Clase ${componentName} no encontrada en el módulo`);
      }
    } catch (error) {
      console.error(`❌ Error cargando ${componentName}:`, error);
    }
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.componentRefs.forEach(ref => ref.destroy());
  }
}