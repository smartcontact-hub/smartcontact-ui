# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir sesión. Estado *volátil* + qué hacer ahora.
> Se **SOBREESCRIBE** en cada cierre. El *por qué* durable vive en `docs/DECISIONS.md`
> (DD-N) y el mapa de docs en [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md).

## Dónde estamos (2026-06-14, tras el maratón "sistema operativo")
- DS **publicado** en GitHub Packages — `@smartcontact-hub/{styles,icons,components}`.
  **0.1.0 vivo; 0.2.0 cortada en código (verify verde), PENDIENTE de publicar.**
- **Sistema operativo del repo montado** (maratón L1-L9, L11): `DOCS-INDEX` (juez
  anti-duplicación), `AGENTS.md` (protocolo de cierre + trampas + bridge Figma MCP),
  `.impeccable.md` (alcance sagrado), gobernanza de Figma (no escribir sin registro +
  change-log en `guia-tokens.md`), formato DD-N con Descartadas, unit tests del pipeline
  (`test:unit` en `verify`) + hint copy-paste en parity. Decisiones en DD-14 / DD-15.
- **Puente Theme Designer → repo**: CONFIRMADO. Bridge Figma MCP = `mcp__figma__*`
  (figma-console-mcp, 9223) — recorded en AGENTS.

## Lo siguiente (en orden)
1. **Publicar 0.2.0** (operador, tu terminal):
   `cd …/smartcontact-ui && GITHUB_TOKEN=… npm run publish:packages -- --publish`
2. **Validar el round-trip del focus ring** (en curso): ya escrito en Figma (electric-blue 2px,
   variables `focus/ring/*`, registrado en el Figma change-log). **Re-exporta el tema desde el
   plugin** → corro `tokens:import` + `verify` y quito la fila `focus.ring` de DIVERGE. Las otras
   2 divergencias (dark, grises sutiles) son **system-wide** → en `docs/ROADMAP.md` con review.
3. **Bloque 3 — migrar `smart-contact-platform`** → [playbook](docs/playbook-migracion-platform.md)
   (SESIÓN APARTE; read-only aquí).
4. **Bloque 5 — archivar `smartcontact-ui-main`** → [playbook](docs/playbook-archivar-ui-main.md)
   (sesión aparte).
5. **Backlog durable** (lo diferido, con disparador + validación) →
   [`docs/ROADMAP.md`](docs/ROADMAP.md): decisión dark, pase a11y de grises sutiles, generador de
   color, resolver de refs del preset, Migration Assistant.

## Índice de documentos
- **Mapa completo** → [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) (qué doc manda en cada tema).
- **Decisiones + Descartadas** → `docs/DECISIONS.md`. **Reglas / trampas / cierre** → `AGENTS.md`.
- **Alcance sagrado** → `.impeccable.md`. **Puente Figma + change-log** → `docs/guia-tokens.md`.

## Cómo reabrir
- **Seguir aquí**: "continúa con el plan" (cargo memoria + este doc).
- **Migrar la app / archivar ui-main**: abrir sesión EN ese repo y pedir el playbook correspondiente.
