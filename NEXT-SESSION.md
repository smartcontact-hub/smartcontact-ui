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
2. **L10 — Divergencias de color → ¿encodar en Figma `aura/custom`?** (PENDIENTE de tu
   decisión). La nota Backlog está en Figma con el "cómo entra en `aura/custom`" por
   divergencia. Decisión: **encodar** (Figma se completa; DIVERGE→ENFORCE) **vs mantener**
   como divergencia consciente (status quo, ya guardada por `token-parity §6`). Si encodas:
   se escribe en Figma **con registro** (Figma change-log) y round-trip verde.
3. **Bloque 3 — migrar `smart-contact-platform`** → [playbook](docs/playbook-migracion-platform.md)
   (SESIÓN APARTE; read-only aquí).
4. **Bloque 5 — archivar `smartcontact-ui-main`** → [playbook](docs/playbook-archivar-ui-main.md)
   (sesión aparte).
5. **Follow-ups con criterio (Bloque E, diferido)**: generador de color (opt-in, si los
   diseñadores iteran color a menudo) · resolver de refs del preset (aparte, sin romper el
   guard core) · Migration Assistant del Theme Designer = cómo subimos versión de PrimeNG
   (verificar su comportamiento la 1ª vez).

## Índice de documentos
- **Mapa completo** → [`docs/DOCS-INDEX.md`](docs/DOCS-INDEX.md) (qué doc manda en cada tema).
- **Decisiones + Descartadas** → `docs/DECISIONS.md`. **Reglas / trampas / cierre** → `AGENTS.md`.
- **Alcance sagrado** → `.impeccable.md`. **Puente Figma + change-log** → `docs/guia-tokens.md`.

## Cómo reabrir
- **Seguir aquí**: "continúa con el plan" (cargo memoria + este doc).
- **Migrar la app / archivar ui-main**: abrir sesión EN ese repo y pedir el playbook correspondiente.
