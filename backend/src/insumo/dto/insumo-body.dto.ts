import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  grupo: string;

  @IsString()
  @IsNotEmpty()
  detalle: string;

  @IsNumber()
  @IsNotEmpty()
  costo: number;
}

export class UpdateInsumoDto {
  @IsString()
  grupo?: string;

  @IsString()
  detalle?: string;

  @IsNumber()
  costo?: number;
}