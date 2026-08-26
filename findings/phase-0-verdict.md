# FASE 0 — FORENSE DE FUENTES · VEREDICTO

**Estado del gate: NO SUPERADO.** Hay dos desajustes de pipeline de fuentes. Nada aguas
abajo puede medirse hasta que se resuelvan o los aceptes por escrito.

Artefactos: `phase-0-fonts.json` (17 caras declaradas y 41 ficheros abiertos en el
original; 69 caras y 21 ficheros en la réplica) y `phase-0-resolve-probe.json`.

Manifiesto de la ejecución dentro de los JSON. Paridad de barra de scroll medida:
**0 px en ambos lados** (`--hide-scrollbars`), así que el viewport de maquetación coincide
y las medidas en vw no están sesgadas.

---

## 1. ¿Variable o estático?

|                           | original                              | réplica                   |
| ------------------------- | ------------------------------------- | ------------------------- |
| Open Sans                 | **ESTÁTICO**                          | **VARIABLE** (eje `wght`) |
| familias                  | **8 nombres distintos**, uno por peso | **1 nombre**, `Open Sans` |
| alojamiento               | self-hosted (`/assets/fonts/…`)       | Google Fonts + local      |
| formatos                  | eot + woff + ttf                      | woff2                     |
| `font-display`            | `swap`                                | `swap`                    |
| `unicode-range`           | ninguno                               | por subconjuntos (Google) |
| `size-adjust` / overrides | ninguno                               | ninguno                   |

El original declara `"Open Sans"`, `"Open Sans Light"`, `"Open Sans Semibold"`,
`"Open Sans Bold"`, `"Open Sans Extra Bold"` y sus cuatro itálicas **como familias
separadas**. Por eso su CSS pide el peso escribiendo
`font-family: "Open Sans Semibold"` en vez de `font-weight: 600`.

Además sirve **Roboto** estático en seis pesos (Thin, Light, Regular, Medium, Bold,
Italic) y un `Poppins-LightItalic`.

## 2. Métricas de las caras que importan

| lado     | cara                 | USE_TYPO_METRICS | typo asc/desc/gap | win asc/desc   | hhea asc/desc/gap | upem | cap  | x    |
| -------- | -------------------- | ---------------- | ----------------- | -------------- | ----------------- | ---- | ---- | ---- |
| original | Open Sans Regular    | **false**        | 1567 / −492 / 132 | 2189 / 600     | 2189 / −600 / 0   | 2048 | 1462 | 1096 |
| original | Open Sans Semibold   | **false**        | 1567 / −492 / 132 | 2189 / 600     | 2189 / −600 / 0   | 2048 | 1462 | 1106 |
| original | Roboto Regular       | false            | 1536 / −512 / 102 | 1946 / 512     | 1900 / −500 / 0   | 2048 | 1456 | 1082 |
| réplica  | Open Sans (variable) | **true**         | 2189 / −600 / 0   | **2302 / 651** | 2189 / −600 / 0   | 2048 | 1462 | 1096 |

Dos hechos, no interpretaciones:

- **El bit USE_TYPO_METRICS difiere.** El original lo lleva apagado, la réplica encendido.
  Ese bit decide qué juego de métricas usa el navegador para la caja de línea.
- **Las métricas `win` difieren**: 2189/600 contra 2302/651.

Las `hhea` sí coinciden en los dos (2189 / −600 / 0). Cuánto se traduce eso en píxeles de
alto de línea real depende del motor y de la plataforma: **es medible en la Fase 2 y no
lo voy a predecir aquí.**

## 3. ¿Puede la réplica reproducir el render del original?

**No, todavía no.** Dos causas, ambas medidas:

### BLOQUEANTE 1 — la réplica no sirve Roboto

Sonda de resolución (`phase-0-resolve-probe.json`, medida por ancho de texto contra tres
bases genéricas, no por `document.fonts.check`):

```
SI  Open Sans          <- única familia que la réplica sirve de verdad
NO  Open Sans Semibold
NO  Open Sans Bold
NO  Open Sans Light
NO  Roboto
NO  Roboto Medium
NO  Inter
```

La réplica declara `font-family: Roboto` en **2 sitios** —`.msg__gtext` (el nodo en la
tarjeta de Mensajes) y `.prof__gname` (el nombre de grupo en Perfil)— y ahí **cae a Open
Sans**. El original pinta Roboto de verdad, que es otra tipografía: `win` 1946/512 contra
2189/600 y `cap` 1456 contra 1462. No es un matiz, es otro tipo de letra.

### BLOQUEANTE 2 — familia resuelta distinta en los 8 usos de Semibold

La réplica declara `font-family: 'Open Sans Semibold'` en **8 sitios**. Ninguno resuelve:
todos caen a `Open Sans`. Los ocho llevan `font-weight: 600` al lado (verificado, ninguno
se queda sin él), así que **la instancia renderizada es wght 600 en los dos lados** — pero
la familia resuelta difiere, y eso es BLOQUEANTE según la tolerancia fijada. El impacto
real en píxeles se mide en la Fase 2; hoy está **sin verificar**.

### No bloqueante

`Inter` está declarada en `index.html` y en un `@font-face`, pero la app de agente no la
usa en ningún sitio (0 declaraciones). `Poppins-LightItalic` del original tampoco aparece
en la superficie replicada.

---

## Opciones para cerrar el gate — decide tú, no elijo yo

**A — Servir los mismos ficheros que el original.** Copiar `open-sans/*` y `roboto/*` de
`/assets/fonts/` del original a `projects/agent/public/fonts/`, y declarar los mismos 17
`@font-face` con los mismos nombres de familia. Reproduce el render exactamente, incluido
el bit USE_TYPO_METRICS. Coste: ~40 ficheros en el repo y revisar la licencia (Open Sans y
Roboto son Apache 2.0 / SIL OFL, así que self-hosting está permitido; conviene confirmarlo
por escrito). Es lo único que cierra los dos bloqueantes de golpe.

**B — Añadir solo Roboto y aceptar el resto.** Meter `Roboto` en el enlace de Google Fonts
y aceptar por escrito que la familia resuelta de Semibold difiera mientras la instancia
wght 600 coincida. Cierra el bloqueante 1; el 2 queda aceptado y se mide su residuo en la
Fase 2.

**C — Aceptar los dos y seguir.** Se mide todo y se reportan los residuos como deuda
conocida. No recomendable: contamina cualquier delta de altura de línea aguas abajo.

---

## Además: dos bloqueos que frenan la Fase 1, no la 0

**BLOQUEO DE ACCESO.** La Fase 0 pudo correr porque los estáticos del original son
públicos. La superficie que hay que medir (`#/private`) está **detrás de login**. No voy a
introducir credenciales. Para desbloquear las Fases 1–2 necesito que te loguees una vez y
guardemos el `storageState` de Playwright, o que acotemos el alcance a lo alcanzable sin
sesión.

**CONFLICTO DE ALCANCE con una decisión ya tomada.** El encargo pide paridad en **todo el
rango responsive**. La réplica está deliberadamente **congelada a px con referencia 1456**
(`projects/agent/docs/escala.md`), mientras el original es fluido en vw. Con eso, la Fase 1
y la Fase 5 reportarían BLOQUEANTE en **todos los anchos menos 1456**, por diseño y no por
defecto. Hay que elegir: o el rango responsive manda —y la réplica vuelve a vw—, o manda la
decisión de px —y el conjunto de medición se reduce a 1456—. Yo no lo decido.
