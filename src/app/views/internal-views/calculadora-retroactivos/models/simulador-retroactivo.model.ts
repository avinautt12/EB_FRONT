export interface SimuladorRetroactivo {
  id: number;
  descripcion: string;
  cantidadIngresada: number;
  cantidadAMostrar: string;
  compraMinima: number;
  totalCompraConDescuento: number;
  porcentajeRetroactivo: number;
  totalMargenPorCategoria: number;
  totalMargenRetroactivo: number;
  // totalBeneficios: number
  totalMargenCalculado: number;
  //Fletes
  promedioBicicleta: number;
}