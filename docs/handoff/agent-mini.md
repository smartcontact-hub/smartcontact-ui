# Frente · Agent Mini — dialpad standalone — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes.
> **Sello: 2026-09-01 — HEAD `0b1d210`. CI verde (run 33526420436, 5/5), todo en `main`.**
> **Vivo en `agent-mini.pages.dev`, producción por `main`** (repuntado 2026-09-01,
> verificado sirviendo `e3874c3`; el bundle lleva «Estados», «Mensajes», «Seleccione grupo»).
>
> ⚠️ Un hand-off es una **pista, no un hecho**. Confirma antes de construir encima.

## ✅ 2026-09-07 · El mini real queda medido y replicado en Figma, con las 15 pantallas verificadas

> **Sello: no toca el repo.** El entregable vive en Figma, fichero `XiPJxHfz5UuekksPIoEj9u`
> («Gestión de errores»), página **Mini** (`158:3938`). Aquí solo queda el puntero.

Réplica 1:1 del mini **aed real** a 310×891 (DPR 2), no de `agent-mini`: 15 pantallas (11 estados
del marcador + Chat, Agentes, Agenda, Histórico), 13 componentes con variantes y propiedades, y
una ficha de especificación en `229:1243`.

**Lo que esto desbloquea para este frente.** La tabla de arriba dice que Estados, Mensajes y
Agentes están calibrados «de sensación», NO diffeados. Ya no hace falta: se midieron los **11
estados** por `getComputedStyle` sobre la ventana real y el resultado está contrastado contra el
DOM nodo a nodo. Como este frente va todo en `vw`/`vh`, los valores transfieren por ratio aunque
`agent-mini` viva a ~352×1025. Bases: **1vw = 3,10 px · 1vh = 8,91 px**.

**Dos hechos del mini que no estaban escritos aquí:**

- **No tiene breakpoints.** Una sola media query (`min-height:176px` y `max-height:860px`) que solo
  cambia un `margin-bottom: 0.5%`. Todo lo demás es `vw`/`vh` puro.
- **La barra de estado del agente se solapa 4,89 px con la de pestañas** (`position:fixed` abajo:
  el cuerpo acaba en 833,08 y ella empieza en 828,19). No es un fallo de la réplica.

