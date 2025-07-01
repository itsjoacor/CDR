// sectores-productivos.model.ts
export class SectorProductivo {
  constructor(
    public nombre: string,
    public created_at?: Date,
    public updated_at?: Date
  ) { }

  getNombre(): string { return this.nombre; }
}