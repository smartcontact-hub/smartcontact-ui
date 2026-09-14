# Tema de Smart Contact para PrimeNG

Generado desde el commit `49f5aae` del Design System (PrimeNG 22.1.0, Aura 3.0.0).
Es el mismo tema que usan las apps de Smart Contact: con él, vuestra web se ve igual que las nuestras.
En la misma rama está también `tema-plugin.zip`, el export del plugin de Figma, con su propia guía
(`LEEME-plugin.md`) y la medida de cuánto se aparta de este.

## Instalar

1. Copia los tres ficheros a tu proyecto.
2. Carga los estilos globales, en este orden:

   ```css
   @import './smartcontact-tokens.css';
   @import './smartcontact-typography.css';
   ```

3. Da el tema a PrimeNG:

   ```ts
   import scPreset from './sc-preset.mjs';

   providePrimeNG({
     theme: { preset: scPreset, options: { prefix: 'p', darkModeSelector: '.sc-dark' } },
   });
   ```

4. Modo oscuro: pon la clase `sc-dark` en `<html>`. Cambia a la vez los tokens y el tema.

## Tres cosas que no cambiar

- **La raíz de la página a 16 px.** Las medidas están hechas para `html { font-size: 16px }`.
- **La fuente Inter**, que los estilos de texto dan por cargada.
- **El prefijo `p`** de las variables de PrimeNG.

## Qué cambia respecto al zip anterior

- Es el primer zip generado así.