**Trampa que costó tres rebrotes** (ya escrita como regla #11): aplicar mínimos a un árbol usando
el NOMBRE como clave. `Buscador`, `Origen`, `Número` y `Fila N` existen dos veces con tamaños
distintos, y la escritura infló 47 cajas sin dar error. Se ve diffeando tamaños antes/después.

## Qué es este frente

Réplica **standalone** del Comunicador mini (`comunicatormini.smart-contact.com/aed/`) como
app propia en `projects/agent-mini`, a **pantalla completa** (no el widget flotante de
`agent`). Es para el usuario que quiere el dialpad abierto y navegable sin el dashboard.

**Primo autocontenido de `agent`** (decisión de arquitectura, no accidente): cara propia en
`vw`/`vh`, estado propio (`mini-state.service.ts`), **reutiliza SOLO los iconos de `agent`
como assets** (no su TS: el `rootDir` por proyecto lo impide), **sin Design System**. Queda
exento de token-guard como réplica (`REPLICA_APPS`, junto a `agent` y `cuscare`): usa hex/px/vw
literales a propósito. **Datos 100% falsos** (`mini-seed.ts`): el repo es público, ni un nombre
ni teléfono de la extracción real.

## Dónde está la cosa

| Pieza                     | Fichero                                                    |
| ------------------------- | --------------------------------------------------------- |
| Shell + dialpad + estados | `projects/agent-mini/src/app/app.component.ts`            |
| Cerebro (9 estados, call) | `projects/agent-mini/src/app/mini-state.service.ts`       |
| Datos falsos              | `projects/agent-mini/src/app/mini-seed.ts`                |
| Mensajes (lista + chat)   | `projects/agent-mini/src/app/messages.component.ts`       |
| Agentes (roster + grupos) | `projects/agent-mini/src/app/agents.component.ts`         |
| Historial / Agenda        | `projects/agent-mini/src/app/{history,agenda}.component.ts` |

Build `npm run build:agent-mini` (AOT, ~48 KB gzip). Servir `npm run serve:agent-mini` (:4291),
o estático sobre `dist/agent-mini/browser`. Referencia de medidas: **`projects/agent/docs/comunicador.md`**
y la **extracción del mini** (zip que pasó Rafa: 6 vistas capturadas, censo NDJSON; NO está en el repo).

## Estado — qué está hecho y con qué confianza

| Pieza                        | Estado                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Dialpad en reposo            | **pixel-contrastado** contra el censo del mini (display, teclas, pastilla, botón)  |
| Navbar 5 pestañas + roja      | hecho; roja `#762727` cuando el estado no permite llamar (códigos reales)          |
| Barra de estado + **Panel de Estados** | hecho: 9 estados, Disponible con punto verde, actual en negrita, «Administrativo» despliega buscador + «Seleccione grupo» |
| **Mensajes**                 | lista de ejemplo (datos falsos) + conversación (burbujas `#2179ED`/`#1C1C1C`/`#AAAAAA`) + redactor |
| **Agentes**                  | roster (datos falsos) con punto de presencia + canales + toggle Agentes/Grupos     |
| Historial / Agenda           | datos falsos; al pulsar marca el número en el dialpad                              |
| Vista EN LLAMADA             | **doc-based**: el estado en llamada NO se capturó en vivo, sale de `comunicador.md` |
| Ajustes                      | **el mini aed NO tiene** (confirmado por Rafa): el avatar es indicador de presencia |

⚠️ **Confianza desigual.** El dialpad en reposo está diffeado contra el censo real. Las
superficies NUEVAS (Estados, Mensajes, Agentes) están calibradas al **ritmo `vh`/`vw` de sus
hermanas** (Historial/Agenda), NO diffeadas contra censo: no hubo captura de esas vistas en
overlay. Son fieles «de sensación», no verificadas al píxel.

## ▶︎ SIGUIENTE — sin preguntar

1. **Nada al píxel sin captura.** Como en el frente `agent`, el método que funciona es: Rafa
   señala algo del mini real, se MIDE en su navegador y se aplica el número. Lo que quede saldrá
   de él, no de una lista inventada.
2. ~~**(Opcional, hardening) Cablear `agent-mini` al CI.**~~ → **HECHO el 2026-09-11 (#117)**. Ya
   no es cierto que solo Cloudflare cace una rotura de su build: está en el job `build` de
   `ci.yml`, en la cadena de `preflight`, en `typecheck` y en el carril acotado de
   `preflight:scope`. Los pasos del CI subieron de 8 a 9 en los siete sitios que vigila CHECK J, y
   `.impeccable.md` y `docs/traspaso.md` dejaron de decir «cuatro apps».

## ⏸️ ESPERANDO A RAFA — no preguntar, no hacer (dashboard-only)

1. ~~**CRÍTICO · Repuntar Cloudflare `agent-mini` a `main`**~~ → **HECHO (2026-09-01)**.
   Confirmado que estaba en `worktree-agent-mini` (el último build de producción salía de esa
   rama borrada, `0b1d210`) — era la trampa de `feat/cuscare`. La extensión de Claude cambió
   «Production branch» → `main` en el dashboard y relanzó producción desde `main` (`e3874c3`,
   `success`, 55s); `agent-mini.pages.dev` verificado sirviendo el dialpad. «Preview branch» y
   «Automatic deployments» sin tocar. **Pendiente de token wrangler vivo** si algún día hay que
   tocarlo por API (el guardado estaba expirado en esta sesión).
2. **Nombre del proyecto.** Los otros 4 siguen convención `sc-*` (`sc-agent`, `sc-cuscare`…);
   este es `agent-mini.pages.dev`. Si Rafa quiere coherencia → renombrar a `sc-agent-mini`.
3. **Superficies solo-vivo, para pasar de doc-based a medido:** vista EN LLAMADA (cronómetro,
   mute/espera/teclado, transferencia, tipificación) y el **desplegable de banderas/prefijo** del
   display (`containerBanderas`, hoy stub vacío en `.flags`). Piden captura en vivo del mini
   (como el censo del frente `agent`) o que Rafa apunte a algo concreto.

## ⚠️ Trampas de este frente

- **La trampa Cloudflare-rama de arriba.** Es la más cara y la más silenciosa.
- **DS-free a propósito** (DD-35, como `agent`/`cuscare`): token-guard lo exime por `REPLICA_APPS`.
  No lo tokenices «por uniformidad».
- **Todo en `vw`/`vh` relativo a la ventana** (no px fijos). No conviertas a px o clonas un ancho.
- **`url()` dentro de un bloque `styles:`** lo resuelve esbuild en build (peta con rutas de asset
  runtime): usa **root-absoluto `/icons/...`** para los que se sirven en runtime. Los iconos
  nuevos (canales, estados, acciones) van como **máscara data-URI inline** para no depender de assets.
- **`<img>` sin `width`+`height`** → `audit:screen-hygiene` rojo. Por eso los glifos nuevos son
  `<span>` enmascarados, no `<img>`.
- Selectores de componente **`app-*`** (eslint `@angular-eslint/component-selector`).

## Cómo se retoma

```bash
export PATH=/usr/local/bin:$PATH        # o el node v22; el v20 rompe Angular 22
npm run build:agent-mini
python3 -m http.server 4291 --directory dist/agent-mini/browser &
# el mini vive a ~352x1025: en el navegador, viewport estrecho (p.ej. 390x880)
```

Gates que le tocan (el resto de `verify` no lo mira): `tokens:guard`, `audit:screen-hygiene`,
`lint`, `docs:guard`, `docs:coherence`, y el **build AOT** (`ng build` type-checkea las plantillas,
cosa que `tsc`/`verify` no hacen a fondo).

## Lo durable, que NO se reescribe aquí

- `projects/agent/docs/comunicador.md` — las medidas por sección del Comunicador (compartidas).
- `projects/agent-mini/docs/MEASURED.md` y `CODE-FINDINGS.md` — ingeniería inversa del mini.
