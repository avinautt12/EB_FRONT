import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-caratulas',
  standalone: true,
  imports: [RouterModule, CommonModule, HomeBarComponent],
  templateUrl: './caratulas.component.html',
  styleUrls: ['./caratulas.component.css']
})
export class CaratulasComponent {
  buscarClave: string = '';

  buscarCaratulas() {
    // Lógica de búsqueda
    console.log('Buscar carátulas por clave:', this.buscarClave);
  }
}