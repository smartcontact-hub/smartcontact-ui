# Desvíos del Supervisor respecto al nativo de primeng.dev

<!-- GENERADO por `node scripts/component-audit.mjs --write`. NO editar a mano. -->

Contra **PrimeNG 22.1.0**, la versión INSTALADA — no la documentación de la web,
que puede ir por delante.

**44 componentes** del DS se usan en el Supervisor, y entre todos esconden
**575 props** que PrimeNG sí documenta.

La regla es DD-113: *el nativo tal cual, adaptado con tokens*. Esconder una prop puede ser una
decisión buena —los wrappers EXTENDED lo hacen a propósito— pero hasta ahora esa decisión no se
veía en ningún sitio, así que no se podía revisar. Esto la pone delante.

**Cómo se usa**: al construir una pantalla, si echas en falta algo, míralo aquí ANTES de
envolverlo a mano. Si la prop está en esta lista, existe en PrimeNG y solo hay que dejarla pasar.

## ⚠️ Props nuestras sobre API que PrimeNG marca obsoleta

- **`sc-drawer.showCloseIcon`** → use 'closable' instead.

Cambiarlas rompe API pública nuestra, así que es un major (DD-58): se propone, no se cuela.

## Por componente

### `sc-datatable` · 13 usos · primeng/table

**91 props nativas no expuestas**: `alwaysShowPaginator`, `ariaLabel`, `columnResizeMode`, `columnsInput`, `compareSelectionBy`, `contextMenu`, `contextMenuSelectionInput`, `csvSeparator`, `currency`, `currencyDisplay`, `currentPageReportTemplate`, `customSort`, `defaultSortOrder`, `display`, `editMode`, `editingRowKeysInput`, `expandedRowKeysInput`, `exportFilename`, `exportFunction`, `exportHeader`, `field`, `filterButtonProps`, `filterDelay`, `filterLocale`, `filterOn`, `filtersInput`, `first`, `frozenColumns`, `frozenValue`, `frozenWidth`, `groupRowsBy`, `groupRowsByOrder`, `hideOnClear`, `lazyLoadOnInit`, `loadingIcon`, `locale`, `localeMatcher`, `matchMode`, `matchModeOptions`, `maxConstraints`, `maxFractionDigits`, `metaKeySelection`, `minFractionDigits`, `multiSortMetaInput`, `operator`, `pageLinks`, `paginatorDropdownAppendTo`, `paginatorDropdownScrollHeight`, `paginatorLocale`, `paginatorPosition`, `paginatorStyleClass`, `placeholder`, `prefix`, `reorderableColumns`, `resetPageOnSort`, `resizableColumns`, `rowExpandMode`, `rowGroupMode`, `rowHover`, `rowSelectable`, `rowTrackBy`, `selectAllInput`, `selectionPageOnly`, `showAddButton`, `showApplyButton`, `showButtons`, `showClearButton`, `showCurrentPageReport`, `showFirstLastIcon`, `showInitialSortBadge`, `showJumpToPageDropdown`, `showJumpToPageInput`, `showLoader`, `showMatchModes`, `showMenu`, `showOperator`, `showPageLinks`, `sortFieldInput`, `sortMode`, `sortOrderInput`, `stateKey`, `stateStorage`, `suffix`, `tableStyle`, `tableStyleClass`, `type`, `useGrouping`, `valueInput`, `virtualScrollDelay`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-datepicker` · 1 usos · primeng/datepicker

**55 props nativas no expuestas**: `appendTo`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `autofocus`, `baseZIndex`, `clearButtonStyleClass`, `dataType`, `defaultDate`, `disabledDates`, `disabledDays`, `firstDayOfWeek`, `fluid`, `focusTrap`, `hideOnDateTimeSelect`, `hourFormat`, `icon`, `iconAriaLabel`, `iconDisplay`, `inputSize`, `inputStyle`, `inputStyleClass`, `keepInvalid`, `max`, `maxDateCount`, `maxlength`, `min`, `minlength`, `motionOptions`, `multipleSeparator`, `numberOfMonths`, `panelStyle`, `panelStyleClass`, `pattern`, `rangeSeparator`, `readonlyInput`, `responsiveOptions`, `selectOtherMonths`, `shortYearCutoff`, `showOnFocus`, `showOtherMonths`, `showSeconds`, `showTime`, `showWeek`, `startWeekFromFirstDayOfYear`, `step`, `stepHour`, `stepMinute`, `stepSecond`, `tabindex`, `timeOnly`, `timeSeparator`, `todayButtonStyleClass`, `touchUI`, `variant`

### `sc-multiselect` · 15 usos · primeng/multiselect

**46 props nativas no expuestas**: `ariaFilterLabel`, `ariaLabel`, `autoOptionFocus`, `autocomplete`, `autofocus`, `autofocusFilter`, `chipIcon`, `dataKey`, `displaySelectedLabel`, `dropdownIcon`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterPlaceHolder`, `filterValue`, `fluid`, `focusOnHover`, `group`, `highlightOnSelect`, `id`, `lazy`, `loading`, `loadingIcon`, `motionOptions`, `optionDisabled`, `optionGroupChildren`, `optionGroupLabel`, `overlayOptions`, `overlayVisible`, `panelStyle`, `panelStyleClass`, `readonly`, `resetFilterOnHide`, `scrollHeight`, `selectAll`, `selectOnFocus`, `showHeader`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-select` · 34 usos · primeng/select

**44 props nativas no expuestas**: `ariaFilterLabel`, `ariaLabel`, `autoOptionFocus`, `autofocus`, `autofocusFilter`, `checkmark`, `dataKey`, `dropdownIcon`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterValue`, `fluid`, `focusOnHover`, `group`, `id`, `inputSize`, `lazy`, `loadingIcon`, `max`, `maxlength`, `min`, `minlength`, `motionOptions`, `multiple`, `optionGroupChildren`, `optionGroupLabel`, `overlayOptions`, `panelStyle`, `panelStyleClass`, `pattern`, `resetFilterOnHide`, `scrollHeight`, `selectOnFocus`, `step`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-confirmdialog` · 1 usos · primeng/confirmdialog

**35 props nativas no expuestas**: `acceptAriaLabel`, `acceptButtonStyleClass`, `acceptIcon`, `acceptLabel`, `acceptVisible`, `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closable`, `closeAriaLabel`, `closeOnEscape`, `defaultFocus`, `dismissableMask`, `draggable`, `focusTrap`, `header`, `icon`, `key`, `maskMotionOptions`, `maskStyleClass`, `message`, `modal`, `motionOptions`, `position`, `rejectAriaLabel`, `rejectButtonStyleClass`, `rejectIcon`, `rejectLabel`, `rejectVisible`, `rtl`, `style`, `styleClass`, `visible`

### `sc-bulk-edit-menu` · 3 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-delete-entity-dialog` · 11 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-sticky-form-header` · 3 usos · primeng/button

**33 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-impact-preview-dialog` · 3 usos · primeng/button

