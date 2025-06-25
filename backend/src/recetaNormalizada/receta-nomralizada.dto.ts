import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateRecetaNormalizadaDto {
  @IsString()
  @IsNotEmpty()
  codigo_producto: string;

  @IsString()
  @IsNotEmpty()
  codigo_ingrediente: string;

  @IsNumber()
  cantidad_ingrediente: number;
}
