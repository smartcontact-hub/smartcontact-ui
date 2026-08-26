# Fuentes self-hospedadas

Estos ficheros son **los mismos** que sirve la app real de Agent
(`comunicatoraeddev.smart-contact.com/sismac/assets/fonts/`). Se traen al repo con
`node tools/fetch-original-fonts.ts`, que además genera
`projects/agent/src/styles/_fonts-original.css`.

## Por qué están aquí y no vienen de Google

El original **no pide los pesos con `font-weight`**: los pide por **nombre de familia**
—`'Open Sans Semibold'`, `'Roboto Medium'`— porque sirve una cara **estática por peso**.
Con la Open Sans **variable** de Google esas familias no existen, así que el navegador
caía a un fallback: `Roboto` se pintaba con Open Sans, y hasta el bit `USE_TYPO_METRICS`
difería (`false` en el original, `true` en la variable de Google), con las métricas `win`
en 2189/600 contra 2302/651.

Medido en `findings/phase-0-verdict.md`. Con estos ficheros la paridad de métricas es
exacta.

## Formatos

- **Open Sans → `.woff`.** El original **no tiene `.woff2`**: su servidor es un SPA y
  responde `200` con el `index.html` a cualquier ruta inexistente, así que el código HTTP
  engaña. El descargador comprueba los **bytes mágicos** antes de guardar.
- **Roboto → `.woff2`**, que sí existe.

## Licencias

| familia | licencia | titular |
|---|---|---|
| Open Sans | Apache License 2.0 | Steve Matteson / Google |
| Roboto | Apache License 2.0 | Christian Robertson / Google |

Ambas permiten el self-hosting y la redistribución, incluida la comercial, conservando el
aviso de licencia. Texto completo: <https://www.apache.org/licenses/LICENSE-2.0>.

`Poppins-LightItalic`, que el original también declara, **no se trae**: la superficie
replicada no la usa en ningún sitio.
