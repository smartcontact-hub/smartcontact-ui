import type { Page } from '@playwright/test';

/**
 * Manifiesto de pantallas del Supervisor a fotografiar (Fase 2.2). ÚNICA entrada
 * curada a mano (análoga a `scripts/component-audit-map.mjs`) — datos puros, sin
 * lógica. El spec `usage-capture.spec.ts` recorre esto; el DOM-scan de cada pantalla
 * decide qué componentes DS aparecen (verdad de campo), no este fichero.
 *
 * Estados: además del base (implícito), `states[]` añade interacciones ACOTADAS
 * para hacer VISIBLES componentes que solo se ven tras interactuar (su host suele
 * estar ya en el DOM en base — el scan los detecta igual; la interacción es para la
 * FOTO). Cada `action` es best-effort: si el selector se movió, el spec la salta con
 * ⚠ y NO rompe la captura. Regla: ≤2 estados de interacción por pantalla; los
 * globales (command palette) se capturan en UNA sola pantalla.
 */
export interface UsageState {
  /** Sufijo del artefacto + etiqueta (p.ej. 'seleccion'). Omítelo para el estado base. */
  readonly name?: string;
  /** Interacción ANTES de escanear+fotografiar este estado. Best-effort (try/catch en el spec). */
  readonly action?: (page: Page) => Promise<void>;
}

export interface UsageScreen {
  /** Slug estable → nombre de fichero PNG + clave en el JSON. */
  readonly id: string;
  /** Hash route sin el `#` inicial. */
  readonly route: string;
  /** Etiqueta humana para la galería. */
  readonly label: string;
  /** Selector que, visible, significa "pantalla lista". Default: `.page` (18/20 lo usan) → `main#main-content`. */
  readonly readySelector?: string;
  /** Estados extra de interacción (el base se captura siempre). */
  readonly states?: readonly UsageState[];
}

/** Tecla modificadora del command palette según plataforma (mac=Meta, CI linux=Control). */
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

/** Marca la 1ª fila de una tabla de listado (dispara la bulk-action-bar). */
const selectFirstRow = async (page: Page): Promise<void> => {
  await page
    .locator('tbody tr td.table__td-check input[type="checkbox"]')
    .first()
    .check({ timeout: 4000 });
};

export const USAGE_SCREENS: readonly UsageScreen[] = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    id: 'admin-usuarios',
    route: 'admin/usuarios',
    label: 'Usuarios · listado',
    states: [
      { name: 'seleccion', action: selectFirstRow }, // → sc-bulk-action-bar / sc-bulk-edit-menu
      {
        name: 'borrar', // → sc-delete-entity-dialog / sc-dialog
        action: async (page) => {
          await selectFirstRow(page);
          await page
            .locator('sc-bulk-action-bar button, sc-bulk-action-bar p-button')
            .filter({ hasText: /elimin|borrar|delete/i })
            .first()
            .click({ timeout: 4000 });
        },
      },
    ],
  },
  { id: 'admin-usuarios-crear', route: 'admin/usuarios/crear', label: 'Usuarios · crear' },
  {
    id: 'admin-grupos',
    route: 'admin/grupos',
    label: 'Grupos · listado',
    states: [
      {
        name: 'cmdk', // command palette (global) — se captura abierto SOLO aquí
        action: async (page) => {
          await page.keyboard.press(`${MOD}+k`);
        },
      },
    ],
  },
  {
    id: 'admin-agentes',
    route: 'admin/agentes',
    label: 'Agentes · listado',
    states: [{ name: 'seleccion', action: selectFirstRow }], // → sc-bulk-edit-menu / sc-group-popover
  },
  {
    id: 'admin-labels',
    route: 'admin/labels',
    label: 'Etiquetas',
    states: [
      {
        name: 'crear', // abre el panel de creación → sc-label-form-panel (con sc-color-dot-picker)
        action: async (page) => {
          await page
            .locator('sc-top-bar')
            .getByRole('button')
            .filter({ hasText: /crear|nuev|añad|add|create/i })
            .first()
            .click({ timeout: 4000 });
        },
      },
    ],
  },
  { id: 'admin-plantillas', route: 'admin/plantillas', label: 'Plantillas' },
  { id: 'admin-repositorios', route: 'admin/repositorios', label: 'Repositorios · hub' },
  { id: 'admin-agendas', route: 'admin/agendas', label: 'Agendas' },
  // ── Config / Contact Center ─────────────────────────────────────────────────
  { id: 'config-aed-servicio', route: 'config/aed/servicio', label: 'Contact Center · Servicio' },
  { id: 'config-aed-agentes', route: 'config/aed/agentes', label: 'Contact Center · Agentes' },
  { id: 'config-aed-grupos', route: 'config/aed/grupos', label: 'Contact Center · Grupos' },
  { id: 'config-sistema', route: 'config/sistema', label: 'Sistema' },
  { id: 'config-seguridad', route: 'config/seguridad', label: 'Seguridad' },
  // ── Conversaciones (memoria) ────────────────────────────────────────────────
  { id: 'conversaciones', route: 'conversaciones', label: 'Conversaciones' },
  { id: 'conversaciones-reglas', route: 'conversaciones/reglas', label: 'Reglas · listado' },
  {
    id: 'conversaciones-reglas-nueva',
    route: 'conversaciones/reglas/1',
    label: 'Reglas · constructor',
    readySelector: '.rule-builder',
  },
  { id: 'conversaciones-entidades', route: 'conversaciones/entidades', label: 'Entidades' },
  { id: 'conversaciones-categorias', route: 'conversaciones/categorias', label: 'Categorías' },
];
