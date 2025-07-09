import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertaComponent } from './components/alerta/alerta.component';
import { AlertaService } from './services/alerta.service';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AlertaComponent],
  template: `
    <router-outlet></router-outlet>
    <app-alerta
      *ngIf="mensajeVisible"
      [mensaje]="mensaje"
      [tipo]="tipo">
    </app-alerta>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  mensaje = '';
  tipo: 'exito' | 'error' = 'exito';
  mensajeVisible = false;

  constructor(private alerta: AlertaService, private authService: AuthService, private router: Router) {
    this.alerta.alerta$.subscribe(data => {
      this.mensaje = data.mensaje;
      this.tipo = data.tipo;
      this.mensajeVisible = true;
      setTimeout(() => this.mensajeVisible = false, 3000);
    });
  }
  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.authService.clearToken();
      this.router.navigate(['/']);
    }
  }
}
