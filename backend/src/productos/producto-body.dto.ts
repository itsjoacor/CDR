// producto-body.dto.ts
import { Producto } from '../productos/producto.model';

export class ProductoBody {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;

  public aModelo(): Producto {
    return new Producto(
      this.codigo_producto,
      this.descripcion_producto,
      this.sector_productivo
    );
  }
}