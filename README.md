# Smart Contact · Tema para PrimeNG

Versión 0.20260914.2130 · 2026-09-14 · origen: Design System de Smart Contact (`e4d2885f`)

Tema oficial de Smart Contact para aplicaciones Angular con PrimeNG. Es el mismo tema que utilizan las
aplicaciones de Smart Contact, por lo que los componentes se muestran de forma idéntica en ambos entornos.

## Contenido

| Fichero | Descripción |
|---|---|
| `sc-preset.mjs` | Preset de PrimeNG (Aura con la identidad de Smart Contact). Incluye las variables `extend` que genera el plugin de Figma (`--p-typography-*`, `--p-app-typography-*`, `--p-presence-*`, `--p-component-custommodal-*`). |
| `sc-preset.d.ts` | Declaración de tipos para TypeScript. |
| `smartcontact-tokens.css` | Tokens de diseño `--sc-*`, modo claro y oscuro. |
| `smartcontact-typography.css` | Estilos de texto `.sc-text-*`. |
| `manifiesto.json` | Versión, origen y resultado de las comprobaciones. |

## Requisitos

- Angular con PrimeNG 21 o superior.
- Tamaño de fuente raíz de 16 px (`html { font-size: 100% }`).
- Fuente Inter disponible en la aplicación.

## Instalación

1. Instalar el paquete desde el fichero `.tgz`:

   ```sh
   npm install ./local-libs/archives/smartcontact-tema.tgz
   ```

2. Añadir los estilos globales en `angular.json` → `styles`, a continuación de los estilos propios:

   ```json
   "node_modules/smartcontact-tema/smartcontact-tokens.css",
   "node_modules/smartcontact-tema/smartcontact-typography.css"
   ```

3. Configurar PrimeNG con el preset. El resto de opciones existentes se mantiene:

   ```ts
   import scPreset from 'smartcontact-tema';

   providePrimeNG({
     theme: { preset: scPreset, options: { prefix: 'p', darkModeSelector: '.sc-dark' } },
   });
   ```

4. Modo oscuro: añadir la clase `sc-dark` al elemento `<html>`. Afecta a la vez a los tokens y al preset.

## Verificación

Con la aplicación en ejecución, en la consola del navegador:

```js
const v = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
[v('--p-primary-color'), v('--p-typography-font-size-100')];
```

Resultado esperado: `#1b273d` y un valor no vacío. Sin estilos propios que los modifiquen, los botones y
campos de tamaño normal miden 32,5 px de alto (27 px el pequeño y 40 px el grande).

## Actualización

Cada versión se distribuye con el mismo nombre de fichero, `smartcontact-tema.tgz`. Para actualizar,
basta con sustituir el fichero y ejecutar el comando del paso 1; la configuración no cambia. La versión
instalada figura en la cabecera de este documento y en `node_modules/smartcontact-tema/manifiesto.json`.

## Cambios respecto a la versión anterior

- Ficheros modificados: sc-preset.mjs.
- Tokens de diseño modificados: 0.
- Estilos comunes del tema: sin cambios.
- Reglas CSS del tema: sin cambios.
- Componentes con estilos modificados: togglebutton.

## Comprobaciones de esta versión

- Ningún token de diseño con valor pasa a 0: superada.
- Variables `extend` del plugin de Figma definidas: 65 de 65.

---

Equipo de Diseño de Producto · Smart Contact
