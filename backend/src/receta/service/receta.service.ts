import { Injectable } from '@nestjs/common';
import { Receta } from '../model/receta.model';
import { RecetaRepository } from '../repository/receta.repository';
import { supabase } from '../../config/supabase.client';

@Injectable()
export class RecetaService {
  constructor(private readonly recetaRepository: RecetaRepository) { }

  async guardarReceta(receta: Receta): Promise<Receta> {
    try {
      return await this.recetaRepository.guardar(receta);
    } catch (error) {
      console.error('❌ Error completo al guardar:', error); // ✅ más info
      throw new Error('Error al insertar receta: ' + (error?.message ?? 'Error desconocido'));
    }
  }

  async obtenerTodas(): Promise<Receta[]> {
    const { data, error } = await supabase.from('recetas').select('*');

    if (error) {
      throw new Error('Error al obtener recetas: ' + error.message);
    }
    return data as Receta[];
  }


  async obtenerRecetaPorClaves(codigo_producto: string, codigo_ingrediente: string) {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .match({ codigo_producto, codigo_ingrediente }) // clave compuesta

    if (error || !data || data.length === 0) {
      throw new Error('Error al obtener receta: ' + (error?.message || 'No encontrada'))
    }

    return data[0]
  }


  async buscarPorFiltros(filtros: {
    codigo_producto?: string;
    codigo_ingrediente?: string;
    sector_productivo?: string
  }): Promise<Receta[]> {
    return this.recetaRepository.buscarPorFiltros(filtros);
  }

  async actualizarReceta(id: string, receta: Partial<Receta>): Promise<Receta> {
    const { data, error } = await supabase
      .from('recetas')
      .update(receta)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Error al actualizar receta: ' + error.message);
    }
    return data as Receta;
  }

  async eliminarReceta(id: string): Promise<void> {
    const { error } = await supabase.from('recetas').delete().eq('id', id);

    if (error) {
      throw new Error('Error al eliminar receta: ' + error.message);
    }
  }

  
}