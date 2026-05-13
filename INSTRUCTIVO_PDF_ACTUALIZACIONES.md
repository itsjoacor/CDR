# Instructivo para Generación de PDF — Actualizaciones del Sistema CDR

## Contexto para el agente

Necesito que armes un **PDF profesional, claro y visualmente atractivo** dirigido a un **cliente final no técnico** (gerencia / administración de planta textil). El documento debe presentar todas las actualizaciones recientes del sistema CDR (Costo De Reposición) de manera entendible, ordenada y vendible — el cliente debe poder leerlo y entender en 5 minutos qué se construyó y qué beneficios obtiene.

No es documentación técnica: es un **resumen ejecutivo de features**. Evitar jerga de programación (no mencionar columnas de base de datos, endpoints, servicios, etc.). Hablar en términos de **funcionalidad, pantallas y beneficios**.

---

## Lineamientos de estilo y formato

### Tono
- **Profesional pero cercano**, en español rioplatense (vos, no tú).
- Frases cortas, directas, orientadas al beneficio.
- Evitar tecnicismos: si hay que mencionar algo técnico, traducirlo a lenguaje de negocio.

### Estructura sugerida del PDF
1. **Portada**:
   - Título: "Actualizaciones del Sistema CDR"
   - Subtítulo: "Resumen de nuevas funcionalidades"
   - Logo placeholder (si no hay, dejar espacio).
   - Fecha: Mayo 2026.
2. **Página de índice** con las secciones agrupadas.
3. **Resumen ejecutivo** (1 carilla): 3-4 párrafos cortos contando los 3 pilares principales del trabajo (Multi-Planta / Flete / Mejoras de análisis).
4. **Secciones temáticas** con los items detallados abajo.
5. **Cierre**: una página de "Próximos pasos" o "Resumen de beneficios" (podés inventarla a partir del contenido).

