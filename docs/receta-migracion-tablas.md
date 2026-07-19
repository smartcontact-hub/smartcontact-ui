# Receta: migrar una tabla a `sc-datatable`

> Escrito tras migrar `labels` y `templates` (B4, sesión 16). No es teoría: es
> lo que hizo falta, incluidas las tres cosas que estuvieron a punto de colarse.
>
> **Estado (2026-07-19)**: **9 tablas migradas**. De las que quedan, **ninguna
> debe migrar tal cual** — ver «¿esta tabla debe migrar?» justo abajo. La única
> pendiente de verdad es `conversation-table`, y necesita una capacidad NUEVA del
> DS antes (selección de rango con ancla).

## Antes de nada: ¿esta tabla debe migrar?

`sc-datatable` es para tablas de datos con filas homogéneas.

**NO migran, y no es pereza — una `<table>` a mano es ahí el HTML correcto:**

| Tabla | Qué es de verdad |
|---|---|
| `group-assignment-table` | matriz de permisos: una casilla por celda |
| `agent-channel-table` | ídem |
| `agent-form-page` → `.perm-matrix` | matriz de permisos con cabecera tri-estado |
| `aed-agentes-page` → `.comm-table` | ídem |

Una matriz de permisos no tiene filas de datos: tiene ejes. Meterla en un
componente de tabla de datos añade selección, menú de fila y ordenación que ahí
no significan nada, y quita el control fino de las celdas. El `<table>` semántico
con `<th scope="row">` es mejor accesibilidad, no peor.

**Caso límite:** `agent-form-page` → `.picker-table` **sí** es una tabla de datos
(filas homogéneas, seleccionar-todo, vacío), pero su fila SELECCIONA al clicar, y
el modelo canónico del DS es el contrario (la fila abre, la casilla selecciona —
Ola 6). Migrarla obliga a elegir: o cambias su interacción, o el DS aprende un
modo «la fila selecciona». Es una decisión de producto, no una migración.

**Pendiente de verdad — `conversation-table`**, y lo que le falta al DS:
`sc-datatable` no modela **selección de rango con ancla** (shift+click desde la
última fila tocada). Esa tabla la tiene, resuelta en dos sitios por la
propagación del evento, y con **cinco tests e2e** que la fijan
(`conversations-row-gesture.spec.ts`), incluido «el error de dedo no destruye la
selección». También agranda el objetivo de click a la celda entera a propósito
(la casilla mide 16px). Migrarla hoy es romper cinco comportamientos cubiertos;
antes hay que añadir esa capacidad al DS, con sus tests.

## Los pasos

### 1. La plantilla

```html
<div class="table-card">
  <sc-datatable
    class="list-table"          <!-- OBLIGATORIO: ver §"la piel" -->
    [value]="sorted()"
    [columns]="columns()"
    dataKey="id"
    selectionMode="multiple"
    [selection]="selectedRows()"
    (selectionChange)="onSelectionChange($any($event))"
    (rowClick)="onRowClick($event)"                       <!-- si la fila abre -->
    (rowContextMenu)="onRowContextMenu($event, rowMenu)"
    data-testid="mi-tabla"
  >
    <div scTableEmpty class="table__no-results">…</div>
  </sc-datatable>
</div>
```

Las celdas van FUERA del componente, para que los `viewChild` las resuelvan:

```html
<ng-template #nameTpl let-row>…</ng-template>
```

### 2. Las columnas — un `computed()`, nunca un campo

```ts
private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<T>>>('nameTpl');

protected readonly columns = computed<readonly ScColumnDef<T>[]>(() => [
  { field: 'name', header: this.translate.instant('…'), cellTemplate: this.nameTpl() },
  { field: 'actions', header: '', width: '48px', cellTemplate: this.actionsTpl() },
]);
```

Los `TemplateRef` resuelven TARDE. Una lista construida en el campo se queda
con `cellTemplate: undefined` para siempre y la tabla pinta `row[field]` en
crudo. Al ser `computed`, se recalcula cuando resuelven.

Una columna sin datos (acciones, kebab) necesita igualmente un `field` único:
es su identidad para `[visibleColumns]`.

### 3. El puente de selección

No reescribas el estado de la página. `selectedIds: Set<number>` sigue siendo
la fuente de verdad (de ella cuelgan la barra masiva, el borrado, el export);
`sc-datatable` habla de filas. Se traduce en los dos sentidos:

```ts
protected readonly selectedRows = computed(() =>
  this.sorted().filter((r) => this.selectedIds().has(r.id)));

protected onSelectionChange(sel: T | readonly T[] | null): void {
  const rows = Array.isArray(sel) ? sel : sel ? [sel as T] : [];
  this.selectedIds.set(new Set(rows.map((r) => r.id)));
}
```

