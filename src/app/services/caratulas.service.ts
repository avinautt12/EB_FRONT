import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Define the SugerenciaCliente interface
export interface SugerenciaCliente {
  clave: string;
  razon_social: string;
  nombre_cliente?: string;
  evac?: string;
  nivel_firmado?: string;
}

// Interface para la respuesta de búsqueda
export interface CaratulaResponse {
  success?: boolean;
  data?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaratulasService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener sugerencias para el autocompletado
   * @param termino - Término de búsqueda
   * @returns Observable con las sugerencias
   */
  obtenerSugerencias(termino: string): Observable<SugerenciaCliente[]> {
    if (!termino || termino.length < 2) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    // Usar el endpoint /nombres_caratula para obtener todas las sugerencias
    return this.http.get<any>(`${this.apiUrl}/nombres_caratula`)
      .pipe(
        map(response => {
          console.log('Respuesta sugerencias:', response);

          let datos: any[] = [];

          // La respuesta debe ser un array directo según tu Flask endpoint
          if (Array.isArray(response)) {
            datos = response;
          }

          // Filtrar por el término de búsqueda
          const terminoLower = termino.toLowerCase().trim();
          const resultadosFiltrados = datos.filter(item =>
            item.clave?.toLowerCase().includes(terminoLower) ||
            item.nombre_cliente?.toLowerCase().includes(terminoLower)
          );

          // Mapear a la estructura esperada
          return resultadosFiltrados.slice(0, 10).map(item => ({
            clave: item.clave || '',
            razon_social: item.nombre_cliente || '',
            nombre_cliente: item.nombre_cliente || '',
            ga400: item.clave || '',
            nivel_firmado: item.nivel || ''
          }));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Buscar datos completos de carátulas
   * @param clave - Clave del cliente (opcional)
   * @param nombreCliente - Nombre del cliente (opcional)
   * @returns Observable con los datos del cliente
   */
  buscarCaratulas(clave?: string, nombreCliente?: string): Observable<any> {
    if (!clave && !nombreCliente) {
      return throwError(() => new Error('Se requiere al menos clave o nombre del cliente'));
    }

    let params = new HttpParams();

    if (clave) {
      params = params.set('clave', clave.trim().toUpperCase());
    }

    if (nombreCliente) {
      params = params.set('nombre_cliente', nombreCliente.trim());
    }

    console.log('Parámetros de búsqueda:', { clave, nombreCliente });
    console.log('URL de búsqueda:', `${this.apiUrl}/caratula_evac`);

    return this.http.get<any>(`${this.apiUrl}/caratula_evac`, { params })
      .pipe(
        map(response => {
          console.log('Respuesta búsqueda carátulas:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Buscar cliente por clave específica
   * @param clave - Clave del cliente
   * @returns Observable con los datos del cliente
   */
  buscarPorClave(clave: string): Observable<any> {
    if (!clave) {
      return throwError(() => new Error('Clave es requerida'));
    }

    return this.buscarCaratulas(clave.trim().toUpperCase());
  }

  /**
   * Buscar cliente por nombre
   * @param nombre - Nombre del cliente
   * @returns Observable con los datos del cliente
   */
  buscarPorNombre(nombre: string): Observable<any> {
    if (!nombre) {
      return throwError(() => new Error('Nombre es requerido'));
    }

    return this.buscarCaratulas(undefined, nombre.trim());
  }

  /**
   * Manejo centralizado de errores
   * @param error - Error HTTP
   * @returns Observable con error formateado
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
          break;
        case 404:
          errorMessage = 'No se encontraron datos para este cliente.';
          break;
        case 400:
          errorMessage = 'Parámetros de búsqueda inválidos.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente nuevamente.';
          break;
        default:
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Error ${error.status}: ${error.statusText}`;
          }
      }
    }

    console.error('Error en CaratulasService:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Validar formato de clave
   * @param clave - Clave a validar
   * @returns true si el formato es válido
   */
  validarFormatoClave(clave: string): boolean {
    if (!clave) return false;

    // Formato: 2-5 letras seguidas de números opcionales
    const formatoClave = /^[A-Z]{2,5}\d*$/i;
    return formatoClave.test(clave.trim());
  }

  /**
   * Limpiar término de búsqueda
   * @param termino - Término a limpiar
   * @returns Término limpio
   */
  limpiarTerminoBusqueda(termino: string): string {
    if (!termino) return '';

    return termino
      .trim()
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
      .substring(0, 100); // Limitar longitud
  }

  getClientesEvacA(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes_a`);
  }

  getClientesEvacB(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes_b`);
  }

  actualizarCaratulaEvacA(datos: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/caratula_evac_a`, datos)
      .pipe(
        catchError(this.handleError)
      );
  }

  actualizarCaratulaEvacB(datos: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/caratula_evac_b`, datos)
      .pipe(
        catchError(this.handleError)
      );
  }

  getDatosEvacA(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/datos_evac_a`);
  }

  getDatosEvacB(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/datos_evac_b`);
  }

  getDatosPrevio(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/datos_previo`);
  }
}