# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir sesión. Esto es el *estado volátil* + qué hacer ahora.
> Se **SOBREESCRIBE** en cada cierre (no se acumula). El *por qué* durable vive en
> `DECISIONS-LOG-B.md` y en la memoria del agente.

## Dónde estamos (2026-06-14)
- DS **publicado** en GitHub Packages — `@smartcontact-hub/{styles,icons,components}`,
  org `smartcontact-hub`. **0.1.0 vivo; 0.2.0 cortada en código, PENDIENTE de publicar.**
- **Puente Theme Designer → repo** (workflow `tokens-sync`): **CONFIRMADO end-to-end**
  (run verde + PR limpio auto, una sola corrida — PR #3 de test cerrado). Workflow robusto
  (`f5ce783`): trabaja sobre main, resetea la rama a "main+cambio", PR limpio, auto-cura.
  Listo para producción: un diseñador cambia variable en Figma → push → PR limpio solo.
- **Prototipo** `projects/sc-prototype`: 2 pantallas dogfoodeando la lib por nombre.
- Bloques 0, 1, 2, 4-1 hechos (CI verde). Branch protection **diferido**.

## Lo siguiente (en orden)
1. **Publicar 0.2.0** (operador, en tu terminal):
   `cd /Users/rafareses/dev/smartcontact-ui && GITHUB_TOKEN=… npm run publish:packages -- --publish`
2. **Puente: CONFIRMADO** ✅ (ya no hace falta probarlo; el próximo uso es real — un
   diseñador cambia variable en Figma → push → PR limpio solo).
3. **Bloque 3 — migrar `smart-contact-platform`** (SESIÓN APARTE; read-only aquí).
   Divergencias: `sc-illustrated-avatar`→`sc-avatar`, `sc-label-chip`→`sc-tag` variante
   label, `@ngx-translate/core` 15→17, `@primeng/themes` vs `@primeuix/themes`.
4. **Bloque 5 — archivar `smartcontact-ui-main`** (sesión aparte).
5. **Bloque 4 (ongoing)**: extender `token-gen` a color/semántica — **gated en que Figma
   encode esas decisiones como variables** (foco a11y, navy dark…); tests unitarios.

## Índice de documentos (dónde está cada cosa)
- **Plan por bloques** → `.claude/plans/async-greeting-pumpkin.md`
- **Decisiones + por qué** → `DECISIONS-LOG-B.md` (fundaciones: `DECISIONS-LOG.md`)
- **Cómo consume una app** → `docs/consumer-onboarding.md`
- **Tokens / el puente Figma** → `docs/guia-tokens.md` (§2.bis)
- **Cortar versión** → `npm run version:bump` + `CHANGELOG.md`
- **Principios / reglas** → `AGENTS.md` + `CLAUDE.md`

## Cómo reabrir
- **Seguir aquí**: "continúa con el plan" (cargo memoria + este doc).
- **Migrar la app**: abrir sesión EN `smart-contact-platform` y pedir el playbook del Bloque 3.
