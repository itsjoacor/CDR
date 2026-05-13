import { ResultadosCdr } from './resultado-cdr.interface';

export class ResultadosCdrModel {
  static fromSupabase(data: any): ResultadosCdr {
    return {
      codigo_producto: data.codigo_producto,
      sector_productivo: data.sector_productivo,
      descripcion_producto: data.descripcion_producto,
      base_cdr: data.base_cdr,
      base_cdr_final: data.base_cdr_final ?? null,
      planta: data.planta ?? 'catamarca',
      monto_flete: data.monto_flete ?? 0,
      valor_cdr_final: data.valor_cdr_final ?? data.base_cdr_final ?? data.base_cdr ?? null,
    };
  }

  static toSupabase(data: ResultadosCdr): any {
    // base_cdr_final lo gestiona el trigger en DB — no lo escribimos desde código.
    return {
      codigo_producto: data.codigo_producto,
      sector_productivo: data.sector_productivo,
      descripcion_producto: data.descripcion_producto,
      base_cdr: data.base_cdr,
    };
  }
}
