import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { TablaConfig } from './tabla-config.model';
import { TablaConfigBodyDto } from './tabla-config.dto';

@Injectable({ scope: Scope.REQUEST })
export class TablaConfigRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) { }
  private table = 'tabla_config';

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async listarTodos(): Promise<TablaConfig[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) throw error;
    return data;
  }

  async obtenerPorNombre(nombre: string): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('nombre', nombre)
      .single();
    if (error) throw error;
    return data;
  }

  async crear(dto: TablaConfigBodyDto): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .insert(dto)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(nombre: string, valor: number): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    // First verify the record exists
    const { data: existing, error: findError } = await supabase
      .from(this.table)
      .select('*')
      .eq('nombre', nombre)
      .single();

    if (findError || !existing) {
      throw new Error(`Configuration ${nombre} not found`);
    }

    // Then perform the update
    const { data, error } = await supabase
      .from(this.table)
      .update({ valor })
      .eq('nombre', nombre)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', {
        table: this.table,
        nombre,
        valor,
        error
      });
      throw new Error(`Update failed for ${nombre}: ${error.message}`);
    }

    return data;
  }

  async eliminar(nombre: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('nombre', nombre);
    if (error) throw error;
  }
}