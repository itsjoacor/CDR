import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { TablaConfig, PlantaConfig } from './tabla-config.model';
import { TablaConfigBodyDto } from './tabla-config.dto';
import { aplicarFiltroPlanta, validarPlantaEscritura } from '../config/planta.helper';

@Injectable({ scope: Scope.REQUEST })
export class TablaConfigRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}
  private table = 'tabla_config';

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async listarTodos(planta?: PlantaConfig | null): Promise<TablaConfig[]> {
    const supabase = await this.getSupabase();
    let query = supabase.from(this.table).select('*');
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async obtenerPorNombre(nombre: string, planta: PlantaConfig): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('nombre', nombre)
      .eq('planta', planta)
      .single();
    if (error) throw error;
    return data;
  }

  async crear(dto: TablaConfigBodyDto): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    const planta = validarPlantaEscritura(dto.planta);
    const { data, error } = await supabase
      .from(this.table)
      .insert({ nombre: dto.nombre, valor: dto.valor, planta })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(nombre: string, planta: PlantaConfig, valor: number): Promise<TablaConfig> {
    const supabase = await this.getSupabase();
    const { data: existing, error: findError } = await supabase
      .from(this.table)
      .select('*')
      .eq('nombre', nombre)
      .eq('planta', planta)
      .single();

    if (findError || !existing) {
      throw new Error(`Configuration ${nombre} (${planta}) not found`);
    }

    const { data, error } = await supabase
      .from(this.table)
      .update({ valor })
      .eq('nombre', nombre)
      .eq('planta', planta)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', { table: this.table, nombre, planta, valor, error });
      throw new Error(`Update failed for ${nombre} (${planta}): ${error.message}`);
    }

    return data;
  }

  async eliminar(nombre: string, planta: PlantaConfig): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('nombre', nombre)
      .eq('planta', planta);
    if (error) throw error;
  }
}
