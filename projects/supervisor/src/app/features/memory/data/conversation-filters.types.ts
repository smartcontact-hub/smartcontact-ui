/**
 * Modelo de los filtros aplicados al listado de conversaciones.
 *
 * - Bloque "header" (iter 3 S37): services / date / origin / destination /
 *   groups / agents. Top-bar grid 6 columnas.
 * - Bloque "tipo" (iter 7 S38): types / channels / directions / rules /
 *   status / multirec. Popover anchored al `TypeFilterButton`. Réplica
 *   del `TypeFilterPanel.tsx` del prototipo React.
 *
 * Semántica:
 *   - types / channels / directions: TODOS por defecto = todos pasan.
 *     Al menos uno desactivado = filtra.
 *   - rules / status / multirec: TODOS por defecto = sin filtro (todos
 *     pasan). Al menos uno activado = solo las que cumplan.
 *
 * `date` migrado simplificado desde `dateRange: string` del prototipo:
 * `sc-datepicker` v1 solo soporta single date. Si el equipo de diseño pide rangos,
 * escalamos en iter futura (anotado en `docs/memory-migration-inventory.md §10`).
 */
export interface MemoryConversationFilters {
  // Header top-bar (iter 3)
  readonly services: readonly string[];
  readonly date: Date | null;
  readonly origin: string;
  readonly destination: string;
  readonly groups: readonly string[];
  readonly agents: readonly string[];

  // Tipo/Estado popover (iter 7)
  readonly types: {
    readonly interna: boolean;
    readonly externa: boolean;
  };
  readonly channels: {
    readonly llamada: boolean;
    readonly chat: boolean;
  };
  readonly directions: {
    readonly entrante: boolean;
    readonly saliente: boolean;
  };
  readonly rules: {
    readonly recording: boolean;
    readonly transcription: boolean;
    readonly classification: boolean;
  };
  readonly status: {
    readonly onlyFailed: boolean;
  };
  readonly multirec: {
    readonly onlyMulti: boolean;
    /**
     * Solo multi-rec donde algunos tramos están transcritos y otros no.
     * Protege contra reprocesamiento accidental en bulk select-all.
     * `decisiones.md §65-75` documenta el footgun.
     */
    readonly onlyPartial: boolean;
  };

  // Categorías IA popover (iter 8). Empty = sin filtro.
  readonly aiCategories: readonly string[];
}

export const EMPTY_FILTERS: MemoryConversationFilters = {
  services: [],
  date: null,
  origin: '',
  destination: '',
  groups: [],
  agents: [],
  types: { interna: true, externa: true },
  channels: { llamada: true, chat: true },
  directions: { entrante: true, saliente: true },
  rules: { recording: false, transcription: false, classification: false },
  status: { onlyFailed: false },
  multirec: { onlyMulti: false, onlyPartial: false },
  aiCategories: [],
};
