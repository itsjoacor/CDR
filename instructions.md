# TexCDR — Instrucciones del Proyecto

> **Para el agente que reciba este archivo**: este documento es el punto de entrada para entender el sistema. Léelo completo antes de tocar código.

---

## 1. ¿Qué es TexCDR?

**TexCDR** es un sistema web fullstack para calcular y administrar el **CDR (Costo De Reposición)** de una empresa textil con **dos plantas productivas**: **Catamarca** y **Varela**.

El CDR es el costo total que tiene producir un producto en función de:
- El **costo de sus ingredientes** (insumos, mano de obra, energía y otros productos intermedios).
- Un **porcentaje de mantención** que se aplica según el sector productivo.
- Un **porcentaje de flete** opcional, configurable por planta.

El sistema permite cargar recetas, calcular CDR automáticamente, importar volúmenes mensuales de producción, y obtener reportes consolidados por sector, por planta y por período.

---

## 2. Glosario de negocio

| Término | Significado |
|---|---|
| **CDR** | Costo De Reposición. Es el indicador central del sistema. |
| **Producto** | Ítem fabricado. Cada producto pertenece a una planta y un sector productivo. Tiene una receta. |
| **Receta** | Composición de un producto: lista de ingredientes con cantidad y costo. |
| **Ingrediente** | Puede ser un **insumo**, **mano de obra**, **energía**, u **otro producto** (referencias cruzadas). |
| **Sector productivo** | Agrupación que define el porcentaje de mantención (ej. Tejido, Tintorería, Confección). |
| **Mantención** | % adicional sobre el CDR base, definido por sector. |
| **Flete** | % adicional sobre CDR + mantención, configurable por planta. Solo aplica si el producto tiene `lleva_flete = true`. |
| **Planta** | `catamarca` o `varela`. Toda entidad (producto, insumo, MO, ME, receta, sector) tiene una planta asociada. |
| **Implosión** | Proceso de cargar un Excel con volúmenes mensuales y calcular CDR × volumen para cada producto. |
| **Período** | Mes/año de una implosión (ej. `2026-05`). Es único por planta: el mismo período puede existir en ambas plantas. |
| **Resultados CDR** | Tabla agregada por producto con su CDR base, CDR con mantención y CDR final con flete. |

---

## 3. Fórmulas centrales

```
CDR base          = Σ (cantidad_ingrediente × valor_cdr_ingrediente)
CDR con mantención = CDR base × (1 + % mantención del sector)
CDR final          = CDR con mantención × (1 + % flete de la planta)    ← solo si producto.lleva_flete = true
                   = CDR con mantención                                  ← si lleva_flete = false
```

Para implosión (volumen):

```
CDR por volumen        = valor_cdr_ingrediente × volumen del producto
Aporte de flete        = CDR por volumen × (% flete / 100)    ← solo si producto.lleva_flete = true
CDR por volumen final  = CDR por volumen + aporte de flete
```

---

## 4. Stack técnico

### Backend
- **NestJS 11** + **TypeScript**.
- **Supabase** (Postgres) como base de datos, con RLS habilitado.
- Auth con **JWT** (token guardado en cookie del frontend).
- Servicios con `Scope.REQUEST` para propagar el token de Supabase por request.
- Excel I/O con `xlsx`.

### Frontend
- **Vite + React 18 + TypeScript**.
- **shadcn/ui** (Radix + Tailwind) como librería de componentes.
- **TailwindCSS** para estilos.
- **React Router v6** para navegación.
- **React Context** para estado global de planta seleccionada.
- **js-cookie** para persistir el token de auth.

### Infra / Persistencia
- Postgres en Supabase (cliente y schema `public`).
- Backups con `pg_dump` (PostgreSQL 17.4 mínimo).
- Migrations SQL manuales en `/migrations/`.

---

## 5. Estructura de carpetas

