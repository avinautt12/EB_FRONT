import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  // Emitir solo cuando hay una actualización real
  private actualizarSubject = new BehaviorSubject<number>(0);
  
  // Observable sin filtro
  public actualizar$ = this.actualizarSubject.asObservable().pipe(
    tap(count => console.log(`🔔 Señal de actualización #${count} emitida`))
  );

  ejecutarActualizacionCompleta() {
    console.log('🚀 SharedDataService: Iniciando actualización');
    
    // Incrementar el contador para forzar una nueva emisión
    const nuevoValor = this.actualizarSubject.value + 1;
    this.actualizarSubject.next(nuevoValor);
    
    console.log('⚡ SharedDataService: Señal de actualización emitida');
  }

  // Método alternativo: usar un subject diferente para reset
  private resetSubject = new BehaviorSubject<boolean>(false);
  public reset$ = this.resetSubject.asObservable();

  resetActualizacion() {
    this.resetSubject.next(true);
  }
}