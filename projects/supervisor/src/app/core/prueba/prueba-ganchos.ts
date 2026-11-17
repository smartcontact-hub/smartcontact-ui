/**
 * LO QUE UNA RAMA PUEDE ENCHUFAR AL MODO PRUEBA (DD-256). Las dos son opcionales: sin ninguna, la prueba ya mide tiempo,
 * clics, primer clic, pantallas y ayudas, y quien modera marca si la persona lo consiguió.
 *
 *   reiniciar(mision)   deja los datos como deben estar al empezar esa misión.
 *   comprobar(mision)   corrige lo que hay ahora contra lo que pedía la misión. Si existe, manda sobre lo que marque
 *                       quien modera.
 *
 * La misión llega como `<tarea>-<vuelta>` («festivo-1», «festivo-2»): la vuelta dice qué gemela tocó. Se registra al
 * arrancar la rama, por ejemplo con `provideAppInitializer(() => registrarPrueba({ … }))` en su configuración, para que
 * exista aunque la pantalla de la misión aún no se haya abierto.
 *
 * Fichero mínimo y fuera del modo prueba a propósito: lo importan las ramas, y el resto del modo prueba solo se
 * descarga cuando alguien abre un enlace de prueba.
 */
export interface ComprobacionDePrueba {
  /** Lo que salió bien. */
  readonly bien: number;
  /** Lo que se comprobó. `bien === total` es que salió bien. */
  readonly total: number;
  /** Lo que se lee de un vistazo: «362 de 365 días bien». */
  readonly titular?: string;
}

export interface GanchosDePrueba {
  reiniciar?(mision: string): void;
  comprobar?(mision: string): ComprobacionDePrueba;
}

const ganchos: GanchosDePrueba = {};

/** Enchufa los ganchos de la rama. Se puede llamar más de una vez: cada llamada añade o sustituye. */
export function registrarPrueba(nuevos: GanchosDePrueba): void {
  Object.assign(ganchos, nuevos);
}

/** Los ganchos enchufados. */
export const ganchosDePrueba = (): Readonly<GanchosDePrueba> => ganchos;