Con esto, `toggleSelect` / `toggleSelectAll` / `allSelected` quedan muertos:
los sirven `p-tableCheckbox` y `p-tableHeaderCheckbox`, y la de cabecera marca
lo FILTRADO, igual que antes. Bórralos.

### 4. El CSS

Del bloque `.table` de la página se va casi todo (cabecera, filas, celdas,
hover, seleccionada — unas 65 líneas). **Se queda solo lo de las celdas**: su
tipografía y el vacío de búsqueda, que se proyectan desde la plantilla de la
página y por eso conservan su encapsulado.

> Si una celda es texto plano con estilo propio (fecha en gris pequeño), dale
> igualmente un `cellTemplate` con un `<span>` de clase propia. Sin él, el
> `<td>` lo pinta el DS y una regla encapsulada en la página no lo alcanza.

## La piel: `class="list-table"` no es opcional

`styles/_sc-datatable-list.scss`. Sin ella, la tabla migrada **no se parece a
las que aún no lo están**. Medido antes de migrar labels:

| | preset del DS | `.table` del supervisor |
|---|---|---|
| alto de fila | 42px | 54px |
| cabecera | 14px / 600 | 12px / 500 |
| color de cabecera | `#4f5663` | `#8f97a3` (`text-secondary`) |
| borde de fila | `border-default` | `border-subtle` |

La cabecera silenciosa es decisión de S59, no un descuido. La piel se aplica en
la app y no en el preset porque el preset viste también la tabla de llamadas de
`agent`, que no es una tabla-lista de administración.

## Las tres trampas que ya mordieron

1. **`table-layout`**. `main.scss` fuerza `fixed` en `table.table`; la tabla del
   DS es `auto`. Sin corregirlo, las columnas se reparten por CONTENIDO y se
   recolocan al migrar (en labels, la columna de descripción saltaba ~290px).
   La piel ya lo pone — pero si ves columnas movidas, mira aquí.

2. **La banda de `caption`**. PrimeNG la pinta siempre, proyectes o no en
   `[scTableCaption]`: deja una franja vacía sobre la cabecera. La piel la
   oculta con `:empty`.

3. **Los `<td>` los pinta el DS**. Cualquier regla encapsulada en la página que
   apuntara a `.table__td-*` deja de aplicar. Y si la celda ancla un panel
   (editor inline), necesita `position: relative` en el `<td>` — está en la
   piel, no lo repitas por página.

## Verificación — la parte que no se salta

1. `npm run verify` entero. Añadir un `<sc-*>` desfasa `audit:components`:
   `node scripts/component-audit.mjs --write` y commitea `docs/inventory.md` +
   `docs/_component-status.json` en el mismo commit.
2. `npx ng build supervisor` — el AOT caza los errores de binding.
3. **Mira la pantalla.** En labels, los números decían "idéntico" y la captura
   enseñaba una franja vacía y las columnas movidas. Compara alto de fila,
   paddings y colores contra una tabla SIN migrar, en claro y en oscuro.
4. **Deja tests.** Ninguna de las dos páginas del piloto tenía uno; la red fue
   en el mismo commit (`e2e/supervisor/admin-datatable-pilot.spec.ts`, 9 tests).
   Si la tabla que migras tampoco tiene red, esa es parte del trabajo.

## Las 14 que quedan, por dificultad

**Fáciles** — sin click de fila ni selector de columnas. Empieza por aquí:

| Tabla | Nota |
|---|---|
| `admin/repositories/repo-list-page` | |
| `config/aed/aed-agentes-page` | |
| `admin/agents/agent-form-page` (×2) | una de ellas con click de fila |

**Medias** — click de fila, sin selector de columnas:

| Tabla | Nota |
|---|---|
| `memory/pages/categories` | cubierta por `sibling-pages.spec.ts` |
| `memory/pages/entities` (×2) | ídem |
| `memory/pages/rules` | cubierta por `rules-flow.spec.ts` |

**Difíciles** — concentran las 4 capacidades a la vez:

| Tabla | Por qué |
|---|---|
| `admin/agents/agents-list-page` | click de fila + `sc-column-selector` + renombrado inline |
| `admin/groups/groups-list-page` | ídem |
| `admin/users/users-list-page` | ídem |
| `memory/components/conversation-table` | lo peor: shift+click por rango, Enter abre / Espacio selecciona, y `table-layout: fixed` con una columna de 44px medida al píxel (Ola 6) |

**No migrar**: `group-assignment-table` y `agent-channel-table` — formularios
disfrazados de tabla.

## Pendiente conocido (no lo arregla esta receta)

En tema oscuro el separador de filas da **1.00:1 — invisible** en las ocho
tablas de lista, migradas y sin migrar por igual (`border-subtle` sobre
`bg-surface`, que en oscuro son el mismo color). Es un rezagado de la Ola 3.
Arreglarlo solo en las migradas las separaría del resto: va en un cambio propio
que toque las ocho a la vez.
