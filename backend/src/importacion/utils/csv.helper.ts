// backend/src/importacion/utils/csv.helper.ts
import { parse } from 'csv-parse/sync';

export type InsumoCsvRow = {
  codigo: string;
  costo: number;
  // Campos opcionales que pueden venir en el CSV (grupo, detalle, etc.)
  [k: string]: any;
};

export function parseCsvBuffer(buffer: Buffer): InsumoCsvRow[] {
  const text = buffer.toString('utf8');

  // Auto-detectar delimitador mirando la primera línea (Excel en español usa ';'
  // porque ',' es decimal; archivos exportados de otras herramientas pueden usar
  // ',' o tab). Detectamos cuál aparece más veces en la cabecera.
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = {
    ',':  (firstLine.match(/,/g)  || []).length,
    ';':  (firstLine.match(/;/g)  || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
  };
  const delimiter = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? ',';

  // Parseamos con cabecera
  const records: any[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    relax_quotes: true,            // tolera comillas mal cerradas
    relax_column_count: false,     // sigue fallando si una fila tiene cols extra/de menos
                                   // (mejor avisar que silenciar bugs del CSV)
  });

  // Normalizamos/validamos
  const out: InsumoCsvRow[] = [];

  for (const r of records) {
    // Normalizar nombres de columnas (ej: “Código”, “CODIGO”, etc.)
    const entries = Object.entries(r).reduce<Record<string, any>>((acc, [k, v]) => {
      acc[String(k).toLowerCase().trim()] = typeof v === 'string' ? v.trim() : v;
      return acc;
    }, {});

    const codigoRaw = entries['codigo'];
    const costoRaw = entries['costo'];

    if (!codigoRaw) continue;

    // Convertir costo a number (punto o coma decimal)
    let costoNum: number | null = null;
    if (costoRaw !== undefined && costoRaw !== null && String(costoRaw).length > 0) {
      const normalized = String(costoRaw).replace(/\./g, '').replace(',', '.'); // “1.234,56” → “1234.56”
      const n = Number(normalized);
      if (!Number.isNaN(n)) costoNum = n;
    }

    // Si no hay costo numérico válido, salteamos la fila (o podrías push con null y reportar)
    if (costoNum === null) continue;

    out.push({
      codigo: String(codigoRaw).trim(),
      costo: costoNum,
      ...entries,
    });
  }

  return out;
}
