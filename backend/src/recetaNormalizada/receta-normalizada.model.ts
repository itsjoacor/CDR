export interface RecetaNormalizada {
  codigo_producto: string;
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
  costo_ingrediente?: number;
  costo_total?: number;
  valor_cdr?: number;
  ultima_actualizacion?: string;
}
