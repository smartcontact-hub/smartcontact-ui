import type { ScMaterialSymbolName } from './sc-material-symbols.generated';

/**
 * Qué icono dice cada cosa, y qué dice cada icono (DD-200). Es lo que leen la página «Iconos» de sc-docs y
 * `audit:icons`, así que la regla vive en un solo sitio.
 *
 * El mismo icono con dos significados enseña al usuario algo que en la siguiente pantalla deja de valer (la X que
 * aquí cierra y allí elimina), y el mismo concepto con dos iconos impide asociarlo a nada (cuatro iconos para
 * «Agentes»). NN/g, «Icon Usability»: los iconos se reconocen por consistencia. Primer: «Certain Octicons are designed
 * for specific use cases and their meaning should not be changed».
 *
 * ⚠️ `audit:icons` lee este fichero con una expresión regular: una entrada por línea, `clave: 'icono',` en
 * `SC_ICONS` y `icono: { … }` en `SC_ICON_RESERVADOS`. Si cambias la forma, cambia también el gate.
 */

/**
 * Un icono por concepto. Las entidades salen del menú lateral, que manda (DD-137 §5); las acciones, de lo que ya era
 * mayoría en el producto o de la convención de Material. Úsalo desde la pantalla (`SC_ICONS.agentes`) en vez del
 * nombre suelto.
 */
export const SC_ICONS = {
    // Entidades (el icono del menú lateral)
    agentes: 'headphones',
    grupos: 'group',
    usuarios: 'person',
    administracion: 'groups',
    // Acciones
    anadir: 'add',
    anadirDebajo: 'subdirectory_arrow_right',
    editar: 'edit',
    eliminar: 'delete',
    quitar: 'close',
    cerrar: 'close',
    masAcciones: 'more_vert',
    filtrar: 'filter_alt',
    columnas: 'view_column',
    restablecer: 'restart_alt',
    descargar: 'download',
    importar: 'upload',
    copiar: 'content_copy',
    buscar: 'search',
    configuracion: 'settings',
    retroceder10: 'replay_10',
    avanzar10: 'forward_10',
    transcribir: 'description',
    navegacion: 'menu'
} as const satisfies Record<string, ScMaterialSymbolName>;

export type ScIconConcepto = keyof typeof SC_ICONS;

/** Un icono reservado: lo único que puede significar y lo que no. */
export interface ScIconReservado {
    /** Lo que significa, como se lee en la doc. */
    readonly significa: string;
    /** Lo que NO significa: el uso con el que se confunde. */
    readonly noSignifica: string;
    /** Con qué empieza el nombre de un control que lo lleva (minúsculas, sin tildes). Vacío = nunca en un control. */
    readonly verbos: readonly string[];
    /** El icono que va en su lugar cuando no es esto. */
    readonly enSuLugar?: string;
}

/**
 * Iconos con un solo significado en todo el producto. Un control con uno de estos iconos tiene que llamarse con uno
 * de sus `verbos`; si no, el icono está diciendo otra cosa.
 */
export const SC_ICON_RESERVADOS = {
    close: { significa: 'Cerrar, descartar o quitar de una lista', noSignifica: 'Eliminar algo guardado', verbos: ['cerrar', 'quitar', 'cancelar', 'descartar', 'limpiar', 'desvincular', 'ocultar', 'vaciar'], enSuLugar: 'delete' },
    delete: { significa: 'Eliminar algo que existe', noSignifica: 'Quitar de una lista', verbos: ['eliminar', 'borrar'], enSuLugar: 'close' },
    menu: { significa: 'Abrir la navegación', noSignifica: 'Opciones, categorías o contenido', verbos: ['menu', 'navegacion', 'abrir el menu', 'plegar', 'desplegar'], enSuLugar: 'tune' },
    more_vert: { significa: 'Más acciones de este elemento', noSignifica: 'Navegación', verbos: ['mas', 'opciones', 'acciones'] },
    settings: { significa: 'Configuración', noSignifica: 'Columnas o ajustes de una vista', verbos: ['configuracion', 'configurar', 'ajustes', 'sistema', 'preferencias'], enSuLugar: 'view_column' },
    refresh: { significa: 'Volver a cargar los datos', noSignifica: 'Restablecer', verbos: ['actualizar', 'recargar', 'refrescar'], enSuLugar: 'restart_alt' },
    restart_alt: { significa: 'Restablecer a como estaba', noSignifica: 'Recargar datos o rehacer una tarea', verbos: ['restablecer', 'restaurar', 'reiniciar'] },
    replay_10: { significa: 'Retroceder 10 segundos en un audio', noSignifica: 'Rehacer o restablecer', verbos: ['retroceder'] },
    forward_10: { significa: 'Avanzar 10 segundos en un audio', noSignifica: 'Rehacer', verbos: ['avanzar'] },
    rotate_left: { significa: 'Nada: dijo cuatro cosas', noSignifica: 'Retroceder, re-transcribir, restablecer, restaurar', verbos: [], enSuLugar: 'replay_10' },
    rotate_right: { significa: 'Nada: dijo dos cosas', noSignifica: 'Avanzar, rehacer', verbos: [], enSuLugar: 'forward_10' }
} as const satisfies Partial<Record<ScMaterialSymbolName, ScIconReservado>>;

