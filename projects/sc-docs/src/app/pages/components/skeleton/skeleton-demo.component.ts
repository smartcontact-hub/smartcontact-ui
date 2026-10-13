import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {
  ScAvatarComponent,
  ScButtonComponent,
  type ScColumnDef,
  ScDatatableComponent,
  ScInputTextComponent,
  ScSkeletonComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Lo que tarda la «red» de la demo: dentro de la franja de 1 a 3 s en la que DD-188 pide esqueleto. */
const ESPERA_MS = 1500;

interface Agente {
  readonly id: number;
  readonly nombre: string;
  readonly iniciales: string;
  readonly grupo: string;
  readonly activo: boolean;
}

const AGENTES: readonly Agente[] = [
  { id: 1, nombre: 'Inés García', iniciales: 'IG', grupo: 'Atención al cliente', activo: true },
  { id: 2, nombre: 'Marc Soler', iniciales: 'MS', grupo: 'Facturación', activo: true },
  { id: 3, nombre: 'Lucía Pérez', iniciales: 'LP', grupo: 'Atención al cliente', activo: false },
  { id: 4, nombre: 'Diego Romero', iniciales: 'DR', grupo: 'Soporte técnico', activo: true },
  { id: 5, nombre: 'Sara Vidal', iniciales: 'SV', grupo: 'Facturación', activo: false },
];

/** El «Recargar» de cada ejemplo: esqueleto durante `ESPERA_MS` y después los datos. */
class Carga {
  readonly cargando = signal(false);
  private reloj: ReturnType<typeof setTimeout> | undefined;

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => clearTimeout(this.reloj));
  }

  recargar(): void {
    clearTimeout(this.reloj);
    this.cargando.set(true);
    this.reloj = setTimeout(() => this.cargando.set(false), ESPERA_MS);
  }
}

const SHAPES_SNIPPET = `<sc-skeleton />
<sc-skeleton width="10rem" />
<sc-skeleton height="2rem" />
<sc-skeleton borderRadius="var(--sc-radius-full)" />
<sc-skeleton size="3rem" />
<sc-skeleton shape="circle" size="3rem" />`;

const TABLA_SNIPPET = `<sc-datatable
  variant="list"
  dataKey="id"
  [value]="agentes"
  [columns]="columnas"
  [skeleton]="cargando()"
  [skeletonRows]="agentes.length"
/>

// La forma de cada columna mientras carga (por defecto, una barra de texto)
columnas: ScColumnDef<Agente>[] = [
  { field: 'nombre', header: 'Nombre', skeleton: 'avatar', cellTemplate: celdaNombre },
  { field: 'grupo', header: 'Grupo' },
  { field: 'activo', header: 'Estado', skeleton: 'tag', cellTemplate: celdaEstado },
  { field: 'acciones', header: '', skeleton: 'action', cellTemplate: celdaAcciones },
];`;

const LISTA_SNIPPET = `<li>
  @if (cargando()) {
    <sc-skeleton shape="circle" size="var(--sc-cmp-avatar-lg-width)" />
    <sc-skeleton width="7rem" />
    <sc-skeleton width="5rem" />
  } @else {
    <sc-avatar size="large" [label]="agente.iniciales" />
    <span>{{ agente.nombre }}</span>
    <span>{{ agente.grupo }}</span>
  }
</li>`;

const FORMULARIO_SNIPPET = `@if (cargando()) {
  <sc-skeleton width="5rem" height="var(--sc-line-height-100)" />
  <sc-skeleton height="var(--sc-cmp-button-icon-only-width)" />
} @else {
  <sc-inputtext label="Nombre" [value]="agente.nombre" fluid />
}`;

const TARJETA_SNIPPET = `<sc-skeleton shape="circle" size="4rem" />
<sc-skeleton width="10rem" />
<sc-skeleton width="5rem" />
<sc-skeleton height=".5rem" />
<sc-skeleton width="100%" height="10rem" />
<sc-skeleton width="4rem" height="2rem" />
<sc-skeleton width="4rem" height="2rem" />`;

