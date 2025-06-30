import { IsNotEmpty, IsString, IsNumber, IsIn } from 'class-validator';

export class CreateRecetaNormalizadaDto {
  @IsString()
  @IsNotEmpty()
  codigo_producto: string;

  @IsString()
  @IsNotEmpty()
  codigo_ingrediente: string;

  @IsNumber()
  cantidad_ingrediente: number;

  @IsIn(['producto', 'insumo', 'mano_obra', 'matriz_energia'])
  tipo_ingrediente?: string;
}