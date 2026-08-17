import { ProductoDetalle } from '../../../../components/producto-catalogo-modal/models/producto-catalogo.model';

export interface MsiOption {
  id: number;
  plazo_meses: number;
  porcentaje: number;
}

// GUÍA: el % retroactivo ya no es fijo por plazo -- cada campaña liga los
// plazos que le aplican con SU PROPIO %, por eso una campaña trae un
// arreglo de estos en vez de un msi_id/porcentaje sueltos.
export interface CampaniaMsiItem {
  msi_id: number;
  plazo_meses: number;
  porcentaje: number;
}

export interface CampaniaItem {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: number;
  msi: CampaniaMsiItem[];
  productos: number[] | ProductoDetalle[]; // IDs desde la API o lista de objetos en la UI
}

export interface CrearCampaniaPayload {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: number;
  msi: { msi_id: number; porcentaje: number }[];
  productos: number[]; // IDs de producto_detalle enviado al backend
}

export interface FiltrosCampania {
  query: string;
  activa: number | null;
  fecha_inicio: string;
  fecha_fin: string;
}