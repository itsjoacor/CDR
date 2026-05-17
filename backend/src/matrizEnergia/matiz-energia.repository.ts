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
      // Si el usuario no provee std_produccion (null/undefined), el trigger
      // BEFORE INSERT lo autocompleta desde matriz_mano. Si lo provee, se respeta.
      const insertData: any = { ...data };
      if (insertData.std_produccion === undefined || insertData.std_produccion === null) {
        delete insertData.std_produccion;
      }

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
    // std_produccion en matriz_energia es read-only desde la UI:
    // se sincroniza automáticamente desde matriz_mano via trigger sync_std_mano_a_energia.
    // Filtramos por si llegara desde el body para evitar pisar el valor sincronizado.
    const { std_produccion, ...updateData } = data as any;

    const { error } = await supabase
      .from('matriz_energia')
      .update(updateData)
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