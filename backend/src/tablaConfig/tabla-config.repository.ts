import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { TablaConfig } from './tabla-config.model';
import { TablaConfigBodyDto } from './tabla-config.dto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

@Injectable()
export class TablaConfigRepository {
  private table = 'tabla_config';

  async listarTodos(): Promise<TablaConfig[]> {
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) throw error;
    return data;
  }

  async obtenerPorNombre(nombre: string): Promise<TablaConfig> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('nombre', nombre)
      .single();
    if (error) throw error;
    return data;
  }

  async crear(dto: TablaConfigBodyDto): Promise<TablaConfig> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(dto)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(nombre: string, valor: number): Promise<TablaConfig> {
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
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('nombre', nombre);
    if (error) throw error;
  }
}