import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.client';
import { Insumo } from '../model/insumo.model';

@Injectable()
export class InsumoRepository {
  async buscarPorFiltros(filtros: {
    codigo?: string;
    grupo?: string;
    detalle?: string;
    costo_min?: number;
    costo_max?: number;
  }): Promise<Insumo[]> {
    let query = supabase
      .from('insumos')
      .select('*');

    if (filtros.codigo) query = query.eq('codigo', filtros.codigo);
    if (filtros.grupo) query = query.ilike('grupo', `%${filtros.grupo}%`);
    if (filtros.detalle) query = query.ilike('detalle', `%${filtros.detalle}%`);
    if (filtros.costo_min) query = query.gte('costo', filtros.costo_min);
    if (filtros.costo_max) query = query.lte('costo', filtros.costo_max);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al buscar insumos: ${error.message}`);
    }
    return data as Insumo[];
  }

  async buscarPorCodigo(codigo: string): Promise<Insumo | null> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw new Error(`Error al buscar insumo: ${error.message}`);
    }
    return data as Insumo;
  }

  async guardar(insumo: Insumo): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .insert([
        {
          codigo: insumo.codigo,
          grupo: insumo.grupo,
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

  async actualizar(codigo: string, campos: Partial<Insumo>): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .update(campos)
      .eq('codigo', codigo)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar insumo: ${error.message}`);
    }

    return data;
  }

  async eliminar(codigo: string): Promise<void> {
    const { error } = await supabase
      .from('insumos')
      .delete()
      .eq('codigo', codigo);

    if (error) {
      throw new Error(`Error al eliminar insumo: ${error.message}`);
    }
  }
}