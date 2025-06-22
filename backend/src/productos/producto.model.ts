// productos.model.ts
export class Producto {
  constructor(
    public codigo_producto: string,
    public descripcion_producto: string,
    public sector_productivo: string,
    public created_at?: Date,
    public updated_at?: Date
  ) { }

  getCodigoProducto(): string { return this.codigo_producto; }
  getDescripcionProducto(): string { return this.descripcion_producto; }
  getSectorProductivo(): string { return this.sector_productivo; }
}