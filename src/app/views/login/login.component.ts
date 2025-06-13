import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, TopBarComponent, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';
  verPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  iniciarSesion() {
    this.loading = true;
    this.error = '';

    const credentials = {
      usuario: this.email,
      contrasena: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        console.log('Token guardado en localStorage:', response.token);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Error en el servidor';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}