### Visual / Diseño
- **Paleta sugerida**:
  - Color primario: azul oscuro corporativo (ej. #1E3A8A).
  - Acentos: **ámbar (#D97706) para todo lo relacionado a Catamarca**, **celeste (#0284C7) para Varela**, verde para confirmaciones, naranja para advertencias.
- **Tipografía**: sans-serif moderna (Inter, Helvetica, o similar).
- **Iconos**: usar pictogramas simples al lado de cada feature (camión 🚚 para flete, fábrica 🏭 para planta, lupa 🔍 para búsquedas, gráfico 📊 para análisis, etc.).
- **Mockups / Capturas**: dejar espacios marcados con `[CAPTURA: descripción]` donde correspondería incluir una pantalla del sistema. No hace falta generarlas, solo señalizar dónde van.
- **Cajas destacadas** para los puntos clave de cada feature (qué cambia, beneficio).
- **Iconos de check ✅** al inicio de cada beneficio listado.
- Buen uso de **whitespace** — no comprimir todo, una feature por bloque visual.

### Agrupación recomendada (secciones)
Te sugiero agrupar los 15 items en 4 grandes secciones temáticas:

1. **Soporte Multi-Planta** (items 1, 2, 3)
2. **Sistema de Flete por Planta** (items 4, 5, 6)
3. **Implosión y Análisis de Volumen** (items 7, 11, 12, 13, 14, 15)
4. **Mejoras de Visualización en CDR** (items 8, 9, 10)

---

## Contenido a incluir (items completos)

A continuación los 15 items con título, descripción y bullet points. Respetar todo el contenido pero podés reformular títulos para que suenen más comerciales.

---

### Item 1 — Soporte Multi-Planta

- Sistema preparado para operar con **dos plantas**: **Catamarca** y **Varela**.
- Cada planta administra sus propios **productos, insumos, mano de obra, sectores productivos y matriz de energía**.
- Los productos pueden **usar ingredientes de la otra planta** (referencias cruzadas) sin perder trazabilidad.
- Los códigos de producto son **únicos globalmente** (un código pertenece a una sola planta).

### Item 2 — Pantalla de Selección Inicial

- Apenas se ingresa al sistema aparece una pantalla con **3 opciones**:
  - **Catamarca** (color ámbar)
  - **Varela** (color celeste)
  - **Ambas plantas** (vista consolidada)
- La selección queda **guardada en el navegador** y se mantiene entre sesiones.

### Item 3 — Selector Global de Planta en Header

- Selector visible en la parte superior derecha de **todas las pantallas**.
- Permite **cambiar de planta en cualquier momento** sin perder el contexto.
- **Todos los listados** (Productos, Insumos, Recetas, CDR, Importación, Exportación) se filtran automáticamente por la planta seleccionada.

### Item 4 — Sistema de Flete Configurable por Planta

- Cada planta tiene un **porcentaje global de flete** editable (ambas inician en 0%).
- Nueva sección en el menú: **"Actualizar Fletes"** con submenús independientes para Catamarca y Varela.
- Cada producto tiene una opción **"🚚 Aplica flete"** (activable/desactivable):
  - Si está **activa**: al CDR final del producto se le suma el % de flete de su planta.
  - Si está **inactiva**: el producto no se ve afectado por el flete, aunque el % global cambie.

### Item 5 — Recálculo Automático en Cascada

- Al modificar el % de flete de una planta, el sistema **recalcula automáticamente** el CDR final de todos los productos de esa planta que tienen "Aplica flete" activado.
- Al togglear "Aplica flete" en un producto, su CDR final se actualiza al instante.
- **No afecta** ni a productos sin flete ni a productos de la otra planta.

### Item 6 — Feedback Visual en Edición de Flete

- Antes de guardar, badge informativo que muestra **cuántos productos serán afectados** ("X de Y productos afectables por flete").
- Aviso destacado si **ningún producto** de la planta tiene flete activado (evita confusión al guardar y "no ver cambios").
- Mensajes diferenciados al guardar:
  - "✅ Flete actualizado: se recalculó el CDR de X productos."
  - "⚠ Flete guardado, pero ningún producto tiene 'Aplica flete' marcado."

### Item 7 — Importación de Períodos por Planta

- La importación de cantidades por período ahora distingue por planta.
- Cada planta puede tener **los mismos códigos de período** sin conflicto.
- El cálculo de volumen incluye el aporte de flete cuando el producto lo lleva activado.

### Item 8 — Buscador en Pantalla de Resultados CDR

- Buscador con **lupa** en la cabecera de Resultados CDR.
- Busca por **código de producto o por descripción** mientras se escribe.
- **Autocomplete en vivo**: dropdown con sugerencias mostrando código, descripción y sector.
- Funciona combinado con el filtro por sector existente.

### Item 9 — Columna "CDR Total" en Resultados CDR

- La columna principal ahora muestra el **CDR Total** (no solo el CDR base).
- Fórmula del CDR Total:
  - **CDR Base** = Σ valor CDR de los ingredientes
  - **+ Mantención** = CDR Base × (1 + % mantención del sector)
  - **+ Flete** = se suma solo si el producto tiene "Aplica flete" activado
- Ícono 🚚 al lado del valor cuando el producto incluye flete en su cálculo.
- **Tooltip al pasar el mouse** sobre el número: muestra el desglose completo (CDR puro / + Mantención / + Flete / = Total).

### Item 10 — Mejoras de UX Transversales

- Formularios de creación de productos incluyen los nuevos campos **Planta** y **Aplica flete**.
- Formulario de edición inline de productos permite modificar **Aplica flete** sin recrear el producto.
- Vista consolidada "Ambas plantas" para reportes y comparativos globales.

### Item 11 — Implosión Volumen: Importación por Período

- Pantalla **"Implosión Volumen"** para cargar el **Excel de volúmenes mensuales** por planta.
- Selección de **año y mes** + planta activa (debe ser puntual, no funciona en modo "Ambas plantas").
- **Detección automática de columnas** del Excel (acepta variantes en nombres: código, descripción, volumen).
- **Validaciones automáticas al importar**:
  - **Códigos duplicados** dentro del Excel: se reportan y se usa el último valor cargado.
  - **Productos sin receta**: se muestran en un listado de "no cargados" y se ignoran.
  - **Filas vacías o numéricas inválidas**: se descartan defensivamente (no rompen la carga).
- **Re-importar un mismo período** hace un **reemplazo completo** del detalle (no genera duplicados).
- Los **períodos están separados por planta**: el mismo mes puede existir en Catamarca y Varela como cargas independientes.
- Mensaje final con el resumen: cuántos productos se cargaron, cuántos se ignoraron, cuántos códigos estaban duplicados.

### Item 12 — Cálculo de CDR × Volumen con Flete

- Al importar el período, el sistema calcula automáticamente para cada ingrediente de cada producto:
  - **Cantidad producida** = cantidad ingrediente × volumen del producto.
  - **CDR por volumen** = valor CDR × volumen (CDR base por volumen).
  - **Aporte de flete** = CDR por volumen × % flete de la planta (solo si el producto tiene "Aplica flete").
  - **CDR por volumen final** = CDR por volumen + aporte de flete.
- Se identifica automáticamente el **tipo de ingrediente** (insumo / energía / mano de obra / producto) para análisis posterior.
- El cálculo respeta el flete vigente al momento de la importación.

### Item 13 — Resultados Volumen: Visualización Multi-Vista

- Pantalla **"Resultados Volumen"** con varias vistas para analizar la implosión:
  - **Vista Corrido**: evolución mensual del CDR total y por sector productivo a lo largo del año, filtrada por planta.
  - **Vista Detalle por Período**: listado completo de productos e ingredientes de un período puntual, con volumen, cantidad producida y CDR por volumen.
  - **Vista Por Sector**: agrupa los resultados de un período por sector productivo, mostrando el peso relativo de cada uno.
- **Todas las vistas se filtran automáticamente** por la planta activa del header.
- **Identificación visual del tipo de ingrediente** (insumo / energía / mano de obra / producto) en el detalle.

### Item 14 — Exportación de Implosión a Excel

- Botón **"Exportar"** dentro de Resultados Volumen para descargar el detalle completo del período seleccionado.
- El Excel incluye: producto, sector, ingrediente, volumen, cantidad producida, costo, CDR por volumen, aporte de flete y CDR por volumen final.
- La exportación requiere planta puntual (no funciona en "Ambas plantas").

### Item 15 — Eliminación Segura de Períodos

- Posibilidad de **borrar un período completo** desde Resultados Volumen (con confirmación).
- Solo afecta a la **planta activa**: borrar un período en Catamarca no toca el mismo período de Varela.
- Tras borrar, la lista de períodos se refresca automáticamente.

---

## Mockup textual de ejemplo (referencia visual)

Una página tipo para cada feature podría verse así:

```
┌─────────────────────────────────────────────────────────────┐
│  🚚  SISTEMA DE FLETE CONFIGURABLE POR PLANTA              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cada planta cuenta con un porcentaje de flete propio       │
│  y editable, que impacta solo en los productos que tienen   │
│  habilitada la opción "Aplica flete".                       │
│                                                             │
│  ✅  Porcentaje configurable por planta (Catamarca/Varela)  │
│  ✅  Activación individual por producto                     │
│  ✅  Recálculo automático del CDR al cambiar el %           │
│  ✅  No afecta productos sin flete activado                 │
│                                                             │
│       [CAPTURA: pantalla "Actualizar Flete Catamarca"]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Replicá ese patrón para los 15 items, con su ícono, título reformulado en clave de beneficio, párrafo descriptivo y bullets de funcionalidades.

---

## Entregable esperado

Un PDF (o archivo equivalente que se pueda exportar a PDF: HTML imprimible, archivo de Pages/Word, etc.) con:

- Portada profesional.
- Índice.
- Resumen ejecutivo.
- 4 secciones temáticas con los 15 items integrados.
- Cierre con beneficios resumidos.
- Diseño limpio, espacioso y orientado a un cliente no técnico.

Si necesitás aclaraciones sobre algún feature, preguntá antes de inventar contenido.
