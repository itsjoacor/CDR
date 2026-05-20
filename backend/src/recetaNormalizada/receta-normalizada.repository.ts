import { Injectable, Inject, Scope, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { aplicarFiltroPlanta } from '../config/planta.helper';
import { RecetaNormalizada } from './receta-normalizada.model';
import { CreateRecetaNormalizadaDto } from './receta-nomralizada.dto';

@Injectable({ scope: Scope.REQUEST })
export class RecetaNormalizadaRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) { }

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  private async existeEnTabla(tabla: string, campo: string, valor: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.from(tabla).select(campo).eq(campo, valor).limit(1);
    if (error) {
      throw new HttpException(`Error consultando ${tabla}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return !!(data && data.length > 0);
  }

  private campoPk(tabla: string) {
    const map: Record<string, string> = {
      productos: 'codigo_producto',
      insumos: 'codigo',
      recetas_normalizada: 'codigo_producto', // parte de PK compuesta
    };
    return map[tabla] || 'codigo';
  }

  async obtenerTodas(planta?: 'catamarca' | 'varela' | null): Promise<RecetaNormalizada[]> {
    const supabase = await this.getSupabase();
    let query = supabase.from('recetas_normalizada').select('*');
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;
    if (error) {
      throw new HttpException('Error al obtener recetas: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data as RecetaNormalizada[];
  }

  async obtenerPorProducto(codigo_producto: string): Promise<RecetaNormalizada[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('recetas_normalizada')
      .select('*')
      .eq('codigo_producto', codigo_producto);
    if (error) {
      throw new HttpException('Error al obtener receta por producto: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return (data || []) as RecetaNormalizada[];
  }

  /**
   * Devuelve lista de { codigo_producto } que tienen al menos un ingrediente
   * con costo_total = 0 o NULL. Si se pasa "codigo", filtra por ese producto.
   */
  async productosConCostoTotalCero(codigo?: string): Promise<{ codigo_producto: string }[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('recetas_normalizada')
      .select('codigo_producto')
      .or('costo_total.eq.0,costo_total.is.null');

    if (codigo) {
      query = query.eq('codigo_producto', codigo);
    }

    const { data, error } = await query;
    if (error) {
      throw new HttpException(
        'Error al verificar costos de recetas: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const set = new Set<string>((data || []).map((r: any) => r.codigo_producto));
    return Array.from(set).map((codigo_producto) => ({ codigo_producto }));
  }

  async batchTieneCdrCero(codigos: string[]): Promise<Record<string, boolean>> {
    if (!codigos || codigos.length === 0) return {};
    const supabase = await this.getSupabase();

    // Una sola RPC batch (migration 013) que evalua N códigos intra-DB en vez
    // de N round-trips. Conserva exactamente la lógica original de
    // `tiene_valor_cdr_cero` (la nueva RPC solo es un wrapper de unnest).
    const { data: batchData, error: batchErr } = await supabase.rpc(
      'batch_tiene_valor_cdr_cero',
      { p_codigos: codigos },
    );

    if (!batchErr && batchData) {
      const map: Record<string, boolean> = {};
      for (const row of batchData as any[]) {
        map[row.codigo_producto] = !!row.tiene_cdr_cero;
      }
      // Asegurar que TODOS los códigos pedidos tengan entrada (default false)
      for (const c of codigos) if (!(c in map)) map[c] = false;
      return map;
    }

    // Fallback al patrón antiguo si la migration 013 no está aplicada en
    // este entorno (no rompe el endpoint).
    const results = await Promise.all(
      codigos.map(async (codigo) => {
        const { data, error } = await supabase.rpc('tiene_valor_cdr_cero', {
          p_codigo_producto: codigo,
        });
        return { codigo, value: error ? false : (data || false) };
      }),
    );
    return Object.fromEntries(results.map(r => [r.codigo, r.value]));
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('recetas_normalizada')
      .delete()
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al eliminar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async eliminarPorProducto(codigo_producto: string): Promise<number> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('recetas_normalizada')
      .delete()
      .eq('codigo_producto', codigo_producto)
      .select();

    if (error) {
      throw new HttpException('Error al eliminar receta completa: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data?.length || 0;
  }

  async crear(dto: CreateRecetaNormalizadaDto) {
    try {
      const supabase = await this.getSupabase();
      const { codigo_producto, codigo_ingrediente, cantidad_ingrediente, planta_esperada } = dto;

      if (!codigo_producto || !codigo_ingrediente || cantidad_ingrediente == null) {
        throw new HttpException(
          'Datos incompletos: código de producto, código de ingrediente y cantidad son requeridos',
          HttpStatus.BAD_REQUEST
        );
      }

      if (isNaN(Number(cantidad_ingrediente)) || Number(cantidad_ingrediente) <= 0) {
        throw new HttpException(
          'La cantidad debe ser un número mayor a cero',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verificar existencia en paralelo
      const [productoExiste, ingredienteExiste] = await Promise.all([
        this.existeEnTabla('productos', this.campoPk('productos'), codigo_producto),
        true, // si tus ingredientes vienen de otra tabla, validar aquí; lo dejo habilitado
      ]);

      if (!productoExiste || !ingredienteExiste) {
        throw new HttpException(
          'El producto o ingrediente no existen',
          HttpStatus.BAD_REQUEST
        );
      }

      // Inferir planta del producto (la receta hereda la planta del producto padre)
      const { data: prodPlanta } = await supabase
        .from('productos')
        .select('planta')
        .eq('codigo_producto', codigo_producto)
        .maybeSingle();
      const planta = (prodPlanta as any)?.planta ?? 'catamarca';

      // Validación cross-planta: si el front nos dice qué planta espera (el
      // selector global), bloqueamos cargar receta para un producto de otra
      // planta. Productos pueden usarse como INGREDIENTE cross-planta, pero
      // sus RECETAS solo viven en su planta de origen.
      if (planta_esperada && planta_esperada !== planta) {
        throw new HttpException(
          `El producto ${codigo_producto} pertenece a la planta "${planta}". ` +
          `No se puede cargar su receta desde la planta "${planta_esperada}". ` +
          `Si lo querés usar como ingrediente, agregalo directamente en una receta de ${planta_esperada} ` +
          `como codigo_ingrediente — pero para editar su receta tenés que cambiar el selector arriba a "${planta}".`,
          HttpStatus.BAD_REQUEST
        );
      }

      const { data, error } = await supabase.from('recetas_normalizada').insert([
        {
          codigo_producto,
          codigo_ingrediente,
          cantidad_ingrediente: Number(cantidad_ingrediente),
          planta,
        }
      ]).select();

      if (error) {
        throw new HttpException('Error al crear receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const created = (data && data[0]) || null;
      if (!created) {
        throw new HttpException('No se pudo crear la receta (sin retorno)', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const codProducto = created.codigo_producto;
      const codIngrediente = created.codigo_ingrediente;

      return {
        success: true,
        message: `Receta creada exitosamente: ${codProducto} con ingrediente ${codIngrediente}`,
        data: {
          codigo_producto: codProducto,
          codigo_ingrediente: codIngrediente,
          cantidad_ingrediente: created.cantidad_ingrediente
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error inesperado en crear receta:', error);
      throw new HttpException(
        'Ocurrió un error inesperado al procesar la receta',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async actualizar(
    codigo_producto: string,
    codigo_ingrediente: string,
    cantidad_ingrediente: number
  ) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('recetas_normalizada')
      .update({ cantidad_ingrediente })
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al actualizar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  // receta-normalizada.repository.ts - Agregar este método
  async tieneValorCdrCero(codigo_producto: string): Promise<boolean> {
    const supabase = await this.getSupabase();

    const { data, error } = await supabase
      .rpc('tiene_valor_cdr_cero', {
        p_codigo_producto: codigo_producto
      });

    if (error) {
      console.error('Error al verificar CDR cero:', error);
      throw new HttpException(
        'Error al verificar CDR cero: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return data || false;
  }
}
