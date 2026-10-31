import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, type OnInit, signal, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent as ButtonComponent,
  ScCustomModalComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
  ScSectionCardComponent as SectionCardComponent,
  ScSubsectionComponent as SubsectionComponent,
} from '@smartcontact-hub/components';
import { injectAlertModal } from '@core/services';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { ImportDialogComponent } from '@shared/components';
import { nombreDeCopia } from '@shared/utils/copy-name';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { AgentAssignmentTableComponent } from '../components/agent-assignment-table/agent-assignment-table.component';
import { AgendaContactsTableComponent } from '../components/agenda-contacts-table/agenda-contacts-table.component';
import { RepoFormPanelComponent, type RepoFormSubmission } from '../components/repo-form-panel.component';
import type { RepoFieldDef } from '../components/repo-types';
import {
  decodificarCsv,
  CAMPOS_DEL_CSV,
  contactoDeValores,
  type ImportacionDeContactos,
  SECCIONES_DE_CONTACTO,
  normalizarTelefono,
  parsearContactosCsv,
  plantillaCsv,
  telefonoValido,
  TOPE_DE_CONTACTOS,
} from '../state/agenda-contacts.core.mjs';
import { hoy } from '@shared/utils/today';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { AgendasStore, type AgendaContact } from '../state/agendas.store';
import { BreadcrumbService, ResultadoAccionService } from '@core/services';
import { ayudaDeObligatorio, dejoElCampo, ocasionDeAvisar } from '@shared/utils/alta-secciones';

interface AgendaDraft {
  readonly name: string;
  readonly description: string;
  readonly contacts: readonly AgendaContact[];
  /** A qué agentes se asigna (COA SISMAC-4440): solo a agentes, que lo dicen en sus `schedules`. No es algo de la agenda. */
  readonly agentIds: readonly number[];
}

const VACIA: AgendaDraft = { name: '', description: '', contacts: [], agentIds: [] };

/**
 * El editor de una agenda (DD-163): su nombre, su estado y sus contactos. Va en su propia ruta, como las fichas, para que
 * Atrás vuelva a donde se estaba y la guarda avise de lo que no se ha guardado; Guardar y Deshacer suben a la barra de
 * arriba. Los contactos son una tabla dentro de su sección (DD-160), en su propio componente.
 */
