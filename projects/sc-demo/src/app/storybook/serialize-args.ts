import { ArgType, ScArgs, StoryMeta } from './story.types';

/**
 * Serializa `args` a markup Angular para el snippet del Playground. PURO y determinista
 * (orden = orden de `argTypes`). Omite los estados «apagados» (boolean `false`, string
 * vacío, `null`/`undefined`) para que el código quede limpio — como hace Storybook.
 *
 *   serializeArgs({ tag: 'sc-button', ... }, { label: 'Guardar', variant: 'primary', loading: true })
 *   → `<sc-button label="Guardar" variant="primary" [loading]="true" />`
 */

/** Cómo se emite un arg: atributo string, binding `[prop]`, o contenido proyectado. */
function emitMode(argType: ArgType, value: unknown): 'attr' | 'prop' | 'slot' {
  if (argType.emit) return argType.emit;
  return typeof value === 'string' ? 'attr' : 'prop';
}

/** Literal para un binding `[prop]="…"`: strings entre comillas simples, resto tal cual. */
function propLiteral(value: unknown): string {
  return typeof value === 'string' ? `'${value}'` : String(value);
}

/** ¿El valor está «apagado»/vacío y por tanto se omite del snippet? */
function isOff(value: unknown): boolean {
  return value === false || value === '' || value === null || value === undefined;
}

export function serializeArgs(meta: StoryMeta, args: ScArgs): string {
  const attrs: string[] = [];
  const slots: string[] = [];

  for (const argType of meta.argTypes) {
    const value = args[argType.name];
    const mode = emitMode(argType, value);

    if (mode === 'slot') {
      if (typeof value === 'string' && value !== '') slots.push(value);
      continue;
    }
    if (isOff(value)) continue;

    if (mode === 'attr') attrs.push(`${argType.name}="${value}"`);
    else attrs.push(`[${argType.name}]="${propLiteral(value)}"`);
  }

  const inner = slots.join('');
  // Multilínea si hay muchos atributos (más legible); inline si caben pocos.
  const multi = attrs.length > 3;
  const open = multi
    ? `<${meta.tag}\n  ${attrs.join('\n  ')}\n`
    : `<${meta.tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;

  if (inner) return `${open}>${inner}</${meta.tag}>`;
  return multi ? `${open}/>` : `${open} />`;
}
