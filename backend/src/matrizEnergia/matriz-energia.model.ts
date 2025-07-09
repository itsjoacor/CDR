export interface MatrizEnergia {
  sector_productivo: string;
  codigo_mano_obra: string;
  codigo_energia: string;
  descripcion: string;
  consumo_kw_std: number;
  valor_kw: number;
  std_produccion?: number | null;
  total_pesos_std?: number;
  costo_energia_unidad?: number;
}