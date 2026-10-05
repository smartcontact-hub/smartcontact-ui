/** Tipos del código de una story (la lógica vive en `serialize-args.core.mjs`). */
import type { ScArgs, StoryMeta } from './story.types';

/** Lo que el serializador lee de cada miembro del contrato (`ContratoMiembro`, de `audit:components`). */
export interface MiembroDelContrato {
  readonly nombre: string;
  readonly clase: 'input' | 'model' | 'output';
  /** El literal del valor por defecto en el código (`'md'`, `false`), o `null` si no se conoce. */
  readonly porDefecto: string | null;
  readonly requerido: boolean;
}

/** El tag con lo requerido y los args que no sobran. Sin `contrato` (aún cargando), omite `false` y lo vacío. */
export function serializeArgs(meta: StoryMeta, args: ScArgs, contrato?: readonly MiembroDelContrato[] | null): string;
