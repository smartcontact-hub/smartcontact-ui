import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, signal, type OnInit, type TemplateRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
  ScMessageComponent as MessageComponent,
  ScSectionCardComponent as SectionCardComponent,
} from '@smartcontact-hub/components';

import type { DirtyAware } from '@core/guards';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { ImportDialogComponent } from '@shared/components';
import { createFormDirtyState } from '@shared/utils/form-dirty-state';

import { AgendaAgentsTableComponent } from '../components/agenda-agents-table/agenda-agents-table.component';
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
import { ResultadoAccionService } from '@core/services';

interface AgendaDraft {
  readonly name: string;
  readonly description: string;
  readonly contacts: readonly AgendaContact[];
  /** Las etiquetas de los cinco campos personalizados: una por campo, vacía = la de siempre. */
  readonly customLabels: readonly string[];
  /** Los agentes que ven esta agenda: es lo que dice cada agente en sus `schedules`, no algo de la agenda. */
  readonly agentIds: readonly number[];
}

const SIN_ETIQUETAS: readonly string[] = ['', '', '', '', ''];
const VACIA: AgendaDraft = { name: '', description: '', contacts: [], customLabels: SIN_ETIQUETAS, agentIds: [] };

/**
 * El editor de una agenda (DD-163): su nombre, su estado y sus contactos. Va en su propia ruta, como las fichas, para que
 * Atrás vuelva a donde se estaba y la guarda avise de lo que no se ha guardado; Guardar y Deshacer suben a la barra de
 * arriba. Los contactos son una tabla dentro de su sección (DD-160), en su propio componente.
 */
@Component({
  selector: 'sc-agenda-editor-page',
  imports: [
    AgendaAgentsTableComponent,
    AgendaContactsTableComponent,
    ButtonComponent,
    DialogComponent,
    ImportDialogComponent,
    InputTextComponent,
    MessageComponent,
    RepoFormPanelComponent,
    SectionCardComponent,
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
  private agendaId: number | null = null;

  protected readonly form = signal<AgendaDraft>(VACIA);
  private readonly dirtyState = createFormDirtyState(() => this.form());
  readonly formDirty = this.dirtyState.dirty;
  /** Con cambios sin guardar, el «guardado» de la barra ya no vale (DD-191). */
  private readonly limpiaResultado = effect(() => {
    if (this.formDirty()) this.resultado.limpiar();
  });

  /** El nombre no se repite entre agendas (sin contar la propia), como en el panel de la lista. */
  protected readonly nameTaken = computed(() => {
    const name = this.form().name.trim().toLowerCase();
    return !!name && this.store.items().some((a) => a.id !== this.agendaId && a.name.trim().toLowerCase() === name);
  });

  /** Por qué no se puede guardar, dicho en la barra como en las fichas: falta el nombre, o ya lo tiene otra agenda. */
  protected readonly blockedReason = computed<string | null>(() => {
    this.lang();
    if (!this.form().name.trim()) {
      return this.translate.instant('common.summary_missing', { items: this.translate.instant('common.summary_missing_name') });
    }
    return this.nameTaken() ? this.translate.instant('repositories.agendas.errors.name_taken') : null;
  });

  protected readonly canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw === null) {
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
    this.form.set({
      name: agenda.name,
      description: agenda.description,
      contacts: agenda.contacts,
      customLabels: SIN_ETIQUETAS.map((_, i) => agenda.customLabels?.[i] ?? ''),
      agentIds: this.agentsStore
        .agents()
        .filter((a) => a.schedules?.includes(agenda.id))
        .map((a) => a.id)
        .sort((a, b) => a - b),
    });
    this.dirtyState.markPristine();
  }


  protected update<K extends keyof AgendaDraft>(key: K, value: AgendaDraft[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    if (!this.canSave()) return;
    const f = this.form();
    const draft = { ...f, name: f.name.trim(), description: f.description.trim() };
    // Lo de la agenda y lo de sus agentes se guardan en sitios distintos: los agentes llevan sus agendas.
    const { agentIds, ...datos } = draft;
    if (this.mode() === 'create') {
      const created = this.store.addItem({ ...datos, updatedAt: hoy() });
      this.asignarAgentes(created.id, agentIds);
      this.dirtyState.markPristine();
      const creado = this.texto('repositories.toasts.created', created.name);
      // Tras llegar a la edición: antes, el cambio de página se lo llevaría (DD-191).
      void this.router.navigateByUrl(`/admin/agendas/editar/${created.id}`, { replaceUrl: true }).then(() => this.resultado.enLaBarra(creado));
      return;
    }
    this.store.updateItem(this.agendaId!, { ...datos, updatedAt: hoy() });
    this.asignarAgentes(this.agendaId!, agentIds);
    this.form.set(draft);
    this.dirtyState.markPristine();
    this.resultado.enLaBarra(this.texto('repositories.toasts.updated', draft.name));
  }

  /** Pone o quita esta agenda de las `schedules` de cada agente que cambió: solo toca a los que cambian. */
  private asignarAgentes(agendaId: number, ids: readonly number[]): void {
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
  }

  /* ── Contactos ────────────────────────────────────────────────────────── */

  /**
   * Los campos del formulario de un contacto: los de Voice, agrupados. Ninguno es obligatorio, pero no se guarda sin al
   * menos uno con texto (`validateContact`; revisión de producto del 2026-10-15). Los personalizados llevan la etiqueta
   * de ESTA agenda, o «Personalizado N».
   */
  protected readonly contactFields = computed<readonly RepoFieldDef[]>(() => {
    this.lang();
    const etiquetas = this.form().customLabels;
    return SECCIONES_DE_CONTACTO.flatMap(({ seccion, campos }) =>
      campos.map((clave, i): RepoFieldDef => {
        const personalizado = clave.startsWith('custom');
        const n = personalizado ? Number(clave.slice(6)) : 0;
        return {
          key: clave,
          labelKey: clave === 'name' ? 'repositories.columns.name' : clave === 'phone' ? 'repositories.agendas.phone' : `repositories.agendas.fields.${clave}`,
          label: personalizado ? etiquetas[n - 1]?.trim() || this.translate.instant('repositories.agendas.custom_label', { n }) : undefined,
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

  /** Cómo se llama el campo personalizado N en esta agenda. */
  protected readonly etiquetaPersonalizada = (n: number): string =>
    this.form().customLabels[n - 1]?.trim() || this.translate.instant('repositories.agendas.custom_label', { n });

  protected updateCustomLabel(index: number, value: string): void {
    this.form.update((f) => ({ ...f, customLabels: f.customLabels.map((l, i) => (i === index ? value : l)) }));
  }
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

  protected removeContact(contact: AgendaContact): void {
    this.form.update((f) => ({ ...f, contacts: f.contacts.filter((c) => c.id !== contact.id) }));
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
    return this.translate.instant(key, { entity: this.translate.instant('repositories.agendas.singular'), name });
  }

}
