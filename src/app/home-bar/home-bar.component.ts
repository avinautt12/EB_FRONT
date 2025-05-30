import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-bar.component.html',
  styleUrl: './home-bar.component.css'
})
export class HomeBarComponent {

}
