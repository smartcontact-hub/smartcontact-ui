# NEXT SESSION — Smart Contact DS (hand-off)

> Léeme **primero** al abrir sesión. Estado *volátil* + qué hacer ahora.
> Se **SOBREESCRIBE** en cada cierre. El *por qué* durable vive en `docs/DECISIONS.md`
> (DD-N) y el mapa de docs en [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md).

## Dónde estamos (2026-06-14, tras el maratón "sistema operativo")
- DS **publicado** en GitHub Packages — `@smartcontact-hub/{styles,icons,components}`.
  **0.1.0 y 0.2.0 publicadas (los 3 paquetes, GitHub Packages).**
- **Sistema operativo del repo montado** (maratón L1-L9, L11): `DOCS-INDEX` (juez
  anti-duplicación), `AGENTS.md` (protocolo de cierre + trampas + bridge Figma MCP),
  `.impeccable.md` (alcance sagrado), gobernanza de Figma (no escribir sin registro +
  change-log en `guia-tokens.md`), formato DD-N con Descartadas, unit tests del pipeline
  (`test:unit` en `verify`) + hint copy-paste en parity. Decisiones en DD-14 / DD-15.
- **Puente Theme Designer → repo**: CONFIRMADO. Bridge Figma MCP = `mcp__figma__*`
  (figma-console-mcp, 9223) — recorded en AGENTS.

## Hecho (cierre de esta tanda)
- **0.2.0 publicada** (los 3 paquetes) · **round-trip del focus ring cerrado** (Figma = código) ·
  consolidación de docs (logs archivados a `docs/history/`, `docs:guard` recursivo).

## Lo siguiente (en orden)
1. **Migrar `smart-contact-platform`** → [playbook](docs/playbook-migracion-platform.md)
   (SESIÓN APARTE en ese repo; rama `feat/adopt-published-ds`; consume `@smartcontact-hub/*@0.2.0`).
2. **Archivar `smartcontact-ui-main`** → [playbook](docs/playbook-archivar-ui-main.md) (sesión aparte).
3. **Backlog durable** → [`docs/ROADMAP.md`](docs/ROADMAP.md): decisión dark, pase a11y de grises
   sutiles, generador de color, resolver de refs del preset, Migration Assistant.

## Índice de documentos
- **Mapa completo** → [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) (qué doc manda en cada tema).
- **Decisiones + Descartadas** → `docs/DECISIONS.md`. **Reglas / trampas / cierre** → `AGENTS.md`.
- **Alcance sagrado** → `.impeccable.md`. **Puente Figma + change-log** → `docs/guia-tokens.md`.

## Cómo reabrir
- **Seguir aquí**: "continúa con el plan" (cargo memoria + este doc).
- **Migrar la app / archivar ui-main**: abrir sesión EN ese repo y pedir el playbook correspondiente.
