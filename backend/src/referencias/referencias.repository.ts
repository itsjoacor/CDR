import { Injectable, Inject, Scope, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';

@Injectable({ scope: Scope.REQUEST })
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

      const [
        { data: prodData,  error: prodErr  },
        { data: insData,   error: insErr   },
        { data: manoData,  error: manoErr  },
        { data: eneData,   error: eneErr   },
      ] = await Promise.all([
        supabase.from('productos').select('codigo_producto, descripcion_producto').in('codigo_producto', uniqueCodes),
        supabase.from('insumos').select('codigo, detalle').in('codigo', uniqueCodes),
        supabase.from('matriz_mano').select('codigo_mano_obra, descripcion').in('codigo_mano_obra', uniqueCodes),
        supabase.from('matriz_energia').select('codigo_energia, descripcion').in('codigo_energia', uniqueCodes),
      ]);

      if (prodErr) throw prodErr;
      if (insErr)  throw insErr;
      if (manoErr) throw manoErr;
      if (eneErr)  throw eneErr;

      // Prioridad: productos > insumos > mano > energía
      prodData?.forEach((r: any) => { resultados[r.codigo_producto]  = r.descripcion_producto; });
      insData?.forEach((r: any)  => { if (!resultados[r.codigo])           resultados[r.codigo]           = r.detalle;      });
      manoData?.forEach((r: any) => { if (!resultados[r.codigo_mano_obra]) resultados[r.codigo_mano_obra] = r.descripcion;  });
      eneData?.forEach((r: any)  => { if (!resultados[r.codigo_energia])   resultados[r.codigo_energia]   = r.descripcion;  });

      return resultados;
    } catch (error) {
      throw new HttpException(
        'Error al buscar descripciones: ' + (error.message || error),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
