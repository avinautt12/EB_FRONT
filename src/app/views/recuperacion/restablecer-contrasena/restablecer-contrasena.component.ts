import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertaService } from '../../../services/alerta.service';
import { AlertaComponent } from '../../../components/alerta/alerta.component';
import { TopBarComponent } from "../../../components/top-bar/top-bar.component";


@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertaComponent, TopBarComponent],
  templateUrl: './restablecer-contrasena.component.html',
  styleUrl: './restablecer-contrasena.component.css'
})
export class RestablecerContrasenaComponent {
  nuevaContrasena: string = '';
  loading: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' = 'exito';
  token: string = '';
  verPassword = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private alertaService: AlertaService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    console.log('Token recibido:', this.token);
  }

  onSubmit() {
    console.log('Ejecutando onSubmit()');
    console.log('Token:', this.token);
    console.log('Nueva contraseña:', this.nuevaContrasena);
    if (!this.nuevaContrasena || !this.token) return;

    this.loading = true;
    this.authService.cambiarContrasena(this.token, this.nuevaContrasena).subscribe({
      next: (res) => {
        const mensaje = res?.mensaje || 'Contraseña actualizada exitosamente. Redirigiendo a inicio de sesión...';
        this.alertaService.mostrarExito(mensaje);
        this.nuevaContrasena = '';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error) => {
        console.error('Error desde backend:', error);
        const mensaje = error.error?.mensaje || error.error?.error || 'Error al cambiar la contraseña.';
        this.alertaService.mostrarError(mensaje);
        this.loading = false;
      }
    });
  }
}
