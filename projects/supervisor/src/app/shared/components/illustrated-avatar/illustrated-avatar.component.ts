import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  type AvatarIllustrationPool,
  buildIllustrationSrc,
} from '@smartcontact-hub/components';

export type IllustratedAvatarPool = AvatarIllustrationPool;

/**
 * Two pools live under `src/assets/avatars/`:
 *
 *   - `illustrated/` — 24 person portraits. Default. Used for
 *     entities with a person identity (agents, users, the topbar
 *     supervisor avatar).
 *   - `abstract/`    — 3 non-personal abstract patterns. Used for
 *     entities that are *not* people (groups, queues, anything
 *     functional) — assigning a face to "Ventas Nacional" reads
 *     accidental.
 *
 * Each pool has files named `avatar-NN.svg` (illustrated) /
 * `abstract-NN.svg` (abstract). The active pool is picked via the
 * `[pool]` input.
 */
/**
 * El catálogo de pools y el hash que reparte los nombres viven en el DS
 * (`buildIllustrationSrc`, misma fuente que `sc-avatar` y `sc-photo-upload`).
 * Aquí había una copia verbatim de ambos: mismo DJB2, mismos 24/3 ficheros.
 * Al ser DOS implementaciones del mismo reparto, el día que el DS sumara un
 * avatar 25 esta pantalla habría seguido repartiendo entre 24 — el mismo
 * nombre con cara distinta según el componente. (Unificado 2026-08-30.)
 *
 * Lo único que no se hereda es la BASE: aquí es absoluta (`/assets/avatars`)
 * y el DS la deja relativa por defecto, así que se pasa explícita.
 */
const ILLUSTRATION_BASE = '/assets/avatars';

/**
 * Circular avatar that renders one of N illustrations hashed
 * deterministically from the entity name (so the same name always
 * gets the same avatar across pages and reloads). When `photo` is
 * set the photo wins; the illustration is the fallback.
 *
 * The hover zoom replicates the Figma source pair without needing
 * two SVGs: the SVG is wrapped in a clipped circle and scaled with
 * a CSS transform — the SVG's own circular clip-path scales with it
 * and the outer wrapper re-clips to the original bound, producing
 * the same "image fills more of the circle on hover" effect.
 */
@Component({
  selector: 'sc-illustrated-avatar',
  standalone: true,
  templateUrl: './illustrated-avatar.component.html',
  styleUrl: './illustrated-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustratedAvatarComponent {
  readonly name = input.required<string>();
  /** When set, overrides the illustration with the user's uploaded photo.
   *  Accepts `undefined` so it can be wired directly to optional fields
   *  on entity types (e.g. `Agent.photo?: string`) without `?? null`
   *  glue at every call site. */
  readonly photo = input<string | null | undefined>(null);
  /** Pixel size of the rendered circle. Defaults to 40px. */
  readonly size = input<number>(40);
  /** Which pool to hash into. `'illustrated'` = 24 person portraits
   *  (default). `'abstract'` = 3 non-personal patterns for groups
   *  and other functional entities. */
  readonly pool = input<IllustratedAvatarPool>('illustrated');

  protected readonly illustrationSrc = computed(() =>
    buildIllustrationSrc(this.name(), this.pool(), ILLUSTRATION_BASE),
  );

  protected readonly photoSrc = computed(() => this.photo() ?? null);

  protected readonly sizePx = computed(() => `${this.size()}px`);
}
