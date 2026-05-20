import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateRecetaNormalizadaDto {
  @IsString()
  @IsNotEmpty()
  codigo_producto: string;

  @IsString()
  @IsNotEmpty()
  codigo_ingrediente: string;

  @IsNumber()
  cantidad_ingrediente: number;

  /**
   * Planta esperada desde el contexto del usuario (selector global del front).
   * Si está, el backend valida que el codigo_producto pertenezca a esa planta
   * antes de crear la receta. Si no matchea, rechaza con error claro.
   * Es opcional para retro-compat, pero el frontend siempre debería enviarlo.
   */
  @IsOptional()
  @IsString()
  @IsIn(['catamarca', 'varela'])
  planta_esperada?: 'catamarca' | 'varela';
}