```
CDR/
├── backend/                       # API NestJS
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/                # Supabase client + helpers de planta
│   │   ├── productos/             # CRUD productos + flete cascading
│   │   ├── insumo/                # CRUD insumos
│   │   ├── matrizMano/            # CRUD mano de obra
│   │   ├── matrizEnergia/         # CRUD energía
│   │   ├── sectorProductivo/      # CRUD sectores
│   │   ├── receta/                # CRUD recetas crudas
│   │   ├── recetaNormalizada/     # Recetas con valor_cdr calculado
│   │   ├── resultadosCDR/         # Tabla de resultados por producto
│   │   ├── plantas/               # Config de % flete por planta + recálculo
│   │   ├── implosion/             # Import de Excel + cálculo volumen
│   │   ├── importacion/           # Import bulk de catálogos
│   │   ├── exportacion/           # Export a Excel
│   │   ├── referencias/           # Buscador cross-tabla (autocomplete)
│   │   ├── autoComplete/          # Endpoint de autocomplete genérico
│   │   └── tablaConfig/           # Metadata para vistas dinámicas
│   └── package.json
│
├── front-tex/                     # SPA React
│   ├── src/
│   │   ├── App.tsx                # Router principal
│   │   ├── main.tsx
│   │   ├── components/            # UI compartido + shadcn/ui
│   │   │   └── Layout.tsx         # Layout con sidebar + selector de planta
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx    # Token + user
│   │   │   └── PlantaContext.tsx  # Planta global (catamarca / varela / all)
│   │   ├── hooks/                 # Hooks reutilizables
│   │   ├── lib/                   # Utilidades (cn, fetch helpers, etc.)
│   │   └── pages/                 # Pantallas (ver detalle abajo)
│   └── package.json
│
├── migrations/                    # SQL migrations manuales
│   └── 001_plantas_y_fletes.sql
│
├── backup/                        # Backups de DB (pg_dump)
│   ├── backup.sh
│   └── backup_texcdr_*.sql
│
├── README.md
└── instructions.md                # ← este archivo
```

---

## 6. Tablas principales en Supabase

| Tabla | Descripción |
|---|---|
| `productos` | Productos. Columnas clave: `codigo_producto` (PK), `descripcion_producto`, `sector_productivo`, `planta`, `lleva_flete`. |
| `insumos` | Insumos. Columnas: `codigo` (PK), `detalle`, `valor`, `planta`. |
| `matriz_mano` | Mano de obra. `codigo_mano_obra` (PK), `descripcion`, `valor`, `planta`. |
| `matriz_energia` | Energía. `codigo_energia` (PK), `descripcion`, `valor`, `planta`. |
| `sectores_productivos` | Sectores. `nombre` + `porcentaje_mantencion` + `planta`. |
| `recetas` | Receta cruda: producto + ingrediente + cantidad + costo. |
| `recetas_normalizada` | Receta con `valor_cdr` ya calculado por ingrediente. `planta` heredada del producto. |
| `resultados_cdr` | Resultado agregado por producto: `base_cdr`, `base_cdr_final` (con mantención), `monto_flete`, `valor_cdr_final` (total). |
| `plantas` | Config global por planta: `nombre`, `porcentaje_flete`. |
| `implosion_periodos` | Catálogo de períodos cargados. **PK compuesta: `(periodo, planta)`**. |
| `implosion_detalle` | Detalle de cada implosión: producto + ingrediente + volumen + cdr_volumen + flete_aporte + cdr_volumen_final. |

---

## 7. Pantallas del frontend (resumen)

| Ruta | Componente | Función |
|---|---|---|
| `/login` | `Login.tsx` | Autenticación. |
| `/seleccion-planta` | `SeleccionPlanta.tsx` | Pantalla post-login con 3 cards (Catamarca / Varela / Ambas). |
| `/dashboard` | `Dashboard.tsx` | Resumen general. |
| `/producto` | `Producto.tsx` | Listado y edición inline de productos (con toggle `lleva_flete`). |
| `/cargar-producto` | `CargarProducto.tsx` | Crear producto nuevo. |
| `/insumos` | `Insumos.tsx` | Listado de insumos. |
| `/cargar-insumo` | `CargarInsumo.tsx` | Crear insumo. |
| `/mano-obra` | `ManoObra.tsx` | Listado de mano de obra. |
| `/matriz-energetica` | `MatrizEnergetica.tsx` | Listado de energía. |
| `/receta` | `Receta.tsx` | Listado de recetas. |
| `/cargar-receta` | `CargarReceta.tsx` | Crear receta para un producto. |
| `/receta-detallada` | `RecetaDetallada.tsx` | Ver receta normalizada de un producto. |
| `/editar-composicion` | `EditarComposicion.tsx` | Editar receta inline. |
| `/cdr` | `CDR.tsx` | **Resultados CDR**: tabla con CDR Total por producto + buscador con autocomplete. |
| `/cdr-por-sector` | `CDRPorSector.tsx` | CDR agrupado por sector. |
| `/importacion` | `Importacion.tsx` | Importar catálogos desde Excel. |
| `/exportacion` | `Exportacion.tsx` | Exportar datos a Excel. |
| `/implosion-volumen` | `ImplosionVolumen.tsx` | Cargar Excel de volúmenes mensuales. |
| `/resultados-volumen` | `ResultadosVolumen.tsx` | Visualización multi-vista (Corrido / Detalle / Por sector) + exportar/borrar período. |
| `/actualizar-flete/catamarca` | `ActualizarFleteCatamarca.tsx` | Editar % flete Catamarca (usa `_ActualizarFlete.tsx`). |
| `/actualizar-flete/varela` | `ActualizarFleteVarela.tsx` | Editar % flete Varela. |
| `/actualizar-mantencion` | `ActualizarMantencion.tsx` | Editar % mantención por sector. |
| `/actualizacion-mo` | `ActualizacionMO.tsx` | Bulk update de valores de mano de obra. |
| `/actualizacion-me` | `ActualizacionME.tsx` | Bulk update de valores de energía. |
| `/actualizacion` | `Actualizacion.tsx` | Bulk update de insumos. |

