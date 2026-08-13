/**
 * Interfaz para las marcas devueltas en los filtros del modal.
 */
export interface Marca {
  id: number;
  nombre: string;
}

/**
 * Representa la variante concreta (SKU) seleccionable en la tabla del catálogo.
 */
export interface ProductoDetalle {
  id: number;
  id_producto: number;
  marca?: string;
  modelo?: string;
  codigo?: string;
  talla: string;
  color: string;
  sku: string;
}

/**
 * Respuesta paginada entregada por la API para el catálogo.
 */
export interface CatalogoProductosResponse {
  data: ProductoDetalle[];
  total: number;
  page: number;
  pageSize: number;
}