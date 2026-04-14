// backend/src/importacion/importacion.service.ts
import { Injectable, Inject, Scope, BadRequestException, ConflictException } from '@nestjs/common';
import { Request } from 'express';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import { InsumoCsvRow, parseCsvBuffer } from './utils/csv.helper';
import { getSupabaseClient } from '../config/supabase.client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface RecetaRow {
  codigo_producto: string;
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
}

@Injectable({ scope: Scope.REQUEST })
export class ImportacionService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }
  // ─── INSUMOS (existente, no se toca) ──────────────────────────────────────

  async importCsv(file: Express.Multer.File, table: string, mode: string) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo CSV');

    if (table !== 'insumos') {
      throw new BadRequestException('Solo se admite la tabla insumos por ahora');
    }

    try {
      const rows: InsumoCsvRow[] = parseCsvBuffer(file.buffer);

      if (!rows.length) throw new BadRequestException('El CSV está vacío o no tiene filas válidas');
      if (!('codigo' in rows[0]) || !('costo' in rows[0])) {
        throw new BadRequestException('Faltan columnas requeridas: codigo, costo');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(`
          CREATE TEMP TABLE temp_insumos_import (
            codigo text,
            costo  numeric
          ) ON COMMIT DROP;
        `);

        const codigos: string[] = [];
        const costos: number[] = [];
        for (const r of rows) {
          if (!r.codigo || typeof r.costo !== 'number') continue;
          codigos.push(r.codigo.trim());
          costos.push(r.costo);
        }

        if (codigos.length === 0) {
          throw new BadRequestException('No hay filas válidas con {codigo,costo}');
        }

        await client.query(
          `
          INSERT INTO temp_insumos_import (codigo, costo)
          SELECT * FROM UNNEST ($1::text[], $2::numeric[]);
        `,
          [codigos, costos]
        );

        const updateResult = await client.query(`
          UPDATE insumos i
          SET costo = t.costo
          FROM temp_insumos_import t
          WHERE i.codigo = t.codigo;
        `);

        await client.query('COMMIT');

        return {
          table,
          mode,
          updated_rows: updateResult.rowCount ?? 0,
          total_rows: rows.length,
          message: `Actualización completada para ${updateResult.rowCount ?? 0} registros`,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[ImportacionService] Error al importar CSV:', err?.message || err);
      throw new BadRequestException(err?.message || 'Error procesando CSV');
    }
  }

  // ─── RECETAS NORMALIZADAS (carga masiva) ──────────────────────────────────

  async importRecetas(file: Express.Multer.File, mode: 'new' | 'update' | 'patch') {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo');
    if (!['new', 'update', 'patch'].includes(mode)) {
      throw new BadRequestException('mode debe ser "new", "update" o "patch"');
    }

    // 1. Parsear archivo
    const rawRows = this.parseRecetasFile(file);
    if (!rawRows.length) {
      throw new BadRequestException('El archivo está vacío o no tiene filas válidas');
    }

    // Deduplicar por (codigo_producto, codigo_ingrediente) — la PK
    // Si el archivo tiene la misma combinación 2+ veces, gana la última fila
    const dedup = new Map<string, RecetaRow>();
    for (const r of rawRows) {
      const key = `${r.codigo_producto}__${r.codigo_ingrediente}`;
      dedup.set(key, r);
    }
    const rows = [...dedup.values()];
    const filasDuplicadas = rawRows.length - rows.length;

    const productosUnicos = [...new Set(rows.map(r => r.codigo_producto))];
    const supabase = await this.getSupabase();

    try {
      // 2. Verificar productos existentes (paginado por si son muchos)
      const productosExistentes = new Set<string>();
      const CHUNK = 200;
      for (let i = 0; i < productosUnicos.length; i += CHUNK) {
        const slice = productosUnicos.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from('recetas_normalizada')
          .select('codigo_producto')
          .in('codigo_producto', slice);
        if (error) throw new Error(`Error consultando recetas existentes: ${error.message}`);
        (data ?? []).forEach((r: any) => productosExistentes.add(r.codigo_producto));
      }

      // 3. Lógica según modo
      if (mode === 'new' && productosExistentes.size > 0) {
        throw new ConflictException({
          message: `${productosExistentes.size} producto(s) ya tienen receta. Modo "Insertar nuevas" requiere que todos sean nuevos.`,
          productos_existentes: [...productosExistentes],
        });
      }

      // Modo "patch" (actualizar ingrediente): solo permite UPDATE de pares existentes.
      // Si algún (producto, ingrediente) del archivo NO existe en la receta → frena todo.
      if (mode === 'patch') {
        // Verificar que cada par (producto, ingrediente) ya exista
        const paresFaltantes: string[] = [];
        const PAIR_CHUNK = 200;
        for (let i = 0; i < rows.length; i += PAIR_CHUNK) {
          const slice = rows.slice(i, i + PAIR_CHUNK);
          const codsProd = [...new Set(slice.map(r => r.codigo_producto))];
          const codsIng = [...new Set(slice.map(r => r.codigo_ingrediente))];
          const { data, error } = await supabase
            .from('recetas_normalizada')
            .select('codigo_producto, codigo_ingrediente')
            .in('codigo_producto', codsProd)
            .in('codigo_ingrediente', codsIng);
          if (error) throw new Error(`Error verificando ingredientes existentes: ${error.message}`);

          const setExistentes = new Set((data ?? []).map((r: any) => `${r.codigo_producto}__${r.codigo_ingrediente}`));
          for (const r of slice) {
            const key = `${r.codigo_producto}__${r.codigo_ingrediente}`;
            if (!setExistentes.has(key)) paresFaltantes.push(`${r.codigo_producto} → ${r.codigo_ingrediente}`);
          }
        }

        if (paresFaltantes.length > 0) {
          throw new ConflictException({
            message: `${paresFaltantes.length} ingrediente(s) NO existen en la receta. El modo "Actualizar ingrediente" solo permite modificar ingredientes ya cargados.`,
            ingredientes_faltantes: paresFaltantes.slice(0, 50), // hasta 50 para no saturar
            total_faltantes: paresFaltantes.length,
          });
        }
      }

      // 4. Modo update: borrar recetas viejas COMPLETAS de los productos del archivo
      let recetasReemplazadas = 0;
      let filasBorradas = 0;
      if (mode === 'update' && productosExistentes.size > 0) {
        const codsExistentes = [...productosExistentes];
        for (let i = 0; i < codsExistentes.length; i += CHUNK) {
          const slice = codsExistentes.slice(i, i + CHUNK);
          const { error, data: deletedRows } = await supabase
            .from('recetas_normalizada')
            .delete()
            .in('codigo_producto', slice)
            .select('codigo_producto, codigo_ingrediente');
          if (error) throw new Error(`Error eliminando recetas existentes: ${error.message}`);
          filasBorradas += (deletedRows ?? []).length;
        }
        recetasReemplazadas = productosExistentes.size;

        // Verificación: si dijo que se borraron 0 filas → RLS está bloqueando
        if (filasBorradas === 0) {
          throw new BadRequestException(
            `RLS está bloqueando el DELETE. ${productosExistentes.size} producto(s) existían en la DB pero no se pudo borrar ninguna fila. ` +
            `Verificá los policies de DELETE en la tabla recetas_normalizada.`
          );
        }

        // Verificación adicional: que ya no existan filas para esos productos
        const { data: stillThere } = await supabase
          .from('recetas_normalizada')
          .select('codigo_producto')
          .in('codigo_producto', codsExistentes)
          .limit(1);
        if (stillThere && stillThere.length > 0) {
          throw new BadRequestException(
            `Después del DELETE todavía existen filas para los productos del archivo. ` +
            `Posible RLS o trigger bloqueando.`
          );
        }
      }

      // 5. UPSERT en lotes (UPSERT en vez de INSERT para tolerar duplicados/colisiones residuales)
      const BATCH = 500;
      let insertadas = 0;
      const erroresInsert: string[] = [];
      for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);
        const { error, count } = await supabase
          .from('recetas_normalizada')
          .upsert(slice, {
            onConflict: 'codigo_producto,codigo_ingrediente',
            ignoreDuplicates: false,
            count: 'exact',
          });
        if (error) {
          erroresInsert.push(`Lote ${i / BATCH + 1}: ${error.message}${error.details ? ` | ${error.details}` : ''}`);
          continue;
        }
        insertadas += count ?? slice.length;
      }

      if (erroresInsert.length > 0) {
        throw new BadRequestException(
          `Falló la inserción de algunos lotes:\n${erroresInsert.slice(0, 3).join('\n')}` +
          (erroresInsert.length > 3 ? `\n... y ${erroresInsert.length - 3} más` : ''),
        );
      }

      const productosNuevos = productosUnicos.length - productosExistentes.size;
      let baseMsg = '';
      if (mode === 'new') {
        baseMsg = `${productosUnicos.length} recetas nuevas insertadas (${insertadas} filas)`;
      } else if (mode === 'update') {
        baseMsg = `${productosNuevos} recetas nuevas + ${recetasReemplazadas} recetas reemplazadas (${insertadas} filas)`;
      } else {
        // patch
        baseMsg = `${insertadas} cantidad(es) de ingrediente actualizada(s) en ${productosUnicos.length} receta(s) (sin tocar el resto)`;
      }

      return {
        mode,
        total_filas_insertadas: insertadas,
        productos_unicos: productosUnicos.length,
        productos_nuevos: productosNuevos,
        recetas_reemplazadas: recetasReemplazadas,
        filas_duplicadas_descartadas: filasDuplicadas,
        message: baseMsg + (filasDuplicadas > 0 ? ` | ${filasDuplicadas} filas duplicadas descartadas del archivo` : ''),
      };
    } catch (err: any) {
      if (err instanceof ConflictException || err instanceof BadRequestException) throw err;
      console.error('[ImportacionService] Error importando recetas:', err?.message || err);
      throw new BadRequestException(err?.message || 'Error procesando archivo de recetas');
    }
  }

  private parseRecetasFile(file: Express.Multer.File): RecetaRow[] {
    const ext = file.originalname.toLowerCase().split('.').pop();
    let rawRows: any[] = [];

    if (ext === 'xlsx' || ext === 'xls') {
      const wb = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else if (ext === 'csv') {
      const wb = XLSX.read(file.buffer, { type: 'buffer', raw: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      throw new BadRequestException('Formato no soportado. Usá .csv, .xlsx o .xls');
    }

    if (!rawRows.length) return [];

    // Normalizar nombres de columnas (admitir variaciones)
    const out: RecetaRow[] = [];
    for (const r of rawRows) {
      const norm: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        norm[String(k).toLowerCase().trim().replace(/\s+/g, '_')] = v;
      }

      const cod_prod = String(
        norm['codigo_producto'] ?? norm['codigoproducto'] ?? norm['codigo_producto'] ?? '',
      ).trim().toUpperCase();
      const cod_ing = String(
        norm['codigo_ingrediente'] ?? norm['codigoingrediente'] ?? '',
      ).trim().toUpperCase();
      const cantRaw = String(
        norm['cantidad_ingrediente'] ?? norm['cantidadingrediente'] ?? norm['cantidad'] ?? '',
      ).trim();

      if (!cod_prod || !cod_ing || !cantRaw) continue;

      const cant = Number(cantRaw.replace(',', '.'));
      if (!Number.isFinite(cant) || cant <= 0) continue;

      out.push({
        codigo_producto: cod_prod,
        codigo_ingrediente: cod_ing,
        cantidad_ingrediente: cant,
      });
    }

    return out;
  }
}
