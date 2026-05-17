// sectores-productivos-body.dto.ts
import { IsInt, Min, Max, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class SectorProductivoBody {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  @IsIn(['catamarca', 'varela'])
  planta?: 'catamarca' | 'varela';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  porcentaje_mantencion?: number;
}

export class UpdatePorcentajeMantencionV2Dto {
  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  porcentajeMantencion!: number;
}