---

## 8. Convenciones y patrones clave

### Frontend
- **Selector global de planta** (`PlantaContext`): expone `planta` (`'catamarca' | 'varela' | 'all'`), `plantaParam` (string para querystring), y `plantaParaEscritura` (la planta puntual, o `null` si está en modo `'all'`).
- Toda página que **liste** datos filtra con `?planta=${plantaParam}`.
- Toda página que **escriba** (crear/editar/borrar/importar) requiere `plantaParaEscritura` ≠ `null` — si está en modo `'all'`, se bloquea con un toast.
- **`useToast`** (de `@/hooks/use-toast`) para feedback. Usar `variant: 'destructive'` para errores.
- **`Cookies.get('token')`** para auth, se envía en header `Authorization: Bearer ${token}`.
- **Componentes shadcn** (`@/components/ui/*`) — no reinventar botones, inputs, cards.
- **Layout** envuelve toda página con sidebar + header (que contiene el selector de planta).

### Backend
- **`Scope.REQUEST`** en todos los services para tener acceso al token Supabase de la request actual.
- **`getSupabaseClient(token)`** desde `config/supabase.client.ts` — crea cliente con el token del usuario (respeta RLS).
- **`aplicarFiltroPlanta(query, planta)`** desde `config/planta.helper.ts` — helper centralizado para filtrar por planta de forma consistente.
- **`normalizarPlanta(raw)`** y **`validarPlantaEscritura(planta)`** para validar input.
- **DTOs con `class-validator`** para body validation.
- **Errores con NestJS exceptions** (`NotFoundException`, `BadRequestException`).

### Naming
- Backend: módulos en camelCase singular (`producto`, `insumo`, `receta`), archivos con sufijo `.controller.ts`, `.service.ts`, `.repository.ts`, `.dto.ts`, `.interface.ts`, `.model.ts`.
- Frontend: páginas en PascalCase (`Producto.tsx`), componentes en `components/` también PascalCase.
- DB: snake_case en columnas (`codigo_producto`, `valor_cdr_final`).

---

## 9. Flujos críticos

### Flujo 1 — Cálculo de CDR de un producto
1. Usuario crea receta (`CargarReceta.tsx`).
2. Backend en `recetaNormalizada` calcula `valor_cdr` por ingrediente.
3. Se inserta/actualiza fila en `resultados_cdr` con `base_cdr` = Σ valor_cdr × cantidad.
4. Se calcula `base_cdr_final` = `base_cdr × (1 + % mantención del sector)`.
5. Si `producto.lleva_flete = true`: `monto_flete = base_cdr_final × (% flete planta / 100)` y `valor_cdr_final = base_cdr_final + monto_flete`.
6. Si `lleva_flete = false`: `valor_cdr_final = base_cdr_final`.

### Flujo 2 — Cambio de % flete global
1. Usuario edita % en `ActualizarFlete*.tsx`.
2. PUT `/plantas/:nombre/flete` actualiza `plantas.porcentaje_flete`.
3. Backend dispara `PlantasService.recalcularFletesDeProductos(planta)`:
   - Busca productos de esa planta con `lleva_flete = true`.
   - Para cada uno, recalcula `monto_flete` y `valor_cdr_final` en `resultados_cdr`.
