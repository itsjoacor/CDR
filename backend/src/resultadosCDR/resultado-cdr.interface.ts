export interface ResultadosCdr {
  codigo_producto: string;
  sector_productivo: string;
  descripcion_producto: string;
  base_cdr: number;
  base_cdr_final?: number | null;
  planta?: string;
  monto_flete?: number | null;
  valor_cdr_final?: number | null;
}
