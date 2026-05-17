import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { aplicarFiltroPlanta } from '../config/planta.helper';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';

@Injectable({ scope: Scope.REQUEST })
export class SectorProductivoRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) { }

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async crear(sector: SectorProductivo & { planta?: string; porcentaje_mantencion?: number }): Promise<SectorProductivo> {
    const supabase = await this.getSupabase();
    const insertRow: any = {
      nombre: sector.nombre,
      planta: sector.planta ?? 'catamarca',
    };
    if (sector.porcentaje_mantencion !== undefined && sector.porcentaje_mantencion !== null) {
      insertRow.porcentaje_mantencion = Number(sector.porcentaje_mantencion);
    }

    const { data, error } = await supabase
      .from('sectores_productivos')
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear sector productivo: ${error.message}`);
    }

    return new SectorProductivo(
      data.nombre,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  async obtenerTodos(planta?: 'catamarca' | 'varela' | null): Promise<SectorProductivo[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('sectores_productivos')
      .select('*')
      .order('nombre', { ascending: true });
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener sectores productivos: ${error.message}`);
    }

    return data.map(item => new SectorProductivo(
      item.nombre,
      new Date(item.created_at),
      item.updated_at ? new Date(item.updated_at) : undefined
    ));
  }

  async obtenerPorNombre(nombre: string, planta?: 'catamarca' | 'varela'): Promise<SectorProductivo | null> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('sectores_productivos')
      .select('*')
      .eq('nombre', nombre);
    if (planta) query = query.eq('planta', planta);
    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener sector productivo: ${error.message}`);
    }
    if (!data) return null;

    return new SectorProductivo(
      data.nombre,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  // === V2: listar todos los sectores con su porcentaje de mantención ===
  async listarSectoresMantencionV2(planta?: 'catamarca' | 'varela' | null): Promise<Array<{ nombre: string; porcentaje_mantencion: number | null; planta?: string }>> {
    const supabase = await (this as any).getSupabase();
    let query = supabase
      .from('sectores_productivos')
      .select('nombre, porcentaje_mantencion, planta')
      .order('nombre', { ascending: true });
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;

    if (error) {
      throw new (await import('@nestjs/common')).HttpException(
        'Error al obtener sectores: ' + error.message,
        (await import('@nestjs/common')).HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return data as Array<{ nombre: string; porcentaje_mantencion: number | null }>;
  }

  // === V2: obtener porcentaje de mantención de un sector por (nombre, planta) ===
  async getPorcentajeMantencionV2(nombre: string, planta: 'catamarca' | 'varela'): Promise<number> {
    if (!nombre?.trim()) {
      throw new (await import('@nestjs/common')).HttpException(
        'El nombre es requerido',
        (await import('@nestjs/common')).HttpStatus.BAD_REQUEST,
      );
    }

    const supabase = await (this as any).getSupabase();
    const { data, error } = await supabase
      .from('sectores_productivos')
      .select('porcentaje_mantencion')
      .eq('nombre', nombre)
      .eq('planta', planta)
      .maybeSingle();

    if (error) {
      throw new (await import('@nestjs/common')).HttpException(
        'Error al consultar sector: ' + error.message,
        (await import('@nestjs/common')).HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!data) {
      throw new (await import('@nestjs/common')).HttpException(
        `Sector "${nombre}" no encontrado en planta ${planta}`,
        (await import('@nestjs/common')).HttpStatus.NOT_FOUND,
      );
    }
    const valor = data.porcentaje_mantencion;
    return valor === null || valor === undefined ? 1 : Number(valor);
  }

  // === V2: actualizar porcentaje de mantención (0..100, entero) por (nombre, planta) ===
  async updatePorcentajeMantencionV2(
    nombre: string,
    planta: 'catamarca' | 'varela',
    porcentaje: number,
  ): Promise<import('./sectores-productivos.model').SectorProductivoMantencionV2> {
    const { HttpException, HttpStatus } = await import('@nestjs/common');

    if (!nombre?.trim()) throw new HttpException('El nombre es requerido', HttpStatus.BAD_REQUEST);
    if (!Number.isFinite(porcentaje)) {
      throw new HttpException('porcentajeMantencion debe ser un número', HttpStatus.BAD_REQUEST);
    }
    const valor = Math.round(Number(porcentaje));
    if (valor < 0 || valor > 100) {
      throw new HttpException('porcentajeMantencion debe estar entre 0 y 100', HttpStatus.BAD_REQUEST);
    }

    const supabase = await (this as any).getSupabase();

    // verificar existencia en esa planta
    const { data: exists, error: errFind } = await supabase
      .from('sectores_productivos')
      .select('nombre')
      .eq('nombre', nombre)
      .eq('planta', planta)
      .maybeSingle();

    if (errFind) {
      throw new HttpException('Error verificando sector: ' + errFind.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!exists) {
      throw new HttpException(`Sector "${nombre}" no encontrado en planta ${planta}`, HttpStatus.NOT_FOUND);
    }

    // actualizar solo la fila de esa planta
    const { data, error } = await supabase
      .from('sectores_productivos')
      .update({ porcentaje_mantencion: valor })
      .eq('nombre', nombre)
      .eq('planta', planta)
      .select('nombre, porcentaje_mantencion')
      .maybeSingle();

    if (error) {
      throw new HttpException('Error al actualizar: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      nombre: data!.nombre,
      porcentajeMantencion: data!.porcentaje_mantencion,
    };
  }

}