import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, signal, type OnInit, type TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditorModule } from 'primeng/editor';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent as ButtonComponent,
  ScInputTextComponent as InputTextComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSelectButtonComponent as SelectButtonComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { AgentAssignmentTableComponent } from '@features/admin/repositories/components/agent-assignment-table/agent-assignment-table.component';
import { ayudaDeObligatorio, dejoElCampo, ocasionDeAvisar } from '@shared/utils/alta-secciones';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { TEMPLATE_TYPES, type TemplateType } from '../data/templates-data';
import { contenidoParaEditor, contenidoParaGuardar, contenidoVacio } from '../state/templates.core.mjs';
import { TemplatesStore } from '../state/templates.store';

interface TemplateDraft {
  readonly title: string;
  readonly type: TemplateType;
  /** El contenido tal como lo escribe el editor (HTML). Al guardar se convierte según el canal. */
  readonly html: string;
  /** Los agentes a los que se asigna (COA SISMAC-4438): solo agentes; lo dice cada agente en sus `templates`. */
  readonly agentIds: readonly number[];
}

/** Lo que ofrece el editor, por canal: WhatsApp solo entiende negrita, cursiva y tachado. */
const FORMATOS: Record<TemplateType, readonly string[]> = {
  chat: ['bold', 'italic', 'underline', 'strike', 'link'],
  email: ['bold', 'italic', 'underline', 'strike', 'link'],
  whatsapp: ['bold', 'italic', 'strike'],
};

/**
 * El editor de una plantilla: su nombre, su canal, su contenido y los agentes a los que se asigna. Va en su propia ruta, como las
 * fichas y el de agendas, para que el contenido tenga sitio (en el panel de la lista, la caja era demasiado pequeña) y la
 * guarda avise de lo que no se ha guardado; Guardar y Deshacer suben a la barra de arriba.
 *
 * El contenido es el editor de primeng.dev/editor (Quill): chat y correo guardan HTML saneado; WhatsApp, su texto con sus
 * marcas (`templates.core.mjs`).
 */
