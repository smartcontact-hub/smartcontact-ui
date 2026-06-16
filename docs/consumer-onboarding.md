# Consumir `@smartcontact-hub/*` en una app

Guía para que una app Angular consuma el Design System publicado en GitHub Packages
(privado, org `smartcontact-hub`). Validado por `projects/supervisor` (la app real, ya en
el monorepo), que consume el DS **por nombre** igual que una app externa.

> **Nota (DD-17, 2026-06-15)** · Los paquetes están **APARCADOS**: hoy el único consumidor
> (el Supervisor) vive en este mismo repo y resuelve `@smartcontact-hub/*` **local** por
> `tsconfig paths` → `./dist/*` (instantáneo, sin publicar). Esta guía aplica si vuelve a
> entrar un consumidor **externo** que instale los paquetes publicados.

## 0. El modelo en 1 minuto — un DS, dos profundidades

> Resuelve la duda más común entre equipos: *"¿descargamos el tema del Theme Designer y lo
> aplicamos, o usamos lo de `--sc-*`?"*. **No es ni-ni: es lo MISMO a dos niveles.**

**Nadie descarga un "tema".** El plugin Theme Designer es la **fuente** (sus tokens alimentan el DS);
su fichero de preset crudo **no se distribuye**. Se distribuye el **DS** (paquete npm), que sale de
esos mismos tokens y añade lo que el preset crudo no trae: divergencias de marca, a11y, el contrato
estable `--sc-*` y los componentes propios `sc-*`.

```
  Figma (Theme Designer) ──tokens──▶  DS (@smartcontact-hub/*) ──instalar──▶  tu app
       LA FUENTE                       EL PRODUCTO (npm)                       (1 línea)
   (no se ignora — alimenta todo)   preset --sc-* + CSS + componentes
```

### Las piezas (quién toca qué) — para no liarse

| Pieza | Qué es | Quién la usa |
|---|---|---|
| **Kit Figma "Smart-Contact Prime"** | donde se diseña (la fuente) | **diseño** |
| **Plugin Theme Designer** | empuja Figma → repo (el puente) | **diseño**. NI los devs |
| **El DS** (`@smartcontact-hub/*`) | el producto: tema + componentes | **los dos equipos** instalan ESTO |
| **"Generar tema" en primeng.org** | un tema *vanilla* de PrimeNG | **nadie** (sería salirse de la marca) |

**¿Y los temas Aura / Material / Lara / Nora?** Son los 4 "sabores" base de PrimeNG. Se elige uno **una
sola vez** al fundar el sistema — y ya está elegido: **Aura** (el más cercano a la marca). "Jugar" con
los otros = otra identidad = **dejar de usar el DS** (decisión de producto, no de diseño/dev).

**Un solo DS, dos formas de consumirlo:**

| | Equipo "instalar y ya el tema" | Equipo "`--sc-*`" |
|---|---|---|
| Instala | `@smartcontact-hub/*` | igual |
| Arranca | `provideSmartContactUi()` | igual |
| Usa | componentes **PrimeNG** ya tematizados | lo de al lado **+** tokens `--sc-*` en su CSS **+** componentes `sc-*` |
| ¿Toca `--sc-*`? | **No** — es interno, "el tema simplemente funciona" | **Sí** — es el contrato público |

→ **No son dos arquitecturas: es el MISMO paquete.** Uno se queda en la superficie, el otro profundiza.

**¿Son combinables?** **Sí**, porque son *lo mismo a dos niveles*, no dos cosas que compiten. Los dos
equipos instalan el mismo DS; una app aplica **un** preset (`provideSmartContactUi`), y el equipo
"profundo" solo consume más superficie. Un equipo "superficie" puede pasarse a `--sc-*` **cuando
quiera, sin migración** (mismo paquete, mismo look). *(Lo que NO es combinable en una misma app:
aplicar el preset CRUDO del plugin Y el `--sc-*` — son dos presets alternativos, se elige uno. Pero
ningún equipo necesita el preset crudo: el DS hace lo mismo y mejor.)*

