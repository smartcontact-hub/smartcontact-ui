import { LocationStrategy } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  FormNavSection,
  ScFormSectionNavComponent,
} from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const DEFAULT_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  [sectionsWithErrors]="errors"
  (activeChange)="onActive($event)"
/>`;

/* Cada sección lleva su `href` (la URL de la sección, preparada por la página): el clic avisa con
 * activeChange y la página navega; Cmd+clic abre otra pestaña. */
const LINKS_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  titleKey="Contact Center"
  [flush]="true"
  [sectionsWithErrors]="errors"
  [sectionsWithChanges]="changes"
  (activeChange)="onActive($event)"
/>`;

/* En un alta (DD-143): la página marca con ✓ las secciones que se dejaron completas; la abierta no lo
 * lleva. Lo que falta y los cambios sin guardar ganan al ✓. */
const ALTA_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  [flush]="true"
  [sectionsWithErrors]="errors"
  [sectionsDone]="done"
  (activeChange)="onActive($event)"
/>`;

/* Los rótulos van escritos: son lo que enseña la story (DD-52). */
const LONG_SNIPPET = `<!-- Rótulos que no caben en el rail: envuelven a otra línea, sin elipsis. -->
<sc-form-section-nav
  [sections]="[
    { id: 'identificacion', labelKey: 'Identificación', icon: 'badge' },
    { id: 'servicios', labelKey: 'Servicios asignados', icon: 'hub' },
    { id: 'permisos', labelKey: 'Permisos', icon: 'verified_user' },
    { id: 'estrategia', labelKey: 'Estrategia de distribución', icon: 'account_tree' },
  ]"
  [activeId]="active()"
  [flush]="true"
  [sectionsWithErrors]="errors"
  (activeChange)="onActive($event)"
/>`;

const FLUSH_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  [flush]="true"
  [sectionsWithErrors]="errors"
  (activeChange)="onActive($event)"
/>`;

/** Demo de `sc-form-section-nav` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-formsectionnav-demo',
  imports: [ScFormSectionNavComponent, StoryHostComponent],
  templateUrl: './formsectionnav-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSectionNavDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly defaultTpl = viewChild<TemplateRef<StoryContext>>('default');
  protected readonly flushTpl = viewChild<TemplateRef<StoryContext>>('flush');
  protected readonly longTpl = viewChild<TemplateRef<StoryContext>>('long');
  protected readonly linksTpl = viewChild<TemplateRef<StoryContext>>('links');
  protected readonly altaTpl = viewChild<TemplateRef<StoryContext>>('alta');

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locationStrategy = inject(LocationStrategy);

  /**
   * La URL de cada sección: esta misma página con `?seccion=`. Como la hace `routerLink`:
   * `prepareExternalUrl` le pone el `#` de las rutas de sc-docs, y sin él Cmd+clic saldría de la doc.
   */
  private hrefFor(id: string): string {
    const tree = this.router.createUrlTree([], { relativeTo: this.route, queryParams: { seccion: id } });
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  readonly sections: FormNavSection[] = [
    { id: 'general', labelKey: 'General', icon: 'tune', href: this.hrefFor('general') },
    { id: 'voz', labelKey: 'Voz y saludo', icon: 'record_voice_over', href: this.hrefFor('voz') },
    { id: 'horario', labelKey: 'Horario', icon: 'schedule', href: this.hrefFor('horario') },
    { id: 'avanzado', labelKey: 'Avanzado', icon: 'settings', href: this.hrefFor('avanzado') },
  ];
  readonly active = signal('general');
  readonly errors = new Set(['horario']);
  readonly changes = new Set(['voz']);

  /* El alta (DD-143): General y «Voz y saludo» se dejaron completas; Horario, sin lo obligatorio. Avanzado
   * está abierta: aún no lleva marca. */
  readonly altaActive = signal('avanzado');
  readonly altaErrors = new Set(['horario']);
  readonly done = new Set(['general', 'voz']);

  onAltaActive(id: string): void {
    this.altaActive.set(id);
  }

  /* Rótulos largos de verdad, tomados de los formularios del Supervisor: son
   * los que con la elipsis anterior se leían «Servicios asign…» (DD-52). */
  readonly longSections: FormNavSection[] = [
    { id: 'identificacion', labelKey: 'Identificación', icon: 'badge' },
    { id: 'servicios', labelKey: 'Servicios asignados', icon: 'hub' },
    { id: 'permisos', labelKey: 'Permisos', icon: 'verified_user' },
    { id: 'estrategia', labelKey: 'Estrategia de distribución', icon: 'account_tree' },
  ];
  readonly longActive = signal('identificacion');
  readonly longErrors = new Set(['identificacion']);

  onActive(id: string): void {
    this.active.set(id);
  }

  onLongActive(id: string): void {
    this.longActive.set(id);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-form-section-nav',
    title: 'FormSectionNav',
    description:
      'El índice de secciones de la app (DD-122): cada fila es un ENLACE a su sitio (`href` de cada sección, una ruta o la misma página con `?seccion=`) y la actual lleva aria-current="page". Controlado: el padre posee activeId; un clic principal sin teclas emite activeChange y la página navega, y Cmd/Ctrl/clic central lo hace el navegador (otra pestaña), como routerLink. Punto rojo en las secciones con required vacíos (sectionsWithErrors) y punto de marca en las que tienen cambios sin guardar (sectionsWithChanges); en un alta, ✓ en las que se dejaron completas (sectionsDone, DD-143). Se ve una marca y se oyen todas. Rótulo visible opcional encima (titleKey), que nombra el índice. Variante flush (el carril de fichas y Contact Center) opt-in. El label ENVUELVE: una etiqueta que no cabe en el rail parte de línea y la fila crece, nunca se recorta con elipsis (DD-52).',
    argTypes: [
      { name: 'flush', control: { kind: 'boolean' } },
      { name: 'titleKey', control: { kind: 'text' }, description: 'Rótulo visible encima de las filas; nombra el índice (aria-labelledby).' },
      { name: 'labelKey', control: { kind: 'text' }, description: 'Clave i18n del rótulo del <nav>, para lectores de pantalla (sin titleKey).' },
    ],
    defaultArgs: {
      flush: false,
      titleKey: '',
      labelKey: 'sc.formSectionNav.label',
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const de = this.defaultTpl();
    const fl = this.flushTpl();
    const lo = this.longTpl();
    const li = this.linksTpl();
    const al = this.altaTpl();
    if (!pg || !de || !fl || !lo || !li || !al) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Default', template: de, snippet: DEFAULT_SNIPPET },
      { name: 'Flush (panel embebido)', template: fl, snippet: FLUSH_SNIPPET },
      { name: 'Enlaces, rótulo y cambios sin guardar', template: li, snippet: LINKS_SNIPPET },
      { name: 'En un alta: ✓ en las secciones que se dejan completas', template: al, snippet: ALTA_SNIPPET },
      { name: 'Rótulos largos (envuelven, no se recortan)', template: lo, snippet: LONG_SNIPPET },
    ];
  });
}
