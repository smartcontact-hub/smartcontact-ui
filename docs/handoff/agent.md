# Frente · Agent — réplica medida del Comunicador — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**.
> No toques los hand-offs de otros frentes. Lo durable vive en `docs/` y en
> `projects/agent/docs/`.
> **Sello: 2026-08-26 (s35) — HEAD `020928a`. Preflight verde, CI verde LEÍDO, todo en `main`.**

## Qué es este frente

Réplica **pixel a pixel** de la app real de Agent
(`comunicatoraeddev.smart-contact.com/sismac/`) dentro de `projects/agent`, más el arnés
de medición que la mantiene honesta. Sale de la card
[SISMAC-3780](https://jira.dvtech.io/browse/SISMAC-3780).

Va por un protocolo de 9 fases (paridad tipográfica y de escala). El estado por fase, con
sus gates, está en **[`findings/STATUS.md`](../../findings/STATUS.md)** — ese es el fichero
de verdad; este de aquí es el resumen y lo que toca hacer.

## Dónde está la cosa

|                   |                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Fases cerradas    | **0** fuentes · **1** breakpoints · **1.5** estados · **5** curvas · **8** comportamientos |
| Fases parciales   | **3** censo · **4** causas · **6** aplicación · **7** verificación                         |
| A 1456, 9 estados | **0 bloqueantes · 0 menores** contra la línea base                                         |
| Fluidez           | peor deriva **0.365vw** (5.31px), aislada en `sc-icon`                                     |
| Bloqueado         | todo lo que exige medir el ORIGINAL en vivo → **login**                                    |

Lo aplicado y verificado hasta hoy: las fuentes del original self-hospedadas, la vuelta a
`vw`, fuera el lienzo con `zoom`, y los tamaños que vivían fuera del CSS.

## ▶︎ SIGUIENTE — sin preguntar

1. **Seguir puliendo contra el original, que es lo que Rafa va pidiendo a ojo.** El método
   que funciona: él señala algo, se MIDE en su Chrome (sesión abierta, `tab` del original),
   y se aplica el número. Lo hecho el 26-ago está abajo; lo que quede pendiente saldrá de
   él, no de una lista.
2. Del protocolo de fases, nada alcanzable sin sesión. Si aparece tiempo, lo único útil es
   ensanchar `parity:constancy` a los 25 anchos de `findings/phase-1-breakpoints.json` en
   vez de a 3, pero es más de lo mismo: no descubre categorías nuevas.

### Lo que se ajustó el 26-ago (todo medido, no a ojo)

Chip de Conexión llenando su contenedor · tema claro con sus 48 variables `--mode*` reales ·
iconos de cabecera 15 → 9.86 · cabecera a la mitad de alta (KPI a 61.13 contra sus 61.15) ·
tabla bicolor (cabecera `#1f2429`, cuerpo `#24292f`) · medidor rojo/verde con datos reales,
colores muestreados de su `<canvas>` · interruptores y buscador negro en Grupos · las cinco
tarjetas a su ancho medido · tabla pegada al pie (5.83 de la barra) · desplegable de grupos
sin recortes.

## ⏸️ ESPERANDO A RAFA — no preguntar, no hacer

Tres decisiones suyas, todas escritas con su coste:

1. **La sesión para medir el original.** `npm run parity:login` abre una ventana, se
   loguea él, y guarda `.auth/original.json` (gitignored). **Antes hay que decidir el
   riesgo**: eso abre una SEGUNDA sesión de agente del mismo usuario, y eso es telefonía
   en vivo — puede echar a la suya o quedar como agente disponible y que le enruten una
   conversación real. Opciones en `findings/STATUS.md`.
2. **Los breakpoints 1366 y 1680 y el eje vertical en `vh`** (320 usos en el original
   contra 2 aquí). Descrito con coste en `findings/phase-8-new-behaviours.md`. No se toca
   sin poder verificarlo contra el original.
3. **`sc-icon`**, lo único que no escala. Cerrarlo pide tocar el DS y eso marca DIRTY todo
   lo que lo consuma.

## ⚠️ Trampas de este frente

- **Backticks dentro de `styles:`** rompen el build y el error **no los menciona**. Me ha
  pasado dos veces en esta sesión. Guardián: `npm run guard:backticks`, ya dentro de `verify`.
- **Tras pushear, LEE el CI**: `gh run list --branch main --workflow ci --limit 1`. El 26-ago
  se colaron SEIS pushes en rojo mientras yo escribía «preflight verde» en cada mensaje. El
  lock puede desincronizarse solo (peers con rango flotante) y `preflight` no corre `npm ci`.
- **Un `git diff` de TRES puntos compara contra la base de fusión, no contra `main` de hoy.**
  Con eso di por buena una PR que en realidad ya estaba aplicada y que, mergeada, habría
  borrado 432 ficheros. Para «qué cambiaría si la mergeo», dos puntos.
- **`export PATH=/usr/local/bin:$PATH`** siempre. El node de nvm (v20) rompe el repo.
- **Verificar a un solo ancho no vale.** Así se me coló el doble escalado del `zoom`: a
  1456 valía 1 y el fallo era invisible. Comprueba siempre con `parity:constancy`.
- **`HTTP 200` no prueba que un fichero exista**: el original es un SPA y devuelve su
  `index.html` a cualquier ruta. Mira los bytes mágicos.
- **`document.fonts.check()` no dice si una familia existe**: devuelve `true` con
  cualquier fallback. Mide anchos de texto.
- Los **tamaños fuera del CSS** (`[attr.width]`, `<img width>`, `[size]` numérico) no los
  alcanza ningún codemod de hojas de estilo. Si algo sale fijo, mira ahí primero.

## Cómo se retoma

```bash
export PATH=/usr/local/bin:$PATH
python3 -m http.server 8792 --directory dist/agent/browser &   # la réplica
npm run parity:constancy                                       # ¿sigue fluida?
```

Y luego `findings/STATUS.md`. Las herramientas, todas en `tools/`:

| comando                      | qué hace                                                  |
| ---------------------------- | --------------------------------------------------------- |
| `npm run parity:phase0`      | forense de fuentes de los dos lados                       |
| `npm run parity:probe`       | qué familias resuelve de verdad la réplica                |
| `npm run parity:inventory`   | censo del original desde su bundle, sin login             |
| `npm run parity:breakpoints` | mapa de breakpoints, leído de su CSS                      |
| `npm run parity:behaviours`  | qué usa el original que la réplica no tenga               |
| `npm run parity:states`      | matriz de estados: descubre, poda, comprueba idempotencia |
| `npm run parity:constancy`   | ¿mantiene la réplica su vw en todo el rango?              |
| `npm run parity:metrics`     | volcado NDJSON de un (ancho × estado)                     |
| `npm run parity:diff`        | diff de dos volcados, casando por clave estructural       |
| `npm run parity:login`       | ⚠️ guarda una sesión del original — leer el riesgo antes  |

## Lo durable, que NO se reescribe aquí

- `projects/agent/docs/escala.md` — la app mide en **`vw`**, como la real. Léelo primero.
- `projects/agent/docs/comunicador.md`, `tabla.md`, `README.md` — las medidas por sección.
- `findings/` — los artefactos de cada fase.
- `tools/README.md` — el arnés.
