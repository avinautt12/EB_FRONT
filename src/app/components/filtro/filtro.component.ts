import { Component, EventEmitter, Input, Output, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltroService } from '../../services/filtro.service';
import { Subscription } from 'rxjs';

interface FiltroOption {
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-filtro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro.component.html',
  styleUrls: ['./filtro.component.css']
})

export class FiltroComponent implements OnDestroy {
  @Input() filtroId!: string;

  @Input() title: string = 'Filtrar';
  @Input() options: FiltroOption[] = [];
  @Input() searchPlaceholder: string = 'Buscar...';
  @Input() showDropdown: boolean = false;
  @Output() showDropdownChange = new EventEmitter<boolean>();

  @Output() apply = new EventEmitter<string[]>();
  @Output() clear = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<void>();

  searchTerm: string = '';
  filteredOptions: FiltroOption[] = [];
  private allOptions: FiltroOption[] = [];
  private hasApplied: boolean = false;

  private subscription: Subscription;

  constructor(private filtroService: FiltroService) {
    this.subscription = this.filtroService.filtroAbierto$.subscribe(id => {
      if (id === this.filtroId) {
        this.showDropdown = true;
      } else {
        this.showDropdown = false;
      }
    });
  }

  ngOnInit() {
    this.allOptions = [...this.options];
    this.updateFilteredOptions();
  }

  ngOnChanges() {
    this.allOptions = [...this.options];
    this.updateFilteredOptions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get selectedLabel(): string {
    const selected = this.allOptions.filter(o => o.selected);
    if (selected.length === 1) {
      return selected[0].value;
    }
    return selected.length > 1 ? `${selected.length} seleccionados` : this.title;
  }

  get hasSelectedOptions(): boolean {
    return this.allOptions?.filter(o => o.selected).length > 0;
  }

  filterOptions() {
    this.updateFilteredOptions();
  }

  private updateFilteredOptions() {
    if (!this.searchTerm) {
      // Mostrar todas las opciones hasta que se aplique el filtro
      this.filteredOptions = this.hasApplied
        ? [...this.allOptions.filter(o => o.selected)]
        : [...this.allOptions];
    } else {
      // Cuando hay búsqueda, mostrar TODAS las opciones que coincidan
      const term = this.searchTerm.toLowerCase();
      this.filteredOptions = this.allOptions.filter(option =>
        option.value.toLowerCase().includes(term)
      );
    }
  }

  applyFilter() {
    this.hasApplied = true; // Marcar que se ha aplicado el filtro
    const selected = this.allOptions.filter(o => o.selected).map(o => o.value);
    this.apply.emit(selected);
    this.closeDropdown();
  }

  private closeDropdown() {
    this.showDropdown = false;
    this.showDropdownChange.emit(false);
    this.searchTerm = '';
    this.updateFilteredOptions();
  }

  onSelectionChange() {
    // No actualizamos filteredOptions aquí para permitir múltiples selecciones
  }

  clearFilter() {
    this.hasApplied = false; // Resetear al limpiar
    this.allOptions.forEach(o => o.selected = false);
    this.clear.emit();
    this.updateFilteredOptions();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();

    if (this.showDropdown) {
      this.filtroService.cerrarFiltros();
    } else {
      this.filtroService.abrirFiltro(this.filtroId);
      this.showDropdown = true;
      this.showDropdownChange.emit(true);
      this.searchTerm = '';
      this.updateFilteredOptions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('.sort-dropdown')) {
      this.filtroService.cerrarFiltros();
    }
  }
}
