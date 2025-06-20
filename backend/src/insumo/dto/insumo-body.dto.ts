import { Insumo } from '../model/insumo.model';

export class InsumoBody {
  grupo: string;
  codigo: string;
  detalle: string;
  costo: number;

  public aModelo(): Insumo {
    return new Insumo(
      this.grupo,
      this.codigo,
      this.detalle,
      this.costo
    );
  }
}