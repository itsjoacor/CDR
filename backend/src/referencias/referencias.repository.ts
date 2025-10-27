import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';

@Injectable()
export class ReferenciasRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  /**
   * Busca descripciones en las tablas:
   * productos, insumos, matriz_mano, matriz_energia
   * en ese orden de prioridad.
   */
  async buscarDescripcionesPorCodigos(codigos: string[]): Promise<Record<string, string>> {
    const supabase = await this.getSupabase();

    try {
      const uniqueCodes = Array.from(new Set(codigos.filter(Boolean)));

      const resultados: Record<string, string> = {};

      // Productos
      const { data: prodData, error: prodErr } = await supabase
        .from('productos')
        .select('codigo_producto, descripcion_producto')
        .in('codigo_producto', uniqueCodes);
      if (prodErr) throw prodErr;
      prodData?.forEach((r: any) => {
        resultados[r.codigo_producto] = r.descripcion_producto;
      });

      // Insumos
      const { data: insData, error: insErr } = await supabase
        .from('insumos')
        .select('codigo, detalle')
        .in('codigo', uniqueCodes);
      if (insErr) throw insErr;
      insData?.forEach((r: any) => {
        if (!resultados[r.codigo]) {
          resultados[r.codigo] = r.detalle;
        }
      });

      // Matriz mano
      const { data: manoData, error: manoErr } = await supabase
        .from('matriz_mano')
        .select('codigo_mano_obra, descripcion')
        .in('codigo_mano_obra', uniqueCodes);
      if (manoErr) throw manoErr;
      manoData?.forEach((r: any) => {
        if (!resultados[r.codigo_mano_obra]) {
          resultados[r.codigo_mano_obra] = r.descripcion;
        }
      });

      // Matriz energía
      const { data: eneData, error: eneErr } = await supabase
        .from('matriz_energia')
        .select('codigo_energia, descripcion')
        .in('codigo_energia', uniqueCodes);
      if (eneErr) throw eneErr;
      eneData?.forEach((r: any) => {
        if (!resultados[r.codigo_energia]) {
          resultados[r.codigo_energia] = r.descripcion;
        }
      });

      return resultados;
    } catch (error) {
      throw new HttpException(
        'Error al buscar descripciones: ' + (error.message || error),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
