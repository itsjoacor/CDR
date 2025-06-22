import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { ResultadosCdr } from './resultado-cdr.interface';
import { ResultadosCdrModel } from './resultado-cdr.model';

@Injectable()
export class ResultadosCdrRepository {
  private table = 'resultados_cdr';


  async findAll(): Promise<ResultadosCdr[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*');

    if (error) throw new Error(error.message);
    return data.map(ResultadosCdrModel.fromSupabase);
  }

  async findOne(codigo_producto: string): Promise<ResultadosCdr | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('codigo_producto', codigo_producto)
      .single();

    if (error) return null;
    return ResultadosCdrModel.fromSupabase(data);
  }

  async create(record: ResultadosCdr): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .insert(ResultadosCdrModel.toSupabase(record));

    if (error) throw new Error(error.message);
  }

  async update(record: ResultadosCdr): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update(ResultadosCdrModel.toSupabase(record))
      .eq('codigo_producto', record.codigo_producto);

    if (error) throw new Error(error.message);
  }

  async delete(codigo_producto: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('codigo_producto', codigo_producto);

    if (error) throw new Error(error.message);
  }
}
