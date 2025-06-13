import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private alertaSubject = new Subject<{ mensaje: string, tipo: 'exito' | 'error' }>();
  alerta$ = this.alertaSubject.asObservable();

  mostrarExito(mensaje: string) {
    this.alertaSubject.next({ mensaje, tipo: 'exito' });
  }

  mostrarError(mensaje: string) {
    this.alertaSubject.next({ mensaje, tipo: 'error' });
  }
}
