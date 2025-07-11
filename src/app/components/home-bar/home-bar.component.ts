import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-bar.component.html',
  styleUrl: './home-bar.component.css'
})
export class HomeBarComponent {
  nombreUsuario: string = '';

  constructor(private router: Router) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.nombreUsuario = payload.nombre;
      } catch (e) {
        console.error('Error al decodificar el token', e);
      }
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