@Component({
  selector: 'sc-agenda-editor-page',
  imports: [
    SubsectionComponent,
    AgendaContactsTableComponent,
    AgentAssignmentTableComponent,
    ButtonComponent,
    DialogComponent,
    ImportDialogComponent,
    InputTextComponent,
    RepoFormPanelComponent,
    SectionCardComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './agenda-editor-page.component.html',
  styleUrl: './agenda-editor-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaEditorPageComponent implements DirtyAware, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(AgendasStore);
  protected readonly agentsStore = inject(AgentsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
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
  private agendaId: number | null = null;

  protected readonly form = signal<AgendaDraft>(VACIA);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;

  /*
   * Lo que falta, como en Grupos y Agentes (DD-219): «Crear» y «Guardar» apagados mientras falte el título, con el motivo en
   * su tooltip; el aviso, en gris bajo el campo desde el principio y en rojo al dejarlo vacío.
   */
  private readonly faltas = computed<readonly string[]>(() => (this.form().name.trim() ? [] : ['repositories.agendas.errors.title_required']));
  private readonly ocasion = ocasionDeAvisar({
    editando: () => this.mode() === 'edit',
    cambios: () => this.formDirty(),
    faltas: this.faltas,
  });
  protected readonly nameError = computed<string | undefined>(() => {
    this.lang();
    const falta = this.faltas()[0];
    return falta && this.ocasion.acusa(falta) ? this.translate.instant(falta) : undefined;
  });
  protected readonly nameHint = computed<string | undefined>(() => {
    this.lang();
    const falta = this.faltas()[0];
    return falta && !this.ocasion.acusa(falta) ? ayudaDeObligatorio(this.translate.instant(falta)) : undefined;
  });

  protected dejarNombre(event: FocusEvent): void {
    const falta = this.faltas()[0];
    if (falta && dejoElCampo(event)) this.ocasion.tocar(falta);
  }

  protected readonly canSave = computed(() => this.faltas().length === 0 && (this.mode() === 'create' || this.formDirty()));

  /** Por qué está apagado el botón, para su tooltip: lo que falta o, sin cambios, «No hay cambios». */
  protected readonly motivoApagado = computed(() => {
    this.lang();
    if (this.canSave()) return '';
    return this.translate.instant(this.faltas()[0] ?? 'common.no_changes');
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
      this.seedFromDuplicate();
      this.dirtyState.markPristine();
      return;
    }
    const agenda = this.store.items().find((a) => a.id === Number(raw));
    if (!agenda) {
      void this.router.navigateByUrl('/admin/agendas', { replaceUrl: true });
      return;
    }
    this.mode.set('edit');
    this.agendaId = agenda.id;
    this.nombreGuardado.set(agenda.name);
    this.form.set({
      name: agenda.name,
      description: agenda.description,
      contacts: agenda.contacts,
      agentIds: this.agentsStore.agents().filter((a) => a.schedules?.includes(agenda.id)).map((a) => a.id),
    });
    this.dirtyState.markPristine();
  }


  /**
   * Duplicar es un alta (DD-234, como un grupo o un agente): `?seedFromId` abre «Nueva agenda» con los datos de la
   * original y su nombre «X (1)». No copia a qué agentes se asigna (lo dicen ellos). La agenda no existe hasta «Crear»,
   * y la copia es el punto de partida: «Deshacer» vuelve a ella y salir sin tocar nada no pregunta.
   */
  private seedFromDuplicate(): void {
    const seed = this.route.snapshot.queryParamMap.get('seedFromId');
    if (!seed) return;
    const origen = this.store.items().find((a) => a.id === Number(seed));
    if (!origen) {
      void this.router.navigateByUrl('/admin/agendas', { replaceUrl: true });
      return;
    }
    this.form.set({
      name: nombreDeCopia(origen.name, this.store.items().map((a) => a.name)),
      description: origen.description,
      contacts: origen.contacts,
      agentIds: [],
    });
  }

  protected update<K extends keyof AgendaDraft>(key: K, value: AgendaDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    // Como en Grupos: el botón está apagado si falta el título, pero se llega aquí también con Ctrl/Cmd + S. No crea ni
    // guarda: dice lo que falta en rojo y lleva al campo.
    if (this.faltas().length > 0) {
      this.ocasion.intentar();
      document.getElementById('agenda-name')?.focus();
      return;
    }
    if (!this.canSave()) return;
    this.ocasion.olvidar();
    const f = this.form();
    const draft = { ...f, name: f.name.trim(), description: f.description.trim() };
    // Lo de la agenda y a quién se asigna se guardan en sitios distintos: los agentes llevan sus agendas.
    const { agentIds, ...datos } = draft;
    if (this.mode() === 'create') {
      const created = this.store.addItem({ ...datos, updatedAt: hoy() });
      this.asignar(created.id, agentIds);
      this.dirtyState.markPristine();
      const creado = this.texto('repositories.agendas.toasts.created', created.name);
      // El toast, ya en la ficha a la que se llega (DD-211 §5).
      void this.router.navigateByUrl(`/admin/agendas/editar/${created.id}`, { replaceUrl: true }).then(() => this.resultado.contar(creado));
      return;
    }
    this.store.updateItem(this.agendaId!, { ...datos, updatedAt: hoy() });
    this.asignar(this.agendaId!, agentIds);
    this.nombreGuardado.set(draft.name);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.contar(this.texto('repositories.agendas.toasts.updated', draft.name));
  }

  /** Pone o quita esta agenda de las `schedules` de cada agente que cambió: solo toca a los que cambian. */
  private asignar(agendaId: number, ids: readonly number[]): void {
    const deben = new Set(ids);
    for (const agente of this.agentsStore.agents()) {
      const tiene = agente.schedules?.includes(agendaId) ?? false;
      if (tiene === deben.has(agente.id)) continue;
      const resto = (agente.schedules ?? []).filter((id) => id !== agendaId);
      this.agentsStore.updateAgent(agente.id, { schedules: deben.has(agente.id) ? [...resto, agendaId] : resto });
    }
  }

  protected discard(): void {
    this.form.set(this.dirtyState.pristineValue());
    this.ocasion.olvidar();
  }

  /* ── Contactos ────────────────────────────────────────────────────────── */

  /**
   * Los campos del formulario de un contacto: los de Voice, agrupados. Ninguno es obligatorio, pero no se guarda sin al
   * menos uno con texto (`validateContact`; revisión de producto del 2026-10-15). Los personalizados se llaman siempre
   * «Personalizado N»: sus etiquetas no se editan (COA SISMAC-4440, DD-245).
   */
  protected readonly contactFields = computed<readonly RepoFieldDef[]>(() => {
    this.lang();
    return SECCIONES_DE_CONTACTO.flatMap(({ seccion, campos }) =>
      campos.map((clave, i): RepoFieldDef => {
        const personalizado = clave.startsWith('custom');
        const n = personalizado ? Number(clave.slice(6)) : 0;
        return {
          key: clave,
          labelKey: clave === 'name' ? 'repositories.columns.name' : clave === 'phone' ? 'repositories.agendas.phone' : `repositories.agendas.fields.${clave}`,
          label: personalizado ? this.etiquetaPersonalizada(n) : undefined,
          sectionKey: i === 0 ? `repositories.agendas.sections.${seccion}` : undefined,
          wide: clave === 'workAddress' || clave === 'homeAddress' || clave === 'notes' || clave === 'website',
          type: clave === 'notes' ? 'textarea' : 'text',
          inputType: clave.startsWith('phone') || clave === 'fax' ? 'tel' : 'text',
        };
      }),
    );
  });

  /**
   * Los 34 campos de un contacto, en el orden del CSV, con el nombre que tienen en esta agenda: la cabecera de la
   * plantilla y las columnas que puede enseñar la tabla de contactos.
   */
  protected readonly contactColumns = computed(() => {
    this.lang();
    const t = (clave: string) => this.translate.instant(`repositories.agendas.${clave}`);
    return CAMPOS_DEL_CSV.map((clave) => ({
      key: clave,
      label:
        clave === 'name'
          ? this.translate.instant('repositories.columns.name')
          : clave === 'phone'
            ? t('phone')
            : clave.startsWith('custom')
              ? this.etiquetaPersonalizada(Number(clave.slice(6)))
              : t(`fields.${clave}`),
    }));
  });

  /** Cómo se llama el campo personalizado N: «Personalizado N», en todas las agendas. */
  protected readonly etiquetaPersonalizada = (n: number): string =>
    this.translate.instant('repositories.agendas.custom_label', { n });

  /** El diálogo de un contacto: `null` cerrado; con `contact: null`, para añadir. */
  protected readonly contactDialog = signal<{ readonly contact: AgendaContact | null } | null>(null);

  /**
   * Al menos un dato con texto (solo espacios no cuenta: llegan ya recortados) y, si lleva teléfono, válido y sin repetir
   * en la agenda (comparado por sus cifras). Devuelve la clave del error.
   */
  protected readonly validateContact = (values: RepoFormSubmission): string | null => {
    if (!Object.values(values).some((v) => !!v)) return 'repositories.agendas.errors.contact_empty';
    const phone = values['phone'] ?? '';
    if (!phone) return null;
    if (!telefonoValido(phone)) return 'repositories.agendas.errors.phone_invalid';
    const propio = this.contactDialog()?.contact?.id ?? null;
    const clave = normalizarTelefono(phone);
    const repetido = this.form().contacts.some((c) => c.id !== propio && normalizarTelefono(c.phone) === clave);
    return repetido ? 'repositories.agendas.errors.phone_taken' : null;
  };

  protected onContactSave(values: RepoFormSubmission): void {
    const editing = this.contactDialog()?.contact ?? null;
    // Todos los campos: lo vaciado se quita (no se arrastra lo de antes) y lo escrito se guarda sin espacios de más.
    const datos = contactoDeValores(values);
    this.form.update((f) => {
      if (editing) return { ...f, contacts: f.contacts.map((c) => (c.id === editing.id ? { id: c.id, ...datos } : c)) };
      // Arriba, donde se ve: al final, en la agenda grande caería en la última página.
      const id = f.contacts.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      return { ...f, contacts: [{ id, ...datos }, ...f.contacts] };
    });
    this.contactDialog.set(null);
  }

  /** Uno solo también pregunta (COA SISMAC-4440, «Eliminar contacto»): el mismo modal que varios, con su cifra en singular. */
  protected removeContact(contact: AgendaContact): void {
    void this.removeContacts([contact]);
  }

  /* ── Eliminar varios (DD-227): el clic derecho sobre un contacto marcado entre dos o más ──────────────────────── */

  private readonly alertModal = injectAlertModal();

  /** «¿Eliminar 3 contactos?», «Esta acción no se puede deshacer.»: la confirmación simple con su cifra, como Reglas. */
  protected async removeContacts(contacts: readonly AgendaContact[]): Promise<void> {
    const n = contacts.length;
    const accepted = await this.alertModal({
      variant: 'error',
      surface: 'plain',
      title: this.translate.instant(`repositories.agendas.contacts_delete_title${n === 1 ? '_one' : ''}`, { count: n }),
      message: this.translate.instant('common.delete_dialog.body'),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!accepted) return;
    const ids = new Set(contacts.map((c) => c.id));
    this.form.update((f) => ({ ...f, contacts: f.contacts.filter((c) => !ids.has(c.id)) }));
    this.resultado.contar(this.translate.instant(`repositories.agendas.contacts_deleted_bulk${n === 1 ? '_one' : ''}`, { count: n }));
  }

  /* ── Importar desde un CSV (DD-166) ────────────────────────────────────── */

  /** Las líneas con error que se enseñan; de las demás se dice cuántas son. */
  private static readonly ERRORES_A_LA_VISTA = 20;
  private readonly formatoCifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  protected readonly importOpen = signal(false);
  /** Lo que dice el archivo antes de añadirlo: `null` mientras no se elige. */
  protected readonly importPreview = signal<ImportacionDeContactos | null>(null);

  /** La vista previa en frases: qué entra, cada error con su línea, los repetidos y lo que no cabe. */
  protected readonly importResumen = computed(() => {
    this.lang();
    const vista = this.importPreview();
    if (!vista) return null;
    const cifra = (n: number) => this.formatoCifra().format(n);
    const frase = (clave: string, n: number) =>
      this.translate.instant(`repositories.agendas.${clave}${n === 1 ? '_one' : ''}`, { count: cifra(n), max: cifra(TOPE_DE_CONTACTOS) });
    const vistos = vista.errores.slice(0, AgendaEditorPageComponent.ERRORES_A_LA_VISTA);
    const resto = vista.errores.length - vistos.length;
    return {
      entran: vista.nuevos.length > 0 ? frase('import_add', vista.nuevos.length) : this.translate.instant('repositories.agendas.import_nothing'),
      errores: vista.errores.length > 0 ? frase('import_errors', vista.errores.length) : null,
      lineas: vistos.map((e) =>
        this.translate.instant('repositories.agendas.import_error_line', {
          line: e.linea,
          reason: this.translate.instant('repositories.agendas.import_reason_phone'),
        }),
      ),
      mas: resto > 0 ? this.translate.instant('repositories.agendas.import_more_errors', { count: cifra(resto) }) : null,
      repetidas: vista.repetidos > 0 ? frase('import_duplicates', vista.repetidos) : null,
      sobran: vista.sobran > 0 ? frase('import_over', vista.sobran) : null,
      confirmar: vista.nuevos.length > 0 ? frase('import_confirm', vista.nuevos.length) : null,
    };
  });

  protected abrirImportar(): void {
    this.importPreview.set(null);
    this.importOpen.set(true);
  }

  protected cerrarImportar(): void {
    this.importOpen.set(false);
    this.importPreview.set(null);
  }

  /** La plantilla: solo la cabecera, en el idioma de la app, con `;` y BOM para Excel. */
  protected descargarPlantilla(): void {
    const t = (clave: string) => this.translate.instant(`repositories.agendas.${clave}`);
    // La cabecera, con los nombres de los campos en el idioma de la app y los personalizados como los llama esta agenda.
    const cabecera = this.contactColumns().map((c) => c.label);
    const blob = new Blob([plantillaCsv(cabecera)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${t('import_template_file')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    // Vacío, para que elegir otra vez el mismo archivo (corregido) vuelva a leerlo.
    input.value = '';
    if (!archivo) return;
    const texto = decodificarCsv(new Uint8Array(await archivo.arrayBuffer()));
    this.importPreview.set(parsearContactosCsv(texto, this.form().contacts));
  }

  /** Lo importado entra en el formulario, arriba y sin guardar, como un contacto añadido a mano: Guardar y Deshacer. */
  protected confirmarImportar(): void {
    const vista = this.importPreview();
    if (!vista || vista.nuevos.length === 0) return;
    this.form.update((f) => {
      let id = f.contacts.reduce((max, c) => Math.max(max, c.id), 0);
      const nuevos = vista.nuevos.map((c) => ({ id: ++id, ...c }));
      return { ...f, contacts: [...nuevos, ...f.contacts] };
    });
    this.cerrarImportar();
  }

  /* ── Teclado y pestaña ────────────────────────────────────────────────── */

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

  /** El texto de «creado», «actualizado» o «eliminado» de esta entidad. */
  private texto(key: string, name: string): string {
    return this.translate.instant(key, { name });
  }

}
