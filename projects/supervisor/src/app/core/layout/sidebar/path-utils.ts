/**
 * Repository sub-paths that all collapse to `/admin/repositorios` for active
 * highlight purposes (mirrors DD#302 from the React prototype).
 */
const REPO_SUB_PATHS = [
  '/admin/agendas',
  '/admin/horarios',
  '/admin/plantillas',
  '/admin/tipificaciones',
  '/admin/labels',
  '/admin/variables',
  '/admin/entidades',
  '/admin/intenciones',
  '/admin/reglas-ia',
  '/admin/entidades-ia',
  '/admin/clasificacion-ia',
];

/**
 * Normalize a router URL for sidebar active-state matching.
 *
 *   - Strips the trailing `/crear` or `/editar/:id` segment so create and edit
 *     pages keep the parent list highlighted.
 *   - Maps every repository sub-path to `/admin/repositorios` so the single
 *     "Repositorios" sidebar entry stays highlighted across all 9 instances.
 */
export function normalizeRoutePath(rawPath: string): string {
  const stripped = rawPath.replace(/\/(crear|editar\/[^/]+)$/, '');
  const isRepoSubPath = REPO_SUB_PATHS.some((p) => stripped === p || stripped.startsWith(p + '/'));
  return isRepoSubPath ? '/admin/repositorios' : stripped;
}
