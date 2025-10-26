// backend/src/importacion/importacion.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { InsumoCsvRow, parseCsvBuffer } from './utils/csv.helper';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

@Injectable()
export class ImportacionService {
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

        // Tabla temporal
        await client.query(`
          CREATE TEMP TABLE temp_insumos_import (
            codigo text,
            costo  numeric
          ) ON COMMIT DROP;
        `);

        // Inserción en lote con UNNEST para acelerar
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

        // UPDATE masivo
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
      // Log controlado
      console.error('[ImportacionService] Error al importar CSV:', err?.message || err);
      throw new BadRequestException(err?.message || 'Error procesando CSV');
    }
  }
}
