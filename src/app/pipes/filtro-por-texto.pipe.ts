import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroPorTexto'
})
export class FiltroPorTextoPipe implements PipeTransform {
  transform(lista: string[], texto: string): string[] {
    if (!texto) return lista;
    const textoNormalizado = texto.toLowerCase();
    return lista.filter(item => item.toLowerCase().includes(textoNormalizado));
  }
}
