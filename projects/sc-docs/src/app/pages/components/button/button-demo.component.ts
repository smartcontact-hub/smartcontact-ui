import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScButtonComponent, ScSelectComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const VARIANTS_SNIPPET = `<sc-button label="Primario" />
<sc-button label="Secundario" variant="secondary" />
<sc-button label="Success" variant="success" />
<sc-button label="Info" variant="info" />
<sc-button label="Warn" variant="warn" />
<sc-button label="Help" variant="help" />
<sc-button label="Danger" variant="danger" />
<sc-button label="Contrast" variant="contrast" />

<!-- "plain", la gris neutra: como en el Kit, solo de texto o con borde. -->
<sc-button label="Plain" variant="plain" appearance="text" />
<sc-button label="Plain" variant="plain" appearance="outlined" />`;

const APPEARANCES_SNIPPET = `<sc-button label="Filled" />
<sc-button label="Outlined" appearance="outlined" />
<sc-button label="Text" appearance="text" />
<sc-button label="Link" appearance="link" />`;

const RAISED_SNIPPET = `<!-- La sombra de «Raised» del Kit: el botón que flota sobre un contenido. -->
<sc-button label="Primario" [raised]="true" />
<sc-button label="Secundario" variant="secondary" [raised]="true" />
<sc-button label="Texto" variant="secondary" appearance="text" [raised]="true" />
<sc-button icon="add" [rounded]="true" [raised]="true" ariaLabel="Nuevo" />`;

const RAISED_DESCRIPTION =
  'La propiedad «Raised» del Kit: la sombra `button.raisedShadow` del preset. Para el botón que flota sobre un ' +
  'contenido (un mapa, una lista que se desplaza), no para el de una barra o un formulario.';

const SIZES_SNIPPET = `<sc-button label="Small" size="sm" />
<sc-button label="Medium" />
<sc-button label="Large" size="lg" />`;

const ICONS_SNIPPET = `<sc-button label="Con icono" icon="check" />
<sc-button icon="check" iconAriaLabel="Confirmar" />
<sc-button label="Legacy pi" icon="pi pi-trash" variant="danger" />
<sc-button label="Cargando" [loading]="true" />
<sc-button label="Deshabilitado" [disabled]="true" />
<sc-button label="Full width" [fullWidth]="true" />`;

const SOLO_ICONO_SNIPPET = `<!-- Sin rótulo, el nombre va en "ariaLabel": es lo que anuncia el lector, y el icono queda decorativo.
     Cada forma, con las ocho variantes rellenas ("variant"), como en las filas de arriba. -->
<sc-button icon="check" ariaLabel="Confirmar" />
<sc-button icon="check" [rounded]="true" ariaLabel="Confirmar" />
<sc-button icon="check" [rounded]="true" appearance="outlined" ariaLabel="Confirmar" />
<sc-button icon="check" [rounded]="true" appearance="text" ariaLabel="Confirmar" />
<sc-button icon="check" [rounded]="true" [raised]="true" ariaLabel="Confirmar" />

<!-- El «+» de añadir, a la derecha de su campo o en la fila que crece: el secundario relleno del Kit, A LA TALLA DE SU
     CAMPO (DD-187, que corrige DD-167): rima con él, mediano junto a uno mediano y pequeño junto a uno pequeño. -->
<sc-select placeholder="Agendas" [options]="agendas" />
<sc-button icon="add" variant="secondary" ariaLabel="Nueva agenda" />

<sc-select size="sm" placeholder="Agendas" [options]="agendas" />
<sc-button icon="add" size="sm" variant="secondary" ariaLabel="Nueva agenda" />`;

const SOLO_ICONO_DESCRIPTION =
  'Las filas de «Icon Only» del Kit: relleno, redondo, redondo con borde, redondo de texto y redondo con sombra, ' +
  'con sus ocho variantes. Redondo, el botón es un círculo del ancho de solo icono. Debajo, el «+» de añadir, a la ' +
  'derecha de su campo o en la fila que crece: el secundario relleno del Kit, a la talla de su campo, para que rime con ' +
  'él (DD-187, que corrige el redondo con borde de DD-167). Es el mismo en todas partes: no se elige forma ni color en ' +
  'cada pantalla, y la talla la decide el campo.';

