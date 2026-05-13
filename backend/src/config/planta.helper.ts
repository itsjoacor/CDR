/**
 * Helper para manejar la planta en queries y validaciones.
 * Centralizado acá para que todos los módulos lo usen igual.
 */

export type PlantaQuery = 'catamarca' | 'varela' | 'all' | undefined;

export const PLANTAS_VALIDAS = ['catamarca', 'varela'];

/**
 * Normaliza el query param `planta` que viene del frontend.
 * Acepta: 'catamarca', 'varela', 'all', 'ambas', '', undefined → vista combinada.
 * Devuelve: 'catamarca' | 'varela' | null (null = sin filtro = ambas)
 */
export function normalizarPlanta(raw?: string | null): 'catamarca' | 'varela' | null {
  if (!raw) return null;
  const v = String(raw).toLowerCase().trim();
  if (v === 'all' || v === 'ambas' || v === '') return null;
  if (PLANTAS_VALIDAS.includes(v)) return v as 'catamarca' | 'varela';
  return null; // valor raro → no filtra
}

/**
 * Aplica filtro `.eq('planta', X)` a un query de Supabase solo si la planta está definida.
 * Devuelve el query (chaineable).
 */
export function aplicarFiltroPlanta(query: any, planta: 'catamarca' | 'varela' | null) {
  if (planta) return query.eq('planta', planta);
  return query;
}

/**
 * Valida que una planta sea válida para escritura.
 * Lanza error si no lo es.
 */
export function validarPlantaEscritura(planta?: string): 'catamarca' | 'varela' {
  if (!planta) throw new Error('Falta el campo "planta" (catamarca o varela)');
  const v = String(planta).toLowerCase().trim();
  if (!PLANTAS_VALIDAS.includes(v)) {
    throw new Error(`Planta inválida: ${planta}. Debe ser "catamarca" o "varela".`);
  }
  return v as 'catamarca' | 'varela';
}
