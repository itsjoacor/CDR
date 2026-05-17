// productos.model.ts
export class Producto {
  constructor(
    public codigo_producto: string,
    public descripcion_producto: string,
    public sector_productivo: string,
    public planta: string = 'catamarca',
    public lleva_flete: boolean = false,
    public m3: number = 0,
    public created_at?: Date,
    public updated_at?: Date
  ) { }

  getCodigoProducto(): string { return this.codigo_producto; }
  getDescripcionProducto(): string { return this.descripcion_producto; }
  getSectorProductivo(): string { return this.sector_productivo; }
  getPlanta(): string { return this.planta; }
  getLlevaFlete(): boolean { return this.lleva_flete; }
  getM3(): number { return this.m3; }
}
