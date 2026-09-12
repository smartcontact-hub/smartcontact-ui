/**
 * LA PUERTA BARATA DEL PREFLIGHT — lo que cuesta milisegundos no se descubre en el minuto cuatro.
 *
 * De dónde sale (2026-09-11 y 2026-09-12, dos veces el mismo día): una cadena de 8 minutos murió
 * en el CHECK N de `docs:coherence` porque una ficha de la MEMORIA del agente medía más de 250
 * palabras. Esa comprobación no lee nada del build ni de los tokens: son unos milisegundos de
 * `readdir` sobre un directorio que está FUERA del repo. Corría en el paso 33 de 38 sólo porque
 * vive dentro de `docs:coherence`, que sí depende de los generadores de tokens.
 *
 * Y hay una segunda razón, más fea, para adelantarla: la memoria es estado COMPARTIDO entre
 * sesiones. Cualquier chat abierto puede engordar una ficha y tumbarte una cadena que no tiene
 * nada que ver con lo tuyo. Enterarte en el segundo 2 te deja esperar o recortar; enterarte en el
 * minuto 4 te cuesta la cadena entera dos veces.
 *
 * Qué NO es: no sustituye al gate. `docs:coherence` sigue comprobándolo dentro de `verify` y en el
 * CI, que es donde tiene que estar. Esto solo lo adelanta para quien lanza la cadena en local.
 */
import { existsSync } from "node:fs";

import { localizarMemoria, leerMemoria, revisarMemoria } from "./memory-shape.mjs";

/**
 * Los problemas que se pueden ver SIN construir nada. Devuelve la lista (vacía = puerta abierta).
 *
 * `localizarMemoria` puede no encontrar nada (CI, otra máquina): ahí no hay nada que mirar y la
 * puerta se abre — igual que hace el CHECK N, que se omite en vez de fallar.
 */
export function puertaBarata(cwd = process.cwd()) {
  const dir = localizarMemoria(cwd);
  if (!dir || !existsSync(dir)) return [];
  return revisarMemoria(leerMemoria(dir)).map((p) => `memoria (${dir}) — ${p}`);
}
