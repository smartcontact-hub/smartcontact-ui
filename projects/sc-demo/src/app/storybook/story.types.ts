import { TemplateRef } from '@angular/core';

/**
 * Modelo del motor «Storybook-like» de sc-demo.
 *
 * Patrón de render: cada story se declara como un `<ng-template>` en el demo (con la
 * API real del componente DS) y el motor pinta canvas/knobs/código alrededor. NO se usa
 * `NgComponentOutlet` a propósito: `sc-select`/`sc-multiselect` proyectan `pTemplate`
 * (content-projection) y `sc-datatable` usa `model()` + `cellTemplate`, que el outlet de
 * componente no soporta sin un adaptador por componente. El template, en cambio, se
 * escribe con bindings nativos y un knob sólo muta `args` → el contexto del outlet
 * re-bindea, instantáneo y OnPush-friendly.
 */

/** Bag de argumentos de una story (knobs). Claves = inputs del componente. */
export type ScArgs = Record<string, unknown>;

/** Contexto que recibe el `<ng-template>` de la story: `let-args` (=$implicit) o `let-a="args"`. */
export interface StoryContext {
  $implicit: ScArgs;
  args: ScArgs;
}

/** Tipo de control (knob) para un arg. Determina el widget en StoryControls + la serialización. */
export type ArgControl =
  | { readonly kind: 'select'; readonly options: readonly (string | number)[] }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'text' }
  | { readonly kind: 'number'; readonly min?: number; readonly max?: number; readonly step?: number }
  | { readonly kind: 'color' };

/** Definición de un arg controlable: nombre del input + cómo editarlo + cómo serializarlo. */
export interface ArgType {
  /** Nombre del input del componente (clave en `args`). */
  readonly name: string;
  /** Etiqueta legible (default: `name`). */
  readonly label?: string;
  readonly control: ArgControl;
  /** Descripción corta (tooltip/ayuda). */
  readonly description?: string;
  /**
   * Cómo se emite en el snippet: `attr` → `name="v"`; `prop` → `[name]="v"` (binding);
   * `slot` → contenido proyectado (hijo), no atributo. Default: string→attr, resto→prop.
   */
  readonly emit?: 'attr' | 'prop' | 'slot';
}

/** Fila de la tabla de API (referencia estática, no editable). */
export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description?: string;
}

/** Meta del componente: identidad + knobs por defecto + tabla de props. */
export interface StoryMeta {
  /** Selector del componente DS, p.ej. `sc-button`. Se usa como tag del snippet del Playground. */
  readonly tag: string;
  /** Título legible (default: `tag`). */
  readonly title?: string;
  readonly description?: string;
  /** Knobs del Playground. */
  readonly argTypes: readonly ArgType[];
  /** Args iniciales del Playground (default por arg). */
  readonly defaultArgs: ScArgs;
  /** Tabla de API (opcional pero recomendada). */
  readonly props?: readonly PropRow[];
}

/** Una story concreta: un `<ng-template>` + sus args + (opcional) un snippet a medida. */
export interface StoryDef {
  /** Nombre de la story, p.ej. `Playground`, `Variantes`. */
  readonly name: string;
  /** El `<ng-template>` declarado en el demo (vía `viewChild`). */
  readonly template: TemplateRef<StoryContext>;
  /**
   * Args de ESTA story. El Playground usa `meta.defaultArgs` y deja editar; las demás
   * stories suelen fijar args (ejemplos) y mostrar su código.
   */
  readonly args?: ScArgs;
  /** ¿Es el Playground (knobs en vivo)? Sólo una story debería serlo. */
  readonly playground?: boolean;
  /**
   * Snippet a medida (override). Si se omite, se serializa desde `meta.tag` + args.
   * Necesario para stories con proyección/templates (datatable, select con pTemplate).
   */
  readonly snippet?: string;
}
