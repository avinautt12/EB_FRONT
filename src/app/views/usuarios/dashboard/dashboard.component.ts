import { Component } from '@angular/core';
import { TopBarUsuariosComponent } from "../../../components/top-bar-usuarios/top-bar-usuarios.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Route } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [TopBarUsuariosComponent, CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}
