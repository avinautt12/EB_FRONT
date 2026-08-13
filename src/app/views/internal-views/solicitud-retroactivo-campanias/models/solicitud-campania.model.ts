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
  plazo_meses: string;
  porcentaje: number;
  productos: ProductoDetalle[];
}

export interface FiltrosCampania {
  query: string;
  msi_id: number | null;
  activa: number | null;
  fecha_inicio: string;
  fecha_fin: string;
}