import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-confirmacion-flujo', // <--- OJO AQUÍ: Este es tu nuevo selector
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacion-flujo.component.html',
  styleUrls: ['./modal-confirmacion-flujo.component.css']
})
export class ModalConfirmacionFlujoComponent { // <--- Nombre de la clase actualizado
  @Input() titulo: string = 'Confirmar acción';
  @Input() mensaje: string = '¿Estás seguro de continuar?';
  @Input() textoConfirmar: string = 'Aceptar';
  @Input() textoCancelar: string = 'Cancelar';
  
  @Input() visible: boolean = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar() {
    this.confirmar.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }
}