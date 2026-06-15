# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir. Estado *volátil* + qué hacer ahora. Se SOBREESCRIBE en cada cierre.
> El *por qué* durable vive en `docs/DECISIONS.md` (DD-N). Plan durable: `~/.claude/plans/async-greeting-pumpkin.md`.

## Estado de un vistazo
- **Consolidación (DD-17)**: ✅ un repo · Cloudflare **sc-demo.pages.dev** + **sc-supervisor.pages.dev** · platform archivado.
- **Puente seamless de SIZING (DD-18, W1)**: ✅ HECHO y en main (commit `1016012`). Un cambio de
  **radio/padding/fontSize de componente** en Figma → `tokens:import` → se auto-aplica al código vía
  tokens `--sc-cmp-*` (zona generada `@sc-gen:cmp-sizing` en `04-component.css`). El **color** sigue
  con gate humano a propósito. Probado: e2e 58/58 sin diff + prueba de fuego (radio md→lg → parity
  verde sin tocar `.ts`).

## El loop, cómo funciona HOY
1. Diseñador cambia token en Figma → **Push Tokens** (el plugin empuja `kit-export-dtcg.json` a la
   rama **`design-tokens-sync`** — el plugin la NECESITA existente; **NUNCA borrarla**, está protegida
   con ruleset id 17705331; si hay que resetearla: `git push --force origin main:design-tokens-sync`).
2. El workflow `tokens-sync.yml` parte de `main`, toma el export, corre `tokens:import` (regenera
   primitivos **y** `--sc-cmp-*`), `verify` + `e2e`, y **publica la rama + abre PR aunque e2e falle**
   (`if: always()`, línea 63).
3. **El preview ya funciona**: Cloudflare hace deploy por rama → hay un preview de `design-tokens-sync`
   (URLs en el dashboard Cloudflare → cada proyecto → pestaña *Deployments*). ⚠️ El usuario NO ha tocado
   Cloudflare — **verificar que el preview por rama está ON** y encontrar las URLs (1er paso abajo).
4. Si gusta → mergear el PR a main → corren todos los controles → producción (los links de verdad) se
   actualiza. Si no → cerrar el PR; producción intacta.

## ⚠️ Lo que FALTA (pendiente, prioridad alta): "gate verde automático" — tarea #85
**Problema**: `e2e/components.spec.ts` (+ `e2e/smoke.spec.ts`) tienen **68 aserciones de métrica con px
clavados a mano** (33 `toEqual({...})` + 33 `.toBe('Npx')`, ej. `'border-radius': '6px'`). En CI **solo
corren las métricas** (las screenshots se saltan, `if (process.env['CI']) return`, línea 25). Por eso un
cambio REAL de token → e2e rojo (los tests esperan lo viejo) → **main CI rojo tras mergear**. parity SÍ
pasa (el código auto-aplicado cuadra con Figma); revienta el e2e de métricas hardcoded.

**Solución diseñada** (aprobada en concepto): convertir las 68 a **snapshot** (`toMatchSnapshot`, con
`JSON.stringify` para los objetos) → así `playwright --update-snapshots` las regenera. `tokens-sync.yml`
corre el e2e con `--update-snapshots` + commitea los snapshots → la rama va verde → preview → merge →
main verde. La garantía de "es el número correcto de Figma" la SIGUE dando parity (token↔export). Las
screenshots se quedan local-only (la revisión visual es el **preview de Cloudflare**). Plan: delegar la
conversión mecánica (68 sitios) a un agente + yo diseño el cambio de workflow + verifico (parity+e2e).

## Decisión PENDIENTE: nombre de la rama experimental — tarea #86
El usuario quiere un nombre **fácil y conciso** (hoy `design-tokens-sync`). **Recomendación: `preview`**
(da `preview.sc-demo.pages.dev` / `preview.sc-supervisor.pages.dev`). Renombrar = coordinar:
(1) el usuario reconfigura el plugin para empujar a `preview`; (2) cambiar el trigger de `tokens-sync.yml`
(`branches: [preview]`); (3) mover el ruleset de protección a `preview`; (4) actualizar docs/AGENTS trap.
**Confirmar el nombre con el usuario antes de tocar.**

## Próximos pasos (en ORDEN — esto es lo que pidió el usuario)
1. **Verificar el preview de Cloudflare** (no tocó nada ahí): confirmar que hay deploys por rama y dar
   las URLs de preview. Si no está ON, guiarle a activarlo (Cloudflare → proyecto → Settings → Builds &
   deployments → preview deployments = All branches).
2. **(Opcional ahora) nombre limpio de la rama** (#86) — confirmar `preview` y renombrar.
3. **TEST del loop con los links**: el usuario cambia un token (un **primitivo** o un **sizing** — esos
   sí fluyen; un ref semántico suelto no) → Push → ver el cambio **inmediato en el preview link**.
   (El preview funciona HOY sin el gate; el merge-a-producción-verde necesita el gate #85.)
4. **Montar el gate #85** (los 68 tests → snapshot) para que el merge a main vaya verde solo.
5. **Lotes restantes del plan** (tareas #81-84): **W4** cerrar los 4 gaps del DS (avatar px, tag xs,
   confirm icon — borran locales del Supervisor; iconos Outlined va con decisión de marca) · **W2**
   READMEs + perfil de org `smartcontact-hub/.github` (humano, sin sopa de links — criterio de Rafa) ·
   **W3** mapa Figma↔componente (`mcp__figma__*`, NECESITA el bridge conectado; hoy solo ~5 de 47) ·
   **W5** decisiones de marca (iconos, dark zinc/cool, grises a11y — TUYAS).

## Hechos clave / cómo
- **Gate local**: `npm run verify` (+ `CI=1 npm run e2e` si visual) + `npm run docs:guard`.
- **Generador de sizing**: `scripts/token-gen-component.mjs` + mapa `scripts/sizing-map.mjs` (53 slots) +
  `DIVERGE_SIZING` (vacío; blinda una divergencia de sizing deliberada). `tokens:import` corre ambos
  generadores. NO editar la zona `@sc-gen:cmp-sizing` a mano.
- **App en local**: `npm run start:supervisor` (4400) · `npx ng serve sc-demo`.
- **Bugs ya cerrados esta sesión**: test:unit en Node 22 (ficheros explícitos) · borré la rama del plugin
  (recreada + protegida). Ver AGENTS Known Traps.
- **Branch de trabajo**: una por lote (no main) hasta verde; merge ff a main + watch CI.

## Índice
- Decisiones → `docs/DECISIONS.md` (DD-18 sizing, DD-17 consolidación). Reglas/trampas → `AGENTS.md`.
  Alcance sagrado → `.impeccable.md`. Loop Figma → `docs/guia-tokens.md`. Mapa docs → `docs/DOCS-INDEX.md`.
