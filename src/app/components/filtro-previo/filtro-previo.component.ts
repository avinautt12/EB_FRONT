import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filtro-previo',
  templateUrl: './filtro-previo.component.html',
  styleUrls: ['./filtro-previo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FiltroPrevioComponent {
  @Input() tipo!: 'clave' | 'evac' | 'cliente' | 'nivel';
  @Input() placeholder: string = '';
  @Input() opciones: { value: string; selected: boolean }[] = [];
  @Input() estaActivo: boolean = false;

  @Output() aplicarFiltro = new EventEmitter<string[]>();
  @Output() limpiarFiltro = new EventEmitter<void>();
  @Output() filtroClicked = new EventEmitter<void>();

  searchTerm = '';

  // Usar estaActivo directamente como el estado del dropdown
  get showDropdown(): boolean {
    return this.estaActivo;
  }

  get filteredOptions() {
    return this.searchTerm 
      ? this.opciones.filter(op => 
          op.value.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : this.opciones;
  }

  get hasSelectedOptions() {
    return this.opciones.some(op => op.selected);
  }

  get selectedLabel() {
    const selected = this.opciones.filter(op => op.selected);
    return selected.length > 2 
      ? `${selected[0].value} +${selected.length - 1} más`
      : selected.map(op => op.value).join(', ');
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    // Siempre notificar al padre para manejar el toggle
    this.filtroClicked.emit();
  }

  onSelectionChange() {}

  aplicar() {
    const seleccionados = this.opciones
      .filter(op => op.selected)
      .map(op => op.value);
    this.aplicarFiltro.emit(seleccionados);
  }

  limpiar() {
    this.opciones.forEach(op => op.selected = false);
    this.limpiarFiltro.emit();
    this.searchTerm = '';
  }
}