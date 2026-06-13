/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario). Cubre el chrome del cheat-sheet y las
 * etiquetas de los grupos INTRÍNSECOS del DS (los del default colocado). Los
 * grupos que añada el consumidor traen sus propias strings ya traducidas — pasan
 * por el pipe `translate` sin match y se renderizan tal cual.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_KEYBOARD_SHORTCUTS_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      keyboardShortcuts: {
        title: 'Keyboard shortcuts',
        close: 'Close',
        navTitle: 'Navigation',
        paletteTitle: 'In the palette',
        openPalette: 'Open command palette',
        openPaletteWin: 'Open command palette (Win/Linux)',
        focusSearch: 'Focus page search',
        showShortcuts: 'Show shortcuts',
        moveSelection: 'Move selection',
        execute: 'Run',
      },
    },
  },
  es: {
    sc: {
      keyboardShortcuts: {
        title: 'Atajos de teclado',
        close: 'Cerrar',
        navTitle: 'Navegación',
        paletteTitle: 'En la paleta',
        openPalette: 'Abrir paleta de comandos',
        openPaletteWin: 'Abrir paleta de comandos (Win/Linux)',
        focusSearch: 'Enfocar buscador de la página',
        showShortcuts: 'Mostrar atajos',
        moveSelection: 'Mover selección',
        execute: 'Ejecutar',
      },
    },
  },
};
