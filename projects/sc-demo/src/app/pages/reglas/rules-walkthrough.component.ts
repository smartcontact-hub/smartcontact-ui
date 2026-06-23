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

interface Decision {
  readonly t: string;
  readonly d: string;
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

  // --- De la charla con el equipo (2026-06-23): solo lo que se dijo ---

  readonly conclusiones: Decision[] = [
    {
      t: 'MVP: una sola regla activa a la vez',
      d: 'Puedes crear varias reglas de transcripción, pero solo una activa. Así no hay reglas que se pisen ni priorización que resolver (justo la complejidad del paso 6): es la vía rápida para salir y empezar a probar.',
    },
    {
      t: 'Una conversación cumple la condición o no (uno o cero)',
      d: 'No hay cumplimiento parcial: no se transcribe «por un trozo» de la condición. Con una sola regla activa tampoco hay doble transcripción.',
    },
    {
      t: 'El alcance combina entidades con AND y OR',
      d: 'Servicios, grupos, agentes y tipificación. Ej.: servicio Y grupo Y agente O tipificación=ventas. La tipificación es una entidad más (no una condición suelta) y es el caso de valor más claro: «quiero solo las que acabaron en venta».',
    },
    {
      t: 'Criterios del MVP',
      d: 'Dirección y duración mínima ya están; hay que añadir tipificación y recuperar el horario (estaba y se perdió en el prototipo). El canal (chat) es el siguiente nivel; primero llamadas.',
    },
    {
      t: 'Grabación como requisito: avisar, no bloquear',
      d: 'Si la regla incluye un servicio o agente sin permiso de grabación, mostrar un aviso al activarla, no impedir seleccionarlo. Los permisos cambian con el tiempo; validar en duro sería frágil y obligaría a volver a tocar la regla.',
    },
    {
      t: 'La transcripción ya limpia música y ruido por defecto',
      d: 'No se manda la música en espera. El ajuste fino de esfuerzo y calidad (y por tanto del coste) no entra ahora: a confirmar con Lucas si es viable.',
    },
    {
      t: 'Casa de las reglas: una sección de Repositorios',
      d: 'En administración, no un modal de configuración (es un formulario y se ve mejor a pantalla completa). El mismo repositorio sirve para reglas de transcripción y tipificación, y a futuro las listas de orígenes de IVR (hoy hay que replicarlas a mano en 15-16 nodos). Empezar simple, con una tabla.',
    },
    {
      t: 'Las reglas son a futuro; la clasificación va después',
      d: 'Nada retroactivo aquí: aplicar a conversaciones pasadas es bulk. Y la clasificación con IA (categorías) es la parte de más valor, pero se saca de aquí de momento: primero la transcripción.',
    },
    {
      t: 'Lo potente queda como futuro, no MVP',
      d: 'Constructor de condiciones anidadas (AND/OR agrupados), invertir/excluir («todo esto menos X»), simulador de impacto y coste, abrir el detalle de la conversación en ventana propia (reproductor no bloqueante) y re-transcripción.',
    },
  ];

  readonly accionables: string[] = [
    'Hablar con desarrollo (VAC / Lucas) cuanto antes, hoy o mañana: enseñarles el concepto y cerrar qué criterios entran. Los que faltaban: duración y tipificación.',
    'Pasarles este link de Cloudflare como resumen del estado para la conversación con desarrollo.',
    'El backend puede ir por delante del interfaz: el VAC crea la tabla, mete las reglas y evalúa la condición aunque la UI no exista todavía, y se prueba así.',
    'Preguntar a Lucas por el ajuste fino de calidad y esfuerzo de la transcripción (viabilidad y coste).',
    'Crear la sección de Repositorios (transcripción + tipificación), empezando por una tabla simple.',
    'Avanzar AED con tipificación, agendas y la regla de transcripción (y el tema de migración).',
    'Construir el módulo simulador de coste: estima qué porcentaje se transcribiría y el gasto, comparando con el mes anterior.',
  ];

  readonly aConfirmar: string[] = [
    'Naming definitivo de las entidades («contactantes» frente a grupos/ACD).',
    'Si entra la opción de invertir o excluir condición.',
    'El detalle de la conversación en ventana propia (reproductor no bloqueante).',
  ];
}
