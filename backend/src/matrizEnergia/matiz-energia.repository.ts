import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { aplicarFiltroPlanta } from '../config/planta.helper';
import { MatrizEnergia } from './matriz-energia.model';

@Injectable({ scope: Scope.REQUEST })
export class MatrizEnergiaRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async obtenerTodos(planta?: 'catamarca' | 'varela' | null): Promise<MatrizEnergia[]> {
    const supabase = await this.getSupabase();
    let query = supabase.from('matriz_energia').select('*');
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as MatrizEnergia[];
  }

  async obtenerPorCodigo(codigo: string): Promise<MatrizEnergia | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('matriz_energia')
      .select('*')
      .eq('codigo_energia', codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MatrizEnergia | null;
  }

  async crear(data: MatrizEnergia): Promise<MatrizEnergia> {
    try {
      const supabase = await this.getSupabase();
      // Eliminar std_produccion para que lo maneje el trigger
      const { std_produccion, ...insertData } = data;

      const { data: insertedData, error } = await supabase
        .from('matriz_energia')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        // Manejo de errores específicos
        if (error.code === '23505') {
          throw new Error('Código de energía ya existente');
        }
        if (error.code === '23502') {
          throw new Error('Datos requeridos faltantes');
        }
        throw new Error(error.message);
      }

      return insertedData;
    } catch (error: any) {
      throw error;
    }
  }

  async actualizar(codigo: string, data: Partial<MatrizEnergia>): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('matriz_energia')
      .update(data)
      .eq('codigo_energia', codigo);
    if (error) throw new Error(error.message);
  }

  async eliminar(codigo: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('matriz_energia')
      .delete()
      .eq('codigo_energia', codigo);
    if (error) throw new Error(error.message);
  }
}