const PRESS_SNIPPET = `<!-- La pulsación la pone el tema: no hay nada que activar. -->
<sc-button label="Guardar" />
<sc-button label="Cancelar" variant="secondary" appearance="outlined" />
<sc-button label="Ver todo" variant="secondary" appearance="text" />
<sc-button icon="more_vert" variant="secondary" appearance="text" iconAriaLabel="Más acciones" />`;

const POPUP_SNIPPET = `<!-- El host <sc-button> nunca recibe el foco: "ariaHasPopup", "ariaExpanded" y "ariaControls"
     llegan al <button> real por dentro (DD-171). Sin ellos, el lector no dice que el botón abre
     algo ni si ya está abierto. -->
<sc-button
  icon="view_column"
  variant="secondary"
  appearance="outlined"
  ariaLabel="Columnas"
  ariaHasPopup="dialog"
  [ariaExpanded]="false"
  ariaControls="columnas-panel"
/>`;

const POPUP_DESCRIPTION =
  'El botón de «Columnas» de una lista: abre un diálogo (`ariaHasPopup="dialog"`), cerrado (`ariaExpanded` en ' +
  'false, que SÍ se anuncia) y `ariaControls` apunta al id del panel que abre. El mismo patrón sirve para un ' +
  'menú (`"menu"`, el ⋮ de un widget) o una lista (`"listbox"`).';

const PRESS_DESCRIPTION =
  'Mantén pulsado un botón: se encoge al 96 % y, al soltarlo, vuelve suave en 150 ms (ease-out), con el cambio de ' +
  'color a la misma velocidad. Si el sistema pide movimiento reducido, no se mueve. Es un desvío a propósito del ' +
  'botón de primeng.dev, que no se mueve y tarda 200 ms: se eligió entre seis formas de pulsar probadas sobre este ' +
  'mismo botón (DD-113, customs-catalog §8.1). En Figma está pendiente (figma-pendiente §13).';

