# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir sesión. Estado *volátil* + qué hacer ahora.
> Se **SOBREESCRIBE** en cada cierre. El *por qué* durable vive en `docs/DECISIONS.md`
> (DD-N) y el mapa de docs en [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md).

## ✅ Consolidación monorepo (DD-17) — COMPLETADA (2026-06-15)

**Un solo repo** = DS (3 libs, sagrado) + `sc-demo` (showcase) + `supervisor` (la app real).
La app consume el DS **local** por `tsconfig paths` → `./dist/*`: tocar un token se refleja al
instante en local y, vía Cloudflare, en los dos sitios (~1-2 min, sin publicar ni versionar).

### Sitios vivos — Cloudflare Pages (Node 22, preview por rama automático)
- **Showcase del DS** → **https://sc-demo.pages.dev** (`sc-demo`, hash-routing → SPA-safe).
- **App real** → **https://sc-supervisor.pages.dev** (`supervisor`, routing por path + `_redirects`).
- Verificado en vivo: raíz + F5 en ruta profunda (sin 404) + i18n (`/assets/i18n/*.json` sirve).
- **Compartir una rama**: haz `git push` de la rama → Cloudflare genera su preview URL sola
  (pestaña *Deployments* de cada proyecto en el dash). Eso cubre el "abrir ramas y compartirlas".

### El loop seamless (la prueba de fuego, ya operativa)
Theme Designer → push tema → PR `design-tokens-sync` → **merge manual** (tu gate) → Cloudflare
reconstruye `sc-demo` **y** `supervisor` → token visible en los dos. En local, `ng serve` al instante.

### Hecho en esta tanda (cierre)
- **Supervisor** traído como `projects/supervisor` (consume el DS local; build/lint/typecheck/e2e verdes).
- **Cloudflare** montado (2 proyectos en raíz) y **GitHub Pages retirado** (`deploy-demo.yml` borrado
  + Pages deshabilitado) — fuera Netlify, fuera Pages.
- **`sc-prototype` jubilado** (lo superan sc-demo + supervisor): fuera de `angular.json`/CI/scripts.
- **`ds-docs` fundido** en sc-demo (`docs/inventory.md` + página Tipografía).
- **`arebury/smart-contact-platform` archivado** (read-only, reversible; preserva audits/galerías) +
  **PR #51 cerrado** (superado por DD-17).
- **Paquetes `@smartcontact-hub/*` APARCADOS** (dormidos; `publish:packages` solo antes de un
  release externo real). Scripts intactos.

## Lo siguiente (backlog durable — nada urgente, todo en `docs/ROADMAP.md`)
1. **Los 4 gaps del DS** (hoy resueltos como locales en `supervisor/src/app/shared/components`):
   px en `sc-avatar`, `xs` en `sc-tag`, paquete de iconos a Outlined, `icon?` overridable en
   `ScConfirmService`. Cada uno = decisión de diseño deliberada → cuando se haga en el DS, se borra el local.
2. **Decisiones de marca**: superficies dark (zinc vs cool), pase a11y de grises sutiles.
3. **Profundidad gated**: generador de color semántico, resolver de refs del preset, Migration Assistant
   (subir PrimeNG — verificar su comportamiento real la 1ª vez).
4. **Atribución por persona (Marta)** en Theme Designer: requisitos escritos en ROADMAP + AGENTS
   (colaboradora con escritura + plugin commitea con SU identidad). Pendiente de capacidad del plugin.
5. **(Deuda anotada)** i18n absoluto del Supervisor: funciona servido en raíz; si algún día va a
   subpath, pasar a `APP_BASE_HREF`/ruta relativa.

## Índice de documentos
- **Mapa completo** → [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) (qué doc manda en cada tema).
- **Decisiones + Descartadas** → `docs/DECISIONS.md` (**DD-17** = consolidación/Cloudflare; DD-16 superseded).
- **Reglas / trampas / cierre** → `AGENTS.md`. **Alcance sagrado** → `.impeccable.md`.
- **Puente Figma + change-log** → `docs/guia-tokens.md`. **Inventario de componentes** → `docs/inventory.md`.

## Cómo reabrir / correr en local
- **Seguir aquí**: "continúa" (cargo memoria + este doc).
- **App real en local**: `npm run start:supervisor` (o `npx ng serve supervisor`, puerto 4400 —
  ver `.claude/launch.json`). Smoke: `/admin/agentes` con datos mock.
- **Showcase en local**: `npx ng serve sc-demo`. En vivo: las URLs de arriba.
- **Gate antes de dar algo por bueno**: `npm run verify` (+ `CI=1 npm run e2e` si tocas visual).
