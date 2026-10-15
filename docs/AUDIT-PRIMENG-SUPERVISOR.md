# Desvíos del Supervisor respecto al nativo de primeng.dev

<!-- GENERADO por `node scripts/component-audit.mjs --write`. NO editar a mano. -->

Contra **PrimeNG 22.1.0**, la versión INSTALADA — no la documentación de la web,
que puede ir por delante.

**51 componentes** del DS se usan en el Supervisor, y entre todos esconden
**509 props** que PrimeNG sí documenta.

La regla es DD-113: *el nativo tal cual, adaptado con tokens*. Esconder una prop puede ser una
decisión buena —los wrappers EXTENDED lo hacen a propósito— pero hasta ahora esa decisión no se
veía en ningún sitio, así que no se podía revisar. Esto la pone delante.

**Cómo se usa**: al construir una pantalla, si echas en falta algo, míralo aquí ANTES de
envolverlo a mano. Si la prop está en esta lista, existe en PrimeNG y solo hay que dejarla pasar.

## ⚠️ Props nuestras sobre API que PrimeNG marca obsoleta

- **`sc-drawer.showCloseIcon`** → use 'closable' instead.

Cambiarlas rompe API pública nuestra, así que es un major (DD-58): se propone, no se cuela.

## Por componente

### `sc-datatable` · 17 usos · primeng/table