@Component({
  selector: 'sc-template-editor-page',
  imports: [
    AgentAssignmentTableComponent,
    ButtonComponent,
    EditorModule,
    FormsModule,
    InputTextComponent,
    SectionCardComponent,
    SelectButtonComponent,
    TooltipModule,
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
  protected readonly agentsStore = inject(AgentsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly mode = signal<'create' | 'edit'>('create');

  /** La miga de la edición dice el nombre guardado, como en Grupos y Agentes (DD-238): el que se teclea aún no es el
   *  suyo. Al crear, el de la ruta. */
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly nombreGuardado = signal<string | null>(null);
  private readonly migaConNombre = effect(() =>
    this.breadcrumbs.nombrar(this.route, this.mode() === 'edit' ? this.nombreGuardado() : null),
  );
  private readonly sinMiga = inject(DestroyRef).onDestroy(() => this.breadcrumbs.nombrar(this.route, null));
  private templateId: number | null = null;

  protected readonly form = signal<TemplateDraft>({ title: '', type: 'chat', html: '', agentIds: [] });
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
  protected readonly editorPlaceholder = computed(() => {
    this.lang();
    return this.translate.instant(`templates.form.body_placeholder`);
  });

  /*
   * Lo que falta, como en Grupos y Agentes (DD-219): «Crear plantilla» y «Guardar» apagados mientras falte el título o el
   * contenido, con el motivo en su tooltip; cada aviso, en gris bajo su campo desde el principio y en rojo al dejarlo vacío.
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
    const falta = 'templates.errors.title_required';
    return this.faltas().includes(falta) && this.ocasion.acusa(falta) ? this.translate.instant(falta) : undefined;
  });
  protected readonly bodyError = computed(() => {
    const falta = 'templates.errors.body_required';
    return this.faltas().includes(falta) && this.ocasion.acusa(falta) ? falta : null;
  });

  protected readonly titleHint = computed<string | undefined>(() => {
    this.lang();
    const falta = 'templates.errors.title_required';
    return this.faltas().includes(falta) && !this.ocasion.acusa(falta) ? ayudaDeObligatorio(this.translate.instant(falta)) : undefined;
  });
  protected readonly bodyHint = computed(() => {
    const falta = 'templates.errors.body_required';
    return this.faltas().includes(falta) && !this.ocasion.acusa(falta) ? falta : null;
  });

  protected dejarTitulo(event: FocusEvent): void {
    const falta = 'templates.errors.title_required';
    if (this.faltas().includes(falta) && dejoElCampo(event)) this.ocasion.tocar(falta);
  }

  protected readonly canSave = computed(() => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()));

  /** Por qué está apagado el botón, para su tooltip: lo primero que falta o, sin cambios, «No hay cambios». */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    return this.translate.instant(this.faltas()[0] ?? 'common.no_changes');
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      const tipo = this.route.snapshot.queryParamMap.get('tipo');
      const type = TEMPLATE_TYPES.find((t) => t === tipo) ?? 'chat';
      this.form.set({ title: '', type, html: '', agentIds: [] });
      if (!this.seedFromDuplicate()) return;
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
    this.nombreGuardado.set(tpl.title);
    this.form.set({
      title: tpl.title,
      type: tpl.type,
      html: contenidoParaEditor(tpl.body, tpl.type),
      agentIds: this.agentsStore
        .agents()
        .filter((a) => a.templates?.includes(tpl.id))
        .map((a) => a.id)
        .sort((a, b) => a - b),
    });
    this.dirtyState.markPristine();
  }

  /**
   * Duplicar es un alta (DD-234, como un grupo o un agente): `?seedFromId` abre «Nueva plantilla» con el canal y el
   * contenido de la original y su nombre «X (1)». No copia a qué agentes se asigna (lo dicen ellos). La plantilla no
   * existe hasta «Crear», y la copia es el punto de partida: «Deshacer» vuelve a ella y salir sin tocar nada no pregunta.
   * Devuelve `false` si la original ya no existe (y vuelve a la lista).
   */
  private seedFromDuplicate(): boolean {
    const seed = this.route.snapshot.queryParamMap.get('seedFromId');
    if (!seed) return true;
    const origen = this.store.templates().find((t) => t.id === Number(seed));
    if (!origen) {
      void this.router.navigateByUrl('/admin/plantillas', { replaceUrl: true });
      return false;
    }
    this.form.set({
      title: nombreDeCopia(origen.title, this.store.templates().map((t) => t.title)),
      type: origen.type,
      html: contenidoParaEditor(origen.body, origen.type),
      agentIds: [],
    });
    return true;
  }

  protected update<K extends keyof TemplateDraft>(key: K, value: TemplateDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  /** El editor avisa solo de lo que escribe quien lo usa: cargar el contenido no cuenta como un cambio. */
  protected onHtml(html: string | null): void {
    this.update('html', html ?? '');
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.ocasion.olvidar();
    const f = this.form();
    const title = f.title.trim();
    const body = contenidoParaGuardar(f.html, f.type);
    if (this.mode() === 'create') {
      const created = this.store.addTemplate({ title, type: f.type, body });
      this.asignar(created.id, f.agentIds);
      this.dirtyState.markPristine();
      const creado = this.translate.instant('templates.toasts.created', { name: created.title });
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      void this.router
        .navigateByUrl(`/admin/plantillas/editar/${created.id}`, { replaceUrl: true })
        .then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateTemplate(this.templateId!, { title, type: f.type, body });
    this.asignar(this.templateId!, f.agentIds);
    this.nombreGuardado.set(title);
    this.form.set({ ...f, title });
    this.dirtyState.markPristine();
    this.resultado.contar(this.translate.instant('templates.toasts.updated', { name: title }));
  }

  /** Pone o quita la plantilla de las `templates` de cada agente que cambió: solo toca a los que cambian. */
  private asignar(templateId: number, ids: readonly number[]): void {
    const deben = new Set(ids);
    for (const agente of this.agentsStore.agents()) {
      const tiene = agente.templates?.includes(templateId) ?? false;
      if (tiene === deben.has(agente.id)) continue;
      const resto = (agente.templates ?? []).filter((id) => id !== templateId);
      this.agentsStore.updateAgent(agente.id, { templates: deben.has(agente.id) ? [...resto, templateId] : resto });
    }
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
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
