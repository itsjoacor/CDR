// sectores-productivos-body.dto.ts
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';

export class SectorProductivoBody {
  nombre: string;

  public aModelo(): SectorProductivo {
    return new SectorProductivo(this.nombre);
  }
}