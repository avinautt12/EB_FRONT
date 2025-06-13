import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { AlertaComponent } from '../../../components/alerta/alerta.component';

@Component({
  selector: 'app-verificar-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarComponent, AlertaComponent],
  templateUrl: './verificar-codigo.component.html',
  styleUrl: './verificar-codigo.component.css'
})
export class VerificarCodigoComponent {
  codigo: string = '';
  mensajeAlerta: string = '';
  tipoAlerta: 'exito' | 'error' = 'exito';
  loading: boolean = false;

  constructor(private authService: AuthService) { }

  verificar() {
    if (!this.codigo) return;

    this.loading = true;
    this.mensajeAlerta = '';

    this.authService.verificarCodigo(this.codigo).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend:', res);
        if (res.token) {
          console.log('Token recibido correctamente:', res.token);
        } else {
          console.warn('No se recibió ningún token en la respuesta.');
        }
        this.loading = false;
        this.tipoAlerta = 'exito';
        this.mensajeAlerta = '¡Código verificado correctamente!';
        setTimeout(() => {
          window.location.href = '/recuperacion/restablecer-contrasena?token=' + res.token;
        }, 2000);
      },

      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.tipoAlerta = 'error';
        this.mensajeAlerta = err.error?.mensaje || 'Error al verificar el código.';
      }
    });
  }
}
