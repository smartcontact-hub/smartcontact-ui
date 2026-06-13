# DECISIONS-LOG-B — Mitad B, lote 1 (port de componentes)

> Una entrada por pieza: qué se portó, el barrido de escala, el resultado del
> diff visual y las decisiones §4 tomadas con su base. Guion del lote:
> `docs/master-prompt-mitad-b.md` (fuente operativa: `docs/component-port-plan.md`).

---

## GATE — `sc-component-icon-resolver`: se porta TAL CUAL (decisión §4.2)

**Decisión:** portar el resolver del catálogo de desarrollo sin cambios, junto
con los tipos públicos de `lib/core/types`.

**Racional (base verificada):**
- Es autocontenido (109 líneas, cero dependencias más allá de un tipo) y
  resuelve a clases CSS `sc-icon-font--*` que el paquete `@smartcontact/icons`
  YA genera (4.250 clases en `material-symbols-icons.generated.css` — grep).
- Los 15 wrappers del catálogo de desarrollo lo consumen vía template con
  clases CSS, no vía el componente `<sc-icon>`: sustituirlo por el mapeo del
  catálogo de diseño obligaría a reescribir todos los templates y acoplar los
  wrappers al componente de iconos — eso es rediseño, no adopción, y rompería
  el principio "la solución más simple que resuelve el problema real".
- Mantiene compat con strings legacy `pi pi-*` de consumidores existentes.
- **Revisión futura anotada:** al reconciliar `sc-icon` (§4.6, fuera de este
  lote) puede unificarse resolver + componente; la decisión de hoy no lo
  bloquea (el mapa alias→Material es compartible).

Sin barrido de escala (no hay CSS). `npm run verify` en verde tras el port.

---
