import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export type PlantaConfig = 'catamarca' | 'varela';

export class TablaConfigBodyDto {
  @IsString()
  nombre: string;

  @IsNumber()
  valor: number;

  @IsString()
  @IsIn(['catamarca', 'varela'])
  planta: PlantaConfig;
}

export class ValorUpdateDto {
  @IsNumber()
  valor: number;
}
