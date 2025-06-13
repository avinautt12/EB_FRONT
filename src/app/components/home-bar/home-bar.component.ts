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
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');

    this.router.navigate(['/login']);
  }
}
