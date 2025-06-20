export class Insumo {
  constructor(
    public codigo: string,
    public grupo: string,
    public detalle: string,
    public costo: number
  ) { }

  // Getters for all properties
  getCodigo(): string { return this.codigo; }
  getGrupo(): string { return this.grupo; }
  getDetalle(): string { return this.detalle; }
  getCosto(): number { return this.costo; }

  // Business logic methods
  calcularIva(porcentajeIva: number = 0.21): number {
    return this.costo * porcentajeIva;
  }

  getDescripcionCompleta(): string {
    return `[${this.grupo}] ${this.detalle}`;
  }

  esDeAltoCosto(umbral: number = 1000): boolean {
    return this.costo > umbral;
  }

  // Conversion methods
  toJSON(): Record<string, any> {
    return {
      codigo: this.codigo,
      grupo: this.grupo,
      detalle: this.detalle,
      costo: this.costo
    };
  }

  static fromJSON(data: Record<string, any>): Insumo {
    return new Insumo(
      data.codigo,
      data.grupo,
      data.detalle,
      parseFloat(data.costo)
    );
  }
}