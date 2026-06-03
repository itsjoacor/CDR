import { Insumo } from './insumo.model';

export class InsumoBody {
  grupo: string;
  codigo: string;
  detalle: string;
  costo: number;
  planta?: string;
  m3?: number;
  lleva_flete?: boolean;

  public aModelo(): Insumo {
    const insumo = new Insumo(
      this.grupo,
      this.codigo,
      this.detalle,
      this.costo,
      this.planta ?? 'catamarca',
    );
    // El modelo Insumo no declara m3 / lleva_flete en su constructor,
    // pero el repository los lee con (insumo as any).m3 / lleva_flete.
    (insumo as any).m3          = this.m3          ?? 0;
    (insumo as any).lleva_flete = this.lleva_flete ?? false;
    return insumo;
  }
}
