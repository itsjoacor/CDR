export interface RecetaNormalizada {
  codigo_producto: string;
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
  costo_ingrediente?: number;
  costo_mano_obra?: number;
  costo_matriz_energetica?: number;
  costo_total?: number;
  valor_cdr?: number;
  ultima_actualizacion?: string;
}
