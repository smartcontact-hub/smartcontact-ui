import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { LanguageService } from '@core/services/language.service';
import { XlsxExportService } from '@core/services/xlsx-export.service';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { copyName } from '@shared/utils/copy-name';

import { CeldaVaciaComponent, ImportDialogComponent, ListPageComponent } from '@shared/components';
import {
  useBulkEntityI18n,
  type ColumnDef,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
} from '@smartcontact-hub/components';
import { decodificarCsv } from '../../repositories/state/agenda-contacts.core.mjs';
import { Template } from '../data/templates-data';
import {
  type ImportacionDePlantillas,
  parsearPlantillasCsv,
  plantillaDePlantillasCsv,
  TOPE_DE_PLANTILLAS,
  textoPlano,
} from '../state/templates.core.mjs';
import { TemplatesStore } from '../state/templates.store';
import { ResultadoAccionService } from '@core/services';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'sc-templates-page',
  imports: [
    TooltipModule,
    ButtonComponent,
    CeldaVaciaComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    ImportDialogComponent,
    ListPageComponent,
    TranslateModule,
  ],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesPageComponent {
  private readonly templatesStore = inject(TemplatesStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly xlsx = inject(XlsxExportService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): lleva al editor. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  /** `?editar=<id>` (DD-164): llega del «Editar» de una plantilla en Recursos de una ficha, y lleva a su editor. La
   *  entrada del historial se sustituye: Atrás vuelve a la ficha. */
  readonly editar = input<string>();

  constructor() {
    useTopbarActions(this.topbarActions);
    effect(() => {
      const id = Number(this.editar());
      const tpl = untracked(this.templates).find((t) => t.id === id);
      if (tpl) void this.router.navigateByUrl(`/admin/plantillas/editar/${tpl.id}`, { replaceUrl: true });
    });
  }

  protected readonly plusIcon = 'add';
  protected readonly fileStackIcon = 'file_copy';

  protected readonly templates = this.templatesStore.templates;

  protected readonly searchQuery = signal('');
  /** Selección: la lista la marca; de ella cuelgan la barra en lote y el borrado. */
  protected readonly selectedIds = signal<ReadonlySet<Template['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Template[] | null>(null);

  /** Todas, por nombre (COA SISMAC-4438): sin pestañas por canal, el canal es una columna. */
  protected readonly rows = computed(() => [...this.templates()].sort((a, b) => a.title.localeCompare(b.title)));

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas): en cualquier columna, salvo la fecha. */
  protected readonly matchesSearch = (t: Template, q: string): boolean =>
    t.title.toLowerCase().includes(q) ||
    this.translate.instant(`templates.type.${t.type}`).toLowerCase().includes(q) ||
    textoPlano(t.body).toLowerCase().includes(q);

  /** Nombre de la fila para lectores de pantalla: una plantilla se llama por su título. */
  protected readonly rowLabel = (t: Template): string => t.title;

  /** El contenido, en una línea y sin etiquetas: el HTML guardado no se enseña en crudo. */
  protected plainBody(t: Template): string {
    return textoPlano(t.body);
  }

  /** Cuántos agentes la tienen asignada (lo dice cada agente en sus `templates`): los grupos no se cuentan. */
  private readonly agentesPorPlantilla = computed(() => {
    const cuenta = new Map<number, number>();
    for (const a of this.agentsStore.agents()) for (const id of a.templates ?? []) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    return cuenta;
  });

  protected agentCount(t: Template): number {
    return this.agentesPorPlantilla().get(t.id) ?? 0;
  }

  /** La fecha, en el formato de las agendas: «9 oct 2026». */
  private readonly formatoFecha = computed(
    () => new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' }),
  );

  protected fecha(t: Template): string {
    return this.formatoFecha().format(new Date(`${t.updatedAt}T00:00:00`));
  }

  protected canal(t: Template): string {
    this.lang();
    return this.translate.instant(`templates.type.${t.type}`);
  }

  /** El orden de una cabecera: el nombre y el canal por su letra, el contenido por su texto, los agentes por su cifra y la
   *  fecha por su día. */
  protected readonly sortFn = (a: Template, b: Template, field: string): number => {
    switch (field) {
      case 'type':
        return this.canal(a).localeCompare(this.canal(b));
      case 'body':
        return textoPlano(a.body).localeCompare(textoPlano(b.body));
      case 'agents':
        return this.agentCount(a) - this.agentCount(b);
      case 'updatedAt':
        return a.updatedAt.localeCompare(b.updatedAt);
      default:
        return a.title.localeCompare(b.title);
    }
  };

  /* ── La tabla, `sc-datatable` — misma receta que labels ─────────────────
   * `columns` es un `computed()` que lee los `viewChild`: los `TemplateRef`
   * resuelven tarde y una lista fija se quedaría sin `cellTemplate`. */
  private readonly titleTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('titleTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('typeTpl');
  private readonly bodyTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('bodyTpl');
  private readonly agentsTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('agentsTpl');
  private readonly updatedTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('updatedTpl');

  protected readonly columnPrefKey = 'sc-templates-columns-v3';

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang();
    return [
      { key: 'title', label: this.translate.instant('templates.table.title'), locked: true },
      { key: 'type', label: this.translate.instant('templates.table.type') },
      { key: 'body', label: this.translate.instant('templates.table.body') },
      { key: 'agents', label: this.translate.instant('templates.table.agents') },
      { key: 'updatedAt', label: this.translate.instant('templates.table.updated') },
    ];
  });

  protected readonly columns = computed<readonly ScColumnDef<Template>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      {
        field: 'title',
        header: this.translate.instant('templates.table.title'),
        sortable: true,
        cellTemplate: this.titleTpl(),
      },
      { field: 'type', header: this.translate.instant('templates.table.type'), width: '8rem', sortable: true, cellTemplate: this.typeTpl() },
      {
        field: 'body',
        header: this.translate.instant('templates.table.body'),
        sortable: true,
        cellTemplate: this.bodyTpl(),
      },
      { field: 'agents', header: this.translate.instant('templates.table.agents'), width: '112px', sortable: true, cellTemplate: this.agentsTpl() },
      /* `updatedAt` sí lleva cellTemplate aunque sea texto plano: su tipografía
       * (12px, gris tenue) vive en el SCSS de ESTA página, y el `<td>` lo pinta
       * ahora el DS — una regla encapsulada aquí no lo alcanzaría. El `<span>`
       * proyectado sí conserva el encapsulado de la página. */
      {
        field: 'updatedAt',
        header: this.translate.instant('templates.table.updated'),
        width: '9.5rem',
        sortable: true,
        cellTemplate: this.updatedTpl(),
      },
    ];
  });

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((t) => ({ id: t.id, name: t.title })),
  );

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.template_singular',
    plural: 'common.bulk.entity.template_plural',
    selectedOne: 'common.bulk.entity.template_selected_one',
    selectedOther: 'common.bulk.entity.template_selected_other',
  });

  /** «Nueva plantilla» y el vacío llevan al editor (el canal nace en Chat). */
  protected onCreateClick(): void {
    void this.router.navigate(['/admin/plantillas/crear']);
  }

  protected onRowOpen(tpl: Template): void {
    void this.router.navigateByUrl(`/admin/plantillas/editar/${tpl.id}`);
  }

  /** La copia, en el mismo canal y con un título que no se repite (el título es único). Se queda en la lista. */
  protected duplicar(tpl: Template): void {
    const title = copyName(tpl.title, this.templates().map((t) => t.title), this.translate.instant('common.copy_suffix'));
    const copia = this.templatesStore.addTemplate({ title, type: tpl.type, body: tpl.body });
    this.toastSuccess('common.duplicated_toast', { name: copia.title });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.templates().filter((t) => ids.has(t.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;

    let ids: number[];
    let toasted: Template[];
    if (remainingIds === null) {
      ids = target.map((t) => t.id);
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((t) => idSet.has(t.id));
      ids = toasted.map((t) => t.id);
    }

    if (ids.length === 1) {
      this.templatesStore.deleteTemplate(ids[0]!);
      this.toastSuccess('templates.toasts.deleted_single', { name: toasted[0]!.title });
    } else {
      this.templatesStore.deleteTemplates(ids);
      this.toastSuccess('templates.toasts.deleted_bulk', { count: ids.length });
    }

    this.deleteTarget.set(null);
    this.clearSelection();
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  /** Con varios marcados, el clic derecho sobre uno de ellos ofrece solo «Eliminar»: lo mismo que el botón de la barra. */
  protected readonly selectionMenu = (rows: readonly Template[]): MenuItem[] => [
    {
      label: this.translate.instant('common.delete_count', { count: rows.length }),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => this.deleteTarget.set(rows),
    },
  ];

  protected readonly rowMenu = (tpl: Template): MenuItem[] => this.buildMenuItems(tpl);

  private buildMenuItems(tpl: Template): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowOpen(tpl),
      },
      {
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        command: () => this.duplicar(tpl),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada, no a un
        // borrado inmediato (C4 del plan): convención de menús de escritorio
        // — "…" significa "esto abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(tpl),
      },
    ];
  }

  protected onRowDelete(tpl: Template): void {
    this.deleteTarget.set([tpl]);
  }

  /* ── Descargar e importar ─────────────────────────────────────────────── */

  /** Descarga lo que se ve, o lo marcado (COA SISMAC-4438): nombre, canal, contenido en texto plano (sin las etiquetas del
   *  HTML), agentes asignados y modificada. */
  protected onExport(visibleRows: readonly Template[]): void {
    const t = (k: string) => this.translate.instant(k);
    this.xlsx.export({
      headers: this.cabeceraExportada(),
      rows: visibleRows.map((r) => [r.title, t(`templates.type.${r.type}`), textoPlano(r.body), this.agentCount(r), this.fecha(r)]),
      sheetName: t('templates.breadcrumb'),
      filePrefix: 'plantillas',
    });
  }

  /** La cabecera de la plantilla y de lo descargado, en el idioma de la app. */
  private cabecera(): string[] {
    const t = (k: string) => this.translate.instant(k);
    return [t('templates.table.title'), t('templates.table.type'), t('templates.table.body')];
  }

  /** La cabecera de lo descargado: la de la plantilla de importar más los agentes asignados y la fecha. */
  private cabeceraExportada(): string[] {
    const t = (k: string) => this.translate.instant(k);
    return [...this.cabecera(), t('templates.table.agents_assigned'), t('templates.table.updated')];
  }

  private static readonly ERRORES_A_LA_VISTA = 20;
  private readonly formatoCifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  protected readonly importOpen = signal(false);
  /** Lo que dice el archivo antes de crear nada: `null` mientras no se elige. */
  protected readonly importPreview = signal<ImportacionDePlantillas | null>(null);

  /** La vista previa en frases: qué se crea, cada error con su línea, los repetidos y lo que no cabe. */
  protected readonly importResumen = computed(() => {
    this.lang();
    const vista = this.importPreview();
    if (!vista) return null;
    const cifra = (n: number) => this.formatoCifra().format(n);
    const frase = (clave: string, n: number) =>
      this.translate.instant(`templates.import.${clave}${n === 1 ? '_one' : ''}`, { count: cifra(n), max: cifra(TOPE_DE_PLANTILLAS) });
    const vistos = vista.errores.slice(0, TemplatesPageComponent.ERRORES_A_LA_VISTA);
    const resto = vista.errores.length - vistos.length;
    return {
      entran: vista.nuevas.length > 0 ? frase('add', vista.nuevas.length) : this.translate.instant('templates.import.nothing'),
      errores: vista.errores.length > 0 ? frase('errors', vista.errores.length) : null,
      lineas: vistos.map((e) =>
        this.translate.instant('templates.import.error_line', {
          line: e.linea,
          reason: this.translate.instant(`templates.import.reason_${e.motivo}`),
        }),
      ),
      mas: resto > 0 ? this.translate.instant('templates.import.more_errors', { count: cifra(resto) }) : null,
      repetidas: vista.repetidas > 0 ? frase('duplicates', vista.repetidas) : null,
      sobran: vista.sobran > 0 ? frase('over', vista.sobran) : null,
      confirmar: vista.nuevas.length > 0 ? frase('confirm', vista.nuevas.length) : null,
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
    const blob = new Blob([plantillaDePlantillasCsv(this.cabecera())], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.translate.instant('templates.import.template_file')}.csv`;
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
    this.importPreview.set(parsearPlantillasCsv(texto, this.templates()));
  }

  /** Lo importado se crea: sin grupos, que se asignan después en su editor. */
  protected confirmarImportar(): void {
    const vista = this.importPreview();
    if (!vista || vista.nuevas.length === 0) return;
    for (const t of vista.nuevas) this.templatesStore.addTemplate(t);
    this.toastSuccess(`templates.import.done${vista.nuevas.length === 1 ? '_one' : ''}`, { count: vista.nuevas.length });
    this.cerrarImportar();
  }

  private toastSuccess(key: string, params?: Record<string, string | number>): void {
    // El resultado, en un toast (DD-211 §5).
    this.resultado.contar(this.translate.instant(key, params));
  }
}
