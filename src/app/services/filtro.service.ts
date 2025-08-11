import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiltroService {
  private filtroAbiertoSource = new BehaviorSubject<string | null>(null);
  filtroAbierto$ = this.filtroAbiertoSource.asObservable();

  abrirFiltro(id: string) {
    this.filtroAbiertoSource.next(id);
  }

  cerrarFiltros() {
    this.filtroAbiertoSource.next(null);
  }

  cerrarFiltroActual() {
    this.filtroAbiertoSource.next(null);
  }
}