**73 props nativas no expuestas**: `alwaysShowPaginator`, `ariaLabel`, `columnsInput`, `compareSelectionBy`, `contextMenu`, `contextMenuSelectionInput`, `currency`, `currencyDisplay`, `customSort`, `defaultSortOrder`, `display`, `editingRowKeysInput`, `expandedRowKeysInput`, `exportHeader`, `field`, `filterButtonProps`, `filterDelay`, `filterLocale`, `filterOn`, `filtersInput`, `frozenColumns`, `frozenWidth`, `groupRowsByOrder`, `hideOnClear`, `lazyLoadOnInit`, `loadingIcon`, `locale`, `localeMatcher`, `matchMode`, `matchModeOptions`, `maxConstraints`, `maxFractionDigits`, `minFractionDigits`, `multiSortMetaInput`, `operator`, `pageLinks`, `paginatorDropdownAppendTo`, `paginatorDropdownScrollHeight`, `paginatorLocale`, `paginatorStyleClass`, `placeholder`, `prefix`, `resetPageOnSort`, `rowExpandMode`, `rowHover`, `rowSelectable`, `rowTrackBy`, `selectAllInput`, `selectionPageOnly`, `showAddButton`, `showApplyButton`, `showButtons`, `showClearButton`, `showFirstLastIcon`, `showInitialSortBadge`, `showJumpToPageDropdown`, `showJumpToPageInput`, `showLoader`, `showMatchModes`, `showMenu`, `showOperator`, `showPageLinks`, `sortFieldInput`, `sortOrderInput`, `suffix`, `tableStyle`, `tableStyleClass`, `type`, `useGrouping`, `valueInput`, `virtualScrollDelay`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-datepicker` · 1 usos · primeng/datepicker

**55 props nativas no expuestas**: `appendTo`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `autofocus`, `baseZIndex`, `clearButtonStyleClass`, `dataType`, `defaultDate`, `disabledDates`, `disabledDays`, `firstDayOfWeek`, `fluid`, `focusTrap`, `hideOnDateTimeSelect`, `hourFormat`, `icon`, `iconAriaLabel`, `iconDisplay`, `inputSize`, `inputStyle`, `inputStyleClass`, `keepInvalid`, `max`, `maxDateCount`, `maxlength`, `min`, `minlength`, `motionOptions`, `multipleSeparator`, `numberOfMonths`, `panelStyle`, `panelStyleClass`, `pattern`, `rangeSeparator`, `readonlyInput`, `responsiveOptions`, `selectOtherMonths`, `shortYearCutoff`, `showOnFocus`, `showOtherMonths`, `showSeconds`, `showTime`, `showWeek`, `startWeekFromFirstDayOfYear`, `step`, `stepHour`, `stepMinute`, `stepSecond`, `tabindex`, `timeOnly`, `timeSeparator`, `todayButtonStyleClass`, `touchUI`, `variant`

### `sc-multiselect` · 17 usos · primeng/chip, primeng/multiselect

**46 props nativas no expuestas**: `alt`, `ariaFilterLabel`, `autoOptionFocus`, `autocomplete`, `autofocus`, `autofocusFilter`, `chipIcon`, `chipProps`, `dataKey`, `displaySelectedLabel`, `dropdownIcon`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterPlaceHolder`, `filterValue`, `fluid`, `focusOnHover`, `highlightOnSelect`, `id`, `image`, `lazy`, `loading`, `loadingIcon`, `motionOptions`, `overlayOptions`, `overlayVisible`, `panelStyle`, `panelStyleClass`, `readonly`, `removable`, `removeIcon`, `resetFilterOnHide`, `scrollHeight`, `selectAll`, `selectOnFocus`, `showHeader`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-button` · 183 usos · primeng/button, primeng/tooltip

**43 props nativas no expuestas**: `appendTo`, `autoHide`, `autofocus`, `badge`, `badgeSeverity`, `buttonProps`, `content`, `escape`, `fitContent`, `fluid`, `hideDelay`, `hideOnEscape`, `hostName`, `iconPos`, `life`, `link`, `loadingIcon`, `outlined`, `pButton`, `pButtonIconPT`, `pButtonLabelPT`, `pButtonLabelUnstyled`, `pButtonPT`, `pButtonUnstyled`, `pTooltipPT`, `pTooltipUnstyled`, `plain`, `positionLeft`, `positionStyle`, `positionTop`, `severity`, `showDelay`, `showOnEllipsis`, `style`, `styleClass`, `tabindex`, `text`, `tooltipDisabled`, `tooltipEvent`, `tooltipOptions`, `tooltipPosition`, `tooltipStyleClass`, `tooltipZIndex`

### `sc-select` · 68 usos · primeng/select

**43 props nativas no expuestas**: `ariaFilterLabel`, `autoOptionFocus`, `autofocus`, `autofocusFilter`, `checkmark`, `dataKey`, `dropdownIcon`, `filterFields`, `filterLocale`, `filterMatchMode`, `filterValue`, `fluid`, `focusOnHover`, `group`, `id`, `inputSize`, `lazy`, `loadingIcon`, `max`, `maxlength`, `min`, `minlength`, `motionOptions`, `multiple`, `optionGroupChildren`, `optionGroupLabel`, `overlayOptions`, `panelStyle`, `panelStyleClass`, `pattern`, `resetFilterOnHide`, `scrollHeight`, `selectOnFocus`, `step`, `tabindex`, `tooltip`, `tooltipPosition`, `tooltipPositionStyle`, `tooltipStyleClass`, `variant`, `virtualScroll`, `virtualScrollItemSize`, `virtualScrollOptions`

### `sc-confirmdialog` · 1 usos · primeng/confirmdialog, primeng/confirmpopup

**35 props nativas no expuestas**: `acceptAriaLabel`, `acceptButtonStyleClass`, `acceptIcon`, `acceptLabel`, `acceptVisible`, `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closable`, `closeAriaLabel`, `closeOnEscape`, `defaultFocus`, `dismissableMask`, `draggable`, `focusTrap`, `header`, `icon`, `key`, `maskMotionOptions`, `maskStyleClass`, `message`, `modal`, `motionOptions`, `position`, `rejectAriaLabel`, `rejectButtonStyleClass`, `rejectIcon`, `rejectLabel`, `rejectVisible`, `rtl`, `style`, `styleClass`, `visible`

### `sc-group-popover` · 7 usos · primeng/popover, primeng/tooltip

**31 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoHide`, `autoZIndex`, `baseZIndex`, `content`, `dismissable`, `escape`, `fitContent`, `focusOnShow`, `hideDelay`, `hideOnEscape`, `life`, `motionOptions`, `pTooltipPT`, `pTooltipUnstyled`, `positionLeft`, `positionStyle`, `positionTop`, `showDelay`, `showOnEllipsis`, `style`, `styleClass`, `tooltipDisabled`, `tooltipEvent`, `tooltipOptions`, `tooltipPosition`, `tooltipStyleClass`, `tooltipZIndex`

### `sc-inputtags` · 2 usos · primeng/inputtags

