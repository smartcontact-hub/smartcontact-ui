/** Tipos del código de una story (la lógica vive en `serialize-args.core.mjs`). */
import type { ScArgs, StoryMeta } from './story.types';

/**
 * El tag con los args que no sobran. `porDefecto`: nombre → literal del valor por defecto del contrato
 * (`ContratoMiembro.porDefecto`); `null` o ausente, si no se conoce.
 */
export function serializeArgs(
  meta: StoryMeta,
  args: ScArgs,
  porDefecto?: Readonly<Record<string, string | null>> | null,
): string;
