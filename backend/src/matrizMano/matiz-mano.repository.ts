import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { MatrizMano } from './matriz-mano.model';

@Injectable()
export class MatrizManoRepository {
  async obtenerTodos(): Promise<MatrizMano[]> {
    const { data, error } = await supabase.from('matriz_mano').select('*');
    if (error) throw new Error(error.message);
    return data as MatrizMano[];
  }

  async obtenerPorCodigo(codigo: string): Promise<MatrizMano | null> {
    const { data, error } = await supabase
      .from('matriz_mano')
      .select('*')
      .eq('codigo_mano_obra', codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MatrizMano | null;
  }

  async crear(data: MatrizMano): Promise<MatrizMano> {
    const { error } = await supabase.from('matriz_mano').insert([data]);
    if (error) throw new Error(error.message);
    return data;
  }

  async actualizar(codigo: string, data: Partial<MatrizMano>): Promise<void> {
    const { error } = await supabase
      .from('matriz_mano')
      .update(data)
      .eq('codigo_mano_obra', codigo);
    if (error) throw new Error(error.message);
  }

  async eliminar(codigo: string): Promise<void> {
    const { error } = await supabase
      .from('matriz_mano')
      .delete()
      .eq('codigo_mano_obra', codigo);
    if (error) throw new Error(error.message);
  }

  async obtenerTodosLosCodigos(): Promise<string[]> {
    const { data, error } = await supabase
      .from('matriz_mano')
      .select('codigo_mano_obra');
    if (error) throw new Error(error.message);
    return data.map((item) => item.codigo_mano_obra);
  }
}
