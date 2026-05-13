import { Insumo } from './insumo.model';

export class InsumoBody {
  grupo: string;
  codigo: string;
  detalle: string;
  costo: number;
  planta?: string;

  public aModelo(): Insumo {
    return new Insumo(
      this.grupo,
      this.codigo,
      this.detalle,
      this.costo,
      this.planta ?? 'catamarca',
    );
  }
}
