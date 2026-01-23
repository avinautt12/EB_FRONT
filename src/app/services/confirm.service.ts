import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  isOpen = false;
  mensaje = '';
  
  private _resolve: ((value: boolean) => void) | null = null;

  constructor() { }

  confirmar(mensaje: string): Promise<boolean> {
    this.mensaje = mensaje;
    this.isOpen = true;
    
    return new Promise<boolean>((resolve) => {
      this._resolve = resolve;
    });
  }

  cerrar(respuesta: boolean) {
    this.isOpen = false;
    if (this._resolve) {
      this._resolve(respuesta);
      this._resolve = null; 
    }
  }
}