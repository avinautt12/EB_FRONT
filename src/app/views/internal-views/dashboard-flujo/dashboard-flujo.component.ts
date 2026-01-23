import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component"; 

@Component({
  selector: 'app-dashboard-flujo',
  standalone: true, 
  imports: [RouterModule, CommonModule, HomeBarComponent],
  templateUrl: './dashboard-flujo.component.html',
  styleUrl: './dashboard-flujo.component.css'
})
export class DashboardFlujoComponent {
  // Aquí podríamos agregar lógica futura, como traer resumenes de saldos
}