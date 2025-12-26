import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type OrdenDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-filtro-orden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtro-orden.component.html',
  styleUrls: ['./filtro-orden.component.css']
})
export class FiltroOrdenComponent {
  // Ya no mostramos el label en el botón principal para ahorrar espacio
  @Input() label: string = 'Ordenar'; 
  
  @Input() currentDirection: OrdenDirection = null;
  @Output() ordenCambio = new EventEmitter<OrdenDirection>();

  showDropdown: boolean = false;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  seleccionarOrden(direction: OrdenDirection) {
    this.currentDirection = direction;
    this.ordenCambio.emit(this.currentDirection);
    this.showDropdown = false;
  }

  // Nueva función para limpiar
  limpiarOrden(event: Event) {
    event.stopPropagation();
    this.currentDirection = null;
    this.ordenCambio.emit(null); // Emitimos null para indicar "sin orden"
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('.sort-dropdown')) {
      this.showDropdown = false;
    }
  }
}