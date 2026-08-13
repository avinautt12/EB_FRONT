import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca, ProductoDetalle, CatalogoProductosResponse } from '../components/producto-catalogo-modal/models/producto-catalogo.model';
import { CampaniaItem, MsiOption } from '../views/internal-views/solicitud-retroactivo-campanias/models/solicitud-campania.model';
import { environment } from '../../environments/environment';

/**
 * Payload JSON para creación y actualización de campañas.
 */
export interface CampaniaPayload {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  msi_id: number;
  activa: number;
  productos: number[]; // IDs de producto_detalle (variantes/SKUs)
}

/**
 * Respuesta genérica del API Flask para operaciones de escritura.
 */
export interface ApiResponse<T = any> {
  respuesta: boolean;
  mensaje: string;
  datos?: T;
  id?: number;
}

/**
 * Representación del modelo base de Producto.
 */
export interface ProductoBase {
  id: number;
  nombre: string;
  modelo?: string;
  codigo?: string;
  marca_id?: number;
}

@Injectable({ providedIn: 'root' })
export class SolicitudRetroactivoCampaniasService {
  // Endpoint base configurado en la API Flask (Blueprint)
  private readonly apiUrl = `${environment.apiUrl}/api/solicitud-retroactivo-campanias`;

  constructor(private http: HttpClient) {}

  /* ========================================================================
     1. ENDPOINTS DE CAMPAÑAS (CRUD)
     ======================================================================== */

  /**
   * Obtiene el listado completo de campañas con sus productos asociados.
   * GET /api/solicitud-retroactivo-campanias
   */
  getCampanias(): Observable<CampaniaItem[]> {
    return this.http.get<CampaniaItem[]>(`${this.apiUrl}`);
  }

  /**
   * Obtiene la información detallada de una campaña por su ID.
   * GET /api/solicitud-retroactivo-campanias/:id
   */
  getCampaniaById(id: number): Observable<CampaniaItem> {
    return this.http.get<CampaniaItem>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva campaña y sus relaciones con productos detalle.
   * POST /api/solicitud-retroactivo-campanias
   */
  createCampania(payload: CampaniaPayload): Observable<ApiResponse<CampaniaItem>> {
    return this.http.post<ApiResponse<CampaniaItem>>(`${this.apiUrl}`, payload);
  }

  /**
   * Actualiza los datos de una campaña y reemplaza sus relaciones en la BD.
   * PUT /api/solicitud-retroactivo-campanias/:id
   */
  updateCampania(id: number, payload: CampaniaPayload): Observable<ApiResponse<CampaniaItem>> {
    return this.http.put<ApiResponse<CampaniaItem>>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Elimina una campaña y desvincula sus registros asociados.
   * DELETE /api/solicitud-retroactivo-campanias/:id
   */
  deleteCampania(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  /* ========================================================================
     2. ENDPOINTS DE CATÁLOGOS Y BÚSQUEDA
     ======================================================================== */

  /**
   * Obtiene el catálogo de opciones de Meses Sin Intereses disponibles.
   * GET /api/solicitud-retroactivo-campanias/msi
   */
  getMsi(): Observable<MsiOption[]> {
    return this.http.get<MsiOption[]>(`${this.apiUrl}/msi`);
  }

  /**
   * Obtiene las marcas registradas para filtrado.
   * GET /api/solicitud-retroactivo-campanias/marcas
   */
  getMarcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marcas`);
  }

  /**
   * Obtiene el listado base de productos.
   * GET /api/solicitud-retroactivo-campanias/productos
   */
  getProductos(): Observable<ProductoBase[]> {
    return this.http.get<ProductoBase[]>(`${this.apiUrl}/productos`);
  }

  /**
   * Obtiene los detalles/variantes de un producto específico por su ID.
   * GET /api/solicitud-retroactivo-campanias/productos/:id/detalles
   */
  getProductoDetalles(productoId: number): Observable<ProductoDetalle[]> {
    return this.http.get<ProductoDetalle[]>(`${this.apiUrl}/productos/${productoId}/detalles`);
  }

  /**
   * Consulta el catálogo general de productos/SKU con parámetros de búsqueda, marcas y paginación.
   * GET /api/solicitud-retroactivo-campanias/catalogo-productos
   */
  getCatalogoProductos(filtros: {
    query?: string;
    marca_id?: number;
    sku?: string;
    page?: number;
    limit?: number;
  }): Observable<CatalogoProductosResponse> {
    let params = new HttpParams();

    if (filtros.query) params = params.set('query', filtros.query);
    if (filtros.marca_id) params = params.set('marca_id', filtros.marca_id.toString());
    if (filtros.sku) params = params.set('sku', filtros.sku);
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());

    return this.http.get<CatalogoProductosResponse>(`${this.apiUrl}/catalogo-productos`, { params });
  }
}