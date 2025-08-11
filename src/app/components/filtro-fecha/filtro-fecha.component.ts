import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FiltroService } from '../../services/filtro.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filtro-fecha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-fecha.component.html',
  styleUrls: ['./filtro-fecha.component.css']
})
export class FiltroFechaComponent implements OnDestroy {
  @Input() filtroId!: string;
  @Input() showDropdown = false;
  @Output() showDropdownChange = new EventEmitter<boolean>();
  @Output() apply = new EventEmitter<any>();
  @Output() clear = new EventEmitter<void>();

  ordenSeleccionado: 'asc' | 'desc' | null = null;
  fechaDesde: string = '';
  fechaHasta: string = '';

  private subscription: Subscription;

  constructor(private filtroService: FiltroService) {
    this.subscription = this.filtroService.filtroAbierto$.subscribe(id => {
      if (id !== this.filtroId) {
        this.showDropdown = false;
        this.showDropdownChange.emit(false);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();

    if (this.showDropdown) {
      this.filtroService.cerrarFiltros();
    } else {
      this.filtroService.abrirFiltro(this.filtroId);
      this.showDropdown = true;
      this.showDropdownChange.emit(true);
    }
  }

  aplicarFiltro() {
    const filtro = {
      orden: this.ordenSeleccionado,
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta
    };
    this.apply.emit(filtro);
    this.showDropdown = false;
    this.showDropdownChange.emit(false);
  }

  limpiarFiltro() {
    this.ordenSeleccionado = null;
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.clear.emit();
    this.showDropdown = false;
    this.showDropdownChange.emit(false);
  }

  cerrarDropdown() {
    this.showDropdown = false;
    this.showDropdownChange.emit(false);
  }

  getSelectedLabel(): string {
    const labels = [];

    if (this.ordenSeleccionado) {
      labels.push(this.ordenSeleccionado === 'asc' ? 'Asc' : 'Desc');
    }

    if (this.fechaDesde) {
      labels.push(`Desde: ${this.fechaDesde}`);
    }

    if (this.fechaHasta) {
      labels.push(`Hasta: ${this.fechaHasta}`);
    }

    return labels.join(' | ');
  }
}