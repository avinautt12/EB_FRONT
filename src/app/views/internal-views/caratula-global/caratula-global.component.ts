import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaratulasService } from '../../../services/caratulas.service';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-caratula-global',
  imports: [HomeBarComponent, CommonModule, RouterModule],
  templateUrl: './caratula-global.component.html',
  styleUrl: './caratula-global.component.css'
})
export class CaratulaGlobalComponent {

  constructor(private caratulasService: CaratulasService, private router: Router) {}

}
