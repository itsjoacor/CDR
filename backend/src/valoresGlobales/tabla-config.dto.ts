import { IsNumber, IsString } from 'class-validator';

export class TablaConfigBodyDto {
  @IsString()
  nombre: string;

  @IsNumber()
  valor: number;
}

export class ValorUpdateDto {
  @IsNumber()
  valor: number;
}