export interface MatrizMano {
  sector_productivo: string;
  codigo_mano_obra: string;
  descripcion: string;
  consumo_kw_std: number;
  std_produccion: number;
  horas_hombre_std: number;
  valor_hora_hombre: number;
  horas_por_turno: number;
  producto_calculado_std?: string | null;
  costo_mano_obra?: number; // generado
  cantidad_personal_estimado?: number; // generado
}
