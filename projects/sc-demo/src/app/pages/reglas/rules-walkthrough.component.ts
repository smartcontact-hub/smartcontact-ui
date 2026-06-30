import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

interface Snippet {
  /** Código REAL del repo (o el de antes, reconstruido), recortado para leerse. */
  readonly code: string;
  /** Pie del bloque de código. */
  readonly src: string;
}

interface Concern {
  readonly q: string;
  readonly detail: string;
}

interface Decision {
  readonly t: string;
  readonly d: string;
}

/**
 * Recorrido del "sistema de reglas" del Supervisor, contado como una HISTORIA:
 * de dónde venía (grabación, prioridad, conflictos, borradores) a dónde está
 * (transcripción, una sola regla activa, árbol de condiciones). Cada cambio se
 * cuenta con su antes, su ahora y su porqué, en lenguaje llano.
 *
 * No es un componente del DS: explica el ESTADO del producto para alinear al
 * equipo. Las capturas `*-antes` salen del modelo viejo (guardadas de git); las
 * actuales, del Supervisor real (`public/usage/`). Los snippets «ahora» son código
 * real del repo (DD-26/27/28); los «antes», el código que sustituyeron.
 */
@Component({
  selector: 'app-rules-walkthrough',
  templateUrl: './rules-walkthrough.component.html',
  styleUrl: './rules-walkthrough.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesWalkthroughComponent {
  private readonly destroyRef = inject(DestroyRef);

  /* ─────────── Lightbox: clic en una captura para ampliarla, Esc para cerrarla ─────────── */

  /** Captura ampliada (null = cerrado). */
  protected readonly zoomed = signal<{ src: string; alt: string } | null>(null);
  private readonly lightboxClose = viewChild<ElementRef<HTMLButtonElement>>('lightboxClose');
  /** La imagen que abrió el lightbox, para devolverle el foco al cerrar. */
  private zoomTrigger: HTMLElement | null = null;

  constructor() {
    // Cuando el lightbox aparece en el DOM, el foco va al botón cerrar (a11y).
    effect(() => {
      if (this.zoomed()) this.lightboxClose()?.nativeElement.focus();
    });
    this.destroyRef.onDestroy(() => this.unlockScroll());
  }

  protected openZoom(target: EventTarget | null): void {
    const img = target as HTMLImageElement | null;
    if (!img) return;
    this.zoomTrigger = img;
    this.zoomed.set({ src: img.src, alt: img.alt });
    document.body.style.overflow = 'hidden';
  }

  protected closeZoom(): void {
    if (!this.zoomed()) return;
    this.zoomed.set(null);
    this.unlockScroll();
    this.zoomTrigger?.focus();
    this.zoomTrigger = null;
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeZoom();
  }

  /* ─────────── Beat: el alcance ─────────── */

  /** ANTES: tres casillas fijas + nombres congelados. */
  readonly scopeBefore: Snippet = {
    src: 'antes · features/memory/data/rule.types.ts',
    code: `interface Rule {
  // Alcance: TRES casillas fijas. Se cruzan con Y; dentro de cada una, O.
  servicios: string[];   // y guardaba NOMBRES, no referencias…
  grupos: string[];      // …si renombrabas un grupo, la regla
  agentes: string[];     //    se quedaba mirando un nombre viejo
  priority?: number;
}`,
  };

  /** AHORA: un árbol de condiciones. */
  readonly treeAfter: Snippet = {
    src: 'ahora · features/memory/data/condition.types.ts',
    code: `interface Condition {
  field: ConditionFieldId;     // servicio · grupo · agente · tipificación · dirección · duración
  operator: ConditionOperator; // es · no es · más de · menos de · entre
  value: ConditionValue;       // "Todos" · referencias · un enum · un número
}
interface ConditionTree {
  match: 'all' | 'any';        // Y / O entre grupos
  groups: { match: 'all' | 'any'; conditions: Condition[] }[];
}`,
  };

  /** AHORA: referencias vivas (el detalle que más cambia). */
  readonly refsAfter: Snippet = {
    src: 'ahora · features/memory/data/condition.types.ts',
    code: `// La etiqueta y la MEMBRESÍA se resuelven en vivo: no se congela el nombre.
type ConditionRef =
  | { kind: 'service'; name: string }
  | { kind: 'group'; id: number }       // la cola
  | { kind: 'agent'; id: number }
  | { kind: 'agentGroup'; id: number }  // ese grupo = sus miembros AHORA
  | { kind: 'tipificacion'; id: number };`,
  };

  /* ─────────── Beat: prioridad y conflictos ─────────── */

  /** ANTES: detectar choques entre todas las activas. */
  readonly conflictBefore: Snippet = {
    src: 'antes · features/memory/state/rules.store.ts',
    code: `// Con varias activas: comparar TODAS dos a dos. Mismo tipo + alcances que se
// cruzan = «EN CONFLICTO», y tú decidías arrastrando cuál gana.
for (let i = 0; i < active.length; i++)
  for (let j = i + 1; j < active.length; j++) {
    if (active[i].type !== active[j].type) continue;
    if (!scopeOverlaps(active[i], active[j])) continue;
    markConflict(active[i], active[j]);   // en ambos sentidos
  }`,
  };

  /** AHORA: una sola activa, nada que comparar. */
  readonly oneActiveAfter: Snippet = {
    src: 'ahora · features/memory/state/rules.store.ts',
    code: `// No hay dos activas que comparar. Activar una apaga la anterior (radio).
toggleActive(id) {
  // inactiva → activa: enciende esta, apaga el resto
  return rules.map((r) =>
    r.id === id ? { ...r, active: true } : { ...r, active: false });
}`,
  };

  /* ─────────── La estimación + el resumen en prosa ─────────── */

  /** La estimación de impacto no es inventada: cuenta sobre el histórico. */
  readonly estimate: Snippet = {
    src: 'features/memory/pages/rule-builder/rule-builder-page.component.ts',
    code: `// Cuántas conversaciones del histórico (mock) cumplen el árbol…
impactCount = conversations.filter((c) => conversationMatchesTree(c, tree)).length;
// …y la proyección a día/mes desde ese ratio real × el volumen base.
estimate    = projectImpact(impactCount, impactTotal); // ≈ N al día · ≈ M al mes`,
  };

  /** El árbol se traduce a la frase que ves en el listado. */
  readonly summary: Snippet = {
    src: 'features/memory/data/condition.types.ts',
    code: `// Traduce el árbol a una frase legible. Vacío → "todas las conversaciones".
function describeConditionTree(tree, labelFor) {
  const groups = tree.groups.filter((g) => g.conditions.length > 0);
  if (groups.length === 0) return 'Esta regla se aplica a todas las conversaciones.';
  const sep = tree.match === 'all' ? ' Y ' : ' O ';
  return \`Aplica cuando \${groups.map((g) => describeGroup(g, labelFor)).join(sep)}.\`;
}`,
  };

  readonly concerns: Concern[] = [
    {
      q: 'Coste de transcripción e IA',
      detail:
        'Cada transcripción consume cómputo, y el análisis IA va aparte. El coste crece con las transcripciones múltiples. ¿Ponemos límites? ¿La IA siempre opcional? El constructor ya estima el impacto, pero el coste lo cierra el equipo.',
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
      q: 'Migración de las reglas de grabación',
      detail:
        'Quedan obsoletas con la nueva ley y salen del MVP. ¿Las auto-desactivamos, las borramos, las convertimos? ¿Y qué pasa con lo que ya está grabado?',
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

  // --- De la charla con el equipo (2026-06-23) a lo que ya está construido ---

  readonly conclusiones: Decision[] = [
    {
      t: 'Una sola regla activa a la vez · hecho',
      d: 'Puedes tener varias reglas, pero solo una activa. Activar una desactiva la anterior; desactivar solo la pasa a Inactiva (sin copias ni borradores). Así no hay reglas que se pisen ni priorización que resolver: la vía rápida para salir a probar.',
    },
    {
      t: 'El alcance combina con Y y O · hecho',
      d: 'Servicios, grupos, agentes y tipificación, mezclados con Y u O y agrupados si hace falta. La tipificación es una entidad más (no una condición suelta) y es el caso de valor más claro: «quiero solo las que acabaron en venta».',
    },
    {
      t: 'Referencias vivas, no nombres congelados · hecho',
      d: '«Todos» incluye también las entidades futuras, y un grupo en el campo Agente significa «sus miembros ahora». Cambiar la composición de un grupo se refleja sin reeditar la regla.',
    },
    {
      t: 'Dirección y duración, dentro del constructor · hecho',
      d: 'Son campos más del alcance, no un bloque «Criterios» aparte. Un solo sitio para filtrar, sin duplicar la dirección en dos lugares.',
    },
    {
      t: 'Estimación de impacto en vivo · hecho',
      d: 'Mientras montas, el pie dice «afectaría a N de las últimas M conversaciones», con barra de proporción y proyección día/mes. Es una estimación sobre el histórico, no un dato cerrado.',
    },
    {
      t: 'Una conversación cumple la condición o no · decidido',
      d: 'Uno o cero: no hay cumplimiento parcial, no se transcribe «por un trozo» de la condición. Con una sola regla activa tampoco hay doble transcripción.',
    },
    {
      t: 'Casa de las reglas: Repositorios · en marcha',
      d: 'En administración, no un modal: es un formulario y se ve mejor a pantalla completa. El mismo repositorio sirve para reglas de transcripción y tipificación, y a futuro las listas de orígenes de IVR (hoy hay que replicarlas a mano en 15-16 nodos). Empezar simple, con una tabla.',
    },
    {
      t: 'Las reglas son a futuro; la clasificación va después · decidido',
      d: 'Nada retroactivo aquí: aplicar a conversaciones pasadas es bulk. Y la clasificación con IA (categorías) es la parte de más valor, pero se saca de aquí de momento: primero la transcripción.',
    },
  ];

  readonly pendiente: string[] = [
    'Cerrar con el equipo de backend qué criterios entran de inicio; el constructor ya cubre dirección, duración y tipificación. El backend puede ir por delante de la UI: crear la tabla, meter reglas y evaluar la condición aunque la pantalla no exista todavía.',
    'Confirmar el ajuste fino de calidad y esfuerzo de la transcripción (viabilidad y coste). Hoy limpia música y ruido por defecto.',
    'Levantar la sección de Repositorios (transcripción + tipificación), empezando por una tabla simple.',
    'Construir el simulador de coste: estimar qué porcentaje se transcribiría y el gasto, comparando con el mes anterior.',
    'Avanzar AED con tipificación, agendas y la regla de transcripción (incluida la migración de las reglas de grabación).',
  ];

  readonly aConfirmar: string[] = [
    'Naming definitivo de las entidades («contactantes» frente a grupos/ACD).',
    'Si entra la opción de invertir o excluir condición («todo esto menos X»).',
    'Constructor anidado más allá de 2 niveles y simulador de impacto/coste como evolución, no MVP.',
    'El detalle de la conversación en ventana propia (reproductor no bloqueante).',
  ];
}