**32 props nativas no expuestas**: `ariaLabel`, `autofocus`, `badgeSeverity`, `buttonProps`, `disabled`, `fluid`, `hostName`, `icon`, `iconOnly`, `iconPos`, `label`, `link`, `loading`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `rounded`, `severity`, `size`, `style`, `styleClass`, `tabindex`, `text`, `type`, `variant`

### `sc-dialog` · 10 usos · primeng/dialog

**29 props nativas no expuestas**: `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closeButtonProps`, `closeIcon`, `closeOnEscape`, `closeTabindex`, `contentStyle`, `contentStyleClass`, `focusOnShow`, `focusTrap`, `header`, `keepInViewport`, `maskMotionOptions`, `maskStyle`, `maskStyleClass`, `maximizable`, `maximizeButtonProps`, `maximizeIcon`, `minX`, `minY`, `minimizeIcon`, `motionOptions`, `rtl`, `showHeader`, `style`, `styleClass`

### `sc-password` · 1 usos · primeng/password

**25 props nativas no expuestas**: `appendTo`, `ariaLabelledBy`, `autofocus`, `inputSize`, `inputStyle`, `inputStyleClass`, `max`, `mediumLabel`, `mediumRegex`, `min`, `minlength`, `motionOptions`, `overlayOptions`, `pPasswordPT`, `pPasswordUnstyled`, `pattern`, `promptLabel`, `showClear`, `showPassword`, `step`, `strongLabel`, `strongRegex`, `tabindex`, `variant`, `weakLabel`

### `sc-button` · 133 usos · primeng/button

