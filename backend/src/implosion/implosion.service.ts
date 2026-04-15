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

    // 2. Build volumen map: codigo -> volumen (y mantener descripcion del Excel por codigo)
    // Acepta variantes de nombres de columnas
    const CODIGO_KEYS = [
      'codigo_producto', 'codigoproducto', 'cod_producto', 'codproducto',
      'codigo', 'cod', 'codprod',
    ];
    const DESC_KEYS = [
      'descripcion_producto', 'descripcionproducto', 'descripcion',
      'nombre_producto', 'nombreproducto', 'nombre', 'detalle', 'producto',
    ];
    const VOLUMEN_KEYS = [
      // variantes principales: cantidad_producto_producida
      'cantidad_producto_producida', 'cantidadproductoproducida',
      'cantidad_producida', 'cantidadproducida',
      'cantidad_producto', 'cantidadproducto',
      // volumen
      'volumen_producido', 'volumenproducido', 'volumen',
      // genéricos
      'cantidad', 'vol', 'produccion', 'unidades', 'qty', 'volume',
    ];

    const pickValue = (row: any, keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return row[k];
        }
      }
      return '';
    };

    type NoCargado = { codigo: string; descripcion: string; volumen: number | string; motivo: string };
    const volumenMap: Record<string, number> = {};
    const descFromExcel: Record<string, string> = {};
    const codigosDuplicados: string[] = [];
    const rowsDescartadas: NoCargado[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const cod = String(pickValue(r, CODIGO_KEYS)).trim().toUpperCase();
      const volRaw = String(pickValue(r, VOLUMEN_KEYS)).trim();
      const vol = Number(volRaw.replace(',', '.'));
      const desc = String(pickValue(r, DESC_KEYS)).trim();

      // Fila completamente vacía → la saltamos sin avisar
      if (!cod && !volRaw && !desc) continue;

      // Sin código pero con cantidad → reportar
      if (!cod) {
        rowsDescartadas.push({
          codigo: '(fila ' + (idx + 2) + ')',
          descripcion: desc,
          volumen: volRaw || 0,
          motivo: 'Fila sin código de producto',
        });
        continue;
      }

      // Con código pero sin cantidad
      if (!volRaw) {
        rowsDescartadas.push({
          codigo: cod,
          descripcion: desc,
          volumen: 0,
          motivo: 'Sin cantidad producida',
        });
        continue;
      }

      // Cantidad no numérica
      if (isNaN(vol)) {
        rowsDescartadas.push({
          codigo: cod,
          descripcion: desc,
          volumen: volRaw,
          motivo: `Cantidad inválida (no numérica): "${volRaw}"`,
        });
        continue;
      }

      // Cantidad 0 o negativa
      if (vol <= 0) {
        rowsDescartadas.push({
          codigo: cod,
          descripcion: desc,
          volumen: vol,
          motivo: vol === 0 ? 'Cantidad en 0' : 'Cantidad negativa',
        });
        continue;
      }

      // Fila válida
      if (volumenMap[cod] !== undefined && volumenMap[cod] !== vol) {
        codigosDuplicados.push(`${cod} (había ${volumenMap[cod]}, reemplazado por ${vol})`);
      }
      volumenMap[cod] = vol;
      if (desc) descFromExcel[cod] = desc;
    }

    const codigosExcel = Object.keys(volumenMap);

    // Si no hay filas válidas, devolver con warning (no error) incluyendo las descartadas
    if (!codigosExcel.length) {
      if (rowsDescartadas.length > 0) {
        return {
          periodo,
          productos_importados: 0,
          productos_en_archivo: 0,
          filas_calculadas: 0,
          productos_no_cargados: rowsDescartadas,
          mensaje: `Ninguna fila válida en el archivo. ${rowsDescartadas.length} fila(s) con errores.`,
        };
      }
      const columnasDetectadas = rows.length > 0 ? Object.keys(rows[0]) : [];
      throw new BadRequestException(
        `No se encontraron filas válidas. Columnas detectadas: [${columnasDetectadas.join(', ')}]. ` +
        `El archivo debe tener "codigo_producto" y "cantidad_producto_producida" (la "descripcion_producto" es opcional, siempre se busca en la DB).`,
      );
    }

    // 3. Generar variantes de código para tolerar pérdida de ceros a la izquierda en Excel
    // Ej: Excel devuelve "4703112501" pero en DB está "004703112501"
    const normalizar = (c: string) => String(c).replace(/^0+/, '') || '0';
    const variantes = new Set<string>();
    for (const c of codigosExcel) {
      variantes.add(c);
      // Si el código es solo dígitos, generar variantes con padding de 10 a 15
      if (/^\d+$/.test(c)) {
        for (const len of [10, 11, 12, 13, 14, 15]) {
          if (c.length < len) variantes.add(c.padStart(len, '0'));
        }
      }
    }

    // Mapeo "normalizado → código Excel" para encontrar la coincidencia
    const excelCodigoNorm: Record<string, string> = {};
    for (const c of codigosExcel) excelCodigoNorm[normalizar(c)] = c;

    // 4. Fetch recetas_normalizada para todas las variantes
    const recetas = await this.fetchRecetasByProductos(supabase, [...variantes]);

    // Mapeo "código DB → código Excel" (solo si el normalizado coincide con alguno del Excel)
    const dbToExcel: Record<string, string> = {};
    for (const r of recetas as any[]) {
      const normDb = normalizar(r.codigo_producto);
      if (excelCodigoNorm[normDb]) {
        dbToExcel[r.codigo_producto] = excelCodigoNorm[normDb];
      }
    }

    // Filtrar recetas: solo las que realmente matchean con el Excel
    const recetasFiltradas = (recetas as any[]).filter((r) => dbToExcel[r.codigo_producto]);

    // Determinar qué códigos del Excel SÍ se cargaron
    const codigosExcelCargados = new Set<string>(Object.values(dbToExcel));

    // Productos del Excel que NO tienen receta (no matchean con ninguna variante) + filas descartadas antes
    const productosNoCargados: NoCargado[] = [
      ...rowsDescartadas, // filas descartadas durante parseo (sin código, vol inválido, etc.)
      ...codigosExcel
        .filter((c) => !codigosExcelCargados.has(c))
        .map((c): NoCargado => ({
          codigo: c,
          descripcion: descFromExcel[c] ?? '',
          volumen: volumenMap[c],
          motivo: 'Producto sin receta en recetas_normalizada',
        })),
    ];

    if (!recetasFiltradas.length) {
      // Ninguno de los productos del archivo tiene receta → devolver con warning
      return {
        periodo,
        productos_importados: 0,
        filas_calculadas: 0,
        productos_no_cargados: productosNoCargados,
        mensaje: `Ningún producto del archivo tiene receta cargada. ${productosNoCargados.length} producto(s) quedaron sin procesar.`,
      };
    }

    // 5. Fetch product info (nombre, sector) — consultamos por los códigos DB (canónicos)
    // Chunked para evitar IN clauses demasiado grandes (Postgres soporta ~30k, Supabase URL-len menos)
    const IN_CHUNK = 200;
    const codigosDbCargados = [...new Set(recetasFiltradas.map((r: any) => r.codigo_producto))];
    const prodMap: Record<string, { nombre: string; sector: string }> = {};
    for (let i = 0; i < codigosDbCargados.length; i += IN_CHUNK) {
      const slice = codigosDbCargados.slice(i, i + IN_CHUNK);
      const { data: prodData } = await supabase
        .from('productos')
        .select('codigo_producto, descripcion_producto, sector_productivo')
        .in('codigo_producto', slice);
      (prodData ?? []).forEach((p: any) => {
        prodMap[p.codigo_producto] = {
          nombre: p.descripcion_producto ?? '',
          sector: p.sector_productivo ?? '',
        };
      });
    }

    // 6. Fetch ingredient names from the 4 possible source tables (chunked + parallel)
    const codIngredientes = [...new Set(recetasFiltradas.map((r: any) => r.codigo_ingrediente))];
    const nombreIngMapTmp: Record<string, string> = {};
    const eneCodigosTmp = new Set<string>();
    const manoCodigosTmp = new Set<string>();
    const prodIngCodigosTmp = new Set<string>();

    for (let i = 0; i < codIngredientes.length; i += IN_CHUNK) {
      const slice = codIngredientes.slice(i, i + IN_CHUNK);
      const [insData, manoData, eneData, prodIngData] = await Promise.all([
        supabase.from('insumos').select('codigo, detalle').in('codigo', slice),
        supabase.from('matriz_mano').select('codigo_mano_obra, descripcion').in('codigo_mano_obra', slice),
        supabase.from('matriz_energia').select('codigo_energia, descripcion').in('codigo_energia', slice),
        supabase.from('productos').select('codigo_producto, descripcion_producto').in('codigo_producto', slice),
      ]);
      (insData.data ?? []).forEach((r: any) => { nombreIngMapTmp[r.codigo] = r.detalle ?? ''; });
      (prodIngData.data ?? []).forEach((r: any) => {
        nombreIngMapTmp[r.codigo_producto] = r.descripcion_producto ?? '';
        prodIngCodigosTmp.add(r.codigo_producto);
      });
      (manoData.data ?? []).forEach((r: any) => {
        nombreIngMapTmp[r.codigo_mano_obra] = r.descripcion ?? '';
        manoCodigosTmp.add(r.codigo_mano_obra);
      });
      (eneData.data ?? []).forEach((r: any) => {
        nombreIngMapTmp[r.codigo_energia] = r.descripcion ?? '';
        eneCodigosTmp.add(r.codigo_energia);
      });
    }

    // Sanear numérico: null/undefined/NaN → 0, negativos → 0 (defensivo)
    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    // 7. Build detail rows — volumen viene del Excel, mapeado via dbToExcel
    const detalles = recetasFiltradas.map((r: any) => {
      const excelCod = dbToExcel[r.codigo_producto];
      const volumen = safeNum(volumenMap[excelCod]);
      const cantIng = safeNum(r.cantidad_ingrediente);
      const costoIng = safeNum(r.costo_ingrediente);
      const cantidad_producida = cantIng * volumen;
      const cdr_volumen = costoIng * cantidad_producida;
      const prod = prodMap[r.codigo_producto] ?? { nombre: '', sector: '' };
      const tipo_ingrediente = eneCodigosTmp.has(r.codigo_ingrediente)
        ? 'energia'
        : manoCodigosTmp.has(r.codigo_ingrediente)
        ? 'mano_obra'
        : prodIngCodigosTmp.has(r.codigo_ingrediente)
        ? 'producto'
        : 'insumo';
      return {
        periodo,
        codigo_producto: r.codigo_producto, // versión canónica de la DB
        nombre_producto: prod.nombre,
        sector_productivo: prod.sector,
        codigo_ingrediente: r.codigo_ingrediente,
        nombre_ingrediente: nombreIngMapTmp[r.codigo_ingrediente] ?? '',
        tipo_ingrediente,
        volumen,
        cantidad_ingrediente: cantIng,
        cantidad_producida,
        costo_ingrediente: costoIng,
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

    let mensaje = productosNoCargados.length > 0
      ? `${codigosExcelCargados.size} producto(s) cargado(s). ${productosNoCargados.length} producto(s) no tienen receta y fueron ignorados.`
      : `${codigosExcelCargados.size} producto(s) cargado(s) correctamente.`;
    if (codigosDuplicados.length > 0) {
      mensaje += ` | ⚠ ${codigosDuplicados.length} código(s) duplicado(s) en el Excel (se usó el último valor).`;
    }

    return {
      periodo,
      productos_importados: codigosExcelCargados.size,
      productos_en_archivo: codigosExcel.length,
      filas_calculadas: detalles.length,
      productos_no_cargados: productosNoCargados,
      duplicados_en_excel: codigosDuplicados,
      mensaje,
    };
  }

  private async fetchRecetasByProductos(supabase: any, codigos: string[]): Promise<any[]> {
    if (!codigos.length) return [];
    const PAGE = 1000;
    const IN_CHUNK = 200; // Chunkeamos la lista de códigos (IN clause) para no saturar
    const all: any[] = [];

    for (let c = 0; c < codigos.length; c += IN_CHUNK) {
      const codSlice = codigos.slice(c, c + IN_CHUNK);
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('recetas_normalizada')
          .select('codigo_producto, codigo_ingrediente, cantidad_ingrediente, costo_ingrediente')
          .in('codigo_producto', codSlice)
          .range(from, from + PAGE - 1);

        if (error) throw new Error(`Error paginando recetas_normalizada: ${error.message}`);
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
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
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new BadRequestException('El periodo debe tener formato YYYY-MM');
    }
    const supabase = await this.getSupabase();

    // 1. Borrar detalle primero
    const { error: errDetalle, data: borradas } = await supabase
      .from('implosion_detalle')
      .delete()
      .eq('periodo', periodo)
      .select('id');
    if (errDetalle) {
      throw new Error(`Error borrando detalle de ${periodo}: ${errDetalle.message}`);
    }

    // 2. Borrar periodo
    const { error: errPer } = await supabase
      .from('implosion_periodos')
      .delete()
      .eq('periodo', periodo);
    if (errPer) {
      throw new Error(
        `Detalle borrado (${(borradas ?? []).length} filas) pero falló borrar el periodo: ${errPer.message}`,
      );
    }

    return { deleted: periodo, filas_borradas: (borradas ?? []).length };
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
