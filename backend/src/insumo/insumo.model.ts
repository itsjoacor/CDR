export class Insumo {
  constructor(
    public grupo: string,
    public codigo: string,
    public detalle: string,
    public costo: number,
    public id?: string,
    public created_at?: Date,
    public updated_at?: Date
  ) { }

  // Getters for all properties
  getGrupo(): string { return this.grupo; }
  getCodigo(): string { return this.codigo; }
  getDetalle(): string { return this.detalle; }
  getCosto(): number { return this.costo; }
}