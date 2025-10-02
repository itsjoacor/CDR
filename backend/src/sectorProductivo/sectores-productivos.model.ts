// sectores-productivos.model.ts
export class SectorProductivo {
  constructor(
    public nombre: string,
    public created_at?: Date,
    public updated_at?: Date
    
  ) { }

  getNombre(): string { return this.nombre; }
}

export interface SectorProductivoMantencionV2 {
  nombre: string;
  porcentajeMantencion: number | null; // mapea desde porcentaje_mantencion
}