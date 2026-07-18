/**
 * Modelo de regla Memory — automatización programada a futuro.
 *
 * Migrado desde `RulesContext.tsx` del prototipo React. Subset acotado a lo
 * que necesita el listado: tipo, nombre, alcance resumido, acciones
 * configuradas, estado (activa/inactiva), última modificación.
 *
 * MVP transcripción: solo dos estados, activa o inactiva — sin borradores ni
 * priorización. Pueden convivir VARIAS reglas activas; el solape se resuelve
 * por unión (DD-30). Las reglas viven en `RulesStore` (Memory-specific). El
 * concepto NO se mezcla con bulk actions: regla = "qué pasa con conversaciones
 * futuras", bulk = "qué hago ahora con las existentes".
 */
import type { ConditionTree } from './condition.types';

export type RuleType = 'recording' | 'transcription' | 'classification';

export interface Rule {
  readonly id: number;
  readonly type: RuleType;
  readonly name: string;
  readonly description?: string;
  // Alcance (3 dimensiones AND, OR dentro de cada — spec `rule-constructor-update.md`)
  readonly servicios: readonly string[];
  readonly grupos: readonly string[];
  readonly agentes: readonly string[];
  /**
   * Árbol de condiciones (Variante B: match all/any · AND/OR · grupos). Fuente
   * de verdad del alcance cuando está presente; el constructor lo edita. Los
   * campos planos `servicios/grupos/agentes` se derivan de él al guardar
   * (`deriveLegacyScope`) para alimentar el resumen del listado sin recalcular.
   * Opcional: reglas antiguas sin árbol lo reconstruyen con `deriveTreeFromLegacy`.
   */
  readonly conditionTree?: ConditionTree;
  // Flags qué hace la regla
  readonly recording: boolean;
  readonly transcripcion: boolean;
  readonly clasificacion: boolean;
  readonly active: boolean;
  /* Dirección y duración NO viven aquí: son condiciones del `conditionTree`
     (DD-27). Los planos `direction`/`schedule`/`durationMin` quedaron sin UI y
     sin lectura de comportamiento, y se retiraron. */
  readonly aiAnalysis?: boolean;
  /**
   * IDs de categorías IA que esta regla detecta. Solo aplica a reglas
   * `type: 'classification'`. Fuente de verdad para la relación
   * bidireccional Rule ↔ Category (S49 §10 #13). `Category.usedInRules`
   * se deriva contando reglas con la categoría en este array.
   */
  readonly categorias?: readonly string[];
  /** ISO timestamp última modificación. */
  readonly lastModified: string;
}
