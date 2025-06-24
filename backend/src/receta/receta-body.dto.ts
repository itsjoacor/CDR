import { Receta } from './receta.model';

export class RecetaBody {
  sector_productivo: string;
  codigo_ingrediente: string;
  descripcion_ingrediente: string;
  cantidad_ingrediente: number;
  codigo_producto: string;
  descripcion_producto: string;

  public aModelo(): Receta {
    return new Receta(
      this.sector_productivo,
      this.codigo_ingrediente,
      this.descripcion_ingrediente,
      this.cantidad_ingrediente,
      this.codigo_producto,
      this.descripcion_producto
    );
  }
}