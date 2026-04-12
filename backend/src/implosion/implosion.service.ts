import { Injectable, Inject, Scope, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import * as XLSX from 'xlsx';

@Injectable({ scope: Scope.REQUEST })
export class ImplosionService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  // ─── IMPORT ───────────────────────────────────────────────────────────────

  async importarPeriodo(file: Express.Multer.File, periodo: string) {
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new BadRequestException('El periodo debe tener formato YYYY-MM (ej: 2025-04)');
    }

    const supabase = await this.getSupabase();

    // 1. Parse Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows.length) throw new BadRequestException('El archivo Excel está vacío');

    // Normalize column names to lowercase
    const rows = rawRows.map(r => {
      const e: Record<string, any> = {};
      Object.entries(r).forEach(([k, v]) => {
        e[String(k).toLowerCase().trim().replace(/\s+/g, '_')] = v;
      });
      return e;
    });

    // 2. Build volumen map: codigo -> volumen
    // Accepts: 'codigo', 'codigo_producto' as the code column
    // 'descripcion' column is accepted but intentionally ignored (names come from DB)
    const volumenMap: Record<string, number> = {};
    for (const r of rows) {
      const cod = String(r['codigo_producto'] ?? r['codigo'] ?? '').trim().toUpperCase();
      const vol = Number(String(r['volumen']).replace(',', '.'));
      if (!cod || isNaN(vol) || vol <= 0) continue;
      volumenMap[cod] = vol;
    }

    const codigos = Object.keys(volumenMap);
    if (!codigos.length) {
      throw new BadRequestException(
        'No se encontraron filas válidas. El Excel debe tener columnas: codigo, descripcion, volumen',
      );
    }

    // 3. Fetch recetas_normalizada for those products (paginated, filter by IN)
    const recetas = await this.fetchRecetasByProductos(supabase, codigos);
    if (!recetas.length) {
      throw new BadRequestException(
        'No se encontraron recetas en recetas_normalizada para los productos importados',
      );
    }

    // 4. Fetch product info (nombre, sector)
    const { data: prodData } = await supabase
      .from('productos')
      .select('codigo_producto, descripcion_producto, sector_productivo')
      .in('codigo_producto', codigos);

    const prodMap: Record<string, { nombre: string; sector: string }> = {};
    (prodData ?? []).forEach((p: any) => {
      prodMap[p.codigo_producto] = {
        nombre: p.descripcion_producto ?? '',
        sector: p.sector_productivo ?? '',
      };
    });

    // 5. Fetch ingredient names from the 4 possible source tables in parallel
    //    Each table is the source-of-truth for classifying the ingredient type:
    //      insumos       → 'insumo'
    //      matriz_mano   → 'mano_obra'
    //      matriz_energia→ 'energia'
    //      productos     → 'producto'  (sub-product used as ingredient)
    const codIngredientes = [...new Set(recetas.map((r: any) => r.codigo_ingrediente))];
    const [insData, manoData, eneData, prodIngData] = await Promise.all([
      supabase.from('insumos').select('codigo, detalle').in('codigo', codIngredientes),
      supabase
        .from('matriz_mano')
        .select('codigo_mano_obra, descripcion')
        .in('codigo_mano_obra', codIngredientes),
      supabase
        .from('matriz_energia')
        .select('codigo_energia, descripcion')
        .in('codigo_energia', codIngredientes),
      supabase
        .from('productos')
        .select('codigo_producto, descripcion_producto')
        .in('codigo_producto', codIngredientes),
    ]);

    // Build name map + type sets — priority: insumo < producto < mano < energia
    // (higher priority overwrites name if duplicated across tables)
    const nombreIngMap: Record<string, string> = {};
    const eneCodigos  = new Set<string>();
    const manoCodigos = new Set<string>();
    const prodIngCodigos = new Set<string>();

    (insData.data ?? []).forEach((r: any) => {
      nombreIngMap[r.codigo] = r.detalle;
    });
    (prodIngData.data ?? []).forEach((r: any) => {
      nombreIngMap[r.codigo_producto] = r.descripcion_producto;
      prodIngCodigos.add(r.codigo_producto);
    });
    (manoData.data ?? []).forEach((r: any) => {
      nombreIngMap[r.codigo_mano_obra] = r.descripcion;
      manoCodigos.add(r.codigo_mano_obra);
    });
    (eneData.data ?? []).forEach((r: any) => {
      nombreIngMap[r.codigo_energia] = r.descripcion;
      eneCodigos.add(r.codigo_energia);
    });

    // 6. Build detail rows — tipo_ingrediente comes from whichever table matched
    const detalles = recetas.map((r: any) => {
      const volumen = volumenMap[r.codigo_producto] ?? 0;
      const cantidad_producida = Number(r.cantidad_ingrediente) * volumen;
      const cdr_volumen = Number(r.costo_ingrediente) * cantidad_producida;
      const prod = prodMap[r.codigo_producto] ?? { nombre: '', sector: '' };
      const tipo_ingrediente = eneCodigos.has(r.codigo_ingrediente)
        ? 'energia'
        : manoCodigos.has(r.codigo_ingrediente)
        ? 'mano_obra'
        : prodIngCodigos.has(r.codigo_ingrediente)
        ? 'producto'
        : 'insumo';
      return {
        periodo,
        codigo_producto: r.codigo_producto,
        nombre_producto: prod.nombre,
        sector_productivo: prod.sector,
        codigo_ingrediente: r.codigo_ingrediente,
        nombre_ingrediente: nombreIngMap[r.codigo_ingrediente] ?? '',
        tipo_ingrediente,
        volumen,
        cantidad_ingrediente: Number(r.cantidad_ingrediente),
        cantidad_producida,
        costo_ingrediente: Number(r.costo_ingrediente),
        cdr_volumen,
      };
    });

    // 7. Upsert period catalog entry
    const { error: perErr } = await supabase
      .from('implosion_periodos')
      .upsert({ periodo }, { onConflict: 'periodo' });
    if (perErr) throw new Error(`Error guardando periodo: ${perErr.message}`);

    // 8. Delete existing detail for this period (re-import = full replace)
    await supabase.from('implosion_detalle').delete().eq('periodo', periodo);

    // 9. Insert in batches of 500
    const BATCH = 500;
    for (let i = 0; i < detalles.length; i += BATCH) {
      const { error } = await supabase
        .from('implosion_detalle')
        .insert(detalles.slice(i, i + BATCH));
      if (error) throw new Error(`Error insertando detalle: ${error.message}`);
    }

    return {
      periodo,
      productos_importados: codigos.length,
      filas_calculadas: detalles.length,
    };
  }

  private async fetchRecetasByProductos(supabase: any, codigos: string[]): Promise<any[]> {
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('recetas_normalizada')
        .select('codigo_producto, codigo_ingrediente, cantidad_ingrediente, costo_ingrediente')
        .in('codigo_producto', codigos)
        .range(from, from + PAGE - 1);

      if (error) throw new Error(`Error paginando recetas_normalizada: ${error.message}`);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    return all;
  }

  // ─── PERIODOS ─────────────────────────────────────────────────────────────

  async getPeriodos() {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('implosion_periodos')
      .select('periodo, created_at')
      .order('periodo', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async deletePeriodo(periodo: string) {
    const supabase = await this.getSupabase();
    await supabase.from('implosion_detalle').delete().eq('periodo', periodo);
    const { error } = await supabase
      .from('implosion_periodos')
      .delete()
      .eq('periodo', periodo);
    if (error) throw new Error(error.message);
    return { deleted: periodo };
  }

  // ─── DETALLE (tabla mensual) ───────────────────────────────────────────────

  async getDetalle(periodo: string): Promise<any[]> {
    const supabase = await this.getSupabase();
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('implosion_detalle')
        .select('*')
        .eq('periodo', periodo)
        .order('codigo_producto', { ascending: true })
        .range(from, from + PAGE - 1);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    return all;
  }

  // ─── CORRIDO (gráfico acumulado) ──────────────────────────────────────────

  async getCorrido() {
    // Returns aggregated cdr_volumen per periodo+sector for the line chart
    const supabase = await this.getSupabase();

    // Fetch only the columns needed for aggregation
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('implosion_detalle')
        .select('periodo, sector_productivo, cdr_volumen, cantidad_producida')
        .order('periodo', { ascending: true })
        .range(from, from + PAGE - 1);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Aggregate: { periodo+sector -> { total_cdr, total_cantidad } }
    const agg: Record<string, { periodo: string; sector_productivo: string; total_cdr: number; total_cantidad: number }> = {};
    for (const row of all) {
      const key = `${row.periodo}__${row.sector_productivo ?? 'Sin sector'}`;
      if (!agg[key]) {
        agg[key] = {
          periodo: row.periodo,
          sector_productivo: row.sector_productivo ?? 'Sin sector',
          total_cdr: 0,
          total_cantidad: 0,
        };
      }
      agg[key].total_cdr += Number(row.cdr_volumen) || 0;
      agg[key].total_cantidad += Number(row.cantidad_producida) || 0;
    }

    return Object.values(agg).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  // ─── EXPORT XLSX ──────────────────────────────────────────────────────────

  async exportPeriodo(periodo: string): Promise<Buffer> {
    const rows = await this.getDetalle(periodo);

    // Map to clean column order for the spreadsheet
    const data = rows.map((r: any) => ({
      periodo: r.periodo,
      codigo_producto: r.codigo_producto,
      nombre_producto: r.nombre_producto,
      sector_productivo: r.sector_productivo,
      codigo_ingrediente: r.codigo_ingrediente,
      nombre_ingrediente: r.nombre_ingrediente,
      volumen: r.volumen,
      cantidad_ingrediente: r.cantidad_ingrediente,
      cantidad_producida: r.cantidad_producida,
      costo_ingrediente: r.costo_ingrediente,
      cdr_volumen: r.cdr_volumen,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, `implosion_${periodo}`);
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  // ─── POR SECTOR ────────────────────────────────────────────────────────────

  async getPorSector(periodo: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('implosion_detalle')
      .select(
        'sector_productivo, codigo_producto, nombre_producto, codigo_ingrediente, nombre_ingrediente, volumen, cantidad_producida, cdr_volumen',
      )
      .eq('periodo', periodo)
      .order('sector_productivo', { ascending: true })
      .order('codigo_producto', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
