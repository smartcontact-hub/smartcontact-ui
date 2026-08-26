# Cuaderno de `sc-agent` — réplica del Agent real

> **Para qué existe**: que una sesión nueva de prototipado en `sc-agent` **no empiece de
> cero**. Aquí vive lo que costó medir: de dónde sale cada valor, qué codifica cada icono,
> qué estados tiene cada pantalla y cómo volver a comprobarlo contra la app real.
>
> **No** es la doc del Design System (esa vive en [`docs/`](../../../docs/DOCS-INDEX.md)).
> Esto es el cuaderno de UNA app réplica, y por [DD-35](../../../docs/DECISIONS.md) las
> réplicas **no se tokenizan a propósito**: aquí se copian los valores del real tal cual.

## Índice

| Cuaderno | Qué contiene |
|---|---|
| [`escala.md`](./escala.md) | **Léelo primero.** La conversión `px = vw × 14.56` y por qué. Sin esto, cualquier medida que copies del real sale mal. |
| [`tabla.md`](./tabla.md) | Historial y Pendientes: la matriz de iconos, la barra de estado, los 3 estados de gestión. |
| [`comunicador.md`](./comunicador.md) | El widget flotante: carcasa, navbar, dialpad y sus estados. |

## El método (vale para cualquier pieza nueva)

La app real es **`https://comunicatoraeddev.smart-contact.com/sismac/`** (entorno de
desarrollo del Comunicador, credenciales de desarrollo, sistema AED). Sale de la card
[SISMAC-3780](https://jira.dvtech.io/browse/SISMAC-3780).

**El bundle desplegado viene SIN minificar.** Eso es lo que hace barata esta réplica: trae
la plantilla y el SCSS íntegros de cada componente, con sus comentarios. No hace falta leer
el DOM a ojo.

1. `curl` el `index.html` y bájate los chunks que referencia. Ojo: los chunks perezosos
   solo se nombran dentro de otros chunks — hay que recorrer hasta que no aparezcan nuevos
   (33 en total la última vez).
2. Las plantillas están como `// angular:jit:template:<ruta>` seguido de
   `var x_component_default = \`…\``; los estilos, como
   `var x_component_default2 = '/* … */'`.
3. Los SVG se descargan por URL, tanto `media/<nombre>-<hash>.svg` como
   `assets/icons/…`. 112 disponibles.
4. Para lo que solo se ve en vivo (estados, clases condicionales, colores computados),
   mídelo en la sesión abierta con `getComputedStyle` — **nunca lo deduzcas del CSS**: hay
   reglas que solo aplican con cierto estado del agente (ver `comunicador.md`).

## Dónde están los assets

- `projects/agent/public/icons/historial/` — iconos de la tabla, **originales sin tocar**
  (el color es dato, ver [`tabla.md`](./tabla.md)).
- `projects/agent/public/icons/comunicator/` — iconos de la navbar y la cabecera del
  widget, con sus tres estados (normal / hover / actived).

## Cómo verificar un cambio

```bash
npx ng build agent && (cd dist/agent/browser && python3 -m http.server 8792)
```

El build AOT es el que caza los errores de plantilla; `npm run typecheck` y `tsc` **no**
miran a fondo los `.html`/templates inline.
