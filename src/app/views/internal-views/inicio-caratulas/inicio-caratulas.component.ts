import { Component } from '@angular/core';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio-caratulas',
  imports: [HomeBarComponent, RouterModule],
  templateUrl: './inicio-caratulas.component.html',
  styleUrl: './inicio-caratulas.component.css'
})
export class InicioCaratulasComponent {

constructor(private router: Router) {}

}
