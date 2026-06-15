/**
 * localStorage namespace migration · S47.
 *
 * El proyecto histórico tenía 3 namespaces conviviendo en localStorage:
 *   - `sc_theme` (snake_case, ThemeService)
 *   - `smartcontact_*` (legacy de cuando el proyecto se llamaba SmartContact
 *     y los stores asumían ese prefijo)
 *   - `sc_*_columns_v1/v2` (column prefs de las list-pages admin)
 *   - `sc-*` (kebab, el patrón canonical que adoptamos en S47 con
 *     LanguageService cocinado)
 *
 * Normalizamos todo a `sc-X-Y` kebab para coherencia con la convención CSS
 * (`--sc-*` tokens) + tag selector (`<sc-*>`).
 *
 * **Migración silenciosa**: lee el valor de la key vieja, lo escribe en la
 * key nueva si no existe ya, y borra la vieja. Preserva persistencia del
 * usuario (theme actual, agentes/grupos/usuarios creados, preferencias de
 * columnas) sin que tenga que reconfigurar nada.
 *
 * **Marker flag**: `sc-storage-migration-v1` evita re-correr la migration
 * cada arranque. Cuando un usuario nuevo (sin marker) carga la app,
 * la migration corre una vez y se marca. Cuando ya está marcado, skip.
 *
 * Ejecutado en `main.ts` antes de `bootstrapApplication` para garantizar
 * que los `LocalStore` ya lean del nuevo namespace al instanciarse.
 */

const MIGRATION_FLAG = 'sc-storage-migration-v1';

/** Mapping completo OLD → NEW. */
const KEY_MIGRATIONS: ReadonlyArray<readonly [string, string]> = [
  // Theme service (snake → kebab)
  ['sc_theme', 'sc-theme'],

  // Stores de admin (smartcontact_ → sc-)
  ['smartcontact_labels', 'sc-labels'],
  ['smartcontact_labels_v', 'sc-labels-v'],
  ['smartcontact_agents', 'sc-agents'],
  ['smartcontact_agents_v', 'sc-agents-v'],
  ['smartcontact_users', 'sc-users'],
  ['smartcontact_users_v', 'sc-users-v'],
  ['smartcontact_groups', 'sc-groups'],
  ['smartcontact_groups_v', 'sc-groups-v'],
  ['smartcontact_templates', 'sc-templates'],
  ['smartcontact_templates_v', 'sc-templates-v'],
  ['smartcontact_group_agent_links', 'sc-group-agent-links'],
  ['smartcontact_group_agent_links_v', 'sc-group-agent-links-v'],

  // Repositorios (smartcontact_X_repo → sc-X-repo)
  ['smartcontact_agendas_repo', 'sc-agendas-repo'],
  ['smartcontact_agendas_repo_v', 'sc-agendas-repo-v'],
  ['smartcontact_horarios_repo', 'sc-horarios-repo'],
  ['smartcontact_horarios_repo_v', 'sc-horarios-repo-v'],
  ['smartcontact_tipificaciones_repo', 'sc-tipificaciones-repo'],
  ['smartcontact_tipificaciones_repo_v', 'sc-tipificaciones-repo-v'],
  ['smartcontact_entidades_repo', 'sc-entidades-repo'],
  ['smartcontact_entidades_repo_v', 'sc-entidades-repo-v'],
  ['smartcontact_variables_repo', 'sc-variables-repo'],
  ['smartcontact_variables_repo_v', 'sc-variables-repo-v'],
  ['smartcontact_intenciones_repo', 'sc-intenciones-repo'],
  ['smartcontact_intenciones_repo_v', 'sc-intenciones-repo-v'],
  ['smartcontact_reglas_ia_repo', 'sc-reglas-ia-repo'],
  ['smartcontact_reglas_ia_repo_v', 'sc-reglas-ia-repo-v'],
  ['smartcontact_entidades_ia_repo', 'sc-entidades-ia-repo'],
  ['smartcontact_entidades_ia_repo_v', 'sc-entidades-ia-repo-v'],
  ['smartcontact_clasificacion_ia_repo', 'sc-clasificacion-ia-repo'],
  ['smartcontact_clasificacion_ia_repo_v', 'sc-clasificacion-ia-repo-v'],

  // Column prefs admin list-pages (sc_X_columns → sc-X-columns)
  ['sc_agents_columns_v2', 'sc-agents-columns-v2'],
  ['sc_groups_columns_v2', 'sc-groups-columns-v2'],
  ['sc_users_columns_v1', 'sc-users-columns-v1'],
];

export function migrateStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    if (window.localStorage.getItem(MIGRATION_FLAG) === 'done') return;

    let migratedAny = false;
    for (const [oldKey, newKey] of KEY_MIGRATIONS) {
      const oldValue = window.localStorage.getItem(oldKey);
      if (oldValue === null) continue;
      // Si el usuario ya tiene la nueva key (instalación nueva en navegador
      // viejo, o doble-arranque), preservamos el valor más reciente:
      // mantener nuevo (el código actual lo escribió primero); solo borrar
      // el viejo redundante.
      const newValue = window.localStorage.getItem(newKey);
      if (newValue === null) {
        window.localStorage.setItem(newKey, oldValue);
      }
      window.localStorage.removeItem(oldKey);
      migratedAny = true;
    }

    window.localStorage.setItem(MIGRATION_FLAG, 'done');
    if (migratedAny && typeof console !== 'undefined') {
      // Único log informativo aceptable en migrations one-shot. Útil si
      // alguien abre devtools tras la migration y se pregunta qué pasó.
      console.info('[sc] localStorage namespace migrated to sc-* kebab convention.');
    }
  } catch {
    /* localStorage bloqueado (modo privado, quota llena, etc.) — degrada
     * silenciosamente. Los stores caerán a sus defaults; el usuario solo
     * pierde preferencias persisted. */
  }
}
