import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { RecetaNormalizada } from './receta-normalizada.model';

@Injectable()
export class RecetaNormalizadaRepository {
  async crear(dto: Partial<RecetaNormalizada>) {
    const { codigo_producto, codigo_ingrediente } = dto;

    // Validar existencia previa
    const { data: existente, error: readError } = await supabase
      .from('recetas_normalizada')
      .select('codigo_producto')
      .eq('codigo_producto', codigo_producto)
      .eq('codigo_ingrediente', codigo_ingrediente)
      .maybeSingle();

    if (readError) {
      throw new Error('Error al verificar duplicados: ' + readError.message);
    }

    if (existente) {
      throw new Error('Ya existe esa combinación de producto e ingrediente.');
    }

    // Insertar si no existe
    const { error } = await supabase.from('recetas_normalizada').insert(dto);
    if (error) {
      throw new Error('Error al insertar receta: ' + error.message);
    }
  }



  async obtenerTodas(): Promise<RecetaNormalizada[]> {
    const { data, error } = await supabase.from('recetas_normalizada').select('*');
    if (error) throw new Error('Error al obtener recetas: ' + error.message);
    return data as RecetaNormalizada[];
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    const { error } = await supabase
      .from('recetas_normalizada')
      .delete()
      .match({ codigo_producto, codigo_ingrediente });
    if (error) throw new Error('Error al eliminar receta: ' + error.message);
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
    if (error) throw new Error('Error al actualizar receta: ' + error.message);
  }
}
