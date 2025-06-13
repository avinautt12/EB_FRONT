import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerta.component.html',
  styleUrls: ['./alerta.component.css']
})
export class AlertaComponent implements OnInit {
  @Input() mensaje: string = '';
  @Input() tipo: 'exito' | 'error' = 'exito';
  visible = false;

  ngOnInit(): void {
    this.visible = true;
    setTimeout(() => this.visible = false, 4000); 
  }
}
