import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ResultadosCdrBodyDto {
  @IsString()
  @IsNotEmpty()
  codigo_producto: string;

  @IsString()
  @IsNotEmpty()
  sector_productivo: string;

  @IsString()
  @IsNotEmpty()
  descripcion_producto: string;

  @IsNumber()
  base_cdr: number;
}
