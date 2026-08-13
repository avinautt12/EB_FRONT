import { ProductoDetalle } from '../../../../components/producto-catalogo-modal/models/producto-catalogo.model';

export interface MsiOption {
  id: number;
  plazo_meses: number;
  porcentaje: number;
}

export interface CampaniaItem {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  msi_id: number;
  activa: number;
  plazo_meses: number;
  porcentaje: number;
  productos: number[] | ProductoDetalle[]; // IDs desde la API o lista de objetos en la UI
}

export interface CrearCampaniaPayload {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  msi_id: number;
  activa: number;
  productos: number[]; // IDs de producto_detalle enviado al backend
}

export interface FiltrosCampania {
  query: string;
  msi_id: number | null;
  activa: number | null;
  fecha_inicio: string;
  fecha_fin: string;
}