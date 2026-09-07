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
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TranslatePipe } from '@ngx-translate/core';

interface Snippet {
  /** Código REAL del repo (o el de antes, reconstruido), recortado para leerse. */
  readonly code: string;
  /** Pie del bloque de código. */
  readonly src: string;
}

/** Los textos (pregunta/detalle, título/desc, fecha/notas) viven en i18n bajo `reglas.*`;
 * aquí solo va la CLAVE estable de cada uno, para que el recorrido conmute ES↔EN. */
interface Keyed {
  readonly key: string;
}

interface FeedbackEntry {
  readonly key: string;
  readonly notes: Keyed[];
}

/**
 * Recorrido del "sistema de reglas" del Supervisor, contado como una HISTORIA:
 * de dónde venía (grabación, prioridad, conflictos, borradores) a dónde está
 * (transcripción, varias reglas activas sin conflictos, árbol de condiciones).
 * Cada cambio se cuenta con su antes, su ahora y su porqué, en lenguaje llano.
 *
 * No es un componente del DS: explica el ESTADO del producto para alinear al
 * equipo. Las capturas `*-antes` salen del modelo viejo (guardadas de git); las
 * actuales, del Supervisor real (`public/usage/`). Los snippets «ahora» son código
 * real del repo (DD-26/27/28); los «antes», el código que sustituyeron.
 */
@Component({
  selector: 'app-rules-walkthrough',
  imports: [ScIconComponent, TranslatePipe],
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

  /* ─────────── Panel de feedback: pestaña flotante abajo-derecha (no-modal) ─────────── */

  /** Panel de feedback abierto/cerrado. */
  protected readonly feedbackOpen = signal(false);
  /** El botón «×» dentro del panel: recibe el foco al abrir (a11y). */
  private readonly feedbackClose = viewChild<ElementRef<HTMLButtonElement>>('feedbackClose');
  /** El handle que abre el panel: recupera el foco al cerrar. */
  private readonly feedbackHandle = viewChild<ElementRef<HTMLButtonElement>>('feedbackHandle');

  constructor() {
    // Cuando el lightbox aparece en el DOM, el foco va al botón cerrar (a11y).
    effect(() => {
      if (this.zoomed()) this.lightboxClose()?.nativeElement.focus();
    });
    // Al montar el panel, el foco va a su botón cerrar (mismo patrón que el lightbox).
    effect(() => {
      if (this.feedbackOpen()) this.feedbackClose()?.nativeElement.focus();
    });
    this.destroyRef.onDestroy(() => this.unlockScroll());
  }

  protected toggleFeedback(): void {
    if (this.feedbackOpen()) this.closeFeedback();
    else this.feedbackOpen.set(true);
  }

  protected closeFeedback(): void {
    if (!this.feedbackOpen()) return;
    this.feedbackOpen.set(false);
    this.feedbackHandle()?.nativeElement.focus();
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
    // El lightbox tiene prioridad: si está abierto, Esc lo cierra a él primero.
    if (this.zoomed()) {
      this.closeZoom();
      return;
    }
    this.closeFeedback();
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
  field: ConditionFieldId;     // servicio · grupo · agente · tipificación · dirección · duración · categoría IA
  operator: ConditionOperator; // es · no es · más de · menos de · entre
  value: ConditionValue;       // "Todos" · referencias · un enum · un número
}
interface ConditionTree {
  // Y dentro de una alternativa; O entre alternativas (así se expresa cualquier combinación)
  match: 'all' | 'any';
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
  | { kind: 'tipificacion'; id: number }
  | { kind: 'category'; id: string };   // categoría IA (catálogo vivo)`,
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

  /** AHORA: varias activas; el solape se disuelve por unión, sin prioridad. */
  readonly manyActiveAfter: Snippet = {
    src: 'ahora · features/memory/state/rules.store.ts',
    code: `// Varias pueden estar activas: encender una no apaga a las demás.
toggleActive(id) {
  return rules.map((r) =>
    r.id === id ? { ...r, active: !r.active } : r);
}
// El solape se resuelve sin prioridad ni conflictos: una conversación se
// procesa UNA vez, aplicando la unión de lo que pidan las que encajan.`,
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

  /** Preguntas que el MVP deja abiertas (texto en `reglas.concerns.<key>`). */
  readonly concerns: Keyed[] = [
    { key: 'cost' },
    { key: 'governance' },
    { key: 'dependency' },
    { key: 'migration' },
    { key: 'retention' },
    { key: 'calendar' },
  ];

  /** De la charla con el equipo (2026-06-23) a lo construido (texto en `reglas.decisions.<key>`). */
  readonly conclusiones: Keyed[] = [
    { key: 'manyActive' },
    { key: 'scope' },
    { key: 'liveRefs' },
    { key: 'directionDuration' },
    { key: 'estimate' },
    { key: 'oneOrZero' },
    { key: 'repos' },
    { key: 'futureFirst' },
  ];

  /** Lo que queda (texto en `reglas.pending.<key>`). */
  readonly pendiente: string[] = ['backend', 'transcription', 'repos', 'simulator', 'aed'];

  /** A confirmar (texto en `reglas.confirm.<key>`). */
  readonly aConfirmar: string[] = ['naming', 'invert', 'nested', 'detailWindow'];

  /* ─────────── Log de feedback de revisión (cronológico, más reciente arriba) ───────────
   * Acumula las indicaciones del equipo junto al recorrido. Cada punto se VALIDÓ contra el
   * prototipo real (código + flujo) antes de anotarlo. Texto en `reglas.feedback.entries.<key>`. */
  readonly feedback: FeedbackEntry[] = [
    { key: 'jul17', notes: [{ key: 'manyActive' }] },
    {
      key: 'jul1',
      notes: [
        { key: 'pause' },
        { key: 'header' },
        { key: 'scopeCopy' },
        { key: 'exclusive' },
        { key: 'oneTable' },
        { key: 'confirmModal' },
      ],
    },
  ];
}
