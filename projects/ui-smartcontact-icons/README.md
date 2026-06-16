# @smartcontact-hub/icons

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![Material Symbols](https://img.shields.io/badge/Material%20Symbols-Rounded-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-lightgrey)

Librería de iconografía SmartContact basada en Material Symbols Rounded.

## Qué expone

- `ScIconComponent` con selector `sc-icon`.
- `SC_ICON_CATALOG` con todos los iconos disponibles en `MaterialSymbolsRounded[FILL,GRAD,opsz,wght].codepoints`.
- Helpers `resolveScIconName`, `resolveScIconGlyph` y `resolveScIconClass` para wrappers.
- CSS global en `@smartcontact-hub/icons/styles/index.css`.

## Uso en aplicaciones

Instala el paquete junto a `@smartcontact-hub/styles` y `@smartcontact-hub/components` cuando uses componentes con iconos.

```scss
@import '@smartcontact-hub/styles/styles/index.css';
@import '@smartcontact-hub/icons/styles/index.css';
```

```ts
import { Component } from '@angular/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

@Component({
  selector: 'app-icon-example',
  standalone: true,
  imports: [ScIconComponent],
  template: `<sc-icon name="check" ariaLabel="Completado"></sc-icon>`
})
export class IconExampleComponent {}
```

Los wrappers de `@smartcontact-hub/components` aceptan nombres oficiales de Material Symbols:

```html
<sc-button label="Eliminar" icon="delete"></sc-button>
```

También mantienen alias semánticos SmartContact y compatibilidad legacy con algunas clases `pi pi-*` conocidas.

## Build y exportación

Desde la raíz del workspace:

```powershell
npm run build:icons
npm run export:icons
```

El tarball se genera en `dist/archives/`.

## Regenerar catálogo

El catálogo se genera desde:

```text
src/lib/icons/material-symbols-rounded.codepoints
```

Para regenerar TypeScript y CSS:

```powershell
npm run generate:icons
```

El generador actualiza:

- `src/lib/icons/sc-material-symbols.generated.ts`
- `src/lib/styles/material-symbols-icons.generated.css`

No edites esos archivos generados a mano.
