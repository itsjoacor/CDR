import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class MatrizEnergiaBodyDto {
  @IsNotEmpty()
  @IsString()
  sector_productivo: string;

  @IsNotEmpty()
  @IsString()
  codigo_mano_obra: string;

  @IsNotEmpty()
  @IsString()
  codigo_energia: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  consumo_kw_std: number;

  @IsOptional()
  @IsNumber()
  valor_kw?: number;

  @IsOptional()
  @IsNumber()
  std_produccion?: number;
  
}