**24 props nativas no expuestas**: `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `fluid`, `hostName`, `iconOnly`, `iconPos`, `link`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `plain`, `raised`, `severity`, `style`, `styleClass`, `tabindex`, `text`

### `sc-column-selector` · 1 usos · primeng/popover

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `baseZIndex`, `dismissable`, `focusOnShow`, `motionOptions`, `style`, `styleClass`

### `sc-drawer` · 1 usos · primeng/drawer

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `autoZIndex`, `baseZIndex`, `blockScroll`, `closable`, `closeButtonProps`, `maskStyle`, `motionOptions`, `style`, `styleClass`

### `sc-group-popover` · 3 usos · primeng/popover

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `baseZIndex`, `dismissable`, `focusOnShow`, `motionOptions`, `style`, `styleClass`

### `sc-avatar` · 1 usos · primeng/avatar, primeng/overlaybadge

**7 props nativas no expuestas**: `ariaLabelledBy`, `badgeDisabled`, `badgeSize`, `severity`, `style`, `styleClass`, `value`

### `sc-radiobutton` · 2 usos · primeng/radiobutton

**7 props nativas no expuestas**: `ariaLabelledBy`, `autofocus`, `binary`, `disabled`, `invalid`, `required`, `tabindex`

### `sc-search` · 9 usos · primeng/iconfield, primeng/inputicon, primeng/inputtext

**7 props nativas no expuestas**: `fluid`, `iconPosition`, `invalid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-selectbutton` · 7 usos · primeng/selectbutton

**7 props nativas no expuestas**: `autofocus`, `dataKey`, `name`, `required`, `styleClass`, `tabindex`, `unselectable`

### `sc-toggleswitch` · 26 usos · primeng/toggleswitch

**7 props nativas no expuestas**: `autofocus`, `falseValue`, `invalid`, `name`, `required`, `tabindex`, `trueValue`

### `sc-inputnumber` · 11 usos · primeng/inputtext

**5 props nativas no expuestas**: `fluid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-badge` · 6 usos · primeng/badge

**4 props nativas no expuestas**: `badgeDisabled`, `badgeSize`, `severity`, `value`

### `sc-inputtext` · 34 usos · primeng/inputtext

**4 props nativas no expuestas**: `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-panel` · 1 usos · primeng/panel

**4 props nativas no expuestas**: `iconPos`, `motionOptions`, `toggleButtonProps`, `toggler`

### `sc-message` · 3 usos · primeng/message

**3 props nativas no expuestas**: `closeIcon`, `life`, `motionOptions`

### `sc-textarea` · 6 usos · primeng/textarea

**3 props nativas no expuestas**: `pSize`, `pTextareaPT`, `pTextareaUnstyled`

### `sc-breadcrumb` · 1 usos · primeng/breadcrumb

**2 props nativas no expuestas**: `style`, `styleClass`

### `sc-chip` · 6 usos · primeng/chip

**2 props nativas no expuestas**: `chipProps`, `removeIcon`

### `sc-bulk-action-bar` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-checkbox` · 34 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-color-dot-picker` · 3 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-command-palette` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-divider` · 28 usos · primeng/divider

Expone todo lo que PrimeNG documenta.

### `sc-empty-state` · 16 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-form-section-nav` · 6 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-gauge` · 1 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inline-rename-cell` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inputgroup` · 1 usos · primeng/inputgroup

Expone todo lo que PrimeNG documenta.

### `sc-keyboard-shortcuts` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-option-cards` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-permission-matrix` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-photo-upload` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-section-card` · 28 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-tag` · 30 usos · primeng/tag

Expone todo lo que PrimeNG documenta.

## El catálogo de PrimeNG que NO envolvemos

Aura tematiza **97 componentes**. Envolvemos **31**,
**8** se usan en NATIVO sin wrapper (la vía de DD-113) y **1** los cubre
una pieza nuestra hecha a mano.
Quedan **57** que existen, están tematizados y funcionan — simplemente nadie los ha
traído todavía.

⚠️ **«Sin envolver» NO quiere decir «descartado»**: quiere decir que la decisión no se ha tomado.
Si necesitas uno, envolverlo es más barato (y sale mejor) que construirlo a mano, porque llega con
su comportamiento, su accesibilidad y su movimiento ya resueltos. Cuando se decida que uno NO se
quiere, el sitio de esa decisión es `docs/DECISIONS.md`, y entonces se puede anotar aquí.

`accordion` · `autocomplete` · `blockui` · `carousel` · `cascadeselect` · `colorpicker` · `commandmenu` · `compare` · `confirmpopup` · `contextmenu` · `dataview` · `dock` · `editor` · `fieldset` · `fileupload` · `floatlabel` · `galleria` · `gallery` · `iftalabel` · `image` · `imagecompare` · `inlinemessage` · `inplace` · `inputchips` · `inputcolor` · `inputnumber` · `inputotp` · `inputtags` · `knob` · `label` · `megamenu` · `menubar` · `navigationmenu` · `orderlist` · `organizationchart` · `paginator` · `panelmenu` · `picklist` · `rating` · `ripple` · `scrollpanel` · `slider` · `speeddial` · `splitbutton` · `splitter` · `stepper` · `steps` · `tabmenu` · `tabview` · `terminal` · `tieredmenu` · `timeline` · `togglebutton` · `tree` · `treeselect` · `treetable` · `virtualscroller`

### Usados en NATIVO, sin wrapper

Entraron por la vía de DD-113: el nativo tal cual, adaptado solo con tokens. No hay nada que envolver.

`listbox` · `menu` · `metergroup` · `scrollarea` · `sidebar` · `tabs` · `toolbar` · `tooltip`

### Cubiertos por una pieza nuestra

- `checkbox` → sc-checkbox (custom: necesita el tercer estado, el grupo elegido a medias)

