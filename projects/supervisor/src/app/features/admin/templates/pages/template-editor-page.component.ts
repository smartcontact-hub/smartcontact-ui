import { afterNextRender, ChangeDetectionStrategy, Component, computed, HostListener, inject, Injector, signal, type OnInit, type TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditorModule } from 'primeng/editor';
import {
  ScButtonComponent as ButtonComponent,
  ScInputTextComponent as InputTextComponent,
  ScMultiSelectComponent as MultiSelectComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { GroupsStore } from '@features/admin/groups/state/groups.store';
import { llegarAAncla, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { TEMPLATE_TYPES, type TemplateType } from '../data/templates-data';
import { contenidoParaEditor, contenidoParaGuardar, contenidoVacio } from '../state/templates.core.mjs';
import { TemplatesStore } from '../state/templates.store';

interface TemplateDraft {
  readonly title: string;
  readonly type: TemplateType;
  /** El contenido tal como lo escribe el editor (HTML). Al guardar se convierte según el canal. */
  readonly html: string;
  /** Los grupos que usan la plantilla: lo dice cada grupo en sus `templates`, no la plantilla. */
  readonly groupIds: readonly number[];
}

/** Lo que ofrece el editor, por canal: WhatsApp solo entiende negrita, cursiva y tachado. */
const FORMATOS: Record<TemplateType, readonly string[]> = {
  chat: ['bold', 'italic', 'underline', 'strike', 'link'],
  email: ['bold', 'italic', 'underline', 'strike', 'link'],
  whatsapp: ['bold', 'italic', 'strike'],
};

/**
 * El editor de una plantilla: su título, su canal, su contenido y los grupos que la usan. Va en su propia ruta, como las
 * fichas y el de agendas, para que el contenido tenga sitio (en el panel de la lista, la caja era demasiado pequeña) y la
 * guarda avise de lo que no se ha guardado; Guardar y Deshacer suben a la barra de arriba.
 *
 * El contenido es el editor de primeng.dev/editor (Quill): chat y correo guardan HTML saneado; WhatsApp, su texto con sus
 * marcas (`templates.core.mjs`).
 */
@Component({
  selector: 'sc-template-editor-page',
  imports: [
    ButtonComponent,
    EditorModule,
    FormsModule,
    InputTextComponent,
    MultiSelectComponent,
    SectionCardComponent,
    SelectButtonComponent,
    TranslateModule,
  ],
  templateUrl: './template-editor-page.component.html',
  styleUrl: './template-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TemplatesStore);
  private readonly groupsStore = inject(GroupsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly injector = inject(Injector);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');
  private templateId: number | null = null;

  protected readonly form = signal<TemplateDraft>({ title: '', type: 'chat', html: '', groupIds: [] });
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  protected readonly types = TEMPLATE_TYPES;
  /** El alto del editor (barra incluida): el paso del Kit más cercano a un cuerpo de mensaje largo. */
  protected readonly editorStyle = { height: 'var(--sc-spacing-25)' };
  protected readonly typeOptions = computed(() => {
    this.lang();
    return TEMPLATE_TYPES.map((t) => ({ label: this.translate.instant(`templates.type.${t}`), value: t }));
  });

  /** Los formatos del canal elegido: el editor se vuelve a montar al cambiarlo (Quill los lee al nacer). */
  protected readonly formatos = computed(() => [...FORMATOS[this.form().type]]);
  protected readonly groupValue = computed(() => [...this.form().groupIds]);
  protected readonly editorPlaceholder = computed(() => {
    this.lang();
    return this.translate.instant(`templates.form.body_placeholder`);
  });

  /** Los grupos, y apagados los que no atienden el canal de la plantilla, con su porqué: una plantilla de WhatsApp no
   *  le sirve a un grupo sin WhatsApp. */
  protected readonly groupOptions = computed(() => {
    this.lang();
    const type = this.form().type;
    const reason = this.translate.instant('templates.form.group_without_channel', {
      channel: this.translate.instant(`templates.type.${type}`),
    });
    return this.groupsStore.groups().map((g) => {
      const atiende = g.channels.includes(type);
      return { label: g.name, value: g.id, disabled: !atiende, reason: atiende ? null : reason };
    });
  });

  /** El título no se repite entre plantillas (sin contar la propia), como en el panel de antes. */
  protected readonly titleTaken = computed(() => {
    const title = this.form().title.trim().toLowerCase();
    return !!title && this.store.templates().some((t) => t.id !== this.templateId && t.title.trim().toLowerCase() === title);
  });

  /*
   * Lo que falta se dice al pulsar «Crear plantilla» o «Guardar» (DD-217, como en las fichas): el botón no se apaga por
   * ello ni lleva motivo al lado; al pulsar, lo dice cada campo y el primero recibe el foco. El título repetido, en vivo.
   */
  private readonly faltas = computed<readonly string[]>(() => {
    const f = this.form();
    return [
      ...(f.title.trim() ? [] : ['templates.errors.title_required']),
      ...(contenidoVacio(f.html) ? ['templates.errors.body_required'] : []),
    ];
  });
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: this.faltas,
  });
  protected readonly titleError = computed<string | undefined>(() => {
    this.lang();
    if (this.titleTaken()) return this.translate.instant('templates.errors.duplicate_title');
    const falta = 'templates.errors.title_required';
    return this.faltas().includes(falta) && this.ocasion.acusa(falta) ? this.translate.instant(falta) : undefined;
  });
  protected readonly bodyError = computed(() => {
    const falta = 'templates.errors.body_required';
    return this.faltas().includes(falta) && this.ocasion.acusa(falta) ? falta : null;
  });

  protected readonly canSave = computed(() => this.mode() === 'create' || this.formDirty());

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      const tipo = this.route.snapshot.queryParamMap.get('tipo');
      const type = TEMPLATE_TYPES.find((t) => t === tipo) ?? 'chat';
      this.form.set({ title: '', type, html: '', groupIds: [] });
      this.dirtyState.markPristine();
      return;
    }
    const tpl = this.store.templates().find((t) => t.id === Number(raw));
    if (!tpl) {
      void this.router.navigateByUrl('/admin/plantillas', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.templateId = tpl.id;
    this.form.set({
      title: tpl.title,
      type: tpl.type,
      html: contenidoParaEditor(tpl.body, tpl.type),
      groupIds: this.groupsStore
        .groups()
        .filter((g) => g.templates?.includes(tpl.id))
        .map((g) => g.id)
        .sort((a, b) => a - b),
    });
    this.dirtyState.markPristine();
  }

  protected update<K extends keyof TemplateDraft>(key: K, value: TemplateDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /** El editor avisa solo de lo que escribe quien lo usa: cargar el contenido no cuenta como un cambio. */
  protected onHtml(html: string | null): void {
    this.update('html', html ?? '');
  }

  protected onGroups(value: unknown): void {
    this.update('groupIds', [...(value as number[])].sort((a, b) => a - b));
  }

  protected save(): void {
    if (!this.canSave()) return;
    if (this.faltas().length > 0 || this.titleTaken()) {
      this.ocasion.intentar();
      if (this.titleError()) llegarAAncla('template-title', this.injector);
      else this.enfocarContenido();
      return;
    }
    this.ocasion.olvidar();
    const f = this.form();
    const title = f.title.trim();
    const body = contenidoParaGuardar(f.html, f.type);
    if (this.mode() === 'create') {
      const created = this.store.addTemplate({ title, type: f.type, body });
      this.asignarGrupos(created.id, f.groupIds);
      this.dirtyState.markPristine();
      const creado = this.translate.instant('templates.toasts.created', { name: created.title });
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      void this.router
        .navigateByUrl(`/admin/plantillas/editar/${created.id}`, { replaceUrl: true })
        .then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateTemplate(this.templateId!, { title, type: f.type, body });
    this.asignarGrupos(this.templateId!, f.groupIds);
    this.form.set({ ...f, title });
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('templates.toasts.updated', { name: title }));
  }

  /** Pone o quita la plantilla de las `templates` de cada grupo que cambió: solo toca a los que cambian. */
  private asignarGrupos(templateId: number, ids: readonly number[]): void {
    const deben = new Set(ids);
    for (const grupo of this.groupsStore.groups()) {
      const tiene = grupo.templates?.includes(templateId) ?? false;
      if (tiene === deben.has(grupo.id)) continue;
      const resto = (grupo.templates ?? []).filter((id) => id !== templateId);
      this.groupsStore.updateGroup(grupo.id, { templates: deben.has(grupo.id) ? [...resto, templateId] : resto });
    }
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  /** El contenido no es un campo con `id`: el foco va a la caja de escritura del editor, como haría el ratón. */
  private enfocarContenido(): void {
    afterNextRender(
      () => {
        const caja = document.querySelector<HTMLElement>('.template-editor .ql-editor');
        caja?.closest('sc-section-card')?.scrollIntoView({ block: 'start' });
        caja?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.formDirty()) event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }
}
