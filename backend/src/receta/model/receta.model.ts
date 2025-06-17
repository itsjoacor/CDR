export class Receta {
  constructor(
    public sector_productivo: string,
    public codigo_ingrediente: string,
    public descripcion_ingrediente: string,
    public cantidad_ingrediente: number,
    public codigo_producto: string,
    public descripcion_producto: string,
    public costo_ingrediente?: number,
    public costo_mano_obra?: number,
    public costo_matriz_energetica?: number,
    public costo_total?: number,
    public valor_cdr?: number,
    public id?: string,
    public created_at?: Date,
    public updated_at?: Date
  ) { }

  // Getters for all properties
  getSectorProductivo(): string { return this.sector_productivo; }
  getCodigoIngrediente(): string { return this.codigo_ingrediente; }
  getDescripcionIngrediente(): string { return this.descripcion_ingrediente; }
  getCantidadIngrediente(): number { return this.cantidad_ingrediente; }
  getCodigoProducto(): string { return this.codigo_producto; }
  getDescripcionProducto(): string { return this.descripcion_producto; }
  getCostoIngrediente(): number | undefined { return this.costo_ingrediente; }
  getCostoManoObra(): number | undefined { return this.costo_mano_obra; }
  getCostoMatrizEnergetica(): number | undefined { return this.costo_matriz_energetica; }
  getCostoTotal(): number | undefined { return this.costo_total; }
  getValorCdr(): number | undefined { return this.valor_cdr; }
}