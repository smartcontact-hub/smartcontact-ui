/**
 * Fallback de ilustración del avatar (§4.2): cuando no hay foto, se elige una
 * ilustración SVG estable por **hash del nombre**. Lógica portada del retirado
 * `sc-illustrated-avatar` — vive en el DS y la consumen `sc-avatar` (tipo Image)
 * y `sc-photo-upload`, fuente única.
 *
 * El paquete **no empaqueta los SVG** (27 archivos, ~6 MB): expone solo la
 * lógica (hash + pool + path). El consumidor sirve los assets bajo
 * `{base}/{dir}/` — por defecto `assets/avatars/{illustrated|abstract}/`
 * (`avatar-NN.svg` / `abstract-NN.svg`, NN de 2 dígitos).
 */
export type AvatarIllustrationPool = 'illustrated' | 'abstract';

interface PoolConfig {
  readonly count: number;
  readonly dir: string;
  readonly prefix: string;
}

export const AVATAR_ILLUSTRATION_POOLS: Record<AvatarIllustrationPool, PoolConfig> = {
  illustrated: { count: 24, dir: 'illustrated', prefix: 'avatar' },
  abstract: { count: 3, dir: 'abstract', prefix: 'abstract' },
};

/** Hash DJB2 estable de un nombre a un índice en `[0, modulo)` (verbatim del origen). */
export function hashName(name: string, modulo: number): number {
  let hash = 5381;
  const trimmed = name.trim();
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) + hash + trimmed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

/**
 * Construye la URL de la ilustración para un `name`. `base` por defecto
 * `'assets/avatars'` (sin barra inicial → relativo al base href del consumidor).
 */
export function buildIllustrationSrc(
  name: string,
  pool: AvatarIllustrationPool = 'illustrated',
  base = 'assets/avatars',
): string {
  const cfg = AVATAR_ILLUSTRATION_POOLS[pool];
  const idx = hashName(name, cfg.count);
  return `${base}/${cfg.dir}/${cfg.prefix}-${String(idx).padStart(2, '0')}.svg`;
}