**¿Es migration-safe?** **Sí.** Una fuente (Figma) → un DS → los dos equipos. Cambias un color en
Figma → el DS se regenera → `npm update` → los dos al día. Cero drift; los 3 paquetes van en lockstep.

**El "híbrido" (Theme Designer no se ignora):** Theme Designer está **aguas arriba de todo** — es la
fuente de los dos modos. Lo único que NO usamos es su *fichero* de preset crudo, porque el DS lo
sustituye con ventaja (divergencias + a11y + contrato + componentes). Si un equipo quisiera SOLO el
preset (sin la librería de componentes), se puede publicar un `@smartcontact-hub/theme` ligero
generado de la misma fuente — opción, no obligación.

### En cristiano (para no-devs): las dudas que siempre salen

- **¿Hay dos formas de consumir y dan resultados distintos?** No. Hay **un** DS; "las dos formas" son
  solo *cuánto se profundiza*. El look es **el mismo** (mismo paquete); quien profundiza tiene MÁS
  herramientas (tokens `--sc-*` + componentes `sc-*`), pero el tema base es idéntico.
- **¿Unos piden "el tema" y otros "los tokens"?** No. Todos reciben el MISMO DS, que **ES** el tema **y
  trae los tokens (`--sc-*`) dentro**. Se usan si se profundiza; si no, se ignoran. Un paquete, no dos pedidos.
- **¿Algún equipo "va con `--p-*`"?** No. `--p-*` es la fontanería **interna** de PrimeNG — nadie la
  toca (prohibida). El equipo "instala y ya" usa el DS, que por dentro usa `--sc-*` sin verlo → **se
  lleva el blindaje anti-PrimeNG gratis**, sin hacer nada. No lo pierde por ir simple.
- **¿`provideSmartContactUi()` es "solo un wrapper"?** Es un *wrapper* (una capa fina que re-expone
  PrimeNG en tu idioma con UNA llamada — por eso "instalar y ya") **+ más**: el tema propio (`--sc-*`,
  divergencias, a11y) **+** los componentes propios (`sc-*`).
- **¿Y lo custom?** Los componentes `sc-*` **vienen en el DS** y se tematizan igual (`--sc-*`). No hay
  nada que "solo funcione para lo estándar".
- **¿Dónde está el control de errores?** En los **guardarraíles** (parity / verify / CI / chivato
  a11y), automáticos — **competencia de DESARROLLO, no de diseño**. Diseño empuja tokens; si algo
  rompe, el sistema lo marca a los DEVS, no al diseñador. Por eso diseño está **cubierto** (no se puede
  romper el producto en silencio).

> **El "tema crudo" del plugin no se ofrece a nadie** — es peor (solo estándar, sin componentes
> propios, casado con PrimeNG). Una sola oferta para los dos equipos: **el DS.**

### ¿Qué falta para que los equipos externos puedan instalarlo? (la propuesta)

**Hoy el DS no está subido a ningún sitio.** El Supervisor lo usa porque vive en ESTE mismo repo
(carpeta `dist/`, sin "instalar" nada). Para que un equipo de FUERA haga `npm install
@smartcontact-hub/*`, los paquetes hay que **subirlos a un registro** del que se instala — eso es
*"publicar"*. El repo ya trae el botón (`npm run publish:packages`); está **apagado** desde DD-17
(cuando eras solo tú no hacía falta, y publicar a lo loco era fricción inútil). Con dos equipos
externos **ya hace falta encenderlo**. Eso es lo único que falta — no es un re-build, es un paso de release.

**Propuesta recomendada** (menos fricción + más mantenible en el tiempo):

1. **Una fuente** — Figma (Theme Designer). *Ya está.*
2. **Un DS** — los 3 paquetes, generados de esa fuente. *Ya está.*
3. **Distribución** — **GitHub Packages privado** (org `smartcontact-hub`). Cada equipo instala con un
   token de **solo-lectura** (§1 abajo). Privado = cumple "los paquetes no son públicos".
4. **Release** — cuando un cambio llega a `main` en **verde**, se publica versión nueva (auto en CI, o
   a mano con `publish:packages`). Los equipos hacen `npm update` y quedan al día.
