# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir sesión. Estado *volátil* + qué hacer ahora.
> Se **SOBREESCRIBE** en cada cierre. El *por qué* durable vive en `docs/DECISIONS.md`
> (DD-N) y el mapa de docs en [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md).

## Dónde estamos (2026-06-14)
- DS **publicado** en GitHub Packages — `@smartcontact-hub/{styles,icons,components}` **0.1.0 y 0.2.0**
  (paquetes **privados**).
- **Repo AHORA PÚBLICO** (el source; los paquetes npm siguen privados). Se abrió para habilitar Pages.
  Historial escaneado limpio antes de abrir. Ver **DD-16**.
- **Página viva del showcase**: `sc-demo` desplegado a GitHub Pages on-push-to-main →
  **https://smartcontact-hub.github.io/smartcontact-ui/** (`.github/workflows/deploy-demo.yml`, opt-in
  a Node 24). Round-trip de tokens ahora end-to-end visible: variable → PR `design-tokens-sync` →
  merge → redeploy (~1-2 min).
- **Sistema operativo del repo** montado (DOCS-INDEX, AGENTS protocolo/trampas/bridge, `.impeccable`,
  gobernanza Figma, DD-N con Descartadas, `docs:guard` + `test:unit` en `verify`).

## Hecho (cierre de esta tanda)
- **Migración `smart-contact-platform` COMPLETA** (sesión aparte, repo consumidor): rama
  `feat/adopt-published-ds`, 5 lotes (fundación → componentes → shell → ds-docs → borrado copia local),
  diff **+495 / −8538**. Verificado por lote (supervisor visual-regression 10/10 + smoke 9/9 + runtime
  ⌘K/?; ds-docs build + smoke 8/8). **Aún sin PR ni merge.** Quedan 4 locales a propósito (icon,
  illustrated-avatar, label-chip, confirm-host) = los 4 gaps del DS del ROADMAP.
- Showcase a Pages + repo público (DD-16) · Node 24 opt-in · scope viejo corregido en el demo.
- Playbook de migración endurecido contra la fuente; 4 gaps del DS registrados en ROADMAP.

## Lo siguiente (en orden)
1. **Abrir el PR de la migración** → en la sesión de `smart-contact-platform`: `git push -u origin
   feat/adopt-published-ds` + `gh pr create`. NO mergear hasta review + e2e visual cross-app final
   (el 4200 ya está libre). Follow-ups como issues: KeyboardShortcutsService muerto, docs stale de los
   27 borrados.
2. **Desbloquear los 4 locales** = los gaps del DS en [`docs/ROADMAP.md`](docs/ROADMAP.md): px en
   `sc-avatar`, `xs` en `sc-tag`, paquete de iconos a Outlined, `icon?` overridable en `ScConfirmService`.
   (+ entrada `styles` tokens-only / `exports`.) Cada uno = decisión de diseño deliberada, no de la migración.
3. **Archivar `smartcontact-ui-main`** → [playbook](docs/playbook-archivar-ui-main.md) (sesión aparte).
4. **Backlog durable** → [`docs/ROADMAP.md`](docs/ROADMAP.md): decisión dark, pase a11y de grises sutiles,
   generador de color, resolver de refs del preset, Migration Assistant.

## Índice de documentos
- **Mapa completo** → [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) (qué doc manda en cada tema).
- **Decisiones + Descartadas** → `docs/DECISIONS.md` (DD-16 = Pages/público). **Reglas / trampas /
  cierre** → `AGENTS.md`. **Alcance sagrado** → `.impeccable.md`. **Puente Figma + change-log** →
  `docs/guia-tokens.md`.

## Cómo reabrir
- **Seguir aquí**: "continúa con el plan" (cargo memoria + este doc).
- **Ver el showcase**: en vivo (URL de arriba) o en local `npx ng serve sc-demo` (`.claude/launch.json`).
- **Abrir PR / archivar ui-main**: abrir sesión EN ese repo y pedir el playbook correspondiente.
