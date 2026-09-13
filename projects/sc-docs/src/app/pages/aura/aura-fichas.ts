/**
 * Lo que la herramienta NO puede escribir: el resumen en llano y lo que hace el envoltorio.
 *
 * Todo lo demás de la ficha (qué cambia, cuánto, por qué) sale de `tools/aura-diff.mjs`, que
 * lo mide contra Aura puro y lo deja en `public/aura/<componente>.json`. Lo de aquí se escribe
 * a mano leyendo ese JSON y el código del `sc-*`, así que cada frase lleva su cifra y se
 * reescribe cuando se regenere la ficha.
 */
export interface AuraFicha {
  /** Nombre de PrimeUIX (`button`), el del JSON. */
  readonly componente: string;
  readonly titulo: string;
  readonly sc: string;
  readonly prime: string;
  readonly enCorto: readonly string[];
  /** Qué añade el envoltorio: API, estructura y accesibilidad. */
  readonly envoltorio: readonly { readonly titulo: string; readonly texto: string }[];
  /** Traducción de las entradas propias del `sc-*` a las de PrimeNG. */
  readonly api: readonly { readonly sc: string; readonly prime: string; readonly nota: string }[];
}

export const AURA_FICHAS: Readonly<Record<string, AuraFicha>> = {
  boton: {
    componente: 'button',
    titulo: 'Botón',
    sc: 'sc-button',
    prime: 'p-button',
    enCorto: [
      'Las medidas no son nuestras: PrimeOne ya dibuja el botón con relleno 7 y 10,5, hueco 7 y redondo 28, mientras Aura en primeng.dev usa 6 y 10, 8 y 32. Lo heredamos al copiar PrimeOne, y nuestro código sigue a Figma.',
      'Lo único que cambiamos nosotros en el Kit es la marca: primario azul marino (PrimeOne lo trae azul y Aura esmeralda), grises de marca, electric blue en info, amarillo en aviso, y el anillo de foco de 1 a 2.',
      'Nuestro código se aparta del Kit a propósito en dos sitios, por contraste: el rojo sólido baja un paso en claro y el primario sube un paso en oscuro.',
      'Y se aparta sin motivo escrito en tres: los grises en oscuro (el Kit y PrimeOne usan zinc, nuestro código el gris de marca de claro), el texto del botón de aviso en claro (1,92:1 sobre blanco, el Kit pide 4,92) y el tamaño de la insignia.',
    ],
    envoltorio: [
      {
        titulo: 'Una API con nombres de producto',
        texto:
          'Aura reparte la apariencia en tres interruptores (`outlined`, `text`, `link`) que se pueden encender a la vez; `sc-button` la reduce a una sola entrada, `appearance`, con cuatro valores que no se pisan. El tamaño se escribe `sm | md | lg` en vez de `small | large`, y el color, `variant` en vez de `severity`.',
      },
      {
        titulo: 'Iconos por nombre',
        texto:
          'En Aura el icono es una clase (`pi pi-check`). Aquí es un nombre de Material Symbols con `iconFilled` e `iconSize`, que el envoltorio pinta por la plantilla `#icon` de PrimeNG.',
      },
      {
        titulo: 'Accesibilidad',
        texto:
          'Si el botón no tiene texto, su nombre accesible sale de `iconAriaLabel` (o de `ariaLabel`, que manda). El icono es decorativo (`aria-hidden`) salvo que lleve etiqueta: entonces pasa a `role="img"`. Un clic con el botón deshabilitado o cargando se corta antes de emitir `clicked`.',
      },
      {
        titulo: 'Lo que no pasa',
        texto:
          'El envoltorio no deja llegar a `p-button` las entradas de la lista de abajo: sombra (`raised`), `plain`, insignia, `tabindex`, `autofocus`, estilos sueltos y `buttonProps`. Si un equipo las necesita, hoy tiene que usar `p-button` directamente.',
      },
    ],
    api: [
      { sc: 'variant', prime: 'severity', nota: 'Mismo conjunto de valores.' },
      { sc: 'appearance', prime: 'outlined · text · link', nota: 'Una entrada con cuatro valores en vez de tres booleanos.' },
      { sc: 'size', prime: 'size', nota: '`sm | md | lg` se traduce a `small | (nada) | large`.' },
      { sc: 'fullWidth', prime: 'fluid', nota: 'Solo cambia el nombre.' },
      { sc: 'iconPosition', prime: 'iconPos', nota: 'Solo cambia el nombre.' },
      { sc: 'icon · iconFilled · iconSize', prime: 'plantilla #icon', nota: 'Nombre de Material Symbols en vez de clase `pi`.' },
      { sc: 'iconAriaLabel', prime: 'ariaLabel', nota: 'Nombre accesible cuando no hay texto.' },
      { sc: 'clicked', prime: 'onClick', nota: 'No se emite si está deshabilitado o cargando.' },
    ],
  },
};
