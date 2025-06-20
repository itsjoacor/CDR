import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.client';
import { Insumo } from '../model/insumo.model';

@Injectable()
export class InsumoRepository {
  async buscarPorFiltros(filtros: {
    codigo?: string;
    grupo?: string;
    detalle?: string;
  }): Promise<Insumo[]> {
    let query = supabase
      .from('insumos')
      .select('*');

    if (filtros.codigo) query = query.eq('codigo', filtros.codigo);
    if (filtros.grupo) query = query.ilike('grupo', `%${filtros.grupo}%`);
    if (filtros.detalle) query = query.ilike('detalle', `%${filtros.detalle}%`);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al buscar insumos: ${error.message}`);
    }
    return data as Insumo[];
  }

  async guardar(insumo: Insumo): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .insert([
        {
          grupo: insumo.grupo,
          codigo: insumo.codigo,
          detalle: insumo.detalle,
          costo: insumo.costo
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async buscarPorCodigo(codigo: string): Promise<Insumo | null> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al buscar insumo: ${error.message}`);
    }
    return data;
  }
}