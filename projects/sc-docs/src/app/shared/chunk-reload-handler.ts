import { NavigationError } from '@angular/router';

/**
 * Recuperación cuando falla la carga de un chunk diferido.
 *
 * sc-docs carga cada página de componente con `import()` por ruta (`loadComponent`, ver
 * `app.routes.ts` y `components.routes.ts`). Cuando se despliega una versión nueva mientras
 * el usuario tiene la pestaña abierta, los nombres de los chunks cambian (llevan un hash de
 * contenido): la pestaña vieja pide un chunk que ya no existe, el `import()` rechaza y el
 * Router CANCELA la navegación en silencio. Para el usuario eso se ve como que el clic «no
 * hace nada» y solo se arregla refrescando a mano. Aquí lo hacemos por él: al detectar ese
 * fallo recargamos UNA vez en la URL de destino, que trae el `index.html` nuevo con los
 * nombres de chunk correctos.
 *
 * Guarda anti-bucle por `sessionStorage` con ventana de 10 s: si el MISMO destino vuelve a
 * fallar de inmediato (un 404 real del chunk, no un deploy), no recargamos otra vez y dejamos
 * que el error aflore, en vez de entrar en un bucle de recargas. Pasada la ventana, un fallo
 * posterior (otro deploy) vuelve a poder recargar. Si `sessionStorage` no está accesible
 * (modo privado, bloqueado), no hacemos nada: sin guarda no arriesgamos el bucle.
 */
const RELOAD_GUARD_KEY = 'sc-chunk-reload';
const RELOAD_WINDOW_MS = 10_000;

/**
 * Firmas de «no pude cargar el módulo dinámico» en los tres motores. En producción el build
 * es esbuild/Vite y el `import()` que falla lanza un `TypeError` cuyo mensaje varía por
 * navegador: Chrome «Failed to fetch dynamically imported module», Firefox «error loading
 * dynamically imported module», Safari «Importing a module script failed». Se mantiene además
 * la firma histórica de webpack (`ChunkLoadError` / «Loading chunk N failed») por si el build
 * cambiara de bundler.
 */
const CHUNK_ERROR_RE =
  /dynamically imported module|importing a module script failed|chunkloaderror|loading chunk \d+ failed/i;

interface ReloadMark {
  url: string;
  t: number;
}

/**
 * Handler para `withNavigationErrorHandler` (corre en contexto de inyección). Solo actúa ante
 * un fallo de carga de chunk; cualquier otro error de navegación lo deja pasar intacto.
 */
export function reloadOnChunkLoadError(navError: NavigationError): void {
  const message = `${navError?.error ?? ''}`;
  if (!CHUNK_ERROR_RE.test(message)) return;

  let storage: Storage;
  try {
    storage = window.sessionStorage;
  } catch {
    return;
  }

  const targetUrl = navError.url ?? '';
  const now = Date.now();

  let alreadyTried = false;
  try {
    const raw = storage.getItem(RELOAD_GUARD_KEY);
    if (raw) {
      const mark = JSON.parse(raw) as ReloadMark;
      alreadyTried = mark.url === targetUrl && now - mark.t < RELOAD_WINDOW_MS;
    }
  } catch {
    alreadyTried = false;
  }

  // Ya recargamos hace nada por este mismo destino: es un fallo real del chunk, no un deploy.
  // No recargamos otra vez para no entrar en bucle; que el error siga su curso.
  if (alreadyTried) return;

  try {
    storage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ url: targetUrl, t: now } satisfies ReloadMark));
  } catch {
    return;
  }

  // Deja el destino en el hash (routing por hash) y fuerza una recarga COMPLETA del documento:
  // cambiar solo el hash NO recarga la página, por eso el `reload()` explícito a continuación.
  if (targetUrl) window.location.hash = targetUrl;
  window.location.reload();
}