**31 props nativas no expuestas**: `addOnTab`, `appendTo`, `autoOptionFocus`, `completeOnFocus`, `delay`, `focusOnHover`, `group`, `inputSize`, `inputStyle`, `inputStyleClass`, `maxlength`, `min`, `minQueryLength`, `minlength`, `motionOptions`, `name`, `optionDisabled`, `optionGroupChildren`, `optionGroupLabel`, `optionLabel`, `optionValue`, `overlayOptions`, `panelStyle`, `panelStyleClass`, `pattern`, `scrollHeight`, `step`, `suggestions`, `tabindex`, `typeahead`, `variant`

### `sc-dialog` · 19 usos · primeng/dialog

**29 props nativas no expuestas**: `appendTo`, `autoZIndex`, `baseZIndex`, `blockScroll`, `breakpoints`, `closeButtonProps`, `closeIcon`, `closeOnEscape`, `closeTabindex`, `contentStyle`, `contentStyleClass`, `focusOnShow`, `focusTrap`, `header`, `keepInViewport`, `maskMotionOptions`, `maskStyle`, `maskStyleClass`, `maximizable`, `maximizeButtonProps`, `maximizeIcon`, `minX`, `minY`, `minimizeIcon`, `motionOptions`, `rtl`, `showHeader`, `style`, `styleClass`

### `sc-fileupload` · 2 usos · primeng/fileupload

**22 props nativas no expuestas**: `cancelButtonProps`, `cancelIcon`, `cancelStyleClass`, `chooseButtonProps`, `chooseIcon`, `chooseStyleClass`, `customUpload`, `filesInput`, `headers`, `invalidFileLimitMessageDetail`, `invalidFileLimitMessageSummary`, `method`, `previewWidth`, `removeStyleClass`, `showCancelButton`, `showUploadButton`, `style`, `styleClass`, `uploadButtonProps`, `uploadIcon`, `uploadStyleClass`, `withCredentials`

### `sc-column-selector` · 1 usos · primeng/popover

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `ariaLabel`, `ariaLabelledBy`, `autoZIndex`, `baseZIndex`, `dismissable`, `focusOnShow`, `motionOptions`, `style`, `styleClass`

### `sc-drawer` · 3 usos · primeng/drawer

**11 props nativas no expuestas**: `appendTo`, `ariaCloseLabel`, `autoZIndex`, `baseZIndex`, `blockScroll`, `closable`, `closeButtonProps`, `maskStyle`, `motionOptions`, `style`, `styleClass`

### `sc-option-cards` · 3 usos · primeng/radiobutton

**9 props nativas no expuestas**: `ariaLabel`, `autofocus`, `binary`, `inputId`, `invalid`, `required`, `size`, `tabindex`, `variant`

### `sc-avatar` · 4 usos · primeng/avatar, primeng/overlaybadge

**7 props nativas no expuestas**: `ariaLabelledBy`, `badgeDisabled`, `badgeSize`, `severity`, `style`, `styleClass`, `value`

### `sc-radiobutton` · 3 usos · primeng/radiobutton

**7 props nativas no expuestas**: `ariaLabelledBy`, `autofocus`, `binary`, `disabled`, `invalid`, `required`, `tabindex`

### `sc-search` · 13 usos · primeng/iconfield, primeng/inputicon, primeng/inputtext

**7 props nativas no expuestas**: `fluid`, `iconPosition`, `invalid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-selectbutton` · 26 usos · primeng/selectbutton

**7 props nativas no expuestas**: `autofocus`, `dataKey`, `name`, `required`, `styleClass`, `tabindex`, `unselectable`

### `sc-tabs` · 2 usos · primeng/tabs

**7 props nativas no expuestas**: `disabled`, `lazy`, `scrollStrategy`, `scrollable`, `selectOnFocus`, `showNavigators`, `tabindex`

### `sc-toggleswitch` · 44 usos · primeng/toggleswitch

**7 props nativas no expuestas**: `autofocus`, `falseValue`, `invalid`, `name`, `required`, `tabindex`, `trueValue`

### `sc-inputnumber` · 21 usos · primeng/inputtext

**5 props nativas no expuestas**: `fluid`, `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-badge` · 6 usos · primeng/badge

**4 props nativas no expuestas**: `badgeDisabled`, `badgeSize`, `severity`, `value`

