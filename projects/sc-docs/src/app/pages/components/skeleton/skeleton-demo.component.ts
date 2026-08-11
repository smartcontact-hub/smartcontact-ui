import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScSkeletonComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const SHAPES_SNIPPET = `<sc-skeleton />
<sc-skeleton width="60%" />
<sc-skeleton height="4rem" />
<sc-skeleton shape="circle" size="3rem" />
<sc-skeleton animation="none" />`;

/** Demo de `sc-skeleton` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-skeleton-demo',
  imports: [ScSkeletonComponent, StoryHostComponent],
  templateUrl: './skeleton-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly shapesTpl = viewChild<TemplateRef<StoryContext>>('shapes');

  protected readonly meta: StoryMeta = {
    tag: 'sc-skeleton',
    title: 'Skeleton',
    description:
      'Placeholder de carga (esqueleto). Wrapper de PrimeNG con forma rectángulo/círculo, dimensiones configurables y animación de onda.',
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
    props: [
      {
        name: 'shape',
        type: 'ScSkeletonShape',
        default: "'rectangle'",
        description: 'rectangle · circle',
      },
      {
        name: 'animation',
        type: 'ScSkeletonAnimation',
        default: "'wave'",
        description: 'wave · none',
      },
      { name: 'width', type: 'string', default: "'100%'", description: 'Ancho CSS.' },
      { name: 'height', type: 'string', default: "'1rem'", description: 'Alto CSS.' },
      {
        name: 'size',
        type: 'string | null',
        default: 'null',
        description: 'Atajo cuadrado (círculo o rectángulo).',
      },
      {
        name: 'borderRadius',
        type: 'string | null',
        default: 'null',
        description: 'Radio de borde CSS.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const sh = this.shapesTpl();
    if (!pg || !sh) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Formas y tamaños', template: sh, snippet: SHAPES_SNIPPET },
    ];
  });
}
