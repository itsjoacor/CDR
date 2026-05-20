import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package, ShoppingCart, HardHat, Zap, ClipboardList, DollarSign, FileSpreadsheet,
  CheckCircle2, X, Info, AlertTriangle, Download, Upload, BookOpen,
} from 'lucide-react';

type ColMeta = {
  nombre: string;
  tipo: string;
  importable: 'requerido' | 'opcional' | 'ignorado' | 'auto';
  nota?: string;
};

type TablaInfo = {
  key: string;
  titulo: string;
  icono: any;
  color: string;
  exportable: boolean;
  importable: boolean;
  resumen: string;
  conflictoUpsert: string;
  notas?: string[];
  columnas: ColMeta[];
};

const TABLAS: TablaInfo[] = [
  {
    key: 'productos',
    titulo: 'Productos',
    icono: ShoppingCart,
    color: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800',
    exportable: true,
    importable: true,
    resumen: 'Catálogo de productos finales (lo que sale a la venta). Códigos globales.',
    conflictoUpsert: 'codigo_producto (global, no por planta)',
    notas: [
      'Los códigos de producto son GLOBALES: el mismo código no puede vivir en ambas plantas.',
      'Si intentás cargar un código que ya existe en la otra planta, el import se rechaza con la lista de conflictos antes de tocar la DB.',
      'Cualquier receta de cualquier planta puede usar un producto como ingrediente, sin importar en qué planta está el producto.',
      'lleva_flete acepta: SI / NO / TRUE / FALSE / 1 / 0 (case-insensitive). Vacío = NO.',
      'm3 acepta decimales con coma o punto (ej: 0,000162 ó 0.000162). Precisión hasta 10 decimales.',
      'La planta NO va en el CSV — se toma del selector global del header al importar.',
    ],
    columnas: [
      { nombre: 'codigo_producto',      tipo: 'texto',  importable: 'requerido', nota: 'PK — código único del producto' },
      { nombre: 'descripcion_producto', tipo: 'texto',  importable: 'requerido' },
      { nombre: 'sector_productivo',    tipo: 'texto',  importable: 'requerido', nota: 'Debe existir en sectores_productivos para esta planta' },
      { nombre: 'lleva_flete',          tipo: 'SI/NO',  importable: 'opcional',  nota: 'Si no se manda, queda en NO' },
      { nombre: 'm3',                   tipo: 'decimal',importable: 'opcional',  nota: 'Volumen del producto en m³. Solo se usa si lleva_flete = SI' },
      { nombre: 'planta',               tipo: 'texto',  importable: 'auto',      nota: 'Se asigna desde el selector global' },
      { nombre: 'created_at',           tipo: 'fecha',  importable: 'ignorado',  nota: 'La pone la DB' },
      { nombre: 'updated_at',           tipo: 'fecha',  importable: 'ignorado',  nota: 'La pone la DB' },
    ],
  },
  {
    key: 'insumos',
    titulo: 'Insumos',
    icono: Package,
    color: 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800',
    exportable: true,
    importable: true,
    resumen: 'Catálogo de materiales comprados externamente, con su costo. Por planta.',
    conflictoUpsert: '(codigo, planta)',
    notas: [
      'El catálogo es por planta: el mismo código puede convivir en Catamarca y Varela como insumos distintos con costos distintos.',
      'La planta se toma del selector global del header al importar. NO incluir columna planta en el CSV.',
      'Las recetas de cada planta usan únicamente el insumo de SU planta. Si una receta referencia un código que no existe en su planta, el costo queda en 0 / NULL.',
      'El costo acepta formato argentino: "1.234,56" → 1234.56. También "1234.56" o "1234,56".',
      'No borra insumos existentes — solo agrega o actualiza por (codigo, planta).',
    ],
    columnas: [
      { nombre: 'grupo',   tipo: 'texto',   importable: 'requerido' },
      { nombre: 'codigo',  tipo: 'texto',   importable: 'requerido', nota: 'Parte de la PK compuesta con planta' },
      { nombre: 'detalle', tipo: 'texto',   importable: 'requerido', nota: 'Descripción' },
      { nombre: 'costo',   tipo: 'decimal', importable: 'opcional',  nota: 'Si está vacío queda null' },
      { nombre: 'planta',  tipo: 'texto',   importable: 'auto',      nota: 'Se asigna desde el selector global del header' },
    ],
  },
  {
    key: 'matriz_mano',
    titulo: 'Mano de Obra',
    icono: HardHat,
    color: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800',
    exportable: true,
    importable: true,
    resumen: 'Tiempos estándar, salarios y consumo energético por operación de mano de obra. Por planta.',
    conflictoUpsert: '(sector_productivo, codigo_mano_obra, planta)',
    notas: [
      'Por planta: las recetas de cada planta solo usan códigos de MO de SU planta. Si un código no existe en la planta de la receta, el costo queda en 0/NULL.',
      'El mismo código puede convivir en Catamarca y Varela con valores distintos.',
      'std_produccion es editable y cuando se modifica acá, se sincroniza automáticamente a matriz_energia.',
      'costo_mano_obra y cantidad_personal_estimado son columnas GENERATED — calculadas por la DB, NO se envían.',
    ],
    columnas: [
      { nombre: 'sector_productivo',         tipo: 'texto',  importable: 'requerido' },
      { nombre: 'codigo_mano_obra',          tipo: 'texto',  importable: 'requerido', nota: 'PK compuesta con sector + planta' },
      { nombre: 'descripcion',               tipo: 'texto',  importable: 'requerido' },
      { nombre: 'consumo_kw_std',            tipo: 'decimal',importable: 'requerido' },
      { nombre: 'std_produccion',            tipo: 'decimal',importable: 'requerido' },
      { nombre: 'horas_hombre_std',          tipo: 'decimal',importable: 'requerido' },
      { nombre: 'valor_hora_hombre',         tipo: 'decimal',importable: 'requerido', nota: 'Suele venir del actualizador global de costos' },
      { nombre: 'horas_por_turno',           tipo: 'decimal',importable: 'requerido' },
      { nombre: 'producto_calculado_std',    tipo: 'texto',  importable: 'opcional' },
      { nombre: 'planta',                    tipo: 'texto',  importable: 'auto' },
      { nombre: 'costo_mano_obra',           tipo: 'decimal',importable: 'ignorado', nota: 'GENERATED por la DB' },
      { nombre: 'cantidad_personal_estimado',tipo: 'decimal',importable: 'ignorado', nota: 'GENERATED por la DB' },
    ],
  },
  {
    key: 'matriz_energia',
    titulo: 'Matriz Energética',
    icono: Zap,
    color: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800',
    exportable: true,
    importable: true,
    resumen: 'Consumo y costo energético por operación. Linkea con matriz_mano por (sector, codigo_mano_obra). Por planta.',
    conflictoUpsert: '(codigo_energia, planta)',
    notas: [
      'Por planta: las recetas de cada planta solo usan códigos de ME de SU planta.',
      'El mismo código puede convivir en Catamarca y Varela con valores distintos.',
      'std_produccion es opcional al importar: si no se manda, la DB lo autocompleta desde matriz_mano por el trigger.',
      'total_pesos_std y costo_energia_unidad son columnas GENERATED — NO se envían.',
    ],
    columnas: [
      { nombre: 'sector_productivo',     tipo: 'texto',   importable: 'requerido' },
      { nombre: 'codigo_mano_obra',      tipo: 'texto',   importable: 'requerido', nota: 'FK a matriz_mano' },
      { nombre: 'codigo_energia',        tipo: 'texto',   importable: 'requerido', nota: 'PK compuesta con planta' },
      { nombre: 'descripcion',           tipo: 'texto',   importable: 'requerido' },
      { nombre: 'consumo_kw_std',        tipo: 'decimal', importable: 'requerido' },
      { nombre: 'valor_kw',              tipo: 'decimal', importable: 'requerido', nota: 'Suele venir del actualizador global de costos' },
      { nombre: 'std_produccion',        tipo: 'decimal', importable: 'opcional',  nota: 'Si vacío, lo trae del trigger desde matriz_mano' },
      { nombre: 'planta',                tipo: 'texto',   importable: 'auto' },
      { nombre: 'total_pesos_std',       tipo: 'decimal', importable: 'ignorado',  nota: 'GENERATED por la DB' },
      { nombre: 'costo_energia_unidad',  tipo: 'decimal', importable: 'ignorado',  nota: 'GENERATED por la DB' },
    ],
  },
  {
    key: 'recetas_normalizada',
    titulo: 'Recetas',
    icono: ClipboardList,
    color: 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800',
    exportable: true,
    importable: true,
    resumen: 'Insumos / mano de obra / energía que componen cada producto, con cantidades.',
    conflictoUpsert: '(codigo_producto, codigo_ingrediente, planta)',
    notas: [
      'La importación masiva está en una sección aparte ("Zona Peligrosa") porque puede borrar recetas existentes.',
      'Solo importa 3 columnas: producto, ingrediente, cantidad. Todo lo demás (descripciones, costos, CDR) se busca/calcula en la DB.',
      'Las descripciones del CSV se IGNORAN — siempre se obtienen de las tablas productos / insumos / matriz_mano / matriz_energia.',
    ],
    columnas: [
      { nombre: 'codigo_producto',      tipo: 'texto',  importable: 'requerido' },
      { nombre: 'codigo_ingrediente',   tipo: 'texto',  importable: 'requerido', nota: 'Puede ser insumo, mano de obra o energía' },
      { nombre: 'cantidad_ingrediente', tipo: 'decimal',importable: 'requerido' },
      { nombre: 'descripcion',          tipo: 'texto',  importable: 'ignorado',  nota: 'Variante 2 del CSV — se ignora, viene de productos' },
      { nombre: 'descripcion_ingrediente', tipo: 'texto', importable: 'ignorado', nota: 'Variante 2 — se ignora, viene de insumos/mano/energia' },
      { nombre: 'costo_ingrediente',    tipo: 'decimal',importable: 'auto',      nota: 'La DB lo busca en tiempo real' },
      { nombre: 'costo_total',          tipo: 'decimal',importable: 'auto',      nota: 'GENERATED: cantidad × costo' },
      { nombre: 'valor_cdr',            tipo: 'decimal',importable: 'auto',      nota: 'Calculado por triggers' },
      { nombre: 'planta',               tipo: 'texto',  importable: 'auto' },
      { nombre: 'ultima_actualizacion', tipo: 'fecha',  importable: 'ignorado' },
    ],
  },
  {
    key: 'resultados_cdr',
    titulo: 'Resultados CDR',
    icono: DollarSign,
    color: 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800',
    exportable: true,
    importable: false,
    resumen: 'Costos finales por producto. Todo se calcula automáticamente por triggers — no se importa.',
    conflictoUpsert: '—',
    notas: [
      'Esta tabla es 100% calculada. La fórmula es: valor_cdr_final = base_cdr_final + monto_flete.',
      'base_cdr_final = base_cdr × (1 + % mantención del sector).',
      'monto_flete = valor_flete (de la planta) × m³ (del producto), si lleva_flete = SI.',
      'valor_cdr_final es una columna GENERATED — la DB la recalcula sola.',
    ],
    columnas: [
      { nombre: 'codigo_producto',      tipo: 'texto',   importable: 'auto',     nota: 'PK' },
      { nombre: 'sector_productivo',    tipo: 'texto',   importable: 'auto' },
      { nombre: 'descripcion_producto', tipo: 'texto',   importable: 'auto' },
      { nombre: 'base_cdr',             tipo: 'decimal', importable: 'auto',     nota: 'Suma de valor_cdr de los ingredientes' },
      { nombre: 'base_cdr_final',       tipo: 'decimal', importable: 'auto',     nota: 'base_cdr × (1 + mantención)' },
      { nombre: 'monto_flete',          tipo: 'decimal', importable: 'auto',     nota: 'valor_flete × m³ (si lleva flete)' },
      { nombre: 'valor_cdr_final',      tipo: 'decimal', importable: 'auto',     nota: 'GENERATED: base_cdr_final + monto_flete' },
    ],
  },
];

