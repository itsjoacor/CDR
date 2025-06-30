import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { RecetaNormalizada } from './receta-normalizada.model';
import { CreateRecetaNormalizadaDto } from './receta-nomralizada.dto';

@Injectable()
export class RecetaNormalizadaRepository {
  async crear(dto: CreateRecetaNormalizadaDto) {
    const { codigo_producto, codigo_ingrediente } = dto;

    // Validación básica
    if (!codigo_producto || !codigo_ingrediente) {
      throw new HttpException(
        'Código de producto o ingrediente faltante',
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar existencia del producto principal
    const productoExiste = await this.existeEnTabla('productos', 'codigo_producto', codigo_producto);
    if (!productoExiste) {
      throw new HttpException(
        `Producto no existente (${codigo_producto}), primero deberías cargarlo`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar en qué tabla existe el ingrediente
    const tipoIngrediente = await this.determinarTipoIngrediente(codigo_ingrediente);

    if (!tipoIngrediente) {
      throw new HttpException(
        `Ingrediente no existente (${codigo_ingrediente}). Debe existir en alguna de estas tablas: productos, insumos, matriz_mano o matriz_energia.`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Verificar si la combinación ya existe
    const { data: existente, error: readError } = await supabase
      .from('recetas_normalizada')
      .select('codigo_producto')
      .eq('codigo_producto', codigo_producto)
      .eq('codigo_ingrediente', codigo_ingrediente)
      .maybeSingle();

    if (readError) {
      throw new HttpException(
        'Error al verificar duplicados: ' + readError.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    if (existente) {
      throw new HttpException(
        `Combinación producto (${codigo_producto}) e ingrediente (${codigo_ingrediente}) ya existente.`,
        HttpStatus.CONFLICT
      );
    }

    // Insertar la receta
    const { error } = await supabase.from('recetas_normalizada').insert({
      ...dto,
      tipo_ingrediente: tipoIngrediente // Agregamos el tipo de ingrediente
    });

    if (error) {
      throw new HttpException(
        'Error al insertar receta: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return { success: true, message: 'Receta creada exitosamente' };
  }

  private async determinarTipoIngrediente(codigo: string): Promise<string | null> {
    // Verificar en qué tabla existe el código
    const checks = await Promise.all([
      this.existeEnTabla('productos', 'codigo_producto', codigo).then(existe => existe ? 'producto' : null),
      this.existeEnTabla('insumos', 'codigo', codigo).then(existe => existe ? 'insumo' : null),
      this.existeEnTabla('matriz_mano', 'codigo_mano_obra', codigo).then(existe => existe ? 'mano_obra' : null),
      this.existeEnTabla('matriz_energia', 'codigo_matriz_energia', codigo).then(existe => existe ? 'matriz_energia' : null),
    ]);

    // Retornar el primer tipo no nulo encontrado
    return checks.find(tipo => tipo !== null) || null;
  }

  private async existeEnTabla(tabla: string, campo: string, valor: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(tabla)
      .select(campo)
      .eq(campo, valor)
      .maybeSingle();

    if (error) {
      console.error(`Error al verificar existencia en ${tabla}:`, error);
      return false;
    }

    return !!data;
  }




  async obtenerTodas(): Promise<RecetaNormalizada[]> {
    const { data, error } = await supabase.from('recetas_normalizada').select('*');
    if (error) {
      throw new HttpException('Error al obtener recetas: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data as RecetaNormalizada[];
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    const { error } = await supabase
      .from('recetas_normalizada')
      .delete()
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al eliminar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizar(
    codigo_producto: string,
    codigo_ingrediente: string,
    cantidad_ingrediente: number
  ) {
    const { error } = await supabase
      .from('recetas_normalizada')
      .update({ cantidad_ingrediente })
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al actualizar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }




}
