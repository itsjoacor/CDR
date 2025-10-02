// sectores-productivos-body.dto.ts
import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';

export class SectorProductivoBody {
  nombre: string;

  public aModelo(): SectorProductivo {
    return new SectorProductivo(this.nombre);
  }
}

export class UpdatePorcentajeMantencionV2Dto {
  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  porcentajeMantencion!: number;
}