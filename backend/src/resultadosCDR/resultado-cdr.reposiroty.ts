import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { ResultadosCdr } from './resultado-cdr.interface';
import { ResultadosCdrModel } from './resultado-cdr.model';

@Injectable({ scope: Scope.REQUEST })
export class ResultadosCdrRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) { }
  private table = 'resultados_cdr';

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async findAll(): Promise<ResultadosCdr[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*');

    if (error) throw new Error(error.message);
    return data.map(ResultadosCdrModel.fromSupabase);
  }

  async findOne(codigo_producto: string): Promise<ResultadosCdr | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('codigo_producto', codigo_producto)
      .single();

    if (error) return null;
    return ResultadosCdrModel.fromSupabase(data);
  }

  async create(record: ResultadosCdr): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.table)
      .insert(ResultadosCdrModel.toSupabase(record));

    if (error) throw new Error(error.message);
  }

  async update(record: ResultadosCdr): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.table)
      .update(ResultadosCdrModel.toSupabase(record))
      .eq('codigo_producto', record.codigo_producto);

    if (error) throw new Error(error.message);
  }

  async delete(codigo_producto: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('codigo_producto', codigo_producto);

    if (error) throw new Error(error.message);
  }
}