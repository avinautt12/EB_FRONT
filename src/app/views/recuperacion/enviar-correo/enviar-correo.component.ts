import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AlertaComponent } from '../../../components/alerta/alerta.component';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-enviar-correo',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertaComponent, TopBarComponent],
  templateUrl: './enviar-correo.component.html',
  styleUrl: './enviar-correo.component.css',
})
export class EnviarCorreoComponent {
  correo: string = '';
  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' = 'exito';
  loading: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService) { }

  enviarCodigo() {
    if (!this.correo) return;

    this.loading = true;
    this.mensajeAlerta = '';

    this.authService.enviarCodigoActivacion(this.correo).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.tipoAlerta = 'exito';
        this.mensajeAlerta = '¡Código enviado correctamente a tu correo!';
        setTimeout(() => {
          window.location.href = '/recuperacion/verificar-codigo';
        }, 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.tipoAlerta = 'error';
        this.mensajeAlerta = err.error?.mensaje || 'Error al enviar el código.';
      },
    });
  }

}
