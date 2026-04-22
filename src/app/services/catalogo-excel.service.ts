import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProductoExcel {
  sku: string;
  nombre: string;
  color?: string;
  talla?: string;
  origen?: string;
  cargado_en?: string;
}

export interface ListadoProductos {
  total: number;
  productos: ProductoExcel[];
}

export interface RespuestaUpload {
  success: boolean;
  message: string;
  productos_cargados?: number;
  duplicados?: number;
  errores?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoExcelService {
  private apiUrl = `${environment.apiUrl}/admin/productos-excel`;
  private productosSubject = new BehaviorSubject<ProductoExcel[]>([]);
  public productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Carga un archivo Excel con productos
   */
  subirArchivo(file: File): Observable<RespuestaUpload> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<RespuestaUpload>(`${this.apiUrl}/cargar`, formData).pipe(
      tap(respuesta => {
        if (respuesta.success) {
          this.actualizarListado();
        }
      }),
      catchError(error => {
        console.error('Error al cargar archivo:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la lista de productos cargados
   */
  obtenerProductos(busqueda?: string, limit: number = 50, offset: number = 0): Observable<ListadoProductos> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    if (busqueda) {
      params = params.set('search', busqueda);
    }
    
    return this.http.get<ListadoProductos>(this.apiUrl, { params });
  }

  /**
   * Elimina un producto específico
   */
  eliminarProducto(sku: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${sku}`).pipe(
      tap(() => this.actualizarListado())
    );
  }

  /**
   * Vacía el catálogo completo
   */
  vaciarCatalogo(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/vaciar`,
      {},
      { headers: { 'X-Confirm-Action': 'vaciar_catalogo' } }
    ).pipe(
      tap(() => this.actualizarListado())
    );
  }

  /**
   * Actualiza el listado local
   */
  private actualizarListado(): void {
    this.obtenerProductos().subscribe(
      (data) => this.productosSubject.next(data.productos)
    );
  }
}
