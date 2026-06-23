import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Snippet {
  /** Código REAL del repo, recortado para leerse. */
  readonly code: string;
  /** Ruta del archivo de donde sale (bajo projects/supervisor/src/app/). */
  readonly src: string;
}

interface Concern {
  readonly q: string;
  readonly detail: string;
  /** true = depende de dominio que solo tiene el equipo (hueco a rellenar). */
  readonly rafa?: boolean;
}

/**
 * Recorrido del "sistema de reglas" del Supervisor, centrado en el pivote a
 * transcripción. No es un componente del DS: explica el ESTADO del producto para
 * alinear al equipo. Las capturas salen del Supervisor real (`public/usage/`,
 * regeneradas por `npm run usage:capture`) y los snippets son código real del
 * repo. Los huecos marcados [RAFA] los rellena el equipo (dominio: la ley, las
 * transcripciones múltiples, y quién/cuándo).
 */
@Component({
  selector: 'app-rules-walkthrough',
  templateUrl: './rules-walkthrough.component.html',
  styleUrl: './rules-walkthrough.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesWalkthroughComponent {
  readonly model: Snippet = {
    src: 'features/memory/data/rule.types.ts',
    code: `export interface Rule {
  type: RuleType;            // 'recording' | 'transcription' | 'classification'
  name: string;

  // Alcance: 3 dimensiones. Se cruzan con AND. Vacío = "cualquiera".
  servicios: readonly string[];
  grupos: readonly string[];
  agentes: readonly string[];

  // Criterios (los de transcripción)
  direction?: 'all' | 'inbound' | 'outbound';
  schedule?: { enabled: boolean; from: string; to: string };
  durationMin?: number;      // en segundos
  attendedBy?: readonly string[];
  aiAnalysis?: boolean;

  priority?: number;         // 1..N, gana el 1
  active: boolean;
}`,
  };

  readonly overlap: Snippet = {
    src: 'features/memory/state/rules.store.ts',
    code: `function scopeOverlaps(a: Rule, b: Rule): boolean {
  return (
    dimensionOverlaps(a.servicios, b.servicios) &&
    dimensionOverlaps(a.grupos, b.grupos) &&
    dimensionOverlaps(a.agentes, b.agentes)
  );
}

function dimensionOverlaps(a: readonly string[], b: readonly string[]): boolean {
  // Vacío = "cualquiera": siempre solapa en esa dimensión.
  if (a.length === 0 || b.length === 0) return true;
  return a.some((v) => b.includes(v));
}`,
  };

  readonly conflict: Snippet = {
    src: 'features/memory/state/rules.store.ts',
    code: `readonly conflictsByRuleId = computed(() => {
  const active = this.activeRules();
  const map = new Map<number, number[]>();
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.type !== b.type) continue;     // distinto tipo: no chocan
      if (!scopeOverlaps(a, b)) continue;  // sin solape: no chocan
      appendTo(map, a.id, b.id);
      appendTo(map, b.id, a.id);
    }
  }
  return map;
});`,
  };

  readonly winner: Snippet = {
    src: 'features/memory/pages/rules/rules-page.component.ts',
    code: `// "arriba en la lista = más prioridad". Gana el número más bajo.
protected winningRuleId(rule: Rule): number {
  const all = [rule, ...this.getConflictingRules(rule)];
  return all.reduce((winnerId, r) => {
    const winner = all.find((x) => x.id === winnerId)!;
    return (r.priority ?? 999) < (winner.priority ?? 999) ? r.id : winnerId;
  }, rule.id);
}`,
  };

  readonly concerns: Concern[] = [
    {
      q: 'Migración de las reglas de grabación',
      detail:
        'Quedan obsoletas con la nueva ley. ¿Las auto-desactivamos, las borramos, las convertimos? ¿Y qué pasa con lo que ya está grabado?',
    },
    {
      q: 'Conflictos con solape parcial',
      detail:
        'Hoy el sistema detecta el choque y "gana una" (la de prioridad más baja). ¿Eso basta cuando una conversación puede tener varias transcripciones, o queremos que apliquen varias reglas a la vez?',
    },
    {
      q: 'Coste de transcripción e IA',
      detail:
        'Cada transcripción consume cómputo, y el análisis IA va aparte. El coste crece con las transcripciones múltiples. ¿Ponemos límites? ¿La IA siempre opcional?',
    },
    {
      q: 'Gobierno de las transcripciones múltiples',
      detail:
        'Si una conversación tiene varios tramos transcritos por separado, ¿qué regla gobierna cada uno? ¿Cómo se almacenan? ¿Cuándo se re-transcribe?',
    },
    {
      q: 'Dependencia transcripción → clasificación',
      detail:
        'La clasificación con IA necesita la transcripción por debajo. Si la transcripción falla o no existe, ¿qué hace la regla de clasificación?',
    },
    {
      q: 'Retención y borrado',
      detail:
        'Cuánto tiempo se guardan las transcripciones y cómo se borran. El cambio normativo es lo que mueve el foco; el detalle legal lo cierra el equipo.',
    },
    {
      q: 'Calendario de despliegue',
      detail:
        'Las reglas las configuran los supervisores, desde el Supervisor. Queda por fijar cuándo entra en producción el sistema de transcripciones múltiples.',
    },
  ];
}
