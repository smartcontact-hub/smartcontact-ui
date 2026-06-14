# Playbook — archivar `smartcontact-ui-main`

> **Sesión APARTE.** `smartcontact-ui-main` es el **DS viejo** (el "molde" del que se construyó
> este repo espejo), scope `@smartcontact/*`, sin los guardarraíles actuales. Queda **superado**
> por el publicado `@smartcontact-hub/{styles,icons,components}`. Objetivo: **archivarlo**, no
> migrarlo — para matar la doble fuente de verdad. Principio rector: **una sola fuente de verdad**.

## Por qué archivar y no migrar
Este repo (`smartcontact-ui`) ya es el resultado unificado y publicado. `smartcontact-ui-main`
solo sobrevive como referencia histórica del molde. Mantener dos DS vivos = drift garantizado.

## Pre-flight — verificar que nadie lo consume (BLOQUEANTE)
1. Buscar consumidores del scope viejo y de rutas al repo:
   - `grep -rl "@smartcontact/" <repos del usuario>` (esp. `smart-contact-platform`).
   - Imports relativos a `smartcontact-ui-main/`.
2. Si algo lo consume:
   - Si es la app → primero el [playbook de migración](./playbook-migracion-platform.md) (que la
     pasa a `@smartcontact-hub/*`).
   - Si es otra cosa → migrar ese consumo al paquete publicado antes de archivar.
3. Confirmar que este repo espejo no depende de `ui-main` en runtime (solo lo usó como molde de
   construcción; las skills/prompts que lo referencian son históricas).

## Pasos
1. **README de `ui-main` → deprecación**: banner arriba — "⚠️ Deprecado. El Design System vive en
   `smartcontact-ui` y se publica como `@smartcontact-hub/*`. Este repo se conserva solo como
   referencia histórica." + enlace al repo nuevo y a `consumer-onboarding.md`.
2. **Tag final** (opcional): `git tag archived-final && git push --tags` para fijar el último estado.
3. **Freeze**: archivar el repo en GitHub (*Settings → Archive this repository*) → queda read-only.
   Alternativa local: mover a `~/dev/_archive/` para sacarlo del radar de trabajo.
4. **Quitar referencias activas** en docs/prompts del repo nuevo que apunten a `ui-main` como si
   fuese fuente viva (dejarlas solo como nota histórica "(molde, archivado)").

## Verificación
- El `grep` de consumidores queda vacío (nadie lo importa).
- El repo aparece como *Archived* en GitHub.
- En `smartcontact-ui`, `NEXT-SESSION.md` y el índice ya no listan `ui-main` como pendiente vivo.

## Criterio
Si el pre-flight encuentra un consumidor que no se puede migrar ya, **no archivar**: documentar el
bloqueo y archivar cuando el consumo esté movido. Archivar con consumidores vivos rompería esa app.
