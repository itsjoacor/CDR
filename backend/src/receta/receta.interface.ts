export interface Ingrediente {
  codigo_ingrediente: string;
  descripcion_ingrediente: string;
  cantidad_ingrediente: number;
  costo_ingrediente?: number;
}

export interface RecetaAgrupada {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  ingredientes: Ingrediente[];
  costo_mano_obra?: number;
  costo_matriz_energetica?: number;
  costo_total?: number;
  valor_cdr?: number;
}