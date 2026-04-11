import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { Insumo } from './insumo.model';
import { InsumoRepository } from './insumo.repository';
import { getSupabaseClient } from '../config/supabase.client';

@Injectable({ scope: Scope.REQUEST })
export class InsumoService {
  constructor(
    private readonly insumoRepository: InsumoRepository,
    @Inject('REQUEST') private readonly request: Request
  ) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async guardarInsumo(insumo: Insumo): Promise<Insumo> {
    try {
      return await this.insumoRepository.guardar(insumo);
    } catch (error) {
      console.error('❌ Error completo al guardar:', error);
      
      // Manejo específico para error de duplicado
      if (error.code === '23505') {
        throw new Error('Insumo ya existente');
      }
      
      throw new Error('Error al insertar insumo: ' + (error?.message ?? 'Error desconocido'));
    }
  }

  async obtenerTodos(): Promise<Insumo[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.from('insumos').select('*');

    if (error) {
      throw new Error('Error al obtener insumos: ' + error.message);
    }
    return data as Insumo[];
  }

  async obtenerInsumoPorCodigo(codigo: string): Promise<Insumo> {
    const supabase = await this.getSupabase();
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
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('insumos')
      .update({ ...insumo, updated_at: new Date().toISOString() })
      .eq('codigo', codigo)
      .select()
      .single();

    if (error) {
      throw new Error('Error al actualizar insumo: ' + error.message);
    }
    return data as Insumo;
  }

  async eliminarInsumo(codigo: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase.from('insumos').delete().eq('codigo', codigo);

    if (error) {
      throw new Error('Error al eliminar insumo: ' + error.message);
    }
  }
}