5. **Consumo** — los dos equipos arrancan con `provideSmartContactUi()`. El "simple" se queda ahí; el
   de `--sc-*` profundiza (§3-4 abajo).

**Pros:** una fuente sin drift · **UN** paquete que mantener (las dos profundidades salen del mismo) ·
npm estándar (familiar a cualquier dev) · privado · versionado = migration-safe.
**Contras:** cada equipo configura su token de lectura una vez · hay que encender el publish + elegir
cuándo publica (recomiendo: **auto al mergear verde a main**) · disciplina de versiones (semver).

**Alternativas (y por qué no):**
- **Instalar desde el repo Git** (sin registro) → menos setup, pero sucio: arrastra el repo entero,
  build al instalar, sin versiones limpias. Menos mantenible.
- **Meter las apps de los equipos en este monorepo** (como el Supervisor, cero publish) → acopla dos
  equipos externos al repo del DS; no es como trabajan equipos separados.
- **Dos artefactos** (un preset "plano" + el DS completo) → solo si un equipo NO quiere depender de la
  librería de componentes; más superficie que mantener. Se difiere salvo que un equipo lo pida.

> En una frase: **un Figma → un DS → publicado privado → los dos equipos instalan lo mismo y
> profundizan lo que quieran.** El "cómo consumir" (token, install, setup) está justo abajo.

## 1. Autenticación (GitHub Packages privado)

Crea un `.npmrc` en la raíz de tu app (gitignóralo) con un token de scope `read:packages`:

```
@smartcontact-hub:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Exporta `GITHUB_TOKEN` en tu entorno / CI (nunca lo commitees).

## 2. Instalar

```
npm install @smartcontact-hub/styles @smartcontact-hub/icons @smartcontact-hub/components
```

Los tres se versionan en **lockstep** — instala la misma versión de los tres. Las
versiones de GitHub Packages son inmutables; para actualizar: `npm update` /
`npm install @smartcontact-hub/components@<nueva>`.

Peer deps (deben existir en tu app): Angular ^21, `primeng` ^21, `@primeuix/themes` ^2,
`@ngx-translate/core` ^17.

## 3. Setup (una vez)

**`app.config.ts`** — una sola frontera de tema:

```ts
import { provideSmartContactUi } from '@smartcontact-hub/components';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSmartContactUi(),   // envuelve providePrimeNG + el preset --sc-*
    // …router, animations, ngx-translate…
  ],
};
```

**`styles.scss`** — el CSS de tokens + iconos:

```scss
@import '@smartcontact-hub/styles/styles/index.css';
@import '@smartcontact-hub/icons/styles/index.css';
```

Dark mode: añade la clase `.sc-dark` a un ancestro (el selector por defecto del preset).

## 4. Usar

Componentes standalone — impórtalos por nombre y úsalos:

```ts
import { ScDatatableComponent, ScInputTextComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
```

```html
<sc-icon name="group"></sc-icon>
<sc-inputtext [(value)]="name" fluid></sc-inputtext>
```

## 5. Gotchas (descubiertos dogfoodeando el Supervisor)

- **Componentes i18n-key-driven.** Varios (`sc-page-header`, `sc-empty-state`,
  `sc-section-card`/`sc-subsection`/`sc-slot`…) reciben **claves** (`titleKey`,
  `bodyKey`), no texto: las resuelve `@ngx-translate`. Registra tu diccionario, o las
  claves se renderizan tal cual (fallback de ngx-translate). Los componentes con copy
  fijo propio (inline-rename, bulk-action-bar) ya traen su diccionario.
- **Inputs booleanos: atributo escueto OK** (desde 0.2.0). Los `input<boolean>()` llevan
  `transform: booleanAttribute`, así que `<sc-inputtext fluid>` funciona (como
  `<input disabled>`). `[fluid]="true"` también vale.
- **`--sc-*` es el contrato.** Tematiza con los tokens `--sc-*` (públicos). Nunca uses
  `--p-*` (viven solo dentro del preset).

## 6. Referencia viva

`projects/supervisor` es el ejemplo canónico de consumo (la app real construida
solo con `sc-*` + tokens). El catálogo completo está en el demo (`projects/sc-demo`).
