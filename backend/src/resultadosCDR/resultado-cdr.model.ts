import { ResultadosCdr } from './resultado-cdr.interface';

export class ResultadosCdrModel {
  static fromSupabase(data: any): ResultadosCdr {
    return {
      codigo_producto: data.codigo_producto,
      sector_productivo: data.sector_productivo,
      descripcion_producto: data.descripcion_producto,
      base_cdr: data.base_cdr,
    };
  }

  static toSupabase(data: ResultadosCdr): any {
    return {
      codigo_producto: data.codigo_producto,
      sector_productivo: data.sector_productivo,
      descripcion_producto: data.descripcion_producto,
      base_cdr: data.base_cdr,
    };
  }
}
