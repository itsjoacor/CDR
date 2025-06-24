import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class MatrizManoBodyDto {
  @IsNotEmpty()
  @IsString()
  sector_productivo: string;

  @IsNotEmpty()
  @IsString()
  codigo_mano_obra: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  consumo_kw_std: number;

  @IsNotEmpty()
  @IsNumber()
  std_produccion: number;

  @IsNotEmpty()
  @IsNumber()
  horas_hombre_std: number;

  @IsOptional()
  @IsNumber()
  valor_hora_hombre?: number = 3000;

  @IsNotEmpty()
  @IsNumber()
  horas_por_turno: number;

  @IsOptional()
  @IsString()
  producto_calculado_std?: string;
}
