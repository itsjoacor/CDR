import { Injectable, Inject, Scope, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';

export type PlantaNombre = 'catamarca' | 'varela';
export const PLANTAS_VALIDAS: PlantaNombre[] = ['catamarca', 'varela'];

export interface Planta {
  nombre: PlantaNombre;
  valor_flete: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class PlantasService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  /** Listar todas las plantas con sus porcentajes de flete actuales. */
  async listar(): Promise<Planta[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** Obtener una planta puntual. */
  async obtener(nombre: PlantaNombre): Promise<Planta> {
    if (!PLANTAS_VALIDAS.includes(nombre)) {
      throw new BadRequestException(`Planta inválida: ${nombre}`);
    }
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .select('*')
      .eq('nombre', nombre)
      .single();
    if (error || !data) throw new NotFoundException(`Planta ${nombre} no encontrada`);
    return data;
  }

  /**
   * Actualizar valor de flete (monto $ por m³) de una planta.
   * Después dispara recálculo de valor_cdr_final de productos con lleva_flete=true.
   */
  async actualizarFlete(nombre: PlantaNombre, valor_flete: number): Promise<Planta> {
    if (!PLANTAS_VALIDAS.includes(nombre)) {
      throw new BadRequestException(`Planta inválida: ${nombre}`);
    }
    if (!Number.isFinite(valor_flete) || valor_flete < 0) {
      throw new BadRequestException('valor_flete debe ser un número ≥ 0');
    }
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .update({
        valor_flete,
        updated_at: new Date().toISOString(),
      })
      .eq('nombre', nombre)
      .select()
      .single();
    if (error) throw new Error(`Error actualizando flete: ${error.message}`);

    // Disparar recálculo de valor_cdr_final para productos de esa planta con flete
    await this.recalcularFletesDeProductos(nombre, valor_flete);

    return data;
  }

  /**
   * Recalcula `monto_flete` y `valor_cdr_final` para TODOS los productos de
   * una planta que tienen `lleva_flete = true`.
   * Nueva fórmula: monto_flete = valor_flete (planta) × m3 (producto).
   * Llamado tras un cambio de valor_flete o de la flag lleva_flete/m3 de un producto.
   */
  async recalcularFletesDeProductos(planta: PlantaNombre, valor?: number): Promise<{ actualizados: number }> {
    const supabase = await this.getSupabase();

    const valor_flete = Number(valor ?? (await this.obtener(planta)).valor_flete);

    // Productos de esa planta con lleva_flete = true (traemos m3 para la fórmula)
    const { data: productos, error: errProd } = await supabase
      .from('productos')
      .select('codigo_producto, m3')
      .eq('planta', planta)
      .eq('lleva_flete', true);
    if (errProd) throw new Error(`Error listando productos: ${errProd.message}`);

    const codigos = (productos ?? []).map((p: any) => p.codigo_producto);
    if (!codigos.length) return { actualizados: 0 };

    // Map de m3 por código
    const m3Map: Record<string, number> = {};
    (productos ?? []).forEach((p: any) => {
      m3Map[p.codigo_producto] = Number(p.m3 ?? 0);
    });

    // Traer base con mantención para cada producto
    const { data: cdrs, error: errCdr } = await supabase
      .from('resultados_cdr')
      .select('codigo_producto, base_cdr, base_cdr_final')
      .in('codigo_producto', codigos);
    if (errCdr) throw new Error(`Error listando resultados_cdr: ${errCdr.message}`);

    // valor_cdr_final ahora es columna GENERATED en DB: la DB la recalcula sola.
    // Solo escribimos monto_flete.
    const updates = (cdrs ?? []).map((r: any) => {
      const m3 = m3Map[r.codigo_producto] ?? 0;
      const monto_flete = valor_flete * m3;
      return {
        codigo_producto: r.codigo_producto,
        monto_flete,
      };
    });

    const BATCH = 200;
    let actualizados = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH);
      for (const u of slice) {
        const { error } = await supabase
          .from('resultados_cdr')
          .update({ monto_flete: u.monto_flete })
          .eq('codigo_producto', u.codigo_producto);
        if (!error) actualizados++;
      }
    }

    return { actualizados };
  }

  /**
   * Recalcula valor_cdr_final de UN producto puntual.
   * Nueva fórmula: monto_flete = valor_flete (planta) × m3 (producto).
   * Llamado cuando cambia lleva_flete, m3 o planta de ese producto.
   */
  async recalcularFleteDeProducto(codigo_producto: string): Promise<void> {
    const supabase = await this.getSupabase();

    const { data: prod, error: errProd } = await supabase
      .from('productos')
      .select('codigo_producto, planta, lleva_flete, m3')
      .eq('codigo_producto', codigo_producto)
      .single();
    if (errProd || !prod) return;

    const { data: cdr } = await supabase
      .from('resultados_cdr')
      .select('base_cdr, base_cdr_final')
      .eq('codigo_producto', codigo_producto)
      .single();
    if (!cdr) return;

    let monto_flete = 0;
    if ((prod as any).lleva_flete) {
      const planta = await this.obtener((prod as any).planta);
      const m3 = Number((prod as any).m3 ?? 0);
      monto_flete = Number(planta.valor_flete) * m3;
    }

    // valor_cdr_final es GENERATED en DB — la calcula sola al cambiar monto_flete.
    await supabase
      .from('resultados_cdr')
      .update({ monto_flete })
      .eq('codigo_producto', codigo_producto);
  }
}
