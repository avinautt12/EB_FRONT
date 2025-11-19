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
  @Input() tipo!: 'clave' | 'evac' | 'cliente' | 'nivel' | 'cumplimiento';
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

  // NUEVO MÉTODO: Manejar cambios en la búsqueda
  onSearchChange() {
    // Este método se ejecuta cuando el usuario escribe en el buscador
    // Puedes agregar lógica adicional aquí si es necesario
    console.log('Búsqueda cambiada:', this.searchTerm);
  }

  // NUEVO MÉTODO: Alternar opción individual
  toggleOption(option: { value: string; selected: boolean }) {
    option.selected = !option.selected;
    // No emitimos automáticamente aquí, solo cuando se presiona "Aplicar"
  }

  // MÉTODO ACTUALIZADO: Aplicar filtro
  aplicar() {
    const seleccionados = this.opciones
      .filter(op => op.selected)
      .map(op => op.value);
    this.aplicarFiltro.emit(seleccionados);
  }

  // MÉTODO ACTUALIZADO: Limpiar filtro
  limpiar() {
    this.opciones.forEach(op => op.selected = false);
    this.searchTerm = ''; // Limpiar también el término de búsqueda
    this.limpiarFiltro.emit();
  }
}