/** Demo de `sc-button` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-button-demo',
  imports: [ScButtonComponent, ScSelectComponent, StoryHostComponent],
  templateUrl: './button-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');
  protected readonly appearancesTpl = viewChild<TemplateRef<StoryContext>>('appearances');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');
  protected readonly raisedTpl = viewChild<TemplateRef<StoryContext>>('raisedTpl');
  protected readonly iconsTpl = viewChild<TemplateRef<StoryContext>>('icons');
  protected readonly pressTpl = viewChild<TemplateRef<StoryContext>>('press');
  protected readonly soloIconoTpl = viewChild<TemplateRef<StoryContext>>('soloIcono');
  protected readonly popupTpl = viewChild<TemplateRef<StoryContext>>('popup');

  /** Las filas de «Icon Only» del Kit. */
  protected readonly formasSoloIcono = [
    { forma: 'relleno', rounded: false, appearance: 'filled', raised: false },
    { forma: 'redondo', rounded: true, appearance: 'filled', raised: false },
    { forma: 'redondo con borde', rounded: true, appearance: 'outlined', raised: false },
    { forma: 'redondo de texto', rounded: true, appearance: 'text', raised: false },
    { forma: 'redondo con sombra', rounded: true, appearance: 'filled', raised: true },
  ] as const;

  /** Una por variante, con el icono de su columna en primeng.dev (en Material) y su nombre accesible. */
  protected readonly variantesSoloIcono = [
    { variant: 'primary', icon: 'check', nombre: 'Confirmar' },
    { variant: 'secondary', icon: 'bookmark', nombre: 'Guardar' },
    { variant: 'success', icon: 'search', nombre: 'Buscar' },
    { variant: 'info', icon: 'person', nombre: 'Usuario' },
    { variant: 'warn', icon: 'notifications', nombre: 'Avisos' },
    { variant: 'help', icon: 'help', nombre: 'Ayuda' },
    { variant: 'danger', icon: 'close', nombre: 'Cancelar' },
    { variant: 'contrast', icon: 'star', nombre: 'Destacar' },
  ] as const;

  protected readonly meta: StoryMeta = {
    tag: 'sc-button',
    title: 'Button',
    description:
      'Botón de acción. Wrapper de PrimeNG con todo lo que trae el botón del Kit: nueve severidades, cuatro ' +
      'apariencias, tres tamaños, redondo, con sombra e iconos Material. Antes de hacer un botón a mano, búscalo aquí.',
    argTypes: [
      // En el orden del panel del Kit (button-small, button y button-large), con su nombre de Figma debajo. «State»
      // (Idle, Hover, Active) no es una propiedad: se ve al pasar el ratón y al pulsar.
      { name: 'label', control: { kind: 'text' }, description: 'El texto del botón' },
      {
        name: 'variant',
        control: {
          kind: 'select',
          options: ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'plain'],
        },
        description: 'Severity en Figma. Plain, solo con text u outlined',
      },
      {
        name: 'size',
        control: { kind: 'select', options: ['sm', 'md', 'lg'] },
        description: 'button-small, button y button-large en Figma',
      },
      { name: 'disabled', control: { kind: 'boolean' }, description: 'Disabled en Figma' },
      { name: 'iconOnly', control: { kind: 'boolean' }, description: 'Icon Only en Figma: el texto pasa a ser su nombre' },
      { name: 'raised', control: { kind: 'boolean' }, description: 'Raised en Figma' },
      { name: 'rounded', control: { kind: 'boolean' }, description: 'Rounded en Figma' },
      {
        name: 'appearance',
        control: { kind: 'select', options: ['filled', 'outlined', 'text', 'link'] },
        description: 'Outlined, Text y Link en Figma: uno a la vez',
      },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. check)' },
      { name: 'iconPosition', control: { kind: 'select', options: ['left', 'right', 'top', 'bottom'] } },
      { name: 'iconSize', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'iconFilled', control: { kind: 'boolean' } },
      { name: 'loading', control: { kind: 'boolean' } },
      { name: 'fullWidth', control: { kind: 'boolean' } },
      { name: 'type', control: { kind: 'select', options: ['button', 'submit', 'reset'] } },
    ],
    defaultArgs: {
      label: 'Guardar cambios',
      variant: 'primary',
      size: 'md',
      disabled: false,
      iconOnly: false,
      raised: false,
      rounded: false,
      appearance: 'filled',
      icon: 'check',
      iconPosition: 'left',
      iconSize: 'md',
      iconFilled: false,
      loading: false,
      fullWidth: false,
      type: 'button',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const va = this.variantsTpl();
    const ap = this.appearancesTpl();
    const sz = this.sizesTpl();
    const ic = this.iconsTpl();
    const pr = this.pressTpl();
    const so = this.soloIconoTpl();
    const pu = this.popupTpl();
    const ra = this.raisedTpl();
    if (!pg || !va || !ap || !sz || !ic || !pr || !so || !pu || !ra) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
      { name: 'Apariencias', template: ap, snippet: APPEARANCES_SNIPPET },
      { name: 'Tamaños', template: sz, snippet: SIZES_SNIPPET },
      { name: 'Con sombra', template: ra, snippet: RAISED_SNIPPET, description: RAISED_DESCRIPTION },
      { name: 'Iconos y estados', template: ic, snippet: ICONS_SNIPPET },
      { name: 'Solo icono', template: so, snippet: SOLO_ICONO_SNIPPET, description: SOLO_ICONO_DESCRIPTION },
      { name: 'Al pulsar', template: pr, snippet: PRESS_SNIPPET, description: PRESS_DESCRIPTION },
      { name: 'Abre un popup', template: pu, snippet: POPUP_SNIPPET, description: POPUP_DESCRIPTION },
    ];
  });
}