/** Demo de `sc-skeleton` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-skeleton-demo',
  imports: [
    ScAvatarComponent,
    ScButtonComponent,
    ScDatatableComponent,
    ScInputTextComponent,
    ScSkeletonComponent,
    ScTagComponent,
    StoryHostComponent,
  ],
  templateUrl: './skeleton-demo.component.html',
  styleUrl: './skeleton-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonDemoComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly agentes = AGENTES;

  protected readonly cargaTabla = new Carga(this.destroyRef);
  protected readonly cargaLista = new Carga(this.destroyRef);
  protected readonly cargaFormulario = new Carga(this.destroyRef);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly shapesTpl = viewChild<TemplateRef<StoryContext>>('shapes');
  protected readonly tablaTpl = viewChild<TemplateRef<StoryContext>>('tabla');
  protected readonly listaTpl = viewChild<TemplateRef<StoryContext>>('lista');
  protected readonly formularioTpl = viewChild<TemplateRef<StoryContext>>('formulario');
  protected readonly tarjetaTpl = viewChild<TemplateRef<StoryContext>>('tarjeta');

  private readonly celdaNombre = viewChild<TemplateRef<unknown>>('celdaNombre');
  private readonly celdaEstado = viewChild<TemplateRef<unknown>>('celdaEstado');
  private readonly celdaAcciones = viewChild<TemplateRef<unknown>>('celdaAcciones');

  protected readonly columnasTabla = computed<readonly ScColumnDef<Agente>[]>(() => [
    { field: 'nombre', header: 'Nombre', skeleton: 'avatar', cellTemplate: this.celdaNombre() as never },
    { field: 'grupo', header: 'Grupo' },
    { field: 'activo', header: 'Estado', width: '8rem', skeleton: 'tag', cellTemplate: this.celdaEstado() as never },
    {
      field: 'acciones',
      header: '',
      headerAriaLabel: 'Acciones',
      width: '4rem',
      skeleton: 'action',
      cellTemplate: this.celdaAcciones() as never,
    },
  ]);

  protected readonly meta: StoryMeta = {
    tag: 'sc-skeleton',
    title: 'Skeleton',
    description:
      'Hueco de carga sobre `p-skeleton` (primeng.dev/skeleton). Se pinta cuando una pantalla espera datos de 1 a 3 s ' +
      '(DD-188: por debajo de 1 s, nada; de 3 a 10 s, progreso con cifra) y lleva la FORMA de lo que va a llegar: el ' +
      'círculo donde irá el avatar, la barra al ancho de un texto, el cuadrado del botón. Si la forma es otra, al llegar ' +
      'los datos cambia todo: el alto de las filas, lo que ocupa cada celda, cuántas hay. Cada esqueleto es ' +
      '`aria-hidden`; el bloque que espera lleva `aria-busy`. Un esqueleto por bloque, no por pieza.',
    argTypes: [
      { name: 'shape', control: { kind: 'select', options: ['rectangle', 'circle'] } },
      { name: 'animation', control: { kind: 'select', options: ['wave', 'none'] } },
      { name: 'width', control: { kind: 'text' }, description: 'CSS width (p.ej. 100%, 12rem)' },
      { name: 'height', control: { kind: 'text' }, description: 'CSS height (p.ej. 1rem)' },
      {
        name: 'size',
        control: { kind: 'text' },
        description: 'Atajo cuadrado (aplica a width y height)',
      },
      { name: 'borderRadius', control: { kind: 'text' }, description: 'CSS border-radius' },
    ],
    defaultArgs: {
      shape: 'rectangle',
      animation: 'wave',
      width: '100%',
      height: '1rem',
      size: '',
      borderRadius: '',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const sh = this.shapesTpl();
    const tb = this.tablaTpl();
    const li = this.listaTpl();
    const fo = this.formularioTpl();
    const ta = this.tarjetaTpl();
    if (!pg || !sh || !tb || !li || !fo || !ta) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Formas', template: sh, snippet: SHAPES_SNIPPET, description: '«Shapes» de primeng.dev.' },
      {
        name: 'Tabla',
        template: tb,
        snippet: TABLA_SNIPPET,
        description:
          '`[skeleton]` de `sc-datatable` pinta cada celda con la forma que dice su columna (`skeleton`: `avatar`, `tag`, ' +
          '`action` o, por defecto, una barra de texto de ancho variado), con las medidas del Kit. Es la receta de carga ' +
          'perezosa de primeng.dev/table: la fila del esqueleto mide lo que la de datos. Pulsa «Recargar»: no se mueve ' +
          'nada. El ejemplo «DataTable» de primeng.dev/skeleton, una barra a todo el ancho por celda, no se usa: al llegar ' +
          'los datos las filas pasaban de 33 a 45 px y cada barra se encogía a su texto.',
      },
      {
        name: 'Lista',
        template: li,
        snippet: LISTA_SNIPPET,
        description: '«List» de primeng.dev: el círculo y dos líneas, al tamaño del avatar y de los textos que sustituye.',
      },
      {
        name: 'Formulario',
        template: fo,
        snippet: FORMULARIO_SNIPPET,
        description:
          'Una ficha al abrirse para editar: la etiqueta y el campo, cada uno con su forma. No está en primeng.dev.',
      },
      {
        name: 'Tarjeta',
        template: ta,
        snippet: TARJETA_SNIPPET,
        description: '«Card» de primeng.dev: cómo se compone un bloque entero con las formas.',
      },
    ];
  });
}
