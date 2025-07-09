import { AfterViewInit, Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
  selector: '[monedaFormatoInput]',
  standalone: true,
  providers: [NgModel],
})
export class MonedaFormatoInputDirective implements AfterViewInit {
  private el: HTMLInputElement;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private ngModel: NgModel
  ) {
    this.el = this.elementRef.nativeElement;
  }

  ngAfterViewInit() {
    // Formatear valor inicial si ya viene cargado
    const value = parseInt(this.el.value.replace(/[^0-9]/g, ''), 10) || 0;
    this.el.value = this.formatNumber(value);
  }

  // Al escribir
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;

    // Eliminar todo lo que no sea número
    const rawValue = input.value.replace(/[^0-9]/g, '');
    const numericValue = parseInt(rawValue, 10) || 0;

    // Actualizar visualmente
    input.value = this.formatNumber(numericValue);

    // Actualizar el modelo de Angular
    this.ngModel.control?.setValue(numericValue);
  }

  // Al pegar contenido
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') ?? '';
    const sanitized = pastedData.replace(/[^0-9]/g, '');
    const value = parseInt(sanitized, 10) || 0;
    this.el.value = this.formatNumber(value);
    this.ngModel.control?.setValue(value);
  }

  // Al presionar teclas (para evitar letras y símbolos)
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const allowedChars = /[0-9]/;
    if (!allowedChars.test(event.key)) {
      event.preventDefault();
    }
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