### `sc-inputtext` · 47 usos · primeng/inputtext

**4 props nativas no expuestas**: `pInputTextPT`, `pInputTextUnstyled`, `pSize`, `variant`

### `sc-panel` · 1 usos · primeng/panel

**4 props nativas no expuestas**: `iconPos`, `motionOptions`, `toggleButtonProps`, `toggler`

### `sc-message` · 9 usos · primeng/message

**3 props nativas no expuestas**: `closeIcon`, `life`, `motionOptions`

### `sc-textarea` · 8 usos · primeng/textarea

**3 props nativas no expuestas**: `pSize`, `pTextareaPT`, `pTextareaUnstyled`

### `sc-breadcrumb` · 1 usos · primeng/breadcrumb

**2 props nativas no expuestas**: `style`, `styleClass`

### `sc-chip` · 5 usos · primeng/chip

**2 props nativas no expuestas**: `chipProps`, `removeIcon`

### `sc-password` · 2 usos · primeng/config, primeng/inputpassword

**1 props nativas no expuestas**: `mask`

### `sc-bulk-action-bar` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-bulk-edit-menu` · 3 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-checkbox` · 38 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-color-dot-picker` · 3 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-command-palette` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-delete-entity-dialog` · 12 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-divider` · 22 usos · primeng/divider

Expone todo lo que PrimeNG documenta.

### `sc-empty-state` · 24 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-form-section-nav` · 6 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-gauge` · 1 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-icon-tile` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-impact-preview-dialog` · 3 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inline-rename-cell` · 4 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-inputgroup` · 1 usos · primeng/inputgroup

Expone todo lo que PrimeNG documenta.

### `sc-keyboard-shortcuts` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-permission-matrix` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-photo-upload` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-section-card` · 40 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-skeleton` · 1 usos · primeng/skeleton

Expone todo lo que PrimeNG documenta.

### `sc-slot` · 12 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-sticky-form-header` · 2 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-subsection` · 18 usos · —

Expone todo lo que PrimeNG documenta.

### `sc-tag` · 33 usos · primeng/tag

Expone todo lo que PrimeNG documenta.

## El catálogo de PrimeNG que NO envolvemos

Aura tematiza **97 componentes**. Envolvemos **35**,
**13** se usan en NATIVO sin wrapper (la vía de DD-113) y **1** los cubre
una pieza nuestra hecha a mano.
Quedan **48** que existen, están tematizados y funcionan — simplemente nadie los ha
traído todavía.

⚠️ **«Sin envolver» NO quiere decir «descartado»**: quiere decir que la decisión no se ha tomado.
Si necesitas uno, envolverlo es más barato (y sale mejor) que construirlo a mano, porque llega con
su comportamiento, su accesibilidad y su movimiento ya resueltos. Cuando se decida que uno NO se
quiere, el sitio de esa decisión es `docs/DECISIONS.md`, y entonces se puede anotar aquí.

`accordion` · `autocomplete` · `blockui` · `carousel` · `cascadeselect` · `colorpicker` · `commandmenu` · `compare` · `dataview` · `dock` · `fieldset` · `floatlabel` · `galleria` · `gallery` · `iftalabel` · `image` · `imagecompare` · `inlinemessage` · `inputchips` · `inputcolor` · `inputnumber` · `inputotp` · `knob` · `label` · `megamenu` · `menubar` · `navigationmenu` · `orderlist` · `organizationchart` · `paginator` · `panelmenu` · `password` · `picklist` · `ripple` · `scrollpanel` · `speeddial` · `splitbutton` · `splitter` · `stepper` · `steps` · `tabmenu` · `tabview` · `terminal` · `timeline` · `togglebutton` · `tree` · `treeselect` · `virtualscroller`

### Usados en NATIVO, sin wrapper

Entraron por la vía de DD-113: el nativo tal cual, adaptado solo con tokens. No hay nada que envolver.

`contextmenu` · `editor` · `inplace` · `listbox` · `menu` · `metergroup` · `rating` · `scrollarea` · `sidebar` · `slider` · `tieredmenu` · `toolbar` · `treetable`

### Cubiertos por una pieza nuestra

- `checkbox` → sc-checkbox (custom: necesita el tercer estado, el grupo elegido a medias)