const BadgeImportable: React.FC<{ tipo: ColMeta['importable'] }> = ({ tipo }) => {
  const map: Record<ColMeta['importable'], { label: string; cls: string; icon: any }> = {
    requerido: { label: 'Requerido', cls: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700', icon: AlertTriangle },
    opcional:  { label: 'Opcional',  cls: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700', icon: Info },
    auto:      { label: 'Auto',      cls: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600', icon: CheckCircle2 },
    ignorado:  { label: 'Ignorado',  cls: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700', icon: X },
  };
  const cfg = map[tipo];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.cls} text-xs font-medium gap-1`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
};

const ManualCarga: React.FC = () => {
  return (
    <Layout title="Manual de Carga">
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="h-6 w-6" />
              Manual de Carga
            </CardTitle>
            <CardDescription className="text-blue-50">
              Referencia rápida de qué se puede exportar/importar, qué columnas son necesarias y cuáles
              se ignoran o se calculan solas. Si una tabla está vacía, descargá su <strong>Molde</strong>
              desde "Exportación" para obtener el formato exacto.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Leyenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leyenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <BadgeImportable tipo="requerido" />
              <span>La fila se descarta si esta columna falta o queda vacía.</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeImportable tipo="opcional" />
              <span>Se puede omitir o dejar vacío — el sistema usa un default.</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeImportable tipo="auto" />
              <span>El sistema la asigna o la calcula sola — no la pongas en el CSV.</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeImportable tipo="ignorado" />
              <span>Aparece en el export pero el importador la descarta. No la edites.</span>
            </div>
          </CardContent>
        </Card>

        {/* Tablas por entidad */}
        {TABLAS.map((t) => {
          const Icon = t.icono;
          return (
            <Card key={t.key} className={`border-2 ${t.color}`}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {t.titulo}
                    <code className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded ml-1">
                      {t.key}
                    </code>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {t.exportable && (
                      <Badge variant="outline" className="gap-1 bg-white/60 dark:bg-card">
                        <Download className="h-3 w-3" /> Exportable
                      </Badge>
                    )}
                    {t.importable ? (
                      <Badge variant="outline" className="gap-1 bg-white/60 dark:bg-card">
                        <Upload className="h-3 w-3" /> Importable
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400">
                        <X className="h-3 w-3" /> No importable
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2">{t.resumen}</CardDescription>
                <div className="text-xs text-muted-foreground mt-1">
                  <strong>Clave de upsert:</strong> <code>{t.conflictoUpsert}</code>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tabla de columnas */}
                <div className="rounded-md border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Columna</TableHead>
                        <TableHead className="w-24">Tipo</TableHead>
                        <TableHead className="w-32">Importar</TableHead>
                        <TableHead>Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.columnas.map((col) => (
                        <TableRow key={col.nombre}>
                          <TableCell className="font-mono text-xs">{col.nombre}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{col.tipo}</TableCell>
                          <TableCell><BadgeImportable tipo={col.importable} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{col.nota ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Notas */}
                {t.notas && t.notas.length > 0 && (
                  <div className="bg-white/60 dark:bg-card/60 border rounded-md p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <Info className="h-4 w-4" /> Notas
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {t.notas.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Footer / tips generales */}
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <FileSpreadsheet className="h-5 w-5" /> Tips generales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 dark:text-amber-200 space-y-2">
            <p>
              <strong>Decimales:</strong> el importador acepta tanto coma como punto. Si el CSV viene de
              Excel en argentino con miles, también funciona ("1.234,56" → 1234.56).
            </p>
            <p>
              <strong>Planta:</strong> nunca pongas la columna <code>planta</code> en el CSV. Cambiá el
              selector arriba a la derecha (Catamarca / Varela) <em>antes</em> de importar.
            </p>
            <p>
              <strong>Productos son globales, insumos / MO / ME son por planta:</strong> un código de
              producto solo puede vivir en una planta; el sistema rechaza el import si el código
              choca con la otra. Insumos, MO y ME en cambio se cargan por planta y el mismo código
              puede convivir con valores distintos. Cada receta usa el insumo/MO/ME de SU planta y los
              productos los puede usar como ingredientes sin importar dónde estén dados de alta.
            </p>
            <p>
              <strong>Re-importar entre plantas:</strong> si exportás insumos de Catamarca, cambiás el
              selector a Varela e importás ese CSV, el sistema asigna las filas a Varela (la columna
              <code>planta</code> del CSV se ignora). Es útil para clonar el catálogo de una planta a otra.
            </p>
            <p>
              <strong>Encoding:</strong> guardá los archivos como <code>UTF-8</code> para que se
              respeten las Ñ, tildes y caracteres como °/º. Si abrís un export en Excel y volvés a
              guardar, fijate que no te lo pase a Latin-1.
            </p>
            <p>
              <strong>Round-trip:</strong> exportar → editar → re-importar es seguro. Las columnas
              "ignorado"/"auto" no rompen nada.
            </p>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default ManualCarga;
