/**
 * Modelo de regla Memory — automatización programada a futuro.
 *
 * Migrado desde `RulesContext.tsx` del prototipo React. Subset acotado a lo
 * que necesita iter 9a (listado): tipo, nombre, alcance resumido, acciones
 * configuradas, estado, prioridad, última modificación.
 *
 * Campos del constructor completo (durationMin, schedule, percentage,
 * scopeOrGroups, etc.) llegan en iter 9c.
 *
 * Las reglas viven en `RulesStore` (Memory-specific). El concepto NO se
 * mezcla con bulk actions: regla = "qué pasa con conversaciones futuras",
 * bulk = "qué hago ahora con las existentes" (spec `rule-constructor-update.md`).
 */
export type RuleType = 'recording' | 'transcription' | 'classification';
export type RuleStatus = 'active' | 'inactive' | 'draft' | 'conflict';

export type Direction = 'all' | 'inbound' | 'outbound';

export interface Schedule {
  readonly enabled: boolean;
  readonly from: string; // 'HH:MM'
  readonly to: string;
}

export interface Rule {
  readonly id: number;
  readonly type: RuleType;
  readonly name: string;
  readonly description?: string;
  // Alcance (3 dimensiones AND, OR dentro de cada — spec `rule-constructor-update.md`)
  readonly servicios: readonly string[];
  readonly grupos: readonly string[];
  readonly agentes: readonly string[];
  // Flags qué hace la regla
  readonly recording: boolean;
  readonly transcripcion: boolean;
  readonly clasificacion: boolean;
  readonly active: boolean;
  // Criterios específicos (iter 9c-1 cubre Recording; iter 9c-2 añade resto)
  readonly direction?: Direction;
  readonly schedule?: Schedule;
  readonly durationMin?: number; // segundos
  readonly attendedBy?: readonly string[]; // agentes o grupos
  readonly aiAnalysis?: boolean;
  /**
   * IDs de categorías IA que esta regla detecta. Solo aplica a reglas
   * `type: 'classification'`. Fuente de verdad para la relación
   * bidireccional Rule ↔ Category (S49 §10 #13). `Category.usedInRules`
   * se deriva contando reglas con la categoría en este array.
   */
  readonly categorias?: readonly string[];
  // Estado
  /** Borrador sin editar — copia recién creada que aún no se ha modificado. */
  readonly isDraft?: boolean;
  /** Id de la regla origen si fue duplicada. */
  readonly duplicatedFromId?: number;
  /** Posición en el orden de prioridad (solo válido si `active === true`). */
  readonly priority?: number;
  /** ISO timestamp última modificación. */
  readonly lastModified: string;
}