4. Frontend recarga conteo y muestra cuántos productos se afectaron.

### Flujo 3 — Toggle `lleva_flete` en un producto
1. Usuario marca/desmarca el checkbox "Aplica flete" en `Producto.tsx` (form inline).
2. PUT `/productos/:codigo` con `lleva_flete: true/false`.
3. `ProductoService.actualizar` detecta el cambio y llama `recalcularFleteDeProducto(codigo)`.
4. Resultado: la fila de `resultados_cdr` se actualiza.

### Flujo 4 — Implosión de un período
1. Usuario sube Excel en `ImplosionVolumen.tsx` con código + volumen + descripción.
2. Backend (`ImplosionService.importarPeriodo`):
   - Lee Excel, normaliza códigos, detecta duplicados y productos sin receta.
   - Obtiene recetas normalizadas filtradas por planta.
   - Obtiene % flete actual de la planta.
   - Calcula por cada fila: `cdr_volumen`, `flete_aporte` (si corresponde), `cdr_volumen_final`.
   - Upsert en `implosion_periodos` con PK compuesta `(periodo, planta)`.
   - Borra detalle anterior del mismo `(periodo, planta)` y reinserta.
3. Frontend muestra resumen (cuántos cargados / ignorados / duplicados).

---

## 10. Cómo correr el proyecto

### Variables de entorno
**Backend** (`backend/.env`):
```
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
PORT=3000
```

**Frontend** (`front-tex/.env`):
```
VITE_API_URL=http://localhost:3000
```

### Comandos
```bash
# Backend
cd backend
npm install
npm run start:dev   # http://localhost:3000

# Frontend
cd front-tex
npm install
npm run dev         # http://localhost:5173 (o 5174 si está ocupado)
```

### Backup de DB
```bash
cd backup
./backup.sh         # genera backup_texcdr_full_<timestamp>.sql con pg_dump
```

### Migrations
Aplicar manualmente en Supabase SQL Editor:
```bash
cat migrations/001_plantas_y_fletes.sql
```

---

## 11. Reglas de oro al modificar el código

1. **Nunca filtrar listados sin tener en cuenta `plantaParam`** — toda query a Supabase del lado backend que liste datos debe pasar por `aplicarFiltroPlanta`.
2. **Cualquier mutación de `productos.lleva_flete`, `productos.planta`, o `plantas.porcentaje_flete`** debe disparar el recálculo correspondiente. Es la responsabilidad de `ProductoService` / `PlantasService`.
3. **No duplicar lógica de cálculo de CDR**: la fórmula vive en `PlantasService` (para flete) y en `recetaNormalizada` (para base). Reusar, no copiar.
4. **No romper el modo "Ambas plantas"**: las pantallas de lectura deben funcionar; las de escritura deben bloquear con toast claro.
5. **Validar input de planta** con `normalizarPlanta` / `validarPlantaEscritura` en backend, no asumir nada.
6. **Re-importar un período es replace, no append**: borrar detalle existente del mismo `(periodo, planta)` antes de insertar.
7. **Usar shadcn/ui** y la paleta del proyecto. Colores: ámbar para Catamarca, celeste para Varela, verde para confirmaciones, rojo para destructivos.
8. **Todo cambio que afecte cálculo de CDR debería tener un test manual de regresión** comparando antes/después en `resultados_cdr` para al menos 1 producto con flete y 1 sin.

---

## 12. Estado actual del proyecto

- Multi-planta y sistema de flete **completos** y en producción.
- Buscador con autocomplete en CDR **agregado**.
- Columna "CDR Total" en lugar de "Base CDR" en pantalla CDR.
- Pendientes conocidos (opcionales):
  - Mostrar badge cross-planta cuando un producto usa ingredientes de la otra planta.
  - Considerar si `ResultadosVolumen` debería mostrar `cdr_volumen_final` (con flete) en lugar de `cdr_volumen` puro — hoy muestra el valor sin flete.

---

## 13. Contacto / Convenciones de trabajo

- Idioma del código y UI: **español rioplatense** (vos, no tú).
- Comentarios en código: solo cuando expliquen el **porqué**, nunca el qué.
- Commits: mensajes en español, descriptivos.
- Antes de modificar cálculos de CDR: leer este archivo completo y los flujos críticos de la sección 9.
