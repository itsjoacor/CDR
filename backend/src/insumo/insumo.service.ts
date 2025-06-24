import { Injectable } from '@nestjs/common';
import { Insumo } from './insumo.model';
import { InsumoRepository } from './insumo.repository';
import { supabase } from '../config/supabase.client';

@Injectable()
export class InsumoService {
  constructor(private readonly insumoRepository: InsumoRepository) { }

  async guardarInsumo(insumo: Insumo): Promise<Insumo> {
    try {
      return await this.insumoRepository.guardar(insumo);
    } catch (error) {
      console.error('❌ Error completo al guardar:', error);
      throw new Error('Error al insertar insumo: ' + (error?.message ?? 'Error desconocido'));
    }
  }

  async obtenerTodos(): Promise<Insumo[]> {
    const { data, error } = await supabase.from('insumos').select('*');

    if (error) {
      throw new Error('Error al obtener insumos: ' + error.message);
    }
    return data as Insumo[];
  }

  async obtenerInsumoPorCodigo(codigo: string): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error || !data) {
      throw new Error('Error al obtener insumo: ' + (error?.message || 'No encontrado'));
    }

    return data;
  }

  async buscarPorFiltros(filtros: {
    codigo?: string;
    grupo?: string;
    detalle?: string;
  }): Promise<Insumo[]> {
    return this.insumoRepository.buscarPorFiltros(filtros);
  }

  async actualizarInsumo(codigo: string, insumo: Partial<Insumo>): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumos')
      .update(insumo)
      .eq('codigo', codigo)
      .select()
      .single();

    if (error) {
      throw new Error('Error al actualizar insumo: ' + error.message);
    }
    return data as Insumo;
  }

  async eliminarInsumo(codigo: string): Promise<void> {
    const { error } = await supabase.from('insumos').delete().eq('codigo', codigo);

    if (error) {
      throw new Error('Error al eliminar insumo: ' + error.message);
    }
  }
}