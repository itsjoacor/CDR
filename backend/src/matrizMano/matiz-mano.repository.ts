import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { MatrizMano } from './matriz-mano.model';

@Injectable({ scope: Scope.REQUEST })
export class MatrizManoRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async obtenerTodos(): Promise<MatrizMano[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.from('matriz_mano').select('*');
    if (error) throw new Error(error.message);
    return data as MatrizMano[];
  }

  async obtenerPorCodigo(codigo: string): Promise<MatrizMano | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('matriz_mano')
      .select('*')
      .eq('codigo_mano_obra', codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MatrizMano | null;
  }

  async crear(data: MatrizMano): Promise<MatrizMano> {
    const supabase = await this.getSupabase();
    const { data: insertedData, error } = await supabase
      .from('matriz_mano')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return insertedData;
  }

  async actualizar(codigo: string, data: Partial<MatrizMano>): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('matriz_mano')
      .update(data)
      .eq('codigo_mano_obra', codigo);
    if (error) throw new Error(error.message);
  }

  async eliminar(codigo: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('matriz_mano')
      .delete()
      .eq('codigo_mano_obra', codigo);
    if (error) throw new Error(error.message);
  }

  async obtenerTodosLosCodigos(): Promise<string[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('matriz_mano')
      .select('codigo_mano_obra');
    if (error) throw new Error(error.message);
    return data.map((item) => item.codigo_mano_obra);
  }
}