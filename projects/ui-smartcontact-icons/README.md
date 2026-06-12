# @smartcontact/icons

Librería de iconografía SmartContact basada en Material Symbols Rounded.

## Qué expone

- `ScIconComponent` con selector `sc-icon`.
- `SC_ICON_CATALOG` con todos los iconos disponibles en `MaterialSymbolsRounded[FILL,GRAD,opsz,wght].codepoints`.
- Helpers `resolveScIconName`, `resolveScIconGlyph` y `resolveScIconClass` para wrappers.
- CSS global en `@smartcontact/icons/styles/index.css`.

## Uso en aplicaciones

Instala el paquete junto a `@smartcontact/styles` y `@smartcontact/components` cuando uses componentes con iconos.

```scss
@import '@smartcontact/styles/styles/index.css';
@import '@smartcontact/icons/styles/index.css';
```

```ts
import { Component } from '@angular/core';
import { ScIconComponent } from '@smartcontact/icons';

@Component({
  selector: 'app-icon-example',
  standalone: true,
  imports: [ScIconComponent],
  template: `<sc-icon name="check" ariaLabel="Completado"></sc-icon>`
})
export class IconExampleComponent {}
```

Los wrappers de `@smartcontact/components` aceptan nombres oficiales de Material Symbols:

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
