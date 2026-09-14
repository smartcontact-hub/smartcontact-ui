// node_modules/@primeuix/utils/dist/object/index.mjs
var ce = Object.defineProperty;
var $ = Object.getOwnPropertySymbols;
var pe = Object.prototype.hasOwnProperty;
var ge = Object.prototype.propertyIsEnumerable;
var q = (e67, t57, n46) => t57 in e67 ? ce(e67, t57, { enumerable: true, configurable: true, writable: true, value: n46 }) : e67[t57] = n46;
var E = (e67, t57) => {
  for (var n46 in t57 || (t57 = {})) pe.call(t57, n46) && q(e67, n46, t57[n46]);
  if ($) for (var n46 of $(t57)) ge.call(t57, n46) && q(e67, n46, t57[n46]);
  return e67;
};
function s(e67, t57 = true) {
  return e67 instanceof Object && e67.constructor === Object && (t57 || Object.keys(e67).length !== 0);
}
var me = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function S(e67, t57, n46, r91 = /* @__PURE__ */ new WeakSet()) {
  let o93 = E({}, e67);
  Object.keys(o93).length === 0 && !n46.has(t57) && n46.set(t57, o93);
  let u8 = !r91.has(t57);
  return u8 && r91.add(t57), Object.keys(t57).forEach((i39) => {
    var y2, k3;
    if (me.has(i39)) return;
    let f13 = i39, a49 = t57[f13];
    s(a49) && f13 in e67 && s(e67[f13]) ? o93[f13] = r91.has(a49) ? (y2 = n46.get(a49)) != null ? y2 : S({}, a49, n46, r91) : S(e67[f13], a49, n46, r91) : s(a49) ? o93[f13] = (k3 = n46.get(a49)) != null ? k3 : S({}, a49, n46, r91) : o93[f13] = a49;
  }), u8 && r91.delete(t57), o93;
}
function F(...e67) {
  return e67.reduce((t57, n46) => S(t57, n46 || {}, /* @__PURE__ */ new WeakMap()), {});
}

// node_modules/@primeuix/utils/dist/eventbus/index.mjs
function v() {
  let s16 = /* @__PURE__ */ new Map(), r91 = { on(n46, t57) {
    let e67 = s16.get(n46);
    return e67 ? e67.push(t57) : e67 = [t57], s16.set(n46, e67), r91;
  }, off(n46, t57) {
    let e67 = s16.get(n46);
    if (e67) {
      let o93 = e67.indexOf(t57);
      o93 !== -1 && e67.splice(o93, 1);
    }
    return r91;
  }, emit(n46, ...t57) {
    let e67 = s16.get(n46);
    e67 && e67.forEach((o93) => {
      o93(t57[0]);
    });
  }, clear() {
    s16.clear();
  } };
  return r91;
}

// node_modules/@primeuix/styled/dist/index.mjs
function xe(e67, ...t57) {
  return F(e67, ...t57);
}
var ct = v();

// node_modules/@primeuix/themes/dist/index.mjs
var t = (t57, ...a49) => xe(t57, ...a49);

// node_modules/@primeuix/themes/dist/aura/accordion/index.mjs
var o = { transitionDuration: "{transition.duration}" };
var r = { borderWidth: "0 0 1px 0", borderColor: "{content.border.color}" };
var t2 = { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{text.color}", activeHoverColor: "{text.color}", padding: "1rem", fontWeight: "600", fontSize: "{typography.font.size}", borderRadius: "0", borderWidth: "0", borderColor: "{content.border.color}", background: "{content.background}", hoverBackground: "{content.background}", activeBackground: "{content.background}", activeHoverBackground: "{content.background}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, toggleIcon: { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{text.color}", activeHoverColor: "{text.color}" }, first: { topBorderRadius: "{content.border.radius}", borderWidth: "0" }, last: { bottomBorderRadius: "{content.border.radius}", activeBottomBorderRadius: "0" } };
var e = { borderWidth: "0", borderColor: "{content.border.color}", background: "{content.background}", color: "{text.color}", padding: "0 1rem 1rem 1rem" };
var c = { root: o, panel: r, header: t2, content: e };

// node_modules/@primeuix/themes/dist/aura/autocomplete/index.mjs
var o2 = { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}" };
var r2 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" };
var d = { padding: "{list.padding}", gap: "{list.gap}" };
var e2 = { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", fontWeight: "{list.option.font.weight}", fontSize: "{list.option.font.size}" };
var l = { background: "{list.option.group.background}", color: "{list.option.group.color}", fontWeight: "{list.option.group.font.weight}", fontSize: "{list.option.group.font.size}", padding: "{list.option.group.padding}" };
var i = { width: "2.25rem", sm: { width: "1.75rem" }, lg: { width: "2.625rem" }, background: "light-dark({surface.100}, {surface.800})", hoverBackground: "light-dark({surface.200}, {surface.700})", activeBackground: "light-dark({surface.300}, {surface.600})", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", color: "light-dark({surface.600}, {surface.300})", hoverColor: "light-dark({surface.700}, {surface.200})", activeColor: "light-dark({surface.800}, {surface.100})", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var f = { borderRadius: "{border.radius.sm}", focusBackground: "light-dark({surface.200}, {surface.700})", focusColor: "light-dark({surface.800}, {surface.0})" };
var c2 = { padding: "{list.option.padding}" };
var s2 = { root: o2, overlay: r2, list: d, option: e2, optionGroup: l, dropdown: i, chip: f, emptyMessage: c2 };

// node_modules/@primeuix/themes/dist/aura/avatar/index.mjs
var e3 = { width: "1.75rem", height: "1.75rem", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}", background: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" };
var o3 = { size: "0.875rem" };
var r3 = { borderColor: "{content.background}", offset: "-0.625rem" };
var t3 = { width: "2.625rem", height: "2.625rem", fontSize: "1.25rem", icon: { size: "1.25rem" }, group: { offset: "-0.875rem" } };
var i2 = { width: "3.5rem", height: "3.5rem", fontSize: "1.75rem", icon: { size: "1.75rem" }, group: { offset: "-1.25rem" } };
var n = { root: e3, icon: o3, group: r3, lg: t3, xl: i2 };

// node_modules/@primeuix/themes/dist/aura/badge/index.mjs
var r4 = { borderRadius: "{border.radius.md}", padding: "0 0.375rem", fontSize: "0.625rem", fontWeight: "700", minWidth: "1.25rem", height: "1.25rem" };
var e4 = { size: "0.5rem" };
var a = { fontSize: "0.5rem", minWidth: "1.125rem", height: "1.125rem" };
var o4 = { fontSize: "0.75rem", minWidth: "1.5rem", height: "1.5rem" };
var d2 = { fontSize: "0.875rem", minWidth: "1.75rem", height: "1.75rem" };
var i3 = { background: "{primary.color}", color: "{primary.contrast.color}" };
var t4 = { background: "light-dark({surface.100}, {surface.800})", color: "light-dark({surface.600}, {surface.300})" };
var c3 = { background: "light-dark({green.500}, {green.400})", color: "light-dark({surface.0}, {green.950})" };
var g = { background: "light-dark({sky.500}, {sky.400})", color: "light-dark({surface.0}, {sky.950})" };
var n2 = { background: "light-dark({orange.500}, {orange.400})", color: "light-dark({surface.0}, {orange.950})" };
var s3 = { background: "light-dark({red.500}, {red.400})", color: "light-dark({surface.0}, {red.950})" };
var h = { background: "light-dark({surface.950}, {surface.0})", color: "light-dark({surface.0}, {surface.950})" };
var l2 = { root: r4, dot: e4, sm: a, lg: o4, xl: d2, primary: i3, secondary: t4, success: c3, info: g, warn: n2, danger: s3, contrast: h };

// node_modules/@primeuix/themes/dist/aura/base/index.mjs
var r5 = { borderRadius: { none: "0", xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" }, slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" } };
var e5 = { typography: { lineHeight: "1.5", fontFamily: "inherit", fontWeight: "normal", fontSize: "0.875rem" }, transitionDuration: "0.2s", focusRing: { width: "1px", style: "solid", color: "{primary.color}", offset: "2px", shadow: "none" }, disabledOpacity: "0.6", iconSize: "0.875rem", anchorGutter: "2px", primary: { 50: "{emerald.50}", 100: "{emerald.100}", 200: "{emerald.200}", 300: "{emerald.300}", 400: "{emerald.400}", 500: "{emerald.500}", 600: "{emerald.600}", 700: "{emerald.700}", 800: "{emerald.800}", 900: "{emerald.900}", 950: "{emerald.950}", color: "light-dark({primary.500}, {primary.400})", contrastColor: "light-dark(#ffffff, {surface.900})", hoverColor: "light-dark({primary.600}, {primary.300})", activeColor: "light-dark({primary.700}, {primary.200})" }, formField: { fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}", paddingX: "0.625rem", paddingY: "0.375rem", sm: { fontSize: "0.75rem", paddingX: "0.5rem", paddingY: "0.25rem" }, lg: { fontSize: "1rem", paddingX: "0.75rem", paddingY: "0.5rem" }, borderRadius: "{border.radius.md}", focusRing: { width: "0", style: "none", color: "transparent", offset: "0", shadow: "none" }, transitionDuration: "{transition.duration}", background: "light-dark({surface.0}, {surface.950})", disabledBackground: "light-dark({surface.200}, {surface.700})", filledBackground: "light-dark({surface.50}, {surface.800})", filledHoverBackground: "light-dark({surface.50}, {surface.800})", filledFocusBackground: "light-dark({surface.50}, {surface.800})", borderColor: "light-dark({surface.300}, {surface.600})", hoverBorderColor: "light-dark({surface.400}, {surface.500})", focusBorderColor: "{primary.color}", invalidBorderColor: "light-dark({red.400}, {red.300})", color: "light-dark({surface.700}, {surface.0})", disabledColor: "light-dark({surface.500}, {surface.400})", placeholderColor: "light-dark({surface.500}, {surface.400})", invalidPlaceholderColor: "light-dark({red.600}, {red.400})", floatLabelColor: "light-dark({surface.500}, {surface.400})", floatLabelFocusColor: "light-dark({primary.600}, {primary.color})", floatLabelActiveColor: "light-dark({surface.500}, {surface.400})", floatLabelInvalidColor: "{form.field.invalid.placeholder.color}", iconColor: "{surface.400}", shadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)" }, list: { padding: "0.25rem 0.25rem", gap: "2px", header: { padding: "0.5rem 0.875rem 0.125rem 0.875rem" }, option: { padding: "0.25rem 0.625rem", borderRadius: "{border.radius.sm}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}", transitionDuration: "0s", focusBackground: "light-dark({surface.100}, {surface.800})", selectedBackground: "{highlight.background}", selectedFocusBackground: "{highlight.focus.background}", color: "{text.color}", focusColor: "{text.hover.color}", selectedColor: "{highlight.color}", selectedFocusColor: "{highlight.focus.color}", selectedFontWeight: "{typography.font.weight}", icon: { color: "light-dark({surface.400}, {surface.500})", focusColor: "light-dark({surface.500}, {surface.400})" } }, optionGroup: { padding: "0.25rem 0.625rem", fontWeight: "600", fontSize: "{typography.font.size}", background: "transparent", color: "{text.muted.color}" } }, content: { borderRadius: "{border.radius.md}", background: "light-dark({surface.0}, {surface.900})", hoverBackground: "light-dark({surface.100}, {surface.800})", borderColor: "light-dark({surface.200}, {surface.700})", color: "{text.color}", hoverColor: "{text.hover.color}" }, mask: { transitionDuration: "0.3s", background: "light-dark(rgba(0,0,0,0.4), rgba(0,0,0,0.6))", color: "{surface.200}" }, navigation: { list: { padding: "0.25rem 0.25rem", gap: "2px" }, item: { padding: "0.25rem 0.625rem", borderRadius: "{border.radius.sm}", gap: "0.5rem", focusBackground: "light-dark({surface.100}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.800})", color: "{text.color}", focusColor: "{text.hover.color}", activeColor: "{text.hover.color}", icon: { size: "{icon.size}", color: "light-dark({surface.400}, {surface.500})", focusColor: "light-dark({surface.500}, {surface.400})", activeColor: "light-dark({surface.500}, {surface.400})" }, label: { fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" }, transitionDuration: "0s" }, submenuLabel: { padding: "0.25rem 0.625rem", fontWeight: "600", fontSize: "{typography.font.size}", background: "transparent", color: "{text.muted.color}" }, submenuIcon: { size: "0.75rem", color: "light-dark({surface.400}, {surface.500})", focusColor: "light-dark({surface.500}, {surface.400})", activeColor: "light-dark({surface.500}, {surface.400})" } }, overlay: { select: { borderRadius: "{border.radius.md}", shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)", background: "light-dark({surface.0}, {surface.900})", borderColor: "light-dark({surface.200}, {surface.700})", color: "{text.color}" }, popover: { borderRadius: "{border.radius.md}", padding: "0.625rem", shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)", background: "light-dark({surface.0}, {surface.900})", borderColor: "light-dark({surface.200}, {surface.700})", color: "{text.color}" }, modal: { borderRadius: "{border.radius.xl}", padding: "1.125rem", shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", background: "light-dark({surface.0}, {surface.900})", borderColor: "light-dark({surface.200}, {surface.700})", color: "{text.color}" }, navigation: { shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" } }, surface: { 0: "#ffffff", 50: "light-dark({slate.50}, {zinc.50})", 100: "light-dark({slate.100}, {zinc.100})", 200: "light-dark({slate.200}, {zinc.200})", 300: "light-dark({slate.300}, {zinc.300})", 400: "light-dark({slate.400}, {zinc.400})", 500: "light-dark({slate.500}, {zinc.500})", 600: "light-dark({slate.600}, {zinc.600})", 700: "light-dark({slate.700}, {zinc.700})", 800: "light-dark({slate.800}, {zinc.800})", 900: "light-dark({slate.900}, {zinc.900})", 950: "light-dark({slate.950}, {zinc.950})" }, highlight: { background: "light-dark({primary.50}, color-mix(in srgb, {primary.400}, transparent 84%))", focusBackground: "light-dark({primary.100}, color-mix(in srgb, {primary.400}, transparent 76%))", color: "light-dark({primary.700}, rgba(255,255,255,.87))", focusColor: "light-dark({primary.800}, rgba(255,255,255,.87))" }, text: { color: "light-dark({surface.700}, {surface.0})", hoverColor: "light-dark({surface.800}, {surface.0})", mutedColor: "light-dark({surface.500}, {surface.400})", hoverMutedColor: "light-dark({surface.600}, {surface.300})" } };
var a2 = { primitive: r5, semantic: e5 };

// node_modules/@primeuix/themes/dist/aura/blockui/index.mjs
var r6 = { borderRadius: "{content.border.radius}" };
var o5 = { root: r6 };

// node_modules/@primeuix/themes/dist/aura/breadcrumb/index.mjs
var o6 = { padding: "0.875rem", background: "{content.background}", gap: "0.5rem", transitionDuration: "{transition.duration}" };
var i4 = { color: "{text.muted.color}", hoverColor: "{text.color}", borderRadius: "{content.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", hoverColor: "{navigation.item.icon.focus.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var t5 = { color: "{navigation.item.icon.color}" };
var n3 = { root: o6, item: i4, separator: t5 };

// node_modules/@primeuix/themes/dist/aura/button/index.mjs
var r7 = { borderRadius: "{form.field.border.radius}", roundedBorderRadius: "2rem", gap: "0.5rem", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", iconOnlyWidth: "2.25rem", fontSize: "{form.field.font.size}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}", iconOnlyWidth: "1.75rem" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}", iconOnlyWidth: "2.625rem" }, label: { fontWeight: "500" }, raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" }, badgeSize: "1rem", transitionDuration: "{form.field.transition.duration}", primary: { background: "{primary.color}", hoverBackground: "{primary.hover.color}", activeBackground: "{primary.active.color}", borderColor: "{primary.color}", hoverBorderColor: "{primary.hover.color}", activeBorderColor: "{primary.active.color}", color: "{primary.contrast.color}", hoverColor: "{primary.contrast.color}", activeColor: "{primary.contrast.color}", focusRing: { color: "{primary.color}", shadow: "none" } }, secondary: { background: "light-dark({surface.100}, {surface.800})", hoverBackground: "light-dark({surface.200}, {surface.700})", activeBackground: "light-dark({surface.300}, {surface.600})", borderColor: "light-dark({surface.100}, {surface.800})", hoverBorderColor: "light-dark({surface.200}, {surface.700})", activeBorderColor: "light-dark({surface.300}, {surface.600})", color: "light-dark({surface.600}, {surface.300})", hoverColor: "light-dark({surface.700}, {surface.200})", activeColor: "light-dark({surface.800}, {surface.100})", focusRing: { color: "light-dark({surface.600}, {surface.300})", shadow: "none" } }, info: { background: "light-dark({sky.500}, {sky.400})", hoverBackground: "light-dark({sky.600}, {sky.300})", activeBackground: "light-dark({sky.700}, {sky.200})", borderColor: "light-dark({sky.500}, {sky.400})", hoverBorderColor: "light-dark({sky.600}, {sky.300})", activeBorderColor: "light-dark({sky.700}, {sky.200})", color: "light-dark(#ffffff, {sky.950})", hoverColor: "light-dark(#ffffff, {sky.950})", activeColor: "light-dark(#ffffff, {sky.950})", focusRing: { color: "light-dark({sky.500}, {sky.400})", shadow: "none" } }, success: { background: "light-dark({green.500}, {green.400})", hoverBackground: "light-dark({green.600}, {green.300})", activeBackground: "light-dark({green.700}, {green.200})", borderColor: "light-dark({green.500}, {green.400})", hoverBorderColor: "light-dark({green.600}, {green.300})", activeBorderColor: "light-dark({green.700}, {green.200})", color: "light-dark(#ffffff, {green.950})", hoverColor: "light-dark(#ffffff, {green.950})", activeColor: "light-dark(#ffffff, {green.950})", focusRing: { color: "light-dark({green.500}, {green.400})", shadow: "none" } }, warn: { background: "light-dark({orange.500}, {orange.400})", hoverBackground: "light-dark({orange.600}, {orange.300})", activeBackground: "light-dark({orange.700}, {orange.200})", borderColor: "light-dark({orange.500}, {orange.400})", hoverBorderColor: "light-dark({orange.600}, {orange.300})", activeBorderColor: "light-dark({orange.700}, {orange.200})", color: "light-dark(#ffffff, {orange.950})", hoverColor: "light-dark(#ffffff, {orange.950})", activeColor: "light-dark(#ffffff, {orange.950})", focusRing: { color: "light-dark({orange.500}, {orange.400})", shadow: "none" } }, help: { background: "light-dark({purple.500}, {purple.400})", hoverBackground: "light-dark({purple.600}, {purple.300})", activeBackground: "light-dark({purple.700}, {purple.200})", borderColor: "light-dark({purple.500}, {purple.400})", hoverBorderColor: "light-dark({purple.600}, {purple.300})", activeBorderColor: "light-dark({purple.700}, {purple.200})", color: "light-dark(#ffffff, {purple.950})", hoverColor: "light-dark(#ffffff, {purple.950})", activeColor: "light-dark(#ffffff, {purple.950})", focusRing: { color: "light-dark({purple.500}, {purple.400})", shadow: "none" } }, danger: { background: "light-dark({red.500}, {red.400})", hoverBackground: "light-dark({red.600}, {red.300})", activeBackground: "light-dark({red.700}, {red.200})", borderColor: "light-dark({red.500}, {red.400})", hoverBorderColor: "light-dark({red.600}, {red.300})", activeBorderColor: "light-dark({red.700}, {red.200})", color: "light-dark(#ffffff, {red.950})", hoverColor: "light-dark(#ffffff, {red.950})", activeColor: "light-dark(#ffffff, {red.950})", focusRing: { color: "light-dark({red.500}, {red.400})", shadow: "none" } }, contrast: { background: "light-dark({surface.950}, {surface.0})", hoverBackground: "light-dark({surface.900}, {surface.100})", activeBackground: "light-dark({surface.800}, {surface.200})", borderColor: "light-dark({surface.950}, {surface.0})", hoverBorderColor: "light-dark({surface.900}, {surface.100})", activeBorderColor: "light-dark({surface.800}, {surface.200})", color: "light-dark({surface.0}, {surface.950})", hoverColor: "light-dark({surface.0}, {surface.950})", activeColor: "light-dark({surface.0}, {surface.950})", focusRing: { color: "light-dark({surface.950}, {surface.0})", shadow: "none" } } };
var o7 = { primary: { hoverBackground: "light-dark({primary.50}, color-mix(in srgb, {primary.color}, transparent 96%))", activeBackground: "light-dark({primary.100}, color-mix(in srgb, {primary.color}, transparent 84%))", borderColor: "light-dark({primary.200}, {primary.700})", color: "{primary.color}" }, secondary: { hoverBackground: "light-dark({surface.50}, rgba(255,255,255,0.04))", activeBackground: "light-dark({surface.100}, rgba(255,255,255,0.16))", borderColor: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.500}, {surface.400})" }, success: { hoverBackground: "light-dark({green.50}, color-mix(in srgb, {green.400}, transparent 96%))", activeBackground: "light-dark({green.100}, color-mix(in srgb, {green.400}, transparent 84%))", borderColor: "light-dark({green.200}, {green.700})", color: "light-dark({green.500}, {green.400})" }, info: { hoverBackground: "light-dark({sky.50}, color-mix(in srgb, {sky.400}, transparent 96%))", activeBackground: "light-dark({sky.100}, color-mix(in srgb, {sky.400}, transparent 84%))", borderColor: "light-dark({sky.200}, {sky.700})", color: "light-dark({sky.500}, {sky.400})" }, warn: { hoverBackground: "light-dark({orange.50}, color-mix(in srgb, {orange.400}, transparent 96%))", activeBackground: "light-dark({orange.100}, color-mix(in srgb, {orange.400}, transparent 84%))", borderColor: "light-dark({orange.200}, {orange.700})", color: "light-dark({orange.500}, {orange.400})" }, help: { hoverBackground: "light-dark({purple.50}, color-mix(in srgb, {purple.400}, transparent 96%))", activeBackground: "light-dark({purple.100}, color-mix(in srgb, {purple.400}, transparent 84%))", borderColor: "light-dark({purple.200}, {purple.700})", color: "light-dark({purple.500}, {purple.400})" }, danger: { hoverBackground: "light-dark({red.50}, color-mix(in srgb, {red.400}, transparent 96%))", activeBackground: "light-dark({red.100}, color-mix(in srgb, {red.400}, transparent 84%))", borderColor: "light-dark({red.200}, {red.700})", color: "light-dark({red.500}, {red.400})" }, contrast: { hoverBackground: "light-dark({surface.50}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.700})", borderColor: "light-dark({surface.700}, {surface.500})", color: "light-dark({surface.950}, {surface.0})" }, plain: { hoverBackground: "light-dark({surface.50}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.700})", borderColor: "light-dark({surface.200}, {surface.600})", color: "light-dark({surface.700}, {surface.0})" } };
var a3 = { primary: { hoverBackground: "light-dark({primary.50}, color-mix(in srgb, {primary.color}, transparent 96%))", activeBackground: "light-dark({primary.100}, color-mix(in srgb, {primary.color}, transparent 84%))", color: "{primary.color}" }, secondary: { hoverBackground: "light-dark({surface.50}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.700})", color: "light-dark({surface.500}, {surface.400})" }, success: { hoverBackground: "light-dark({green.50}, color-mix(in srgb, {green.400}, transparent 96%))", activeBackground: "light-dark({green.100}, color-mix(in srgb, {green.400}, transparent 84%))", color: "light-dark({green.500}, {green.400})" }, info: { hoverBackground: "light-dark({sky.50}, color-mix(in srgb, {sky.400}, transparent 96%))", activeBackground: "light-dark({sky.100}, color-mix(in srgb, {sky.400}, transparent 84%))", color: "light-dark({sky.500}, {sky.400})" }, warn: { hoverBackground: "light-dark({orange.50}, color-mix(in srgb, {orange.400}, transparent 96%))", activeBackground: "light-dark({orange.100}, color-mix(in srgb, {orange.400}, transparent 84%))", color: "light-dark({orange.500}, {orange.400})" }, help: { hoverBackground: "light-dark({purple.50}, color-mix(in srgb, {purple.400}, transparent 96%))", activeBackground: "light-dark({purple.100}, color-mix(in srgb, {purple.400}, transparent 84%))", color: "light-dark({purple.500}, {purple.400})" }, danger: { hoverBackground: "light-dark({red.50}, color-mix(in srgb, {red.400}, transparent 96%))", activeBackground: "light-dark({red.100}, color-mix(in srgb, {red.400}, transparent 84%))", color: "light-dark({red.500}, {red.400})" }, contrast: { hoverBackground: "light-dark({surface.50}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.700})", color: "light-dark({surface.950}, {surface.0})" }, plain: { hoverBackground: "light-dark({surface.50}, {surface.800})", activeBackground: "light-dark({surface.100}, {surface.700})", color: "light-dark({surface.700}, {surface.0})" } };
var e6 = { color: "{primary.color}", hoverColor: "{primary.color}", activeColor: "{primary.color}" };
var d3 = { root: r7, outlined: o7, text: a3, link: e6 };

// node_modules/@primeuix/themes/dist/aura/card/index.mjs
var o8 = { background: "{content.background}", borderRadius: "{border.radius.xl}", color: "{content.color}", shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)" };
var t6 = { padding: "1.125rem", gap: "0.5rem" };
var r8 = { gap: "0.5rem" };
var e7 = { fontSize: "1.125rem", fontWeight: "500" };
var a4 = { color: "{text.muted.color}", fontSize: "1rem", fontWeight: "{typography.font.weight}" };
var n4 = { root: o8, body: t6, caption: r8, title: e7, subtitle: a4 };

// node_modules/@primeuix/themes/dist/aura/carousel/index.mjs
var r9 = { transitionDuration: "{transition.duration}" };
var o9 = { gap: "0.25rem" };
var i5 = { padding: "1rem", gap: "0.5rem" };
var a5 = { width: "1.75rem", height: "0.5rem", borderRadius: "{content.border.radius}", background: "light-dark({surface.200}, {surface.700})", hoverBackground: "light-dark({surface.300}, {surface.600})", activeBackground: "{primary.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var t7 = { root: r9, content: o9, indicatorList: i5, indicator: a5 };

// node_modules/@primeuix/themes/dist/aura/cascadeselect/index.mjs
var o10 = { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" }, fontWeight: "{form.field.font.weight}", fontSize: "{form.field.font.size}" };
var r10 = { width: "2.25rem", color: "{form.field.icon.color}" };
var d4 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" };
var l3 = { padding: "{list.padding}", gap: "{list.gap}", mobileIndent: "1rem" };
var e8 = { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", selectedFontWeight: "{list.option.selected.font.weight}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", icon: { color: "{list.option.icon.color}", focusColor: "{list.option.icon.focus.color}", size: "0.75rem" }, fontWeight: "{list.option.font.weight}", fontSize: "{list.option.font.size}" };
var i6 = { color: "{form.field.icon.color}" };
var f2 = { root: o10, dropdown: r10, overlay: d4, list: l3, option: e8, clearIcon: i6 };

// node_modules/@primeuix/themes/dist/aura/checkbox/index.mjs
var r11 = { borderRadius: "{border.radius.sm}", width: "1.125rem", height: "1.125rem", background: "{form.field.background}", checkedBackground: "{primary.color}", checkedHoverBackground: "{primary.hover.color}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.border.color}", checkedBorderColor: "{primary.color}", checkedHoverBorderColor: "{primary.hover.color}", checkedFocusBorderColor: "{primary.color}", checkedDisabledBorderColor: "{form.field.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { width: "0.875rem", height: "0.875rem" }, lg: { width: "1.25rem", height: "1.25rem" } };
var o11 = { size: "0.75rem", color: "{form.field.color}", checkedColor: "{primary.contrast.color}", checkedHoverColor: "{primary.contrast.color}", disabledColor: "{form.field.disabled.color}", sm: { size: "0.625rem" }, lg: { size: "0.875rem" } };
var e9 = { root: r11, icon: o11 };

// node_modules/@primeuix/themes/dist/aura/chip/index.mjs
var r12 = { borderRadius: "1rem", paddingX: "0.625rem", paddingY: "0.375rem", gap: "0.375rem", transitionDuration: "{transition.duration}", background: "light-dark({surface.100}, {surface.800})", focusBackground: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.800}, {surface.0})" };
var o12 = { width: "1.75rem", height: "1.75rem" };
var e10 = { size: "0.875rem", color: "light-dark({surface.800}, {surface.0})" };
var a6 = { fontWeight: "{typography.font.weight}", fontSize: "0.75rem" };
var i7 = { size: "0.875rem", color: "light-dark({surface.800}, {surface.0})", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" } };
var s4 = { root: r12, image: o12, icon: e10, label: a6, removeIcon: i7 };

// node_modules/@primeuix/themes/dist/aura/colorpicker/index.mjs
var r13 = { transitionDuration: "{transition.duration}" };
var o13 = { width: "1.375rem", height: "1.375rem", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e11 = { shadow: "{overlay.popover.shadow}", borderRadius: "{overlay.popover.borderRadius}", background: "light-dark({surface.800}, {surface.900})", borderColor: "light-dark({surface.900}, {surface.700})" };
var a7 = { color: "{surface.0}" };
var s5 = { root: r13, preview: o13, panel: e11, handle: a7 };

// node_modules/@primeuix/themes/dist/aura/commandmenu/index.mjs
var o14 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", height: "25rem" };
var r14 = { padding: "0.375rem 1.125rem", background: "{content.background}", borderColor: "{content.border.color}" };
var e12 = { padding: "0.375rem 0", fontSize: "1rem", fontWeight: "{typography.font.weight}", color: "{form.field.color}", placeholderColor: "{form.field.placeholder.color}" };
var d5 = { padding: "0.375rem" };
var n5 = { padding: "2rem 0", color: "{content.color}" };
var t8 = { padding: "0.625rem 1.125rem", background: "{content.background}", borderColor: "{content.border.color}" };
var c4 = { root: o14, header: r14, input: e12, list: d5, empty: n5, footer: t8 };

// node_modules/@primeuix/themes/dist/aura/compare/index.mjs
var o15 = { borderRadius: "{content.border.radius}" };
var r15 = { background: "{content.background}", size: "1px" };
var e13 = { size: "1.5rem", background: "{content.background}", borderRadius: "{content.border.radius}", focusRing: { width: "2px", style: "solid", color: "{content.background}", offset: "2px" }, icon: { color: "{text.muted.color}", size: "{icon.size}" } };
var n6 = { root: o15, handle: r15, indicator: e13 };

// node_modules/@primeuix/themes/dist/aura/confirmdialog/index.mjs
var o16 = { size: "1.5rem", color: "{overlay.modal.color}" };
var e14 = { gap: "0.875rem" };
var t9 = { color: "{content.color}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var r16 = { icon: o16, content: e14, message: t9 };

// node_modules/@primeuix/themes/dist/aura/confirmpopup/index.mjs
var o17 = { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", color: "{overlay.popover.color}", borderRadius: "{overlay.popover.border.radius}", shadow: "{overlay.popover.shadow}", gutter: "10px", arrowOffset: "1.125rem" };
var r17 = { padding: "{overlay.popover.padding}", gap: "0.5rem" };
var e15 = { size: "1.25rem", color: "{overlay.popover.color}" };
var p = { color: "{content.color}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var a8 = { gap: "0.375rem", padding: "0 {overlay.popover.padding} {overlay.popover.padding} {overlay.popover.padding}" };
var d6 = { root: o17, content: r17, icon: e15, message: p, footer: a8 };

// node_modules/@primeuix/themes/dist/aura/contextmenu/index.mjs
var o18 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{navigation.item.transition.duration}" };
var i8 = { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" };
var n7 = { focusBackground: "{navigation.item.focus.background}", activeBackground: "{navigation.item.active.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", activeColor: "{navigation.item.active.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var a9 = { mobileIndent: "1rem" };
var t10 = { padding: "{navigation.submenu.label.padding}", fontWeight: "{navigation.submenu.label.font.weight}", fontSize: "{navigation.submenu.label.font.size}", background: "{navigation.submenu.label.background}", color: "{navigation.submenu.label.color}" };
var e16 = { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" };
var r18 = { borderColor: "{content.border.color}" };
var c5 = { root: o18, list: i8, item: n7, submenu: a9, submenuLabel: t10, submenuIcon: e16, separator: r18 };

// node_modules/@primeuix/themes/dist/aura/css/index.mjs
var a10 = "\n";

// node_modules/@primeuix/themes/dist/aura/datatable/index.mjs
var o19 = { transitionDuration: "0s", borderColor: "light-dark({content.border.color}, {surface.800})" };
var r19 = { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.5rem 0.875rem", sm: { padding: "0.125rem 0.375rem" }, lg: { padding: "0.75rem 1.125rem" } };
var e17 = { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{content.color}", gap: "0.5rem", padding: "0.5rem 0.875rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, sm: { padding: "0.125rem 0.375rem" }, lg: { padding: "0.75rem 1.125rem" } };
var t11 = { fontWeight: "600", fontSize: "{typography.font.size}" };
var d7 = { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", stripedBackground: "light-dark({surface.50}, {surface.950})", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } };
var c6 = { borderColor: "{datatable.border.color}", padding: "0.5rem 0.875rem", fontWeight: "{typography.font.size}", fontSize: "{typography.font.size}", selectedBorderColor: "light-dark({primary.100}, {primary.900})", sm: { padding: "0.125rem 0.375rem" }, lg: { padding: "0.75rem 1.125rem" } };
var l4 = { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", padding: "0.5rem 0.875rem", sm: { padding: "0.125rem 0.375rem" }, lg: { padding: "0.75rem 1.125rem" } };
var n8 = { fontWeight: "600", fontSize: "{typography.font.size}" };
var a11 = { background: "{content.background}", borderColor: "{datatable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.5rem 0.875rem", sm: { padding: "0.125rem 0.375rem" }, lg: { padding: "0.75rem 1.125rem" } };
var i9 = { color: "{primary.color}" };
var s6 = { width: "0.5rem" };
var g2 = { width: "1px", color: "{primary.color}" };
var p2 = { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", size: "0.75rem" };
var u = { size: "1.75rem" };
var b = { hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", selectedHoverColor: "{primary.color}", size: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var m = { inlineGap: "0.5rem", overlaySelect: { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" }, overlayPopover: { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", borderRadius: "{overlay.popover.border.radius}", color: "{overlay.popover.color}", shadow: "{overlay.popover.shadow}", padding: "{overlay.popover.padding}", gap: "0.5rem" }, rule: { borderColor: "{content.border.color}" }, constraintList: { padding: "{list.padding}", gap: "{list.gap}" }, constraint: { focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", separator: { borderColor: "{content.border.color}" }, padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" } };
var h2 = { borderColor: "{datatable.border.color}", borderWidth: "0 0 1px 0" };
var f3 = { borderColor: "{datatable.border.color}", borderWidth: "0 0 1px 0" };
var css = "\n    .p-datatable-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n";
var k = { root: o19, header: r19, headerCell: e17, columnTitle: t11, row: d7, bodyCell: c6, footerCell: l4, columnFooter: n8, footer: a11, dropPoint: i9, columnResizer: s6, resizeIndicator: g2, sortIcon: p2, loadingIcon: u, rowToggleButton: b, filter: m, paginatorTop: h2, paginatorBottom: f3, css };

// node_modules/@primeuix/themes/dist/aura/dataview/index.mjs
var o20 = { borderColor: "transparent", borderWidth: "0", borderRadius: "0", padding: "0" };
var r20 = { background: "{content.background}", color: "{content.color}", borderColor: "{content.border.color}", borderWidth: "0 0 1px 0", padding: "0.625rem 0.875rem", borderRadius: "0" };
var d8 = { background: "{content.background}", color: "{content.color}", borderColor: "transparent", borderWidth: "0", padding: "0", borderRadius: "0" };
var e18 = { background: "{content.background}", color: "{content.color}", borderColor: "{content.border.color}", borderWidth: "1px 0 0 0", padding: "0.625rem 0.875rem", borderRadius: "0" };
var t12 = { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" };
var n9 = { borderColor: "{content.border.color}", borderWidth: "1px 0 0 0" };
var c7 = { root: o20, header: r20, content: d8, footer: e18, paginatorTop: t12, paginatorBottom: n9 };

// node_modules/@primeuix/themes/dist/aura/datepicker/index.mjs
var o21 = { transitionDuration: "{transition.duration}" };
var r21 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.popover.shadow}", padding: "{overlay.popover.padding}" };
var e19 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", padding: "0 0 0.5rem 0" };
var t13 = { gap: "0.5rem", fontWeight: "500", fontSize: "{typography.font.size}" };
var n10 = { width: "2.25rem", sm: { width: "1.75rem" }, lg: { width: "2.625rem" }, background: "light-dark({surface.100}, {surface.800})", hoverBackground: "light-dark({surface.200}, {surface.700})", activeBackground: "light-dark({surface.300}, {surface.600})", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", color: "light-dark({surface.600}, {surface.300})", hoverColor: "light-dark({surface.700}, {surface.200})", activeColor: "light-dark({surface.800}, {surface.100})", borderRadius: "{form.field.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var d9 = { color: "{form.field.icon.color}" };
var c8 = { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}", fontWeight: "500", fontSize: "{typography.font.size}" };
var a12 = { hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}", fontWeight: "500", fontSize: "{typography.font.size}" };
var i10 = { borderColor: "{content.border.color}", gap: "{overlay.popover.padding}" };
var l5 = { margin: "0.5rem 0 0 0" };
var g3 = { padding: "0.25rem", fontWeight: "500", fontSize: "{typography.font.size}", color: "{content.color}" };
var s7 = { fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}", hoverBackground: "{content.hover.background}", selectedBackground: "{primary.color}", rangeSelectedBackground: "{highlight.background}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{primary.contrast.color}", rangeSelectedColor: "{highlight.color}", width: "1.75rem", height: "1.75rem", borderRadius: "50%", padding: "0.25rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var f4 = { margin: "0.5rem 0 0 0" };
var h3 = { padding: "0.25rem", borderRadius: "{content.border.radius}" };
var u2 = { margin: "0.5rem 0 0 0" };
var p3 = { padding: "0.25rem", borderRadius: "{content.border.radius}" };
var b2 = { padding: "0.5rem 0 0 0", borderColor: "{content.border.color}" };
var m2 = { padding: "0.5rem 0 0 0", borderColor: "{content.border.color}", gap: "0.5rem", buttonGap: "0.125rem", color: "{content.color}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var y = { background: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.900}, {surface.0})" };
var k2 = { root: o21, panel: r21, header: e19, title: t13, dropdown: n10, inputIcon: d9, selectMonth: c8, selectYear: a12, group: i10, dayView: l5, weekDay: g3, date: s7, monthView: f4, month: h3, yearView: u2, year: p3, buttonbar: b2, timePicker: m2, today: y };

// node_modules/@primeuix/themes/dist/aura/dialog/index.mjs
var o22 = { background: "{overlay.modal.background}", borderColor: "{overlay.modal.border.color}", color: "{overlay.modal.color}", borderRadius: "{overlay.modal.border.radius}", shadow: "{overlay.modal.shadow}" };
var a13 = { padding: "{overlay.modal.padding}", gap: "0.5rem" };
var d10 = { fontSize: "1.125rem", fontWeight: "600" };
var r22 = { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}" };
var l6 = { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}", gap: "0.375rem" };
var e20 = { root: o22, header: a13, title: d10, content: r22, footer: l6 };

// node_modules/@primeuix/themes/dist/aura/divider/index.mjs
var r23 = { borderColor: "{content.border.color}" };
var o23 = { background: "{content.background}", color: "{text.color}" };
var n11 = { margin: "0.875rem 0", padding: "0 0.875rem", content: { padding: "0 0.375rem" } };
var e21 = { margin: "0 0.875rem", padding: "0.375rem 0", content: { padding: "0.375rem 0" } };
var t14 = { root: r23, content: o23, horizontal: n11, vertical: e21 };

// node_modules/@primeuix/themes/dist/aura/dock/index.mjs
var r24 = { background: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.2)", padding: "0.5rem", borderRadius: "{border.radius.xl}" };
var o24 = { borderRadius: "{content.border.radius}", padding: "0.5rem", size: "2.625rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var d11 = { root: r24, item: o24 };

// node_modules/@primeuix/themes/dist/aura/drawer/index.mjs
var o25 = { background: "{overlay.modal.background}", borderColor: "{overlay.modal.border.color}", color: "{overlay.modal.color}", shadow: "{overlay.modal.shadow}" };
var a14 = { padding: "{overlay.modal.padding}" };
var d12 = { fontSize: "1.125rem", fontWeight: "600" };
var r25 = { padding: "0 {overlay.modal.padding} {overlay.modal.padding} {overlay.modal.padding}" };
var l7 = { padding: "{overlay.modal.padding}" };
var e22 = { root: o25, header: a14, title: d12, content: r25, footer: l7 };

// node_modules/@primeuix/themes/dist/aura/editor/index.mjs
var o26 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}" };
var r26 = { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" };
var e23 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}", padding: "{list.padding}" };
var t15 = { focusBackground: "{list.option.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" };
var d13 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" };
var l8 = { toolbar: o26, toolbarItem: r26, overlay: e23, overlayOption: t15, content: d13 };

// node_modules/@primeuix/themes/dist/aura/fieldset/index.mjs
var o27 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", padding: "0 1rem 1rem 1rem", transitionDuration: "{transition.duration}" };
var r27 = { background: "{content.background}", hoverBackground: "{content.hover.background}", color: "{content.color}", hoverColor: "{content.hover.color}", borderRadius: "{content.border.radius}", borderWidth: "1px", borderColor: "transparent", padding: ".375rem 0.625rem", gap: "0.5rem", fontWeight: "600", fontSize: "{typography.font.size}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var t16 = { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}" };
var n12 = { padding: "0" };
var e24 = { root: o27, legend: r27, toggleIcon: t16, content: n12 };

// node_modules/@primeuix/themes/dist/aura/fileupload/index.mjs
var r28 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", transitionDuration: "{transition.duration}" };
var o28 = { background: "transparent", color: "{text.color}", padding: "1rem", borderColor: "unset", borderWidth: "0", borderRadius: "0", gap: "0.5rem" };
var e25 = { highlightBorderColor: "{primary.color}", padding: "0 1rem 1rem 1rem", gap: "0.875rem" };
var t17 = { padding: "0.875rem", gap: "0.875rem", borderColor: "{content.border.color}", info: { gap: "0.125rem" } };
var n13 = { color: "{text.color}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var a15 = { color: "{text.muted.color}", fontWeight: "{typography.font.weight}", fontSize: "0.75rem" };
var i11 = { gap: "0.5rem" };
var d14 = { height: "0.25rem" };
var g4 = { gap: "0.5rem" };
var c9 = { root: r28, header: o28, content: e25, file: t17, fileName: n13, fileSize: a15, fileList: i11, progressbar: d14, basic: g4 };

// node_modules/@primeuix/themes/dist/aura/floatlabel/index.mjs
var o29 = { color: "{form.field.float.label.color}", focusColor: "{form.field.float.label.focus.color}", activeColor: "{form.field.float.label.active.color}", invalidColor: "{form.field.float.label.invalid.color}", transitionDuration: "0.2s", positionX: "{form.field.padding.x}", positionY: "{form.field.padding.y}", fontWeight: "{form.field.font.weight}", fontSize: "{form.field.font.size}", active: { fontSize: "0.625rem", fontWeight: "400" } };
var i12 = { active: { top: "-1.125rem" } };
var e26 = { input: { paddingTop: "1.125rem", paddingBottom: "{form.field.padding.y}" }, active: { top: "{form.field.padding.y}" } };
var r29 = { borderRadius: "{border.radius.xs}", active: { background: "{form.field.background}", padding: "0 0.125rem" } };
var f5 = { root: o29, over: i12, in: e26, on: r29 };

// node_modules/@primeuix/themes/dist/aura/galleria/index.mjs
var r30 = { borderWidth: "1px", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", transitionDuration: "{transition.duration}" };
var o30 = { background: "rgba(255, 255, 255, 0.1)", hoverBackground: "rgba(255, 255, 255, 0.2)", color: "{surface.100}", hoverColor: "{surface.0}", size: "2.625rem", gutter: "0.5rem", prev: { borderRadius: "50%" }, next: { borderRadius: "50%" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e27 = { size: "1.25rem" };
var s8 = { background: "{content.background}", padding: "0.875rem 0.25rem" };
var a16 = { size: "1.75rem", borderRadius: "{content.border.radius}", gutter: "0.5rem", hoverBackground: "light-dark({surface.100}, {surface.700})", color: "light-dark({surface.600}, {surface.400})", hoverColor: "light-dark({surface.700}, {surface.0})", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var t18 = { size: "0.875rem" };
var c10 = { background: "rgba(0, 0, 0, 0.5)", color: "{surface.100}", padding: "0.875rem" };
var n14 = { gap: "0.5rem", padding: "0.875rem" };
var i13 = { width: "0.875rem", height: "0.875rem", background: "light-dark({surface.200}, {surface.700})", hoverBackground: "light-dark({surface.300}, {surface.600})", activeBackground: "{primary.color}", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var u3 = { background: "rgba(0, 0, 0, 0.5)" };
var d15 = { background: "rgba(255, 255, 255, 0.4)", hoverBackground: "rgba(255, 255, 255, 0.6)", activeBackground: "rgba(255, 255, 255, 0.9)" };
var g5 = { size: "2.625rem", gutter: "0.5rem", background: "rgba(255, 255, 255, 0.1)", hoverBackground: "rgba(255, 255, 255, 0.2)", color: "{surface.50}", hoverColor: "{surface.0}", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var f6 = { size: "1.25rem" };
var l9 = { root: r30, navButton: o30, navIcon: e27, thumbnailsContent: s8, thumbnailNavButton: a16, thumbnailNavButtonIcon: t18, caption: c10, indicatorList: n14, indicatorButton: i13, insetIndicatorList: u3, insetIndicatorButton: d15, closeButton: g5, closeButtonIcon: f6 };

// node_modules/@primeuix/themes/dist/aura/gallery/index.mjs
var r31 = { background: "{surface.950}" };
var o31 = { padding: "0.75rem 1rem", background: "{surface.950}" };
var a17 = { padding: "0.25rem 0", background: "{surface.950}", borderColor: "{surface.800}" };
var e28 = { transitionDuration: "0.3s" };
var i14 = { size: "2.25rem", borderRadius: "50%", color: "{surface.400}", hoverBackground: "{surface.800}", hoverColor: "{surface.0}", disabledOpacity: "{disabled.opacity}", transitionDuration: "{transition.duration}", icon: { size: "1rem" } };
var n15 = { background: "color-mix(in srgb, {surface.800}, transparent 40%)", size: "2.25rem", borderRadius: "50%", color: "{surface.400}", hoverBackground: "{surface.800}", hoverColor: "{surface.0}", offset: "0.5rem", transitionDuration: "{transition.duration}", icon: { size: "1rem" } };
var t19 = { size: "5rem", padding: "0.25rem", background: "{surface.800}", borderRadius: "0.25rem", borderWidth: "3px", hoverBorderColor: "{surface.700}", activeBorderColor: "{primary.color}", activeScale: "0.85", transitionDuration: "{transition.duration}" };
var d16 = { padding: "0.25rem 0" };
var s9 = { backdrop: r31, header: o31, footer: a17, item: e28, action: i14, navigation: n15, thumbnail: t19, thumbnailContent: d16 };

// node_modules/@primeuix/themes/dist/aura/iconfield/index.mjs
var o32 = { color: "{form.field.icon.color}" };
var r32 = { icon: o32 };

// node_modules/@primeuix/themes/dist/aura/iftalabel/index.mjs
var o33 = { color: "{form.field.float.label.color}", focusColor: "{form.field.float.label.focus.color}", invalidColor: "{form.field.float.label.invalid.color}", transitionDuration: "0.2s", positionX: "{form.field.padding.x}", top: "{form.field.padding.y}", fontWeight: "{form.field.font.weight}", fontSize: "0.625rem" };
var i15 = { paddingTop: "1.125rem", paddingBottom: "{form.field.padding.y}" };
var l10 = { root: o33, input: i15 };

// node_modules/@primeuix/themes/dist/aura/image/index.mjs
var o34 = { transitionDuration: "{transition.duration}" };
var r33 = { icon: { size: "1.25rem" }, mask: { background: "{mask.background}", color: "{mask.color}" } };
var a18 = { position: { left: "auto", right: "1rem", top: "1rem", bottom: "auto" }, blur: "8px", background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", borderWidth: "1px", borderRadius: "30px", padding: ".5rem", gap: "0.5rem" };
var i16 = { hoverBackground: "rgba(255,255,255,0.1)", color: "{surface.50}", hoverColor: "{surface.0}", size: "2.625rem", iconSize: "1.25rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e29 = { root: o34, preview: r33, toolbar: a18, action: i16 };

// node_modules/@primeuix/themes/dist/aura/imagecompare/index.mjs
var o35 = { size: "15px", hoverSize: "30px", background: "rgba(255,255,255,0.3)", hoverBackground: "rgba(255,255,255,0.3)", borderColor: "unset", hoverBorderColor: "unset", borderWidth: "0", borderRadius: "50%", transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "rgba(255,255,255,0.3)", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var r34 = { handle: o35 };

// node_modules/@primeuix/themes/dist/aura/inlinemessage/index.mjs
var r35 = { padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{content.border.radius}", gap: "0.5rem" };
var o36 = { fontWeight: "500" };
var a19 = { size: "1rem" };
var e30 = { background: "light-dark(color-mix(in srgb, {blue.50}, transparent 5%), color-mix(in srgb, {blue.500}, transparent 84%))", borderColor: "light-dark({blue.200}, color-mix(in srgb, {blue.700}, transparent 64%))", color: "light-dark({blue.600}, {blue.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)" };
var n16 = { background: "light-dark(color-mix(in srgb, {green.50}, transparent 5%), color-mix(in srgb, {green.500}, transparent 84%))", borderColor: "light-dark({green.200}, color-mix(in srgb, {green.700}, transparent 64%))", color: "light-dark({green.600}, {green.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)" };
var l11 = { background: "light-dark(color-mix(in srgb, {yellow.50}, transparent 5%), color-mix(in srgb, {yellow.500}, transparent 84%))", borderColor: "light-dark({yellow.200}, color-mix(in srgb, {yellow.700}, transparent 64%))", color: "light-dark({yellow.600}, {yellow.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)" };
var i17 = { background: "light-dark(color-mix(in srgb, {red.50}, transparent 5%), color-mix(in srgb, {red.500}, transparent 84%))", borderColor: "light-dark({red.200}, color-mix(in srgb, {red.700}, transparent 64%))", color: "light-dark({red.600}, {red.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)" };
var s10 = { background: "light-dark({surface.100}, {surface.800})", borderColor: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.600}, {surface.300})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)" };
var t20 = { background: "light-dark({surface.900}, {surface.0})", borderColor: "light-dark({surface.950}, {surface.100})", color: "light-dark({surface.50}, {surface.950})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)" };
var d17 = { root: r35, text: o36, icon: a19, info: e30, success: n16, warn: l11, error: i17, secondary: s10, contrast: t20 };

// node_modules/@primeuix/themes/dist/aura/inplace/index.mjs
var o37 = { padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{transition.duration}" };
var r36 = { hoverBackground: "{content.hover.background}", hoverColor: "{content.hover.color}" };
var n17 = { root: o37, display: r36 };

// node_modules/@primeuix/themes/dist/aura/inputchips/index.mjs
var o38 = { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}" };
var r37 = { borderRadius: "{border.radius.sm}", focusBackground: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.800}, {surface.0})" };
var d18 = { root: o38, chip: r37 };

// node_modules/@primeuix/themes/dist/aura/inputcolor/index.mjs
var r38 = { borderColor: "{content.border.color}" };
var o39 = { borderRadius: "{content.border.radius}" };
var e31 = { borderRadius: "{content.border.radius}", size: "1rem" };
var d19 = { size: "1rem", borderColor: "#ffffff", borderWidth: "3px", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.08), 0px 1px 1px 0px rgba(0, 0, 0, 0.14)", transitionDuration: "{transition.duration}", focusRing: { borderWidth: "2px", borderColor: "#ffffff", outlineWidth: "2px", outlineColor: "rgba(255, 255, 255, 0.3)", outlineOffset: "2px" } };
var t21 = { color: "{surface.100}", background: "#ffffff", tileSize: "0.5rem" };
var i18 = { size: "2.25rem", borderRadius: "{content.border.radius}" };
var a20 = { root: r38, area: o39, slider: e31, handle: d19, transparencyGrid: t21, swatch: i18 };

// node_modules/@primeuix/themes/dist/aura/inputgroup/index.mjs
var o40 = { background: "{form.field.background}", borderColor: "{form.field.border.color}", color: "{form.field.icon.color}", borderRadius: "{form.field.border.radius}", padding: "0 0.5rem", minWidth: "2.25rem", fontWeight: "{form.field.font.weight}", fontSize: "{form.field.font.size}" };
var r39 = { addon: o40 };

// node_modules/@primeuix/themes/dist/aura/inputnumber/index.mjs
var r40 = { transitionDuration: "{transition.duration}" };
var o41 = { width: "2.25rem", borderRadius: "{form.field.border.radius}", verticalPadding: "{form.field.padding.y}", background: "transparent", hoverBackground: "light-dark({surface.100}, {surface.800})", activeBackground: "light-dark({surface.200}, {surface.700})", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.border.color}", activeBorderColor: "{form.field.border.color}", color: "{surface.400}", hoverColor: "light-dark({surface.500}, {surface.300})", activeColor: "light-dark({surface.600}, {surface.200})" };
var a21 = { root: r40, button: o41 };

// node_modules/@primeuix/themes/dist/aura/inputotp/index.mjs
var r41 = { gap: "0.5rem" };
var t22 = { width: "2.25rem", sm: { width: "1.75rem" }, lg: { width: "2.625rem" } };
var e32 = { root: r41, input: t22 };

// node_modules/@primeuix/themes/dist/aura/inputtags/index.mjs
var o42 = { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", gap: "0.25rem" };
var r42 = { borderRadius: "{form.field.border.radius}" };
var d20 = { root: o42, item: r42 };

// node_modules/@primeuix/themes/dist/aura/inputtext/index.mjs
var o43 = { fontSize: "{form.field.font.size}", fontWeight: "{form.field.font.weight}", background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } };
var d21 = { root: o43 };

// node_modules/@primeuix/themes/dist/aura/knob/index.mjs
var o44 = { transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var r43 = { background: "{primary.color}" };
var t23 = { background: "{content.border.color}" };
var n18 = { color: "{text.muted.color}", fontSize: "1.125rem", fontWeight: "normal" };
var i19 = { root: o44, value: r43, range: t23, text: n18 };

// node_modules/@primeuix/themes/dist/aura/label/index.mjs
var t24 = { gap: "0.375rem", fontSize: "{typography.font.size}", fontWeight: "500", textColor: "{text.color}", disabledOpacity: "{disabled.opacity}" };
var o45 = { root: t24 };

// node_modules/@primeuix/themes/dist/aura/listbox/index.mjs
var o46 = { background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", borderColor: "{form.field.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", shadow: "{form.field.shadow}", borderRadius: "{form.field.border.radius}", transitionDuration: "{form.field.transition.duration}" };
var i20 = { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "{list.header.padding}" } };
var t25 = { fontWeight: "{list.option.font.weight}", fontSize: "{list.option.font.size}", focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", selectedFontWeight: "{list.option.selected.font.weight}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", stripedBackground: "light-dark({surface.50}, {surface.900})" };
var r44 = { background: "{list.option.group.background}", color: "{list.option.group.color}", padding: "{list.option.group.padding}", fontWeight: "{list.option.group.font.weight}", fontSize: "{list.option.group.font.size}" };
var d22 = { color: "{list.option.color}", gutterStart: "-0.25rem", gutterEnd: "0.25rem" };
var e33 = { padding: "{list.option.padding}" };
var l12 = { root: o46, list: i20, option: t25, optionGroup: r44, checkmark: d22, emptyMessage: e33 };

// node_modules/@primeuix/themes/dist/aura/megamenu/index.mjs
var o47 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", verticalOrientation: { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" }, horizontalOrientation: { padding: "0.375rem 0.625rem", gap: "0.5rem" }, transitionDuration: "{navigation.item.transition.duration}" };
var n19 = { borderRadius: "{content.border.radius}", padding: "{navigation.item.padding}" };
var i21 = { focusBackground: "{navigation.item.focus.background}", activeBackground: "{navigation.item.active.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", activeColor: "{navigation.item.active.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var a22 = { padding: "0", background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", shadow: "{overlay.navigation.shadow}", gap: "0.5rem" };
var t26 = { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" };
var e34 = { padding: "{navigation.submenu.label.padding}", fontWeight: "{navigation.submenu.label.font.weight}", fontSize: "{navigation.submenu.label.font.size}", background: "{navigation.submenu.label.background}", color: "{navigation.submenu.label.color}" };
var r45 = { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" };
var c11 = { borderColor: "{content.border.color}" };
var g6 = { borderRadius: "50%", size: "1.5rem", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", hoverBackground: "{content.hover.background}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var d23 = { root: o47, baseItem: n19, item: i21, overlay: a22, submenu: t26, submenuLabel: e34, submenuIcon: r45, separator: c11, mobileButton: g6 };

// node_modules/@primeuix/themes/dist/aura/menu/index.mjs
var o48 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{navigation.item.transition.duration}" };
var n20 = { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" };
var i22 = { focusBackground: "{navigation.item.focus.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var a23 = { padding: "{navigation.submenu.label.padding}", fontWeight: "{navigation.submenu.label.font.weight}", fontSize: "{navigation.submenu.label.font.size}", background: "{navigation.submenu.label.background}", color: "{navigation.submenu.label.color}" };
var t27 = { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}" };
var e35 = { borderColor: "{content.border.color}" };
var r46 = { root: o48, list: n20, item: i22, submenuLabel: a23, submenuIcon: t27, separator: e35 };

// node_modules/@primeuix/themes/dist/aura/menubar/index.mjs
var o49 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", padding: "0.375rem 0.625rem", transitionDuration: "{navigation.item.transition.duration}" };
var i23 = { borderRadius: "{content.border.radius}", padding: "{navigation.item.padding}" };
var n21 = { focusBackground: "{navigation.item.focus.background}", activeBackground: "{navigation.item.active.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", activeColor: "{navigation.item.active.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var a24 = { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}", background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", mobileIndent: "0.875rem", icon: { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" } };
var t28 = { borderColor: "{content.border.color}" };
var r47 = { borderRadius: "50%", size: "1.5rem", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", hoverBackground: "{content.hover.background}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e36 = { root: o49, baseItem: i23, item: n21, submenu: a24, separator: t28, mobileButton: r47 };

// node_modules/@primeuix/themes/dist/aura/message/index.mjs
var r48 = { borderRadius: "{content.border.radius}", borderWidth: "1px", transitionDuration: "{transition.duration}" };
var o50 = { padding: "0.375rem 0.625rem", gap: "0.5rem", sm: { padding: "0.25rem 0.5rem" }, lg: { padding: "0.5rem 0.75rem" } };
var e37 = { fontSize: "{typography.font.size}", fontWeight: "500", sm: { fontSize: "0.75rem" }, lg: { fontSize: "1rem" } };
var l13 = { size: "1rem", sm: { size: "0.875rem" }, lg: { size: "1.125rem" } };
var a25 = { width: "1.5rem", height: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" } };
var n22 = { size: "0.875rem", sm: { size: "0.75rem" }, lg: { size: "1rem" } };
var t29 = { root: { borderWidth: "1px" } };
var i24 = { content: { padding: "0" } };
var s11 = { background: "light-dark(color-mix(in srgb, {blue.50}, transparent 5%), color-mix(in srgb, {blue.500}, transparent 84%))", borderColor: "light-dark({blue.200}, color-mix(in srgb, {blue.700}, transparent 64%))", color: "light-dark({blue.600}, {blue.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({blue.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({blue.600}, {blue.500})", shadow: "none" } }, outlined: { color: "light-dark({blue.600}, {blue.500})", borderColor: "light-dark({blue.600}, {blue.500})" }, simple: { color: "light-dark({blue.600}, {blue.500})" } };
var d24 = { background: "light-dark(color-mix(in srgb, {green.50}, transparent 5%), color-mix(in srgb, {green.500}, transparent 84%))", borderColor: "light-dark({green.200}, color-mix(in srgb, {green.700}, transparent 64%))", color: "light-dark({green.600}, {green.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({green.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({green.600}, {green.500})", shadow: "none" } }, outlined: { color: "light-dark({green.600}, {green.500})", borderColor: "light-dark({green.600}, {green.500})" }, simple: { color: "light-dark({green.600}, {green.500})" } };
var g7 = { background: "light-dark(color-mix(in srgb, {yellow.50}, transparent 5%), color-mix(in srgb, {yellow.500}, transparent 84%))", borderColor: "light-dark({yellow.200}, color-mix(in srgb, {yellow.700}, transparent 64%))", color: "light-dark({yellow.600}, {yellow.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({yellow.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({yellow.600}, {yellow.500})", shadow: "none" } }, outlined: { color: "light-dark({yellow.600}, {yellow.500})", borderColor: "light-dark({yellow.600}, {yellow.500})" }, simple: { color: "light-dark({yellow.600}, {yellow.500})" } };
var c12 = { background: "light-dark(color-mix(in srgb, {red.50}, transparent 5%), color-mix(in srgb, {red.500}, transparent 84%))", borderColor: "light-dark({red.200}, color-mix(in srgb, {red.700}, transparent 64%))", color: "light-dark({red.600}, {red.500})", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({red.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({red.600}, {red.500})", shadow: "none" } }, outlined: { color: "light-dark({red.600}, {red.500})", borderColor: "light-dark({red.600}, {red.500})" }, simple: { color: "light-dark({red.600}, {red.500})" } };
var u4 = { background: "light-dark({surface.100}, {surface.800})", borderColor: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.600}, {surface.300})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({surface.200}, {surface.700})", focusRing: { color: "light-dark({surface.600}, {surface.300})", shadow: "none" } }, outlined: { color: "light-dark({surface.500}, {surface.400})", borderColor: "light-dark({surface.500}, {surface.400})" }, simple: { color: "light-dark({surface.500}, {surface.400})" } };
var h4 = { background: "light-dark({surface.900}, {surface.0})", borderColor: "light-dark({surface.950}, {surface.100})", color: "light-dark({surface.50}, {surface.950})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "light-dark({surface.800}, {surface.100})", focusRing: { color: "light-dark({surface.50}, {surface.950})", shadow: "none" } }, outlined: { color: "light-dark({surface.950}, {surface.0})", borderColor: "light-dark({surface.950}, {surface.0})" }, simple: { color: "light-dark({surface.950}, {surface.0})" } };
var b3 = { root: r48, content: o50, text: e37, icon: l13, closeButton: a25, closeIcon: n22, outlined: t29, simple: i24, info: s11, success: d24, warn: g7, error: c12, secondary: u4, contrast: h4 };

// node_modules/@primeuix/themes/dist/aura/metergroup/index.mjs
var e38 = { borderRadius: "{content.border.radius}", gap: "0.875rem" };
var r49 = { background: "{content.border.color}", size: "0.375rem" };
var a26 = { gap: "0.375rem" };
var o51 = { size: "0.375rem" };
var t30 = { fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var l14 = { size: "0.875rem" };
var i25 = { verticalGap: "0.375rem", horizontalGap: "0.875rem" };
var n23 = { root: e38, meters: r49, label: a26, labelMarker: o51, labelText: t30, labelIcon: l14, labelList: i25 };

// node_modules/@primeuix/themes/dist/aura/multiselect/index.mjs
var o52 = { fontSize: "{form.field.font.size}", fontWeight: "{form.field.font.weight}", background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } };
var r50 = { width: "2.25rem", color: "{form.field.icon.color}" };
var d25 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" };
var i26 = { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "0.5rem 0.5rem 0.125rem 0.875rem" } };
var e39 = { fontSize: "{list.option.font.size}", fontWeight: "{list.option.font.weight}", focusBackground: "{list.option.focus.background}", selectedBackground: "transparent", selectedFocusBackground: "transparent", color: "{list.option.color}", focusColor: "{list.option.color}", selectedColor: "{list.option.color}", selectedFocusColor: "{list.option.color}", selectedFontWeight: "{list.option.selected.font.weight}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}", gap: "0.5rem" };
var l15 = { background: "{list.option.group.background}", color: "{list.option.group.color}", fontWeight: "{list.option.group.font.weight}", fontSize: "{list.option.group.font.size}", padding: "{list.option.group.padding}" };
var f7 = { color: "{form.field.icon.color}" };
var n24 = { borderRadius: "{border.radius.sm}" };
var t31 = { padding: "{list.option.padding}" };
var a27 = { root: o52, dropdown: r50, overlay: d25, list: i26, option: e39, optionGroup: l15, chip: n24, clearIcon: f7, emptyMessage: t31 };

// node_modules/@primeuix/themes/dist/aura/navigationmenu/index.mjs
var i27 = { padding: "0.375rem 0.625rem", gap: "0.25rem" };
var a28 = { padding: "{navigation.item.padding}", borderRadius: "{content.border.radius}", gap: "{navigation.item.gap}", fontSize: "{navigation.item.label.font.size}", fontWeight: "500", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", focusBackground: "{navigation.item.focus.background}", activeColor: "{navigation.item.active.color}", activeBackground: "{navigation.item.active.background}", transitionDuration: "{navigation.item.transition.duration}" };
var o53 = { root: i27, baseItem: a28 };

// node_modules/@primeuix/themes/dist/aura/orderlist/index.mjs
var r51 = { gap: "1rem" };
var a29 = { gap: "0.5rem" };
var o54 = { root: r51, controls: a29 };

// node_modules/@primeuix/themes/dist/aura/organizationchart/index.mjs
var o55 = { gutter: "0.625rem", transitionDuration: "{transition.duration}" };
var r52 = { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", borderColor: "{content.border.color}", color: "{content.color}", selectedColor: "{highlight.color}", hoverColor: "{content.hover.color}", padding: "0.625rem 0.875rem", toggleablePadding: "0.625rem 0.875rem 1.125rem 0.875rem", borderRadius: "{content.border.radius}", fontSize: "{typography.font.size}", fontWeight: "{typography.font.weight}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e40 = { background: "{content.background}", hoverBackground: "{content.hover.background}", borderColor: "{content.border.color}", color: "{text.muted.color}", hoverColor: "{text.color}", size: "1.25rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, icon: { size: "0.75rem" } };
var t32 = { color: "{content.border.color}", borderRadius: "{content.border.radius}", height: "24px" };
var n25 = { root: o55, node: r52, nodeToggleButton: e40, connector: t32 };

// node_modules/@primeuix/themes/dist/aura/overlaybadge/index.mjs
var o56 = { outline: { width: "2px", color: "{content.background}" } };
var t33 = { root: o56 };

// node_modules/@primeuix/themes/dist/aura/paginator/index.mjs
var o57 = { padding: "0.375rem 0.875rem", gap: "0.25rem", borderRadius: "{content.border.radius}", background: "{content.background}", color: "{content.color}", transitionDuration: "{transition.duration}" };
var t34 = { background: "transparent", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedColor: "{highlight.color}", width: "2.25rem", height: "2.25rem", borderRadius: "50%", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var r53 = { color: "{text.muted.color}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var e41 = { maxWidth: "2.25rem" };
var n26 = { root: o57, navButton: t34, currentPageReport: r53, jumpToPageInput: e41 };

// node_modules/@primeuix/themes/dist/aura/panel/index.mjs
var r54 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}" };
var o58 = { background: "transparent", color: "{text.color}", padding: "1rem", borderColor: "{content.border.color}", borderWidth: "0", borderRadius: "0" };
var e42 = { padding: "0.375rem 1rem" };
var t35 = { fontWeight: "600", fontSize: "{typography.font.size}" };
var d26 = { padding: "0 1rem 1rem 1rem" };
var n27 = { padding: "0 1rem 1rem 1rem" };
var a30 = { root: r54, header: o58, toggleableHeader: e42, title: t35, content: d26, footer: n27 };

// node_modules/@primeuix/themes/dist/aura/panelmenu/index.mjs
var o59 = { gap: "0.5rem", transitionDuration: "{navigation.item.transition.duration}" };
var i28 = { background: "{content.background}", borderColor: "{content.border.color}", borderWidth: "1px", color: "{content.color}", padding: "0.25rem 0.25rem", borderRadius: "{content.border.radius}", first: { borderWidth: "1px", topBorderRadius: "{content.border.radius}" }, last: { borderWidth: "1px", bottomBorderRadius: "{content.border.radius}" } };
var n28 = { focusBackground: "{navigation.item.focus.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", gap: "0.5rem", padding: "{navigation.item.padding}", borderRadius: "{content.border.radius}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var r55 = { indent: "1rem" };
var t36 = { color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}" };
var a31 = { root: o59, panel: i28, item: n28, submenu: r55, submenuIcon: t36 };

// node_modules/@primeuix/themes/dist/aura/password/index.mjs
var o60 = { background: "{content.border.color}", borderRadius: "{content.border.radius}", height: "0.625rem" };
var r56 = { color: "{form.field.icon.color}" };
var e43 = { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", borderRadius: "{overlay.popover.border.radius}", color: "{overlay.popover.color}", padding: "{overlay.popover.padding}", shadow: "{overlay.popover.shadow}" };
var a32 = { gap: "0.5rem" };
var d27 = { fontSize: "{typography.font.size}", fontWeight: "{typography.font.weight}" };
var t37 = { weakBackground: "light-dark({red.500}, {red.400})", mediumBackground: "light-dark({amber.500}, {amber.400})", strongBackground: "light-dark({green.500}, {green.400})" };
var n29 = { meter: o60, icon: r56, overlay: e43, content: a32, meterText: d27, strength: t37 };

// node_modules/@primeuix/themes/dist/aura/picklist/index.mjs
var r57 = { gap: "1rem" };
var a33 = { gap: "0.5rem" };
var o61 = { root: r57, controls: a33 };

// node_modules/@primeuix/themes/dist/aura/popover/index.mjs
var o62 = { background: "{overlay.popover.background}", borderColor: "{overlay.popover.border.color}", color: "{overlay.popover.color}", borderRadius: "{overlay.popover.border.radius}", shadow: "{overlay.popover.shadow}", gutter: "10px", arrowOffset: "1.125rem" };
var r58 = { padding: "{overlay.popover.padding}" };
var e44 = { root: o62, content: r58 };

// node_modules/@primeuix/themes/dist/aura/progressbar/index.mjs
var r59 = { background: "{content.border.color}", borderRadius: "{content.border.radius}", height: "1.125rem" };
var o63 = { background: "{primary.color}" };
var e45 = { color: "{primary.contrast.color}", fontSize: "0.625rem", fontWeight: "600" };
var t38 = { root: r59, value: o63, label: e45 };

// node_modules/@primeuix/themes/dist/aura/progressspinner/index.mjs
var r60 = { colorOne: "light-dark({red.500}, {red.400})", colorTwo: "light-dark({blue.500}, {blue.400})", colorThree: "light-dark({green.500}, {green.400})", colorFour: "light-dark({yellow.500}, {yellow.400})" };
var e46 = { root: r60 };

// node_modules/@primeuix/themes/dist/aura/radiobutton/index.mjs
var o64 = { width: "1.125rem", height: "1.125rem", background: "{form.field.background}", checkedBackground: "{primary.color}", checkedHoverBackground: "{primary.hover.color}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.border.color}", checkedBorderColor: "{primary.color}", checkedHoverBorderColor: "{primary.hover.color}", checkedFocusBorderColor: "{primary.color}", checkedDisabledBorderColor: "{form.field.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { width: "0.875rem", height: "0.875rem" }, lg: { width: "1.25rem", height: "1.25rem" } };
var r61 = { size: "0.625rem", checkedColor: "{primary.contrast.color}", checkedHoverColor: "{primary.contrast.color}", disabledColor: "{form.field.disabled.color}", sm: { size: "0.5rem" }, lg: { size: "0.75rem" } };
var e47 = { root: o64, icon: r61 };

// node_modules/@primeuix/themes/dist/aura/rating/index.mjs
var o65 = { gap: "0.25rem", transitionDuration: "{transition.duration}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var r62 = { size: "1rem", color: "{text.muted.color}", hoverColor: "{primary.color}", activeColor: "{primary.color}" };
var i29 = { root: o65, icon: r62 };

// node_modules/@primeuix/themes/dist/aura/ripple/index.mjs
var a34 = { background: "light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.3))" };
var r63 = { root: a34 };

// node_modules/@primeuix/themes/dist/aura/scrollarea/index.mjs
var o66 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var r64 = { padding: "1rem" };
var n30 = { background: "transparent", margin: "0.25rem", size: "0.25rem", transitionDuration: "{transition.duration}" };
var t39 = { background: "{content.border.color}" };
var e48 = { fadeSize: "40px" };
var a35 = { root: o66, viewport: r64, scrollbar: n30, handle: t39, mask: e48 };

// node_modules/@primeuix/themes/dist/aura/scrollpanel/index.mjs
var o67 = { transitionDuration: "{transition.duration}" };
var r65 = { size: "9px", borderRadius: "{border.radius.sm}", background: "light-dark({surface.100}, {surface.800})", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var s12 = { root: o67, bar: r65 };

// node_modules/@primeuix/themes/dist/aura/select/index.mjs
var o68 = { fontSize: "{form.field.font.size}", fontWeight: "{form.field.font.weight}", background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } };
var r66 = { width: "2.25rem", color: "{form.field.icon.color}" };
var d28 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" };
var i30 = { padding: "{list.padding}", gap: "{list.gap}", header: { padding: "{list.header.padding}" } };
var e49 = { fontSize: "{list.option.font.size}", fontWeight: "{list.option.font.weight}", focusBackground: "{list.option.focus.background}", selectedBackground: "{list.option.selected.background}", selectedFocusBackground: "{list.option.selected.focus.background}", color: "{list.option.color}", focusColor: "{list.option.focus.color}", selectedColor: "{list.option.selected.color}", selectedFocusColor: "{list.option.selected.focus.color}", selectedFontWeight: "{list.option.selected.font.weight}", padding: "{list.option.padding}", borderRadius: "{list.option.border.radius}" };
var l16 = { background: "{list.option.group.background}", color: "{list.option.group.color}", fontWeight: "{list.option.group.font.weight}", fontSize: "{list.option.group.font.size}", padding: "{list.option.group.padding}" };
var f8 = { color: "{form.field.icon.color}" };
var t40 = { color: "{list.option.color}", gutterStart: "-0.25rem", gutterEnd: "0.25rem" };
var n31 = { padding: "{list.option.padding}" };
var c13 = { root: o68, dropdown: r66, overlay: d28, list: i30, option: e49, optionGroup: l16, clearIcon: f8, checkmark: t40, emptyMessage: n31 };

// node_modules/@primeuix/themes/dist/aura/selectbutton/index.mjs
var r67 = { borderRadius: "{form.field.border.radius}", invalidBorderColor: "{form.field.invalid.border.color}" };
var o69 = { root: r67 };

// node_modules/@primeuix/themes/dist/aura/sidebar/index.mjs
var o70 = { borderColor: "{content.border.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var i31 = { background: "light-dark({surface.50}, {surface.900})" };
var n32 = { padding: "0.5rem", gap: "0.5rem" };
var r68 = { padding: "0.5rem", gap: "0.5rem" };
var e50 = { background: "{content.background}", color: "{content.color}", floatingBorderRadius: "{content.border.radius}", floatingShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" };
var a36 = { gap: "0.125rem" };
var t41 = { padding: "0.5rem" };
var c14 = { padding: "0.5rem" };
var g8 = { padding: "0 0.5rem", height: "2rem", borderRadius: "{content.border.radius}", fontSize: "0.75rem", fontWeight: "500", color: "{text.muted.color}" };
var d29 = { top: "0.875rem", right: "0.75rem", size: "1.25rem", borderRadius: "{content.border.radius}", color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", focusBackground: "{navigation.item.focus.background}", icon: { size: "{navigation.item.icon.size}" } };
var u5 = { gap: "{navigation.list.gap}" };
var m3 = { padding: "0.25rem 0.625rem", gap: "{navigation.item.gap}", height: "2rem", borderRadius: "{navigation.item.border.radius}", fontSize: "{navigation.item.label.font.size}", fontWeight: "{navigation.item.label.font.weight}", color: "{navigation.item.color}", focusBackground: "{navigation.item.focus.background}", focusColor: "{navigation.item.focus.color}", activeBackground: "{navigation.item.active.background}", activeColor: "{navigation.item.active.color}", iconOnlyWidth: "2rem", withActionPaddingEnd: "2rem", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", size: "{navigation.item.icon.size}" } };
var s13 = { top: "0.375rem", right: "0.25rem", width: "1.25rem", borderRadius: "{content.border.radius}", color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", focusBackground: "{navigation.item.focus.background}", icon: { size: "{navigation.item.icon.size}" } };
var l17 = { top: "0.375rem", right: "0.25rem", height: "1.25rem", minWidth: "1.25rem", borderRadius: "0.375rem", padding: "0 0.25rem", fontSize: "0.75rem", fontWeight: "500", background: "{content.hover.background}", borderColor: "{content.border.color}", color: "{text.muted.color}" };
var f9 = { paddingBlock: "0.125rem", gap: "0.125rem", indentMargin: "0.875rem", indentPadding: "0.625rem", collapsibleIndent: "1.5rem", collapsibleTopMargin: "0.125rem", collapsibleBorderRadius: "0.375rem" };
var v2 = { padding: "{navigation.item.padding}", gap: "{navigation.item.gap}", height: "2rem", borderRadius: "{navigation.item.border.radius}", fontSize: "{navigation.item.label.font.size}", fontWeight: "{navigation.item.label.font.weight}", color: "{navigation.item.color}", focusBackground: "{navigation.item.focus.background}", focusColor: "{navigation.item.focus.color}", activeBackground: "{navigation.item.active.background}", activeColor: "{navigation.item.active.color}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", size: "{navigation.item.icon.size}" } };
var b4 = { background: "light-dark({surface.50}, {surface.900})", floatingBackground: "light-dark({surface.50}, {surface.900})", insetBackground: "light-dark({surface.0}, {surface.950})", margin: "0.5rem", borderRadius: "{content.border.radius}", shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" };
var p4 = { root: o70, layout: i31, header: n32, footer: r68, content: a36, aside: t41, panel: e50, group: c14, groupLabel: g8, groupAction: d29, menu: u5, menuButton: m3, menuAction: s13, menuBadge: l17, menuSub: f9, menuSubButton: v2, main: b4 };

// node_modules/@primeuix/themes/dist/aura/skeleton/index.mjs
var r69 = { borderRadius: "{content.border.radius}", background: "light-dark({surface.200}, rgba(255, 255, 255, 0.06))", animationBackground: "light-dark(rgba(255,255,255,0.4), rgba(255, 255, 255, 0.04))" };
var a37 = { root: r69 };

// node_modules/@primeuix/themes/dist/aura/slider/index.mjs
var o71 = { transitionDuration: "{transition.duration}" };
var r70 = { background: "{content.border.color}", borderRadius: "{content.border.radius}", size: "3px" };
var n33 = { background: "{primary.color}" };
var t42 = { width: "20px", height: "20px", borderRadius: "50%", background: "{content.border.color}", hoverBackground: "{content.border.color}", content: { borderRadius: "50%", background: "light-dark({surface.0}, {surface.950})", hoverBackground: "{content.background}", width: "16px", height: "16px", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.08), 0px 1px 1px 0px rgba(0, 0, 0, 0.14)" }, focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var a38 = { root: o71, track: r70, range: n33, handle: t42 };

// node_modules/@primeuix/themes/dist/aura/speeddial/index.mjs
var t43 = { gap: "0.5rem", transitionDuration: "{transition.duration}" };
var a39 = { root: t43 };

// node_modules/@primeuix/themes/dist/aura/splitbutton/index.mjs
var r71 = { borderRadius: "{form.field.border.radius}", roundedBorderRadius: "2rem", raisedShadow: "0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)" };
var d30 = { root: r71 };

// node_modules/@primeuix/themes/dist/aura/splitter/index.mjs
var o72 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", transitionDuration: "{transition.duration}" };
var r72 = { background: "{content.border.color}" };
var n34 = { size: "24px", background: "transparent", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var t44 = { root: o72, gutter: r72, handle: n34 };

// node_modules/@primeuix/themes/dist/aura/stepper/index.mjs
var o73 = { transitionDuration: "{transition.duration}" };
var r73 = { background: "{content.border.color}", activeBackground: "{primary.color}", margin: "0 0 0 1.375rem", size: "2px" };
var e51 = { padding: "0.375rem", gap: "0.875rem" };
var t45 = { padding: "0", borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, gap: "0.5rem" };
var n35 = { color: "{text.muted.color}", activeColor: "{primary.color}", fontWeight: "500", fontSize: "{typography.font.size}" };
var a40 = { background: "{content.background}", activeBackground: "{content.background}", borderColor: "{content.border.color}", activeBorderColor: "{content.border.color}", color: "{text.muted.color}", activeColor: "{primary.color}", size: "2rem", fontSize: "1rem", fontWeight: "500", borderRadius: "50%", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" };
var c15 = { padding: "0.75rem 0.375rem 1rem 0.375rem" };
var i32 = { background: "{content.background}", color: "{content.color}", padding: "0", indent: "0.875rem" };
var d31 = { root: o73, separator: r73, step: e51, stepHeader: t45, stepTitle: n35, stepNumber: a40, steppanels: c15, steppanel: i32 };

// node_modules/@primeuix/themes/dist/aura/steps/index.mjs
var o74 = { transitionDuration: "{transition.duration}" };
var r74 = { background: "{content.border.color}" };
var t46 = { borderRadius: "{content.border.radius}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, gap: "0.5rem" };
var e52 = { color: "{text.muted.color}", activeColor: "{primary.color}", fontWeight: "500" };
var n36 = { background: "{content.background}", activeBackground: "{content.background}", borderColor: "{content.border.color}", activeBorderColor: "{content.border.color}", color: "{text.muted.color}", activeColor: "{primary.color}", size: "2rem", fontSize: "1.143rem", fontWeight: "500", borderRadius: "50%", shadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" };
var c16 = { root: o74, separator: r74, itemLink: t46, itemLabel: e52, itemNumber: n36 };

// node_modules/@primeuix/themes/dist/aura/tabmenu/index.mjs
var o75 = { transitionDuration: "{transition.duration}" };
var r75 = { borderWidth: "0 0 1px 0", background: "{content.background}", borderColor: "{content.border.color}" };
var t47 = { background: "transparent", hoverBackground: "transparent", activeBackground: "transparent", borderWidth: "0 0 1px 0", borderColor: "{content.border.color}", hoverBorderColor: "{content.border.color}", activeBorderColor: "{primary.color}", color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}", padding: "1rem 1.125rem", fontWeight: "600", margin: "0 0 -1px 0", gap: "0.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var e53 = { color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" };
var c17 = { height: "1px", bottom: "-1px", background: "{primary.color}" };
var n37 = { root: o75, tablist: r75, item: t47, itemIcon: e53, activeBar: c17 };

// node_modules/@primeuix/themes/dist/aura/tabs/index.mjs
var o76 = { transitionDuration: "{transition.duration}" };
var r76 = { borderWidth: "0 0 1px 0", background: "{content.background}", borderColor: "{content.border.color}" };
var t48 = { background: "transparent", hoverBackground: "transparent", activeBackground: "transparent", borderWidth: "0", borderColor: "transparent", hoverBorderColor: "transparent", activeBorderColor: "transparent", color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}", padding: "0.875rem 1rem", fontWeight: "600", fontSize: "{typography.font.size}", margin: "0", gap: "0.5rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } };
var n38 = { background: "{content.background}", color: "{content.color}", padding: "0.75rem 1rem 1rem 1rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "inset {focus.ring.shadow}" } };
var e54 = { background: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", width: "2.25rem", shadow: "0px 0px 10px 50px light-dark(rgba(255, 255, 255, 0.6), color-mix(in srgb, {content.background}, transparent 50%))", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } };
var a41 = { height: "1px", bottom: "0", background: "{primary.color}" };
var c18 = { root: o76, tablist: r76, tab: t48, tabpanel: n38, navButton: e54, activeBar: a41 };

// node_modules/@primeuix/themes/dist/aura/tabview/index.mjs
var o77 = { transitionDuration: "{transition.duration}" };
var r77 = { background: "{content.background}", borderColor: "{content.border.color}" };
var t49 = { borderColor: "{content.border.color}", activeBorderColor: "{primary.color}", color: "{text.muted.color}", hoverColor: "{text.color}", activeColor: "{primary.color}" };
var n39 = { background: "{content.background}", color: "{content.color}" };
var c19 = { background: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", shadow: "0px 0px 10px 50px light-dark(rgba(255, 255, 255, 0.6), color-mix(in srgb, {content.background}, transparent 50%))" };
var a42 = { root: o77, tabList: r77, tab: t49, tabPanel: n39, navButton: c19 };

// node_modules/@primeuix/themes/dist/aura/tag/index.mjs
var r78 = { fontSize: "0.75rem", fontWeight: "700", padding: "0.125rem 0.375rem", gap: "0.25rem", borderRadius: "{content.border.radius}", roundedBorderRadius: "{border.radius.xl}" };
var a43 = { size: "0.625rem" };
var o78 = { background: "light-dark({primary.100}, color-mix(in srgb, {primary.500}, transparent 84%))", color: "light-dark({primary.700}, {primary.300})" };
var e55 = { background: "light-dark({surface.100}, {surface.800})", color: "light-dark({surface.600}, {surface.300})" };
var n40 = { background: "light-dark({green.100}, color-mix(in srgb, {green.500}, transparent 84%))", color: "light-dark({green.700}, {green.300})" };
var d32 = { background: "light-dark({sky.100}, color-mix(in srgb, {sky.500}, transparent 84%))", color: "light-dark({sky.700}, {sky.300})" };
var i33 = { background: "light-dark({orange.100}, color-mix(in srgb, {orange.500}, transparent 84%))", color: "light-dark({orange.700}, {orange.300})" };
var g9 = { background: "light-dark({red.100}, color-mix(in srgb, {red.500}, transparent 84%))", color: "light-dark({red.700}, {red.300})" };
var t50 = { background: "light-dark({surface.950}, {surface.0})", color: "light-dark({surface.0}, {surface.950})" };
var c20 = { root: r78, icon: a43, primary: o78, secondary: e55, success: n40, info: d32, warn: i33, danger: g9, contrast: t50 };

// node_modules/@primeuix/themes/dist/aura/terminal/index.mjs
var o79 = { background: "{form.field.background}", borderColor: "{form.field.border.color}", color: "{form.field.color}", height: "16rem", padding: "{form.field.padding.y} {form.field.padding.x}", borderRadius: "{form.field.border.radius}", fontWeight: "{typography.font.weight}", fontSize: "{typography.font.size}" };
var r79 = { gap: "0.25rem" };
var d33 = { margin: "2px 0" };
var e56 = { root: o79, prompt: r79, commandResponse: d33 };

// node_modules/@primeuix/themes/dist/aura/textarea/index.mjs
var o80 = { fontSize: "{form.field.font.size}", fontWeight: "{form.field.font.weight}", background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } };
var d34 = { root: o80 };

// node_modules/@primeuix/themes/dist/aura/tieredmenu/index.mjs
var o81 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{content.color}", borderRadius: "{content.border.radius}", shadow: "{overlay.navigation.shadow}", transitionDuration: "{navigation.item.transition.duration}" };
var i34 = { padding: "{navigation.list.padding}", gap: "{navigation.list.gap}" };
var n41 = { focusBackground: "{navigation.item.focus.background}", activeBackground: "{navigation.item.active.background}", color: "{navigation.item.color}", focusColor: "{navigation.item.focus.color}", activeColor: "{navigation.item.active.color}", padding: "{navigation.item.padding}", borderRadius: "{navigation.item.border.radius}", gap: "{navigation.item.gap}", icon: { color: "{navigation.item.icon.color}", focusColor: "{navigation.item.icon.focus.color}", activeColor: "{navigation.item.icon.active.color}", size: "{navigation.item.icon.size}" }, label: { fontWeight: "{navigation.item.label.font.weight}", fontSize: "{navigation.item.label.font.size}" } };
var a44 = { mobileIndent: "0.875rem" };
var t51 = { size: "{navigation.submenu.icon.size}", color: "{navigation.submenu.icon.color}", focusColor: "{navigation.submenu.icon.focus.color}", activeColor: "{navigation.submenu.icon.active.color}" };
var e57 = { borderColor: "{content.border.color}" };
var r80 = { root: o81, list: i34, item: n41, submenu: a44, submenuIcon: t51, separator: e57 };

// node_modules/@primeuix/themes/dist/aura/timeline/index.mjs
var e58 = { minHeight: "4.5rem" };
var r81 = { eventContent: { padding: "0.875rem 0" } };
var o82 = { eventContent: { padding: "0 0.875rem" } };
var n42 = { size: "1rem", borderRadius: "50%", borderWidth: "2px", background: "{content.background}", borderColor: "{content.border.color}", content: { borderRadius: "50%", size: "0.375rem", background: "{primary.color}", insetShadow: "0px 0.5px 0px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.12)" } };
var t52 = { color: "{content.border.color}", size: "2px" };
var d35 = { event: e58, horizontal: r81, vertical: o82, eventMarker: n42, eventConnector: t52 };

// node_modules/@primeuix/themes/dist/aura/toast/index.mjs
var r82 = { width: "22rem", borderRadius: "{content.border.radius}", borderWidth: "1px", transitionDuration: "0.3s", blur: "10px", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var o83 = { size: "1rem", margin: "1px 0 0 0" };
var e59 = { padding: "{overlay.popover.padding}", gap: "0.5rem" };
var a45 = { gap: "0.25rem" };
var n43 = { fontWeight: "500", fontSize: "{typography.font.size}" };
var t53 = { fontWeight: "500", fontSize: "0.75rem" };
var l18 = { width: "1.5rem", height: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", offset: "{focus.ring.offset}" } };
var s14 = { size: "0.875rem" };
var c21 = { background: "{content.background}", borderColor: "{content.border.color}", color: "{text.color}", detailColor: "{text.muted.color}", shadow: "{overlay.popover.shadow}", closeButton: { hoverBackground: "{content.hover.background}", focusRing: { color: "{focus.ring.color}", shadow: "none" } } };
var i35 = { background: "light-dark(color-mix(in srgb, {blue.50}, transparent 5%), color-mix(in srgb, {blue.500}, transparent 84%))", borderColor: "light-dark({blue.200}, color-mix(in srgb, {blue.700}, transparent 64%))", color: "light-dark({blue.600}, {blue.500})", detailColor: "light-dark({surface.700}, {surface.0})", shadow: "0px 4px 8px 0px color-mix(in srgb, {blue.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({blue.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({blue.600}, {blue.500})", shadow: "none" } } };
var d36 = { background: "light-dark(color-mix(in srgb, {green.50}, transparent 5%), color-mix(in srgb, {green.500}, transparent 84%))", borderColor: "light-dark({green.200}, color-mix(in srgb, {green.700}, transparent 64%))", color: "light-dark({green.600}, {green.500})", detailColor: "light-dark({surface.700}, {surface.0})", shadow: "0px 4px 8px 0px color-mix(in srgb, {green.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({green.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({green.600}, {green.500})", shadow: "none" } } };
var g10 = { background: "light-dark(color-mix(in srgb, {yellow.50}, transparent 5%), color-mix(in srgb, {yellow.500}, transparent 84%))", borderColor: "light-dark({yellow.200}, color-mix(in srgb, {yellow.700}, transparent 64%))", color: "light-dark({yellow.600}, {yellow.500})", detailColor: "light-dark({surface.700}, {surface.0})", shadow: "0px 4px 8px 0px color-mix(in srgb, {yellow.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({yellow.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({yellow.600}, {yellow.500})", shadow: "none" } } };
var u6 = { background: "light-dark(color-mix(in srgb, {red.50}, transparent 5%), color-mix(in srgb, {red.500}, transparent 84%))", borderColor: "light-dark({red.200}, color-mix(in srgb, {red.700}, transparent 64%))", color: "light-dark({red.600}, {red.500})", detailColor: "light-dark({surface.700}, {surface.0})", shadow: "0px 4px 8px 0px color-mix(in srgb, {red.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({red.100}, rgba(255, 255, 255, 0.05))", focusRing: { color: "light-dark({red.600}, {red.500})", shadow: "none" } } };
var h5 = { background: "light-dark({surface.100}, {surface.800})", borderColor: "light-dark({surface.200}, {surface.700})", color: "light-dark({surface.600}, {surface.300})", detailColor: "light-dark({surface.700}, {surface.0})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.500}, transparent 96%)", closeButton: { hoverBackground: "light-dark({surface.200}, {surface.700})", focusRing: { color: "light-dark({surface.600}, {surface.300})", shadow: "none" } } };
var f10 = { background: "light-dark({surface.900}, {surface.0})", borderColor: "light-dark({surface.950}, {surface.100})", color: "light-dark({surface.50}, {surface.950})", detailColor: "light-dark({surface.0}, {surface.950})", shadow: "0px 4px 8px 0px color-mix(in srgb, {surface.950}, transparent 96%)", closeButton: { hoverBackground: "light-dark({surface.800}, {surface.100})", focusRing: { color: "light-dark({surface.50}, {surface.950})", shadow: "none" } } };
var p5 = { root: r82, icon: o83, content: e59, text: a45, summary: n43, detail: t53, closeButton: l18, closeIcon: s14, normal: c21, info: i35, success: d36, warn: g10, error: u6, secondary: h5, contrast: f10 };

// node_modules/@primeuix/themes/dist/aura/togglebutton/index.mjs
var r83 = { padding: "0.25rem", borderRadius: "{content.border.radius}", gap: "0.5rem", fontWeight: "500", fontSize: "{form.field.font.size}", background: "light-dark({surface.100}, {surface.950})", checkedBackground: "light-dark({surface.100}, {surface.950})", hoverBackground: "light-dark({surface.100}, {surface.950})", borderColor: "light-dark({surface.100}, {surface.950})", color: "light-dark({surface.500}, {surface.400})", hoverColor: "light-dark({surface.700}, {surface.300})", checkedColor: "light-dark({surface.900}, {surface.0})", checkedBorderColor: "light-dark({surface.100}, {surface.950})", disabledBackground: "{form.field.disabled.background}", disabledBorderColor: "{form.field.disabled.background}", disabledColor: "{form.field.disabled.color}", invalidBorderColor: "{form.field.invalid.border.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", padding: "0.25rem" }, lg: { fontSize: "{form.field.lg.font.size}", padding: "0.25rem" } };
var e60 = { color: "light-dark({surface.500}, {surface.400})", hoverColor: "light-dark({surface.700}, {surface.300})", checkedColor: "light-dark({surface.900}, {surface.0})", disabledColor: "{form.field.disabled.color}" };
var o84 = { padding: "0.125rem 0.625rem", borderRadius: "{content.border.radius}", checkedBackground: "light-dark({surface.0}, {surface.800})", checkedShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.02), 0px 1px 2px 0px rgba(0, 0, 0, 0.04)", sm: { padding: "0.125rem 0.625rem" }, lg: { padding: "0.125rem 0.625rem" } };
var d37 = { root: r83, icon: e60, content: o84 };

// node_modules/@primeuix/themes/dist/aura/toggleswitch/index.mjs
var r84 = { width: "2.25rem", height: "1.375rem", borderRadius: "30px", gap: "0.25rem", shadow: "{form.field.shadow}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" }, borderWidth: "1px", borderColor: "transparent", hoverBorderColor: "transparent", checkedBorderColor: "transparent", checkedHoverBorderColor: "transparent", invalidBorderColor: "{form.field.invalid.border.color}", transitionDuration: "{form.field.transition.duration}", slideDuration: "0.2s", background: "light-dark({surface.300}, {surface.700})", disabledBackground: "light-dark({form.field.disabled.background}, {surface.600})", hoverBackground: "light-dark({surface.400}, {surface.600})", checkedBackground: "{primary.color}", checkedHoverBackground: "{primary.hover.color}" };
var o85 = { borderRadius: "50%", size: "0.875rem", background: "light-dark({surface.0}, {surface.400})", disabledBackground: "light-dark({form.field.disabled.color}, {surface.900})", hoverBackground: "light-dark({surface.0}, {surface.300})", checkedBackground: "light-dark({surface.0}, {surface.900})", checkedHoverBackground: "light-dark({surface.0}, {surface.900})", color: "light-dark({text.muted.color}, {surface.900})", hoverColor: "light-dark({text.color}, {surface.800})", checkedColor: "{primary.color}", checkedHoverColor: "{primary.hover.color}" };
var e61 = { root: r84, handle: o85 };

// node_modules/@primeuix/themes/dist/aura/toolbar/index.mjs
var o86 = { background: "{content.background}", borderColor: "{content.border.color}", borderRadius: "{content.border.radius}", color: "{content.color}", gap: "0.5rem", padding: "0.625rem" };
var r85 = { root: o86 };

// node_modules/@primeuix/themes/dist/aura/tooltip/index.mjs
var r86 = { maxWidth: "12.5rem", gutter: "0.25rem", shadow: "{overlay.popover.shadow}", padding: "0.375rem 0.625rem", borderRadius: "{overlay.popover.border.radius}", fontWeight: "{typography.font.weight}", fontSize: "0.75rem", background: "{surface.700}", color: "{surface.0}" };
var o87 = { root: r86 };

// node_modules/@primeuix/themes/dist/aura/tree/index.mjs
var o88 = { background: "{content.background}", color: "{content.color}", padding: "0.875rem", gap: "2px", indent: "0.875rem", transitionDuration: "0s" };
var e62 = { padding: "0.25rem 0.5rem", borderRadius: "{content.border.radius}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{text.color}", hoverColor: "{text.hover.color}", selectedColor: "{highlight.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" }, gap: "0.375rem" };
var r87 = { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedColor: "{highlight.color}" };
var t54 = { fontWeight: "{typography.font.weight}", selectedFontWeight: "{list.option.selected.font.weight}", fontSize: "{typography.font.size}" };
var n44 = { borderRadius: "50%", size: "1.5rem", hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", selectedHoverColor: "{primary.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var c22 = { size: "1.75rem" };
var d38 = { margin: "0 0 0.5rem 0" };
var css2 = "\n    .p-tree-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n";
var l19 = { root: o88, node: e62, nodeIcon: r87, nodeLabel: t54, nodeToggleButton: n44, loadingIcon: c22, filter: d38, css: css2 };

// node_modules/@primeuix/themes/dist/aura/treeselect/index.mjs
var o89 = { fontSize: "{form.field.font.size}", fontWeight: "{form.field.font.weight}", background: "{form.field.background}", disabledBackground: "{form.field.disabled.background}", filledBackground: "{form.field.filled.background}", filledHoverBackground: "{form.field.filled.hover.background}", filledFocusBackground: "{form.field.filled.focus.background}", borderColor: "{form.field.border.color}", hoverBorderColor: "{form.field.hover.border.color}", focusBorderColor: "{form.field.focus.border.color}", invalidBorderColor: "{form.field.invalid.border.color}", color: "{form.field.color}", disabledColor: "{form.field.disabled.color}", placeholderColor: "{form.field.placeholder.color}", invalidPlaceholderColor: "{form.field.invalid.placeholder.color}", shadow: "{form.field.shadow}", paddingX: "{form.field.padding.x}", paddingY: "{form.field.padding.y}", borderRadius: "{form.field.border.radius}", focusRing: { width: "{form.field.focus.ring.width}", style: "{form.field.focus.ring.style}", color: "{form.field.focus.ring.color}", offset: "{form.field.focus.ring.offset}", shadow: "{form.field.focus.ring.shadow}" }, transitionDuration: "{form.field.transition.duration}", sm: { fontSize: "{form.field.sm.font.size}", paddingX: "{form.field.sm.padding.x}", paddingY: "{form.field.sm.padding.y}" }, lg: { fontSize: "{form.field.lg.font.size}", paddingX: "{form.field.lg.padding.x}", paddingY: "{form.field.lg.padding.y}" } };
var r88 = { width: "2.25rem", color: "{form.field.icon.color}" };
var d39 = { background: "{overlay.select.background}", borderColor: "{overlay.select.border.color}", borderRadius: "{overlay.select.border.radius}", color: "{overlay.select.color}", shadow: "{overlay.select.shadow}" };
var e63 = { padding: "{list.padding}" };
var l20 = { padding: "{list.option.padding}" };
var i36 = { borderRadius: "{border.radius.sm}" };
var f11 = { color: "{form.field.icon.color}" };
var a46 = { root: o89, dropdown: r88, overlay: d39, tree: e63, emptyMessage: l20, chip: i36, clearIcon: f11 };

// node_modules/@primeuix/themes/dist/aura/treetable/index.mjs
var o90 = { transitionDuration: "0s", borderColor: "light-dark({content.border.color}, {surface.800})" };
var r89 = { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.5rem 0.875rem" };
var e64 = { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", borderColor: "{treetable.border.color}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", gap: "0.5rem", padding: "0.5rem 0.875rem", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } };
var t55 = { fontWeight: "600", fontSize: "{typography.font.size}" };
var c23 = { background: "{content.background}", hoverBackground: "{content.hover.background}", selectedBackground: "{highlight.background}", color: "{content.color}", hoverColor: "{content.hover.color}", selectedColor: "{highlight.color}", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "-1px", shadow: "{focus.ring.shadow}" } };
var n45 = { borderColor: "{treetable.border.color}", padding: "0.5rem 0.875rem", gap: "0.5rem", fontWeight: "{typography.font.size}", fontSize: "{typography.font.size}", selectedBorderColor: "light-dark({primary.100}, {primary.900})" };
var d40 = { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", padding: "0.5rem 0.875rem" };
var l21 = { fontWeight: "600", fontSize: "{typography.font.size}" };
var a47 = { background: "{content.background}", borderColor: "{treetable.border.color}", color: "{content.color}", borderWidth: "0 0 1px 0", padding: "0.5rem 0.875rem" };
var i37 = { width: "0.5rem" };
var g11 = { width: "1px", color: "{primary.color}" };
var s15 = { color: "{text.muted.color}", hoverColor: "{text.hover.muted.color}", size: "0.75rem" };
var h6 = { size: "1.75rem" };
var u7 = { hoverBackground: "{content.hover.background}", selectedHoverBackground: "{content.background}", color: "{text.muted.color}", hoverColor: "{text.color}", selectedHoverColor: "{primary.color}", size: "1.5rem", borderRadius: "50%", focusRing: { width: "{focus.ring.width}", style: "{focus.ring.style}", color: "{focus.ring.color}", offset: "{focus.ring.offset}", shadow: "{focus.ring.shadow}" } };
var b5 = { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" };
var f12 = { borderColor: "{content.border.color}", borderWidth: "0 0 1px 0" };
var css3 = "\n    .p-treetable-mask.p-overlay-mask {\n        --px-mask-background: light-dark(rgba(255,255,255,0.5),rgba(0,0,0,0.3));\n    }\n";
var p6 = { root: o90, header: r89, headerCell: e64, columnTitle: t55, row: c23, bodyCell: n45, footerCell: d40, columnFooter: l21, footer: a47, columnResizer: i37, resizeIndicator: g11, sortIcon: s15, loadingIcon: h6, nodeToggleButton: u7, paginatorTop: b5, paginatorBottom: f12, css: css3 };

// node_modules/@primeuix/themes/dist/aura/virtualscroller/index.mjs
var o91 = { mask: { background: "{content.background}", color: "{text.muted.color}" }, icon: { size: "1.75rem" } };
var e65 = { loader: o91 };

// node_modules/@primeuix/themes/dist/aura/index.mjs
var r90 = Object.defineProperty;
var e66 = Object.defineProperties;
var m4 = Object.getOwnPropertyDescriptors;
var i38 = Object.getOwnPropertySymbols;
var t56 = Object.prototype.hasOwnProperty;
var a48 = Object.prototype.propertyIsEnumerable;
var o92 = (e67, m5, i39) => m5 in e67 ? r90(e67, m5, { enumerable: true, configurable: true, writable: true, value: i39 }) : e67[m5] = i39;
var Zr;
var $r = (Zr = ((r91, e67) => {
  for (var m5 in e67 || (e67 = {})) t56.call(e67, m5) && o92(r91, m5, e67[m5]);
  if (i38) for (var m5 of i38(e67)) a48.call(e67, m5) && o92(r91, m5, e67[m5]);
  return r91;
})({}, a2), e66(Zr, m4({ components: { accordion: c, autocomplete: s2, avatar: n, badge: l2, blockui: o5, breadcrumb: n3, button: d3, card: n4, carousel: t7, cascadeselect: f2, checkbox: e9, chip: s4, colorpicker: s5, commandmenu: c4, compare: n6, confirmdialog: r16, confirmpopup: d6, contextmenu: c5, datatable: k, dataview: c7, datepicker: k2, dialog: e20, divider: t14, dock: d11, drawer: e22, editor: l8, fieldset: e24, fileupload: c9, floatlabel: f5, galleria: l9, gallery: s9, iconfield: r32, iftalabel: l10, image: e29, imagecompare: r34, inlinemessage: d17, inplace: n17, inputchips: d18, inputcolor: a20, inputgroup: r39, inputnumber: a21, inputotp: e32, inputtags: d20, inputtext: d21, knob: i19, label: o45, listbox: l12, megamenu: d23, menu: r46, menubar: e36, message: b3, metergroup: n23, multiselect: a27, navigationmenu: o53, orderlist: o54, organizationchart: n25, overlaybadge: t33, paginator: n26, panel: a30, panelmenu: a31, password: n29, picklist: o61, popover: e44, progressbar: t38, progressspinner: e46, radiobutton: e47, rating: i29, ripple: r63, scrollarea: a35, scrollpanel: s12, select: c13, selectbutton: o69, sidebar: p4, skeleton: a37, slider: a38, speeddial: a39, splitbutton: d30, splitter: t44, stepper: d31, steps: c16, tabmenu: n37, tabs: c18, tabview: a42, tag: c20, terminal: e56, textarea: d34, tieredmenu: r80, timeline: d35, toast: p5, togglebutton: d37, toggleswitch: e61, toolbar: r85, tooltip: o87, tree: l19, treeselect: a46, treetable: p6, virtualscroller: e65 }, css: a10 })));

// projects/ui-smartcontact/src/lib/theme/sc-preset/base.ts
var families = {
  red: "red",
  sky: "sky",
  blue: "blue",
  slate: "slate",
  zinc: "zinc",
  // `amber` ya no lo referencia nada nuestro (0 `{amber.N}` en el repo tras mover
  // warn a yellow), pero se queda: esto alimenta el bloque `primitive` del preset y
  // Aura puede resolver `{amber.N}` por dentro. Borrarlo ahorra una rampa de
  // custom properties y arriesga un slot de PrimeNG que no podemos enumerar.
  amber: "amber",
  green: "green",
  purple: "purple",
  orange: "yellow",
  yellow: "yellow"
};
var STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
var ramp = (scToken) => Object.fromEntries(STEPS.map((step) => [step, `var(--sc-color-${scToken}-${step})`]));
var surface = {
  0: "var(--sc-color-slate-0)",
  ...ramp("slate")
};
var surfaceDark = {
  0: "var(--sc-color-slate-0)",
  ...ramp("zinc")
};
var primaryScheme = {
  color: "var(--sc-bg-primary)",
  contrastColor: "var(--sc-text-on-primary)",
  hoverColor: "var(--sc-bg-primary-hover)",
  activeColor: "var(--sc-bg-primary-active)"
};
var textScheme = {
  color: "var(--sc-text-primary)",
  mutedColor: "var(--sc-text-secondary)"
};
var contentScheme = {
  background: "var(--sc-bg-surface)",
  hoverBackground: "var(--sc-bg-secondary-hover)",
  borderColor: "var(--sc-border-default)",
  color: "var(--sc-text-primary)"
};
var overlayScheme = {
  modal: {
    background: "var(--sc-bg-surface)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  },
  popover: {
    background: "var(--sc-bg-surface)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  },
  select: {
    background: "var(--sc-bg-elevated)",
    borderColor: "var(--sc-border-default)",
    color: "var(--sc-text-primary)"
  }
};
var listScheme = {
  option: {
    icon: {
      color: "var(--sc-icon-subtle)",
      focusColor: "var(--sc-text-secondary)"
    },
    color: "{text.color}",
    focusColor: "{text.hover.color}",
    selectedColor: "{highlight.color}",
    focusBackground: "var(--sc-bg-secondary-hover)",
    selectedBackground: "{highlight.background}",
    selectedFocusColor: "{highlight.focus.color}",
    selectedFocusBackground: "{highlight.focus.background}"
  },
  optionGroup: {
    color: "{text.muted.color}",
    background: "transparent"
  }
};
var navigationScheme = {
  item: {
    icon: {
      color: "var(--sc-icon-subtle)",
      focusColor: "var(--sc-text-secondary)",
      activeColor: "var(--sc-text-secondary)"
    },
    color: "{text.color}",
    focusColor: "{text.hover.color}",
    activeColor: "{text.hover.color}",
    focusBackground: "var(--sc-bg-secondary-hover)",
    activeBackground: "var(--sc-bg-secondary-hover)"
  },
  submenuIcon: {
    color: "var(--sc-icon-subtle)",
    focusColor: "var(--sc-text-secondary)",
    activeColor: "var(--sc-text-secondary)"
  },
  submenuLabel: {
    color: "{text.muted.color}",
    background: "transparent"
  }
};
var formFieldScheme = {
  color: "var(--sc-text-primary)",
  iconColor: "var(--sc-icon-subtle)",
  disabledBackground: "var(--sc-bg-disabled)",
  disabledColor: "var(--sc-text-disabled)",
  placeholderColor: "var(--sc-text-subtle)",
  focusBorderColor: "var(--sc-bg-primary)",
  invalidPlaceholderColor: "var(--sc-text-danger)",
  floatLabelColor: "var(--sc-text-subtle)",
  floatLabelFocusColor: "var(--sc-text-subtle)",
  floatLabelActiveColor: "var(--sc-text-subtle)",
  floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
  shadow: "var(--sc-cmp-form-field-shadow)"
};
var base_default = {
  primitive: {
    ...Object.fromEntries(Object.entries(families).map(([kit, sc]) => [kit, ramp(sc)])),
    borderRadius: {
      none: "0",
      xs: "var(--sc-radius-xs)",
      sm: "var(--sc-radius-sm)",
      md: "var(--sc-radius-md)",
      lg: "var(--sc-radius-lg)",
      xl: "var(--sc-radius-xl)"
    }
  },
  semantic: {
    primary: ramp("blue"),
    iconSize: "var(--sc-cmp-icon-size)",
    /*
     * `lineHeight: 'inherit'` DEVUELVE LA HERENCIA que había antes de Aura (2026-09-13).
     * PrimeNG pone en la raíz de TODOS sus componentes
     * `.p-component { line-height: var(--p-typography-line-height) }`. Sin Aura esa variable
     * no existía, el valor salía inválido y cada componente heredaba el de su página. Aura
     * la define a `1.5`, que en el Supervisor no se nota (su body ya va a 1.5) pero en sc-docs
     * movió 15 componentes de 20px a 21px, medido por `component-styles`.
     * Cómo funciona: `inherit` en una variable declarada en `:root` no tiene de quién
     * heredar, así que la variable queda sin valor y `var()` vuelve a ser inválido, que es
     * justo el estado de antes. Los tamaños de letra de Aura SÍ se quedan: esos arreglaban
     * menús y desplegables que se abrían a 16px en el `<body>`.
     */
    typography: {
      lineHeight: "inherit"
    },
    focusRing: {
      // Divergencia consciente vs Kit (navy, width 1): sky-500 más ancho por
      // contraste a11y — customs-catalog §1.1.
      color: "var(--sc-border-focus)",
      style: "solid",
      width: "var(--sc-focus-ring-width)",
      offset: "var(--sc-focus-ring-offset)",
      shadow: "none"
    },
    disabledOpacity: "0.6",
    transitionDuration: "var(--sc-transition-base)",
    anchorGutter: "0.142857rem",
    content: {
      borderRadius: "{border.radius.md}"
    },
    list: {
      gap: "0.142857rem",
      padding: "var(--sc-scale-0-25)",
      header: {
        padding: "var(--sc-scale-0-5) var(--sc-scale-1) var(--sc-scale-0-25)"
      },
      option: {
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
        borderRadius: "{border.radius.sm}"
      },
      optionGroup: {
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
        fontWeight: "600"
      }
    },
    overlay: {
      modal: {
        padding: "var(--sc-cmp-overlay-modal-padding)",
        borderRadius: "var(--sc-cmp-overlay-modal-border-radius)",
        shadow: "var(--sc-cmp-overlay-modal-shadow)"
      },
      popover: {
        padding: "var(--sc-cmp-overlay-popover-padding)",
        borderRadius: "var(--sc-cmp-overlay-popover-border-radius)",
        shadow: "var(--sc-cmp-overlay-popover-shadow)"
      },
      select: {
        borderRadius: "var(--sc-cmp-overlay-select-border-radius)",
        shadow: "var(--sc-cmp-overlay-select-shadow)"
      },
      navigation: {
        shadow: "var(--sc-cmp-overlay-navigation-shadow)"
      }
    },
    formField: {
      // Padding 10/6 + sm/lg 1:1 del export del Kit (valores de Aura desde DD-81) (form.field.*) — los
      // tokens de escala caen exactos. Aplica a todos los form fields PrimeNG.
      paddingX: "var(--sc-cmp-form-field-padding-x)",
      paddingY: "var(--sc-cmp-form-field-padding-y)",
      sm: {
        fontSize: "var(--sc-cmp-form-field-sm-font-size)",
        paddingX: "var(--sc-cmp-form-field-sm-padding-x)",
        paddingY: "var(--sc-cmp-form-field-sm-padding-y)"
      },
      lg: {
        fontSize: "var(--sc-cmp-form-field-lg-font-size)",
        paddingX: "var(--sc-cmp-form-field-lg-padding-x)",
        paddingY: "var(--sc-cmp-form-field-lg-padding-y)"
      },
      borderRadius: "var(--sc-cmp-form-field-border-radius)",
      transitionDuration: "var(--sc-transition-base)",
      shadow: "var(--sc-cmp-form-field-shadow)"
    },
    navigation: {
      item: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
        borderRadius: "{border.radius.sm}"
      },
      list: {
        gap: "0.142857rem",
        padding: "var(--sc-scale-0-25)"
      },
      submenuIcon: {
        size: "var(--sc-scale-0-875)"
      },
      submenuLabel: {
        padding: "var(--sc-scale-0-5) var(--sc-scale-0-75)",
        fontWeight: "600"
      }
    },
    colorScheme: {
      light: {
        surface,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          background: "var(--sc-bg-surface)"
        },
        highlight: {
          color: "{primary.700}",
          background: "{primary.50}",
          focusColor: "{primary.800}",
          focusBackground: "{primary.100}"
        }
      },
      dark: {
        surface: surfaceDark,
        primary: primaryScheme,
        text: textScheme,
        content: contentScheme,
        overlay: overlayScheme,
        list: listScheme,
        navigation: navigationScheme,
        formField: {
          ...formFieldScheme,
          // Inputs "embebidos" en dark: mismo fondo que el lienzo (frame
          // 9795:26786 del Kit), no un paso más claro.
          background: "var(--sc-bg-default)"
        },
        // Sin token semántico propio: receta de Aura (el primario oscuro translúcido
        // al 16 % y al 24 %). Hasta DD-81 era esmeralda-400, copiado tal cual del
        // verde de Aura: los seleccionados en oscuro salían verdes. Ahora cuelga del
        // primario, que en oscuro es sky-300.
        highlight: {
          color: "color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)",
          background: "color-mix(in srgb, var(--sc-bg-primary) 16%, transparent)",
          focusColor: "color-mix(in srgb, var(--sc-color-slate-0) 87%, transparent)",
          focusBackground: "color-mix(in srgb, var(--sc-bg-primary) 24%, transparent)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tag.ts
var tag_default = {
  icon: {
    size: "var(--sc-cmp-tag-icon-size)"
  },
  root: {
    gap: "var(--sc-cmp-tag-gap)",
    /* `tag/padding/y` = scale/0-125 (1.75) y `tag/padding/x` = scale/0-5 (7) en el
     * maestro del Kit (DS › ❖ Tag, set 373:13337, leído el 2026-09-13). Aquí ponía
     * 0-25 (3.5): el tag medía 25 de alto contra los 21.5 del Kit. */
    padding: "var(--sc-cmp-tag-padding-y) var(--sc-cmp-tag-padding-x)",
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "700",
    borderRadius: "{content.border.radius}",
    roundedBorderRadius: "{border.radius.xl}"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-tag-info-color)",
        background: "#0ea5e929"
      },
      warn: {
        color: "var(--sc-cmp-tag-warn-color)",
        background: "var(--sc-cmp-tag-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-tag-danger-color)",
        background: "var(--sc-cmp-tag-danger-background)"
      },
      primary: {
        color: "var(--sc-cmp-tag-primary-color)",
        background: "var(--sc-cmp-tag-primary-background)"
      },
      success: {
        color: "var(--sc-cmp-tag-success-color)",
        background: "var(--sc-cmp-tag-success-background)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-tag-contrast-background)"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-tag-info-color)",
        background: "var(--sc-cmp-tag-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-tag-warn-color)",
        background: "var(--sc-cmp-tag-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-tag-danger-color)",
        background: "var(--sc-cmp-tag-danger-background)"
      },
      primary: {
        color: "{primary.700}",
        background: "{primary.100}"
      },
      success: {
        color: "var(--sc-cmp-tag-success-color)",
        background: "var(--sc-cmp-tag-success-background)"
      },
      contrast: {
        color: "var(--sc-cmp-tag-contrast-color)",
        background: "var(--sc-cmp-tag-contrast-background)"
      },
      secondary: {
        color: "var(--sc-cmp-tag-secondary-color)",
        background: "var(--sc-cmp-tag-secondary-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/card.ts
var card_default = {
  body: {
    gap: "var(--sc-scale-0-5)",
    padding: "var(--sc-cmp-card-body-padding)"
  },
  root: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-card-shadow)",
    background: "{content.background}",
    borderRadius: "{border.radius.xl}"
  },
  title: {
    fontSize: "var(--sc-font-size-400)",
    fontWeight: "500"
  },
  caption: {
    gap: "var(--sc-cmp-card-caption-gap)"
  },
  /* `fontSize: "1em"` = el de la tarjeta, como antes de Aura (2026-09-13). El Kit no le
   * da tamaño al subtítulo; Aura sí (`1rem`, 16px) y un valor propio le gana al heredado:
   * medido en la página de `sc-card` de sc-docs, el subtítulo creció y descuadró la
   * captura. Misma receta que título, mes y año de `datepicker.ts`. */
  subtitle: {
    fontSize: "1em",
    color: "{text.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/chip.ts
var chip_default = {
  icon: {
    size: "var(--sc-cmp-chip-icon-size)"
  },
  root: {
    gap: "var(--sc-cmp-chip-gap)",
    paddingX: "var(--sc-cmp-chip-padding-x)",
    paddingY: "var(--sc-cmp-chip-padding-y)",
    borderRadius: "var(--sc-cmp-chip-border-radius)",
    transitionDuration: "{transition.duration}"
  },
  image: {
    width: "var(--sc-cmp-chip-image-width)",
    height: "var(--sc-cmp-chip-image-height)"
  },
  removeIcon: {
    size: "var(--sc-cmp-chip-remove-icon-size)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    }
  },
  colorScheme: {
    dark: {
      icon: {
        color: "var(--sc-cmp-chip-icon-color)"
      },
      root: {
        color: "{surface.0}",
        background: "{surface.800}"
      },
      removeIcon: {
        color: "var(--sc-cmp-chip-remove-icon-color)"
      }
    },
    light: {
      icon: {
        color: "var(--sc-cmp-chip-icon-color)"
      },
      root: {
        color: "{surface.800}",
        background: "{surface.100}"
      },
      removeIcon: {
        color: "var(--sc-cmp-chip-remove-icon-color)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dock.ts
var dock_default = {
  item: {
    size: "var(--sc-cmp-dock-item-size)",
    padding: "var(--sc-cmp-dock-item-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  root: {
    padding: "var(--sc-cmp-dock-padding)",
    background: "#ffffff1a",
    borderColor: "#ffffff33",
    borderRadius: "{border.radius.xl}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/knob.ts
var knob_default = {
  root: {
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    transitionDuration: "{transition.duration}"
  },
  text: {
    color: "{text.muted.color}"
  },
  range: {
    background: "{content.border.color}"
  },
  value: {
    background: "{primary.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/menu.ts
var menu_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}"
    },
    color: "{navigation.item.color}",
    padding: "{navigation.item.padding}",
    focusColor: "{navigation.item.focus.color}",
    borderRadius: "{navigation.item.border.radius}",
    focusBackground: "{navigation.item.focus.background}"
  },
  list: {
    gap: "{navigation.list.gap}",
    padding: "{navigation.list.padding}"
  },
  root: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-menu-shadow)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  submenuLabel: {
    color: "{navigation.submenu.label.color}",
    padding: "{navigation.submenu.label.padding}",
    background: "{navigation.submenu.label.background}",
    fontWeight: "{navigation.submenu.label.font.weight}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tabs.ts
var tabs_default = {
  tab: {
    gap: "var(--sc-cmp-tabs-tab-gap)",
    color: "{text.muted.color}",
    margin: "0 0 -0.071429rem 0",
    padding: "var(--sc-cmp-tabs-tab-padding-y) var(--sc-cmp-tabs-tab-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "#00000000",
    fontWeight: "600",
    hoverColor: "{text.color}",
    activeColor: "{primary.color}",
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    hoverBackground: "#00000000",
    activeBackground: "#00000000",
    hoverBorderColor: "{content.border.color}",
    activeBorderColor: "{primary.color}"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  tablist: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  },
  tabpanel: {
    color: "{content.color}",
    padding: "var(--sc-cmp-tabs-tabpanel-padding-top) var(--sc-cmp-tabs-tabpanel-padding-right) var(--sc-cmp-tabs-tabpanel-padding-bottom) var(--sc-cmp-tabs-tabpanel-padding-left)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}"
  },
  activeBar: {
    bottom: "-0.071429rem",
    height: "0.071429rem",
    background: "{primary.color}"
  },
  navButton: {
    color: "{text.muted.color}",
    width: "var(--sc-cmp-tabs-nav-button-width)",
    shadow: "var(--sc-cmp-tabs-nav-button-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{text.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tree.ts
var tree_default = {
  node: {
    gap: "var(--sc-cmp-tree-node-gap)",
    color: "{text.color}",
    padding: "var(--sc-cmp-tree-node-padding-y) var(--sc-cmp-tree-node-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    hoverColor: "{text.hover.color}",
    borderRadius: "{content.border.radius}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  root: {
    gap: "0.142857rem",
    color: "{content.color}",
    indent: "var(--sc-cmp-tree-indent)",
    padding: "var(--sc-cmp-tree-padding)",
    background: "{content.background}",
    transitionDuration: "{transition.duration}"
  },
  filter: {
    margin: "var(--sc-cmp-tree-filter-margin)"
  },
  nodeIcon: {
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}",
    selectedColor: "{highlight.color}"
  },
  loadingIcon: {
    size: "var(--sc-cmp-tree-loading-icon-size)"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-tree-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-tree-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}",
    selectedHoverColor: "{primary.color}",
    selectedHoverBackground: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/badge.ts
var badge_default = {
  lg: {
    height: "var(--sc-cmp-badge-lg-height)",
    fontSize: "var(--sc-cmp-badge-lg-font-size)",
    minWidth: "var(--sc-cmp-badge-lg-min-width)"
  },
  sm: {
    height: "var(--sc-cmp-badge-sm-height)",
    fontSize: "var(--sc-cmp-badge-sm-font-size)",
    minWidth: "var(--sc-cmp-badge-sm-min-width)"
  },
  xl: {
    height: "var(--sc-cmp-badge-xl-height)",
    fontSize: "var(--sc-cmp-badge-xl-font-size)",
    minWidth: "var(--sc-cmp-badge-xl-min-width)"
  },
  dot: {
    size: "var(--sc-cmp-badge-dot-size)"
  },
  root: {
    height: "var(--sc-cmp-badge-height)",
    padding: "var(--sc-cmp-badge-padding-y) var(--sc-cmp-badge-padding-x)",
    fontSize: "var(--sc-cmp-badge-font-size)",
    minWidth: "var(--sc-cmp-badge-min-width)",
    fontWeight: "700",
    borderRadius: "{border.radius.md}"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-badge-info-color)",
        background: "var(--sc-cmp-badge-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-badge-warn-color)",
        background: "var(--sc-cmp-badge-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-badge-danger-color)",
        background: "var(--sc-cmp-badge-danger-background)"
      },
      primary: {
        color: "{primary.contrast.color}",
        background: "{primary.color}"
      },
      success: {
        color: "{green.950}",
        background: "var(--sc-cmp-badge-success-background)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-badge-contrast-background)"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-badge-info-color)",
        background: "var(--sc-cmp-badge-info-background)"
      },
      warn: {
        color: "var(--sc-cmp-badge-warn-color)",
        background: "var(--sc-cmp-badge-warn-background)"
      },
      danger: {
        color: "var(--sc-cmp-badge-danger-color)",
        background: "var(--sc-cmp-badge-danger-background)"
      },
      primary: {
        color: "{primary.contrast.color}",
        background: "{primary.color}"
      },
      success: {
        color: "var(--sc-cmp-badge-success-color)",
        background: "var(--sc-cmp-badge-success-background)"
      },
      contrast: {
        color: "var(--sc-cmp-badge-contrast-color)",
        background: "var(--sc-cmp-badge-contrast-background)"
      },
      secondary: {
        color: "var(--sc-cmp-badge-secondary-color)",
        background: "var(--sc-cmp-badge-secondary-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/image.ts
var image_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  action: {
    size: "var(--sc-cmp-image-action-size)",
    color: "{surface.50}",
    iconSize: "var(--sc-cmp-image-action-icon-size)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{surface.0}",
    borderRadius: "var(--sc-cmp-image-action-border-radius)",
    hoverBackground: "#ffffff1a"
  },
  preview: {
    icon: {
      size: "var(--sc-cmp-image-preview-icon-size)"
    },
    mask: {
      color: "{mask.color}",
      background: "{mask.background}"
    }
  },
  toolbar: {
    gap: "var(--sc-cmp-image-toolbar-gap)",
    blur: "0.571429rem",
    padding: "var(--sc-cmp-image-toolbar-padding)",
    position: {
      top: "var(--sc-cmp-image-toolbar-position-top)",
      left: "auto",
      right: "var(--sc-cmp-image-toolbar-position-right)",
      bottom: "auto"
    },
    background: "#ffffff1a",
    borderColor: "#ffffff33",
    borderWidth: "0.071429rem",
    borderRadius: "2.142857rem"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/panel.ts
var panel_default = {
  root: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  title: {
    fontWeight: "600"
  },
  footer: {
    padding: "var(--sc-cmp-panel-footer-padding-top) var(--sc-cmp-panel-footer-padding-right) var(--sc-cmp-panel-footer-padding-bottom) var(--sc-cmp-panel-footer-padding-left)"
  },
  header: {
    color: "{text.color}",
    padding: "var(--sc-cmp-panel-header-padding)",
    background: "#00000000",
    borderColor: "{content.border.color}",
    borderWidth: "0",
    borderRadius: "0"
  },
  content: {
    padding: "var(--sc-cmp-panel-content-padding-top) var(--sc-cmp-panel-content-padding-right) var(--sc-cmp-panel-content-padding-bottom) var(--sc-cmp-panel-content-padding-left)"
  },
  toggleableHeader: {
    padding: "var(--sc-cmp-panel-toggleable-header-padding-y) var(--sc-cmp-panel-toggleable-header-padding-x)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toast.ts
var toast_default = {
  icon: {
    size: "var(--sc-cmp-toast-icon-size)"
  },
  info: {
    shadow: "var(--sc-cmp-toast-info-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  root: {
    width: "var(--sc-cmp-toast-width)",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}"
  },
  text: {
    gap: "var(--sc-cmp-toast-text-gap)"
  },
  warn: {
    shadow: "var(--sc-cmp-toast-warn-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  error: {
    shadow: "var(--sc-cmp-toast-error-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  detail: {
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "500"
  },
  content: {
    gap: "var(--sc-cmp-toast-content-gap)",
    padding: "{overlay.popover.padding}"
  },
  success: {
    shadow: "var(--sc-cmp-toast-success-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  summary: {
    fontSize: "var(--sc-scale-1)",
    fontWeight: "500"
  },
  contrast: {
    shadow: "var(--sc-cmp-toast-contrast-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  closeIcon: {
    size: "var(--sc-cmp-toast-close-icon-size)"
  },
  secondary: {
    shadow: "var(--sc-cmp-toast-secondary-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  closeButton: {
    width: "var(--sc-cmp-toast-close-button-width)",
    height: "var(--sc-cmp-toast-close-button-height)",
    focusRing: {
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}"
    },
    borderRadius: "var(--sc-cmp-toast-close-button-border-radius)"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-toast-info-color)",
        background: "var(--sc-cmp-toast-info-background)",
        borderColor: "var(--sc-cmp-toast-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-info-detail-color)"
      },
      root: {
        blur: "0.714286rem"
      },
      warn: {
        color: "var(--sc-cmp-toast-warn-color)",
        background: "var(--sc-cmp-toast-warn-background)",
        borderColor: "var(--sc-cmp-toast-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-warn-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-warn-detail-color)"
      },
      error: {
        color: "var(--sc-cmp-toast-error-color)",
        background: "var(--sc-cmp-toast-error-background)",
        borderColor: "var(--sc-cmp-toast-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-error-detail-color)"
      },
      success: {
        color: "var(--sc-cmp-toast-success-color)",
        background: "var(--sc-cmp-toast-success-background)",
        borderColor: "var(--sc-cmp-toast-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-success-detail-color)"
      },
      contrast: {
        color: "{surface.950}",
        background: "var(--sc-cmp-toast-contrast-background)",
        borderColor: "{surface.100}",
        closeButton: {
          focusRing: {
            color: "{surface.950}"
          },
          hoverBackground: "{surface.100}"
        },
        detailColor: "{surface.950}"
      },
      secondary: {
        color: "{surface.300}",
        background: "{surface.800}",
        borderColor: "{surface.700}",
        closeButton: {
          focusRing: {
            color: "{surface.300}"
          },
          hoverBackground: "{surface.700}"
        },
        detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-toast-info-color)",
        background: "var(--sc-cmp-toast-info-background)",
        borderColor: "var(--sc-cmp-toast-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-info-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-info-detail-color)"
      },
      root: {
        blur: "0.107143rem"
      },
      warn: {
        color: "var(--sc-cmp-toast-warn-color)",
        background: "var(--sc-cmp-toast-warn-background)",
        borderColor: "var(--sc-cmp-toast-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-warn-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-warn-detail-color)"
      },
      error: {
        color: "var(--sc-cmp-toast-error-color)",
        background: "var(--sc-cmp-toast-error-background)",
        borderColor: "var(--sc-cmp-toast-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-error-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-error-detail-color)"
      },
      success: {
        color: "var(--sc-cmp-toast-success-color)",
        background: "var(--sc-cmp-toast-success-background)",
        borderColor: "var(--sc-cmp-toast-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-success-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-success-detail-color)"
      },
      contrast: {
        color: "var(--sc-cmp-toast-contrast-color)",
        background: "var(--sc-cmp-toast-contrast-background)",
        borderColor: "var(--sc-cmp-toast-contrast-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-contrast-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-contrast-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-contrast-detail-color)"
      },
      secondary: {
        color: "var(--sc-cmp-toast-secondary-color)",
        background: "var(--sc-cmp-toast-secondary-background)",
        borderColor: "var(--sc-cmp-toast-secondary-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-toast-secondary-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-toast-secondary-close-button-hover-background)"
        },
        detailColor: "var(--sc-cmp-toast-secondary-detail-color)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/avatar.ts
var avatar_default = {
  lg: {
    icon: {
      size: "var(--sc-cmp-avatar-lg-icon-size)"
    },
    group: {
      offset: "var(--sc-cmp-avatar-lg-group-offset)"
    },
    width: "var(--sc-cmp-avatar-lg-width)",
    height: "var(--sc-cmp-avatar-lg-height)",
    fontSize: "var(--sc-cmp-avatar-lg-font-size)"
  },
  xl: {
    icon: {
      size: "var(--sc-cmp-avatar-xl-icon-size)"
    },
    group: {
      offset: "var(--sc-cmp-avatar-xl-group-offset)"
    },
    width: "var(--sc-cmp-avatar-xl-width)",
    height: "var(--sc-cmp-avatar-xl-height)",
    fontSize: "var(--sc-cmp-avatar-xl-font-size)"
  },
  icon: {
    size: "var(--sc-cmp-avatar-icon-size)"
  },
  root: {
    color: "{content.color}",
    width: "var(--sc-cmp-avatar-width)",
    height: "var(--sc-cmp-avatar-height)",
    fontSize: "var(--sc-cmp-avatar-font-size)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  group: {
    offset: "var(--sc-cmp-avatar-group-offset)",
    borderColor: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/button.ts
var button_default = {
  root: {
    lg: {
      fontSize: "var(--sc-cmp-button-lg-font-size)",
      paddingX: "var(--sc-cmp-button-lg-padding-x)",
      paddingY: "var(--sc-cmp-button-lg-padding-y)",
      iconOnlyWidth: "var(--sc-cmp-button-lg-icon-only-width)"
    },
    sm: {
      fontSize: "var(--sc-cmp-button-sm-font-size)",
      paddingX: "var(--sc-cmp-button-sm-padding-x)",
      paddingY: "var(--sc-cmp-button-sm-padding-y)",
      iconOnlyWidth: "var(--sc-cmp-button-sm-icon-only-width)"
    },
    gap: "var(--sc-cmp-button-gap)",
    help: {
      focusRing: {
        shadow: "none"
      }
    },
    info: {
      focusRing: {
        shadow: "none"
      }
    },
    warn: {
      focusRing: {
        shadow: "none"
      }
    },
    label: {
      fontWeight: "500"
    },
    danger: {
      focusRing: {
        shadow: "none"
      }
    },
    primary: {
      focusRing: {
        shadow: "none"
      }
    },
    success: {
      focusRing: {
        shadow: "none"
      }
    },
    contrast: {
      focusRing: {
        shadow: "none"
      }
    },
    paddingX: "var(--sc-cmp-button-padding-x)",
    paddingY: "var(--sc-cmp-button-padding-y)",
    badgeSize: "var(--sc-scale-1)",
    focusRing: {
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}"
    },
    secondary: {
      focusRing: {
        shadow: "none"
      }
    },
    borderRadius: "var(--sc-cmp-button-border-radius)",
    raisedShadow: "0 0.071429rem 0.357143rem 0 #0000001f, 0 0.142857rem 0.142857rem 0 #00000024, 0 0.214286rem 0.071429rem -0.142857rem #00000033",
    iconOnlyWidth: "var(--sc-cmp-button-icon-only-width)",
    transitionDuration: "{form.field.transition.duration}",
    roundedBorderRadius: "var(--sc-cmp-button-rounded-border-radius)"
  },
  colorScheme: {
    dark: {
      link: {
        color: "{primary.color}",
        hoverColor: "{primary.color}",
        activeColor: "{primary.color}"
      },
      root: {
        help: {
          color: "{purple.950}",
          focusRing: {
            color: "{purple.400}"
          },
          background: "{purple.400}",
          hoverColor: "{purple.950}",
          activeColor: "{purple.950}",
          borderColor: "{purple.400}",
          hoverBackground: "{purple.300}",
          activeBackground: "{purple.200}",
          hoverBorderColor: "{purple.300}",
          activeBorderColor: "{purple.200}"
        },
        info: {
          color: "{sky.950}",
          focusRing: {
            color: "{sky.400}"
          },
          background: "{sky.400}",
          hoverColor: "{sky.950}",
          activeColor: "{sky.950}",
          borderColor: "{sky.400}",
          hoverBackground: "{sky.300}",
          activeBackground: "{sky.200}",
          hoverBorderColor: "{sky.300}",
          activeBorderColor: "{sky.200}"
        },
        warn: {
          color: "{orange.950}",
          focusRing: {
            color: "{orange.400}"
          },
          background: "{orange.400}",
          hoverColor: "{orange.950}",
          activeColor: "{orange.950}",
          borderColor: "{orange.400}",
          hoverBackground: "{orange.300}",
          activeBackground: "{orange.200}",
          hoverBorderColor: "{orange.300}",
          activeBorderColor: "{orange.200}"
        },
        danger: {
          color: "{red.950}",
          focusRing: {
            color: "{red.400}"
          },
          background: "{red.400}",
          hoverColor: "{red.950}",
          activeColor: "{red.950}",
          borderColor: "{red.400}",
          hoverBackground: "{red.300}",
          activeBackground: "{red.200}",
          hoverBorderColor: "{red.300}",
          activeBorderColor: "{red.200}"
        },
        primary: {
          color: "{primary.contrast.color}",
          focusRing: {
            color: "{primary.color}"
          },
          background: "{primary.color}",
          hoverColor: "{primary.contrast.color}",
          activeColor: "{primary.contrast.color}",
          borderColor: "{primary.color}",
          hoverBackground: "{primary.hover.color}",
          activeBackground: "{primary.active.color}",
          hoverBorderColor: "{primary.hover.color}",
          activeBorderColor: "{primary.active.color}"
        },
        success: {
          color: "{green.950}",
          focusRing: {
            color: "{green.400}"
          },
          background: "{green.400}",
          hoverColor: "{green.950}",
          activeColor: "{green.950}",
          borderColor: "{green.400}",
          hoverBackground: "{green.300}",
          activeBackground: "{green.200}",
          hoverBorderColor: "{green.300}",
          activeBorderColor: "{green.200}"
        },
        contrast: {
          color: "{surface.950}",
          focusRing: {
            color: "{surface.0}"
          },
          background: "{surface.0}",
          hoverColor: "{surface.950}",
          activeColor: "{surface.950}",
          borderColor: "{surface.0}",
          hoverBackground: "{surface.100}",
          activeBackground: "{surface.200}",
          hoverBorderColor: "{surface.100}",
          activeBorderColor: "{surface.200}"
        },
        secondary: {
          color: "{surface.300}",
          focusRing: {
            color: "{surface.300}"
          },
          background: "{surface.800}",
          hoverColor: "{surface.200}",
          activeColor: "{surface.100}",
          borderColor: "{surface.800}",
          hoverBackground: "{surface.700}",
          activeBackground: "{surface.600}",
          hoverBorderColor: "{surface.700}",
          activeBorderColor: "{surface.600}"
        }
      },
      text: {
        help: {
          color: "var(--sc-cmp-button-text-help-color)",
          hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-help-active-background)"
        },
        info: {
          color: "var(--sc-cmp-button-text-info-color)",
          hoverBackground: "#38bdf80a",
          activeBackground: "#38bdf829"
        },
        warn: {
          color: "{orange.400}",
          hoverBackground: "var(--sc-cmp-button-text-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-warn-active-background)"
        },
        plain: {
          color: "var(--sc-cmp-button-text-plain-color)",
          hoverBackground: "{surface.800}",
          activeBackground: "{surface.700}"
        },
        danger: {
          color: "var(--sc-cmp-button-text-danger-color)",
          hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
        },
        primary: {
          color: "{primary.color}",
          hoverBackground: "var(--sc-cmp-button-text-primary-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-primary-active-background)"
        },
        success: {
          color: "var(--sc-cmp-button-text-success-color)",
          hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-success-active-background)"
        },
        contrast: {
          color: "var(--sc-cmp-button-text-contrast-color)",
          hoverBackground: "{surface.800}",
          activeBackground: "{surface.700}"
        },
        secondary: {
          color: "{surface.400}",
          hoverBackground: "{surface.800}",
          activeBackground: "{surface.700}"
        }
      },
      outlined: {
        help: {
          color: "var(--sc-cmp-button-outlined-help-color)",
          borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
        },
        info: {
          color: "var(--sc-cmp-button-outlined-info-color)",
          borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
          hoverBackground: "#38bdf80a",
          activeBackground: "#38bdf829"
        },
        warn: {
          color: "{orange.400}",
          borderColor: "{orange.700}",
          hoverBackground: "var(--sc-cmp-button-outlined-warn-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-warn-active-background)"
        },
        plain: {
          color: "var(--sc-cmp-button-outlined-plain-color)",
          borderColor: "{surface.600}",
          hoverBackground: "{surface.800}",
          activeBackground: "{surface.700}"
        },
        danger: {
          color: "var(--sc-cmp-button-outlined-danger-color)",
          borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
        },
        primary: {
          color: "{primary.color}",
          borderColor: "var(--sc-cmp-button-outlined-primary-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-primary-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-primary-active-background)"
        },
        success: {
          color: "var(--sc-cmp-button-outlined-success-color)",
          borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
        },
        contrast: {
          color: "var(--sc-cmp-button-outlined-contrast-color)",
          borderColor: "{surface.500}",
          hoverBackground: "{surface.800}",
          activeBackground: "{surface.700}"
        },
        secondary: {
          color: "{surface.400}",
          borderColor: "{surface.700}",
          hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
        }
      }
    },
    light: {
      link: {
        color: "{primary.color}",
        hoverColor: "{primary.color}",
        activeColor: "{primary.color}"
      },
      root: {
        help: {
          color: "#ffffffff",
          focusRing: {
            color: "{purple.500}"
          },
          background: "{purple.500}",
          hoverColor: "#ffffffff",
          activeColor: "#ffffffff",
          borderColor: "{purple.500}",
          hoverBackground: "{purple.600}",
          activeBackground: "{purple.700}",
          hoverBorderColor: "{purple.600}",
          activeBorderColor: "{purple.700}"
        },
        info: {
          color: "#ffffffff",
          focusRing: {
            color: "{sky.500}"
          },
          background: "{sky.500}",
          hoverColor: "#ffffffff",
          activeColor: "#ffffffff",
          borderColor: "{sky.500}",
          hoverBackground: "{sky.600}",
          activeBackground: "{sky.700}",
          hoverBorderColor: "{sky.600}",
          activeBorderColor: "{sky.700}"
        },
        /* AA · 2026-08-24 — mismo arreglo que `danger` de abajo y por el
         * mismo motivo, pero aquí ni siquiera hace falta divergir: el
         * warn sólido medía **1.92:1** con su texto blanco y el propio
         * Kit dice `{yellow.700}` para este slot (4.92 ✓). La rampa se
         * desplaza de 500/600/700 a 700/800/900 para conservar el
         * recorrido reposo → hover → pulsado.
         *
         * Se llama `orange` porque así llama PrimeNG al slot; `base.ts`
         * lo remapea a la familia yellow, que es lo que el Theme
         * Designer trajo el 24-ago. */
        warn: {
          color: "#ffffffff",
          focusRing: {
            color: "{orange.700}"
          },
          background: "{orange.700}",
          hoverColor: "#ffffffff",
          activeColor: "#ffffffff",
          borderColor: "{orange.700}",
          hoverBackground: "{orange.800}",
          activeBackground: "{orange.900}",
          hoverBorderColor: "{orange.800}",
          activeBorderColor: "{orange.900}"
        },
        /* AA · 2026-07-19 — el botón `danger` sólido subía a 3.76:1 con
         * su texto blanco: era uno de los dos últimos fallos de
         * contraste de la app. La rampa entera se desplaza un escalón,
         * de 500/600/700 a 600/700/800, para conservar el recorrido
         * reposo → hover → pulsado. red-600 con blanco da **4.83:1**.
         *
         * Se cambia AQUÍ, por referencia de paleta, y no vía
         * `--sc-cmp-button-danger-*`: esos tokens existen pero
         * corresponden a otro slot y **nadie los lee** para el sólido —
         * lo comprobé cambiándolos y midiendo el píxel, que seguía en
         * #ef4444. Cablear el preset a ellos rompe `cmp-color-rewire`,
         * que exige que cada `var(--sc-cmp-*)` case con SU slot
         * (`root.danger` pediría `--sc-cmp-button-root-danger-*`, que no
         * existe). Ver customs-catalog §1.8.
         *
         * `focusRing` se queda en {red.500}: es un anillo, no lleva
         * texto encima, y no cambiarlo evita mover una señal de foco. */
        danger: {
          color: "#ffffffff",
          focusRing: {
            color: "{red.500}"
          },
          background: "{red.600}",
          hoverColor: "#ffffffff",
          activeColor: "#ffffffff",
          borderColor: "{red.600}",
          hoverBackground: "{red.700}",
          activeBackground: "{red.800}",
          hoverBorderColor: "{red.700}",
          activeBorderColor: "{red.800}"
        },
        primary: {
          color: "{primary.contrast.color}",
          focusRing: {
            color: "{primary.color}"
          },
          background: "{primary.color}",
          hoverColor: "{primary.contrast.color}",
          activeColor: "{primary.contrast.color}",
          borderColor: "{primary.color}",
          hoverBackground: "{primary.hover.color}",
          activeBackground: "{primary.active.color}",
          hoverBorderColor: "{primary.hover.color}",
          activeBorderColor: "{primary.active.color}"
        },
        success: {
          color: "#ffffffff",
          focusRing: {
            color: "{green.500}"
          },
          background: "{green.500}",
          hoverColor: "#ffffffff",
          activeColor: "#ffffffff",
          borderColor: "{green.500}",
          hoverBackground: "{green.600}",
          activeBackground: "{green.700}",
          hoverBorderColor: "{green.600}",
          activeBorderColor: "{green.700}"
        },
        contrast: {
          color: "{surface.0}",
          focusRing: {
            color: "{surface.950}"
          },
          background: "{surface.950}",
          hoverColor: "{surface.0}",
          activeColor: "{surface.0}",
          borderColor: "{surface.950}",
          hoverBackground: "{surface.900}",
          activeBackground: "{surface.800}",
          hoverBorderColor: "{surface.900}",
          activeBorderColor: "{surface.800}"
        },
        secondary: {
          color: "{surface.600}",
          focusRing: {
            color: "{surface.600}"
          },
          background: "{surface.100}",
          hoverColor: "{surface.700}",
          activeColor: "{surface.800}",
          borderColor: "{surface.100}",
          hoverBackground: "{surface.200}",
          activeBackground: "{surface.300}",
          hoverBorderColor: "{surface.200}",
          activeBorderColor: "{surface.300}"
        }
      },
      text: {
        help: {
          color: "var(--sc-cmp-button-text-help-color)",
          hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-help-active-background)"
        },
        info: {
          color: "var(--sc-cmp-button-text-info-color)",
          hoverBackground: "var(--sc-cmp-button-text-info-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-info-active-background)"
        },
        warn: {
          color: "{orange.500}",
          hoverBackground: "{orange.50}",
          activeBackground: "{orange.100}"
        },
        plain: {
          color: "var(--sc-cmp-button-text-plain-color)",
          hoverBackground: "var(--sc-cmp-button-text-plain-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-plain-active-background)"
        },
        danger: {
          color: "var(--sc-cmp-button-text-danger-color)",
          hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
        },
        primary: {
          color: "{primary.color}",
          hoverBackground: "{primary.50}",
          activeBackground: "{primary.100}"
        },
        success: {
          color: "var(--sc-cmp-button-text-success-color)",
          hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-success-active-background)"
        },
        contrast: {
          color: "var(--sc-cmp-button-text-contrast-color)",
          hoverBackground: "var(--sc-cmp-button-text-contrast-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-contrast-active-background)"
        },
        secondary: {
          color: "var(--sc-cmp-button-text-secondary-color)",
          hoverBackground: "var(--sc-cmp-button-text-secondary-hover-background)",
          activeBackground: "var(--sc-cmp-button-text-secondary-active-background)"
        }
      },
      outlined: {
        help: {
          color: "var(--sc-cmp-button-outlined-help-color)",
          borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
        },
        info: {
          color: "var(--sc-cmp-button-outlined-info-color)",
          borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-info-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-info-active-background)"
        },
        warn: {
          color: "{orange.500}",
          borderColor: "{orange.200}",
          hoverBackground: "{orange.50}",
          activeBackground: "{orange.100}"
        },
        plain: {
          color: "var(--sc-cmp-button-outlined-plain-color)",
          borderColor: "var(--sc-cmp-button-outlined-plain-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-plain-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-plain-active-background)"
        },
        danger: {
          color: "var(--sc-cmp-button-outlined-danger-color)",
          borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
        },
        primary: {
          color: "{primary.color}",
          borderColor: "{primary.200}",
          hoverBackground: "{primary.50}",
          activeBackground: "{primary.100}"
        },
        success: {
          color: "var(--sc-cmp-button-outlined-success-color)",
          borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
        },
        contrast: {
          color: "var(--sc-cmp-button-outlined-contrast-color)",
          borderColor: "var(--sc-cmp-button-outlined-contrast-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-contrast-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-contrast-active-background)"
        },
        secondary: {
          color: "var(--sc-cmp-button-outlined-secondary-color)",
          borderColor: "var(--sc-cmp-button-outlined-secondary-border-color)",
          hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
          activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dialog.ts
var dialog_default = {
  root: {
    color: "{overlay.modal.color}",
    shadow: "var(--sc-cmp-dialog-shadow)",
    background: "{overlay.modal.background}",
    borderColor: "{overlay.modal.border.color}",
    borderRadius: "{overlay.modal.border.radius}"
  },
  title: {
    fontSize: "var(--sc-font-size-400)",
    fontWeight: "600"
  },
  footer: {
    gap: "var(--sc-cmp-dialog-footer-gap)",
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  },
  header: {
    gap: "var(--sc-cmp-dialog-header-gap)",
    padding: "{overlay.modal.padding}"
  },
  content: {
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/drawer.ts
var drawer_default = {
  root: {
    color: "{overlay.modal.color}",
    shadow: "var(--sc-cmp-drawer-shadow)",
    background: "{overlay.modal.background}",
    borderColor: "{overlay.modal.border.color}"
  },
  title: {
    fontSize: "var(--sc-font-size-450)",
    fontWeight: "600"
  },
  footer: {
    padding: "{overlay.modal.padding}"
  },
  header: {
    padding: "{overlay.modal.padding}"
  },
  content: {
    padding: "0 {overlay.modal.padding} {overlay.modal.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/editor.ts
var editor_default = {
  content: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-editor-overlay-shadow)",
    padding: "{list.padding}",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  toolbar: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  toolbarItem: {
    color: "{text.muted.color}",
    hoverColor: "{text.color}",
    activeColor: "{primary.color}"
  },
  overlayOption: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    focusBackground: "{list.option.focus.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/rating.ts
var rating_default = {
  icon: {
    size: "var(--sc-cmp-rating-icon-size)",
    color: "{text.muted.color}",
    hoverColor: "{primary.color}",
    activeColor: "{primary.color}"
  },
  root: {
    gap: "var(--sc-cmp-rating-gap)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/ripple.ts
var ripple_default = {
  colorScheme: {
    dark: {
      root: {
        background: "rgba(255, 255, 255, 0.4)"
      }
    },
    light: {
      root: {
        background: "rgba(0, 0, 0, 0.1)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/select.ts
var select_default = {
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-select-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-select-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-select-dropdown-width)"
  },
  checkmark: {
    color: "{list.option.color}",
    gutterEnd: "var(--sc-cmp-select-checkmark-gutter-end)",
    gutterStart: "var(--sc-cmp-select-checkmark-gutter-start)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/slider.ts
var slider_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  range: {
    background: "{primary.color}"
  },
  track: {
    size: "0.214286rem",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  handle: {
    width: "1.428571rem",
    height: "1.428571rem",
    content: {
      width: "var(--sc-cmp-slider-handle-content-width)",
      height: "var(--sc-cmp-slider-handle-content-height)",
      shadow: "var(--sc-cmp-slider-handle-content-shadow)",
      borderRadius: "0.571429rem",
      hoverBackground: "{content.background}"
    },
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.border.color}",
    borderRadius: "0.714286rem",
    hoverBackground: "{content.border.color}"
  },
  colorScheme: {
    dark: {
      handle: {
        content: {
          background: "{surface.950}"
        }
      }
    },
    light: {
      handle: {
        content: {
          background: "var(--sc-cmp-slider-handle-content-background)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/blockui.ts
var blockui_default = {
  root: {
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/divider.ts
var divider_default = {
  root: {
    borderColor: "{content.border.color}"
  },
  content: {
    color: "{text.color}",
    background: "{content.background}"
  },
  vertical: {
    margin: "var(--sc-cmp-divider-vertical-margin-y) var(--sc-cmp-divider-vertical-margin-x)",
    content: {
      padding: "var(--sc-cmp-divider-vertical-content-padding-y) var(--sc-cmp-divider-vertical-content-padding-x)"
    },
    padding: "0"
  },
  horizontal: {
    margin: "var(--sc-cmp-divider-horizontal-margin-y) var(--sc-cmp-divider-horizontal-margin-x)",
    content: {
      padding: "var(--sc-cmp-divider-horizontal-content-padding-y) var(--sc-cmp-divider-horizontal-content-padding-x)"
    },
    padding: "0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inplace.ts
var inplace_default = {
  root: {
    padding: "{form.field.padding.y} {form.field.padding.x}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  display: {
    hoverColor: "{content.hover.color}",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/listbox.ts
var listbox_default = {
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-listbox-shadow)",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  checkmark: {
    color: "{list.option.color}",
    gutterEnd: "var(--sc-cmp-listbox-checkmark-gutter-end)",
    gutterStart: "var(--sc-cmp-listbox-checkmark-gutter-start)"
  },
  colorScheme: {
    dark: {
      option: {
        stripedBackground: "{surface.900}"
      }
    },
    light: {
      option: {
        stripedBackground: "var(--sc-cmp-listbox-option-striped-background)"
      }
    }
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/menubar.ts
var menubar_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}",
      activeColor: "{navigation.item.icon.active.color}"
    },
    color: "{navigation.item.color}",
    padding: "{navigation.item.padding}",
    focusColor: "{navigation.item.focus.color}",
    activeColor: "{navigation.item.active.color}",
    borderRadius: "{navigation.item.border.radius}",
    focusBackground: "{navigation.item.focus.background}",
    activeBackground: "{navigation.item.active.background}"
  },
  root: {
    gap: "var(--sc-cmp-menubar-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-menubar-padding-y) var(--sc-cmp-menubar-padding-x)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  submenu: {
    gap: "{navigation.list.gap}",
    icon: {
      size: "{navigation.submenu.icon.size}",
      color: "{navigation.submenu.icon.color}",
      focusColor: "{navigation.submenu.icon.focus.color}",
      activeColor: "{navigation.submenu.icon.active.color}"
    },
    shadow: "var(--sc-cmp-menubar-submenu-shadow)",
    padding: "{navigation.list.padding}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    mobileIndent: "var(--sc-cmp-menubar-submenu-mobile-indent)"
  },
  baseItem: {
    padding: "{navigation.item.padding}",
    borderRadius: "{content.border.radius}"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  mobileButton: {
    size: "var(--sc-cmp-menubar-mobile-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-menubar-mobile-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/message.ts
var message_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-message-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-message-icon-sm-size)"
    },
    size: "var(--sc-cmp-message-icon-size)"
  },
  info: {
    shadow: "var(--sc-cmp-message-info-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  root: {
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  text: {
    lg: {
      fontSize: "var(--sc-font-size-300)"
    },
    sm: {
      fontSize: "var(--sc-font-size-100)"
    },
    fontSize: "var(--sc-scale-1)",
    fontWeight: "500"
  },
  warn: {
    shadow: "var(--sc-cmp-message-warn-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  error: {
    shadow: "var(--sc-cmp-message-error-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  simple: {
    content: {
      padding: "0"
    }
  },
  content: {
    lg: {
      padding: "var(--sc-cmp-message-content-lg-padding-y) var(--sc-cmp-message-content-lg-padding-x)"
    },
    sm: {
      padding: "var(--sc-cmp-message-content-sm-padding-y) var(--sc-cmp-message-content-sm-padding-x)"
    },
    gap: "var(--sc-cmp-message-content-gap)",
    padding: "var(--sc-cmp-message-content-padding-y) var(--sc-cmp-message-content-padding-x)"
  },
  success: {
    shadow: "var(--sc-cmp-message-success-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  contrast: {
    shadow: "var(--sc-cmp-message-contrast-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  outlined: {
    root: {
      borderWidth: "0.071429rem"
    }
  },
  closeIcon: {
    lg: {
      size: "var(--sc-cmp-message-close-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-message-close-icon-sm-size)"
    },
    size: "var(--sc-cmp-message-close-icon-size)"
  },
  secondary: {
    shadow: "var(--sc-cmp-message-secondary-shadow)",
    closeButton: {
      focusRing: {
        shadow: "none"
      }
    }
  },
  closeButton: {
    width: "var(--sc-cmp-message-close-button-width)",
    height: "var(--sc-cmp-message-close-button-height)",
    focusRing: {
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}"
    },
    borderRadius: "var(--sc-cmp-message-close-button-border-radius)"
  },
  colorScheme: {
    dark: {
      info: {
        color: "var(--sc-cmp-message-info-color)",
        simple: {
          color: "var(--sc-cmp-message-info-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-info-outlined-color)",
          borderColor: "var(--sc-cmp-message-info-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-info-background)",
        borderColor: "var(--sc-cmp-message-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-info-close-button-hover-background)"
        }
      },
      warn: {
        color: "var(--sc-cmp-message-warn-color)",
        simple: {
          color: "var(--sc-cmp-message-warn-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-warn-outlined-color)",
          borderColor: "var(--sc-cmp-message-warn-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-warn-background)",
        borderColor: "var(--sc-cmp-message-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-warn-close-button-hover-background)"
        }
      },
      error: {
        color: "var(--sc-cmp-message-error-color)",
        simple: {
          color: "var(--sc-cmp-message-error-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-error-outlined-color)",
          borderColor: "var(--sc-cmp-message-error-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-error-background)",
        borderColor: "var(--sc-cmp-message-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-error-close-button-hover-background)"
        }
      },
      success: {
        color: "var(--sc-cmp-message-success-color)",
        simple: {
          color: "var(--sc-cmp-message-success-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-success-outlined-color)",
          borderColor: "var(--sc-cmp-message-success-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-success-background)",
        borderColor: "var(--sc-cmp-message-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-success-close-button-hover-background)"
        }
      },
      contrast: {
        color: "{surface.950}",
        simple: {
          color: "var(--sc-cmp-message-contrast-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-contrast-outlined-color)",
          borderColor: "var(--sc-cmp-message-contrast-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-contrast-background)",
        borderColor: "{surface.100}",
        closeButton: {
          focusRing: {
            color: "{surface.950}"
          },
          hoverBackground: "{surface.100}"
        }
      },
      secondary: {
        color: "{surface.300}",
        simple: {
          color: "{surface.400}"
        },
        outlined: {
          color: "{surface.400}",
          borderColor: "{surface.400}"
        },
        background: "{surface.800}",
        borderColor: "{surface.700}",
        closeButton: {
          focusRing: {
            color: "{surface.300}"
          },
          hoverBackground: "{surface.700}"
        }
      }
    },
    light: {
      info: {
        color: "var(--sc-cmp-message-info-color)",
        simple: {
          color: "var(--sc-cmp-message-info-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-info-outlined-color)",
          borderColor: "var(--sc-cmp-message-info-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-info-background)",
        borderColor: "var(--sc-cmp-message-info-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-info-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-info-close-button-hover-background)"
        }
      },
      warn: {
        color: "var(--sc-cmp-message-warn-color)",
        simple: {
          color: "var(--sc-cmp-message-warn-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-warn-outlined-color)",
          borderColor: "var(--sc-cmp-message-warn-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-warn-background)",
        borderColor: "var(--sc-cmp-message-warn-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-warn-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-warn-close-button-hover-background)"
        }
      },
      error: {
        color: "var(--sc-cmp-message-error-color)",
        simple: {
          color: "var(--sc-cmp-message-error-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-error-outlined-color)",
          borderColor: "var(--sc-cmp-message-error-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-error-background)",
        borderColor: "var(--sc-cmp-message-error-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-error-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-error-close-button-hover-background)"
        }
      },
      success: {
        color: "var(--sc-cmp-message-success-color)",
        simple: {
          color: "var(--sc-cmp-message-success-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-success-outlined-color)",
          borderColor: "var(--sc-cmp-message-success-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-success-background)",
        borderColor: "var(--sc-cmp-message-success-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-success-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-success-close-button-hover-background)"
        }
      },
      contrast: {
        color: "var(--sc-cmp-message-contrast-color)",
        simple: {
          color: "var(--sc-cmp-message-contrast-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-contrast-outlined-color)",
          borderColor: "var(--sc-cmp-message-contrast-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-contrast-background)",
        borderColor: "var(--sc-cmp-message-contrast-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-contrast-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-contrast-close-button-hover-background)"
        }
      },
      secondary: {
        color: "var(--sc-cmp-message-secondary-color)",
        simple: {
          color: "var(--sc-cmp-message-secondary-simple-color)"
        },
        outlined: {
          color: "var(--sc-cmp-message-secondary-outlined-color)",
          borderColor: "var(--sc-cmp-message-secondary-outlined-border-color)"
        },
        background: "var(--sc-cmp-message-secondary-background)",
        borderColor: "var(--sc-cmp-message-secondary-border-color)",
        closeButton: {
          focusRing: {
            color: "var(--sc-cmp-message-secondary-close-button-focus-ring-color)"
          },
          hoverBackground: "var(--sc-cmp-message-secondary-close-button-hover-background)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/popover.ts
var popover_default = {
  root: {
    color: "{overlay.popover.color}",
    gutter: "0.714286rem",
    shadow: "var(--sc-cmp-popover-shadow)",
    background: "{overlay.popover.background}",
    arrowOffset: "var(--sc-cmp-popover-arrow-offset)",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  content: {
    padding: "{overlay.popover.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/stepper.ts
var stepper_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  step: {
    gap: "var(--sc-cmp-stepper-step-gap)",
    padding: "var(--sc-cmp-stepper-step-padding)"
  },
  separator: {
    size: "0.142857rem",
    margin: "var(--sc-cmp-stepper-separator-margin-top) var(--sc-cmp-stepper-separator-margin-right) var(--sc-cmp-stepper-separator-margin-bottom) var(--sc-cmp-stepper-separator-margin-left)",
    background: "{content.border.color}",
    activeBackground: "{primary.color}"
  },
  stepTitle: {
    color: "{text.muted.color}",
    fontWeight: "500",
    activeColor: "{primary.color}"
  },
  steppanel: {
    color: "{content.color}",
    indent: "var(--sc-scale-1)",
    padding: "0",
    background: "{content.background}"
  },
  stepHeader: {
    gap: "var(--sc-cmp-stepper-step-header-gap)",
    padding: "0",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  stepNumber: {
    size: "var(--sc-cmp-stepper-step-number-size)",
    color: "{text.muted.color}",
    shadow: "var(--sc-cmp-stepper-step-number-shadow)",
    fontSize: "var(--sc-scale-1-143)",
    background: "{content.background}",
    fontWeight: "500",
    activeColor: "{primary.color}",
    borderColor: "{content.border.color}",
    borderRadius: "var(--sc-cmp-stepper-step-number-border-radius)",
    activeBackground: "{content.background}",
    activeBorderColor: "{content.border.color}"
  },
  steppanels: {
    padding: "var(--sc-cmp-stepper-steppanels-padding-top) var(--sc-cmp-stepper-steppanels-padding-right) var(--sc-cmp-stepper-steppanels-padding-bottom) var(--sc-cmp-stepper-steppanels-padding-left)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toolbar.ts
var toolbar_default = {
  root: {
    gap: "var(--sc-cmp-toolbar-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-toolbar-padding)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tooltip.ts
var tooltip_default = {
  root: {
    gutter: "var(--sc-cmp-tooltip-gutter)",
    shadow: "var(--sc-cmp-tooltip-shadow)",
    padding: "var(--sc-cmp-tooltip-padding-y) var(--sc-cmp-tooltip-padding-x)",
    maxWidth: "var(--sc-cmp-tooltip-max-width)",
    /* 14, no el 12 de Aura (2026-09-13): el Kit dibuja el texto del tooltip a 14 regular
     * (`tooltip-tooltip`, 623:36926) y así casa con menús y desplegables. Por TOKEN y no
     * con una regla en `css.ts`: la hoja de Aura ya lee `tooltip.font.size`, y una clase
     * `.p-tooltip-text` nuestra sería acoplamiento al DOM de PrimeNG que no hace falta
     * (`audit:primeng-coupling`). El interlineado no tiene token: lo hereda de la página. */
    fontSize: "var(--sc-font-size-200)",
    borderRadius: "{overlay.popover.border.radius}"
  },
  colorScheme: {
    dark: {
      root: {
        color: "{surface.0}",
        background: "{surface.700}"
      }
    },
    light: {
      root: {
        color: "{surface.0}",
        background: "{surface.700}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/carousel.ts
var carousel_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  content: {
    gap: "var(--sc-cmp-carousel-content-gap)"
  },
  indicator: {
    width: "var(--sc-cmp-carousel-indicator-width)",
    height: "var(--sc-cmp-carousel-indicator-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}",
    activeBackground: "{primary.color}"
  },
  colorScheme: {
    dark: {
      indicator: {
        background: "{surface.700}",
        hoverBackground: "{surface.600}"
      }
    },
    light: {
      indicator: {
        background: "var(--sc-cmp-carousel-indicator-background)",
        hoverBackground: "var(--sc-cmp-carousel-indicator-hover-background)"
      }
    }
  },
  indicatorList: {
    gap: "var(--sc-cmp-carousel-indicator-list-gap)",
    padding: "var(--sc-cmp-carousel-indicator-list-padding)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/checkbox.ts
var checkbox_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-checkbox-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-checkbox-icon-sm-size)"
    },
    size: "var(--sc-cmp-checkbox-icon-size)",
    color: "{form.field.color}",
    checkedColor: "{primary.contrast.color}",
    disabledColor: "{form.field.disabled.color}",
    checkedHoverColor: "{primary.contrast.color}"
  },
  root: {
    lg: {
      width: "var(--sc-cmp-checkbox-lg-width)",
      height: "var(--sc-cmp-checkbox-lg-height)"
    },
    sm: {
      width: "var(--sc-cmp-checkbox-sm-width)",
      height: "var(--sc-cmp-checkbox-sm-height)"
    },
    width: "var(--sc-cmp-checkbox-width)",
    height: "var(--sc-cmp-checkbox-height)",
    shadow: "var(--sc-cmp-checkbox-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{border.radius.sm}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    checkedBackground: "{primary.color}",
    checkedBorderColor: "{primary.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    checkedHoverBackground: "{primary.hover.color}",
    checkedFocusBorderColor: "{primary.color}",
    checkedHoverBorderColor: "{primary.hover.color}",
    checkedDisabledBorderColor: "{form.field.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/dataview.ts
var dataview_default = {
  root: {
    padding: "0",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0"
  },
  footer: {
    color: "{content.color}",
    padding: "var(--sc-cmp-dataview-footer-padding-y) var(--sc-cmp-dataview-footer-padding-x)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    borderRadius: "0"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-dataview-header-padding-y) var(--sc-cmp-dataview-header-padding-x)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    borderRadius: "0"
  },
  content: {
    color: "{content.color}",
    padding: "0",
    background: "{content.background}",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0"
  },
  paginatorTop: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  },
  paginatorBottom: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/fieldset.ts
var fieldset_default = {
  root: {
    color: "{content.color}",
    padding: "var(--sc-scale-1-125)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  legend: {
    gap: "var(--sc-cmp-fieldset-legend-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-fieldset-legend-padding-y) var(--sc-cmp-fieldset-legend-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    fontWeight: "600",
    hoverColor: "{content.hover.color}",
    borderColor: "#00000000",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  },
  content: {
    padding: "0"
  },
  toggleIcon: {
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/galleria.ts
var galleria_default = {
  root: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  caption: {
    color: "{surface.100}",
    padding: "var(--sc-cmp-galleria-caption-padding)",
    background: "#00000080"
  },
  navIcon: {
    size: "var(--sc-cmp-galleria-nav-icon-size)"
  },
  navButton: {
    next: {
      borderRadius: "var(--sc-cmp-galleria-nav-button-next-border-radius)"
    },
    prev: {
      borderRadius: "var(--sc-cmp-galleria-nav-button-prev-border-radius)"
    },
    size: "var(--sc-cmp-galleria-nav-button-size)",
    color: "{surface.100}",
    gutter: "var(--sc-cmp-galleria-nav-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#ffffff1a",
    hoverColor: "{surface.0}",
    hoverBackground: "#ffffff33"
  },
  closeButton: {
    size: "var(--sc-cmp-galleria-close-button-size)",
    color: "{surface.50}",
    gutter: "var(--sc-cmp-galleria-close-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#ffffff1a",
    hoverColor: "{surface.0}",
    borderRadius: "var(--sc-cmp-galleria-close-button-border-radius)",
    hoverBackground: "#ffffff33"
  },
  colorScheme: {
    dark: {
      indicatorButton: {
        background: "{surface.700}",
        hoverBackground: "{surface.600}"
      },
      thumbnailNavButton: {
        color: "{surface.400}",
        hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
        hoverBackground: "{surface.700}"
      }
    },
    light: {
      indicatorButton: {
        background: "var(--sc-cmp-galleria-indicator-button-background)",
        hoverBackground: "var(--sc-cmp-galleria-indicator-button-hover-background)"
      },
      thumbnailNavButton: {
        color: "var(--sc-cmp-galleria-thumbnail-nav-button-color)",
        hoverColor: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-color)",
        hoverBackground: "var(--sc-cmp-galleria-thumbnail-nav-button-hover-background)"
      }
    }
  },
  indicatorList: {
    gap: "var(--sc-cmp-galleria-indicator-list-gap)",
    padding: "var(--sc-cmp-galleria-indicator-list-padding)"
  },
  closeButtonIcon: {
    size: "var(--sc-cmp-galleria-close-button-icon-size)"
  },
  indicatorButton: {
    width: "var(--sc-cmp-galleria-indicator-button-width)",
    height: "var(--sc-cmp-galleria-indicator-button-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "var(--sc-cmp-galleria-indicator-button-border-radius)",
    activeBackground: "{primary.color}"
  },
  thumbnailsContent: {
    padding: "var(--sc-cmp-galleria-thumbnails-content-padding-y) var(--sc-cmp-galleria-thumbnails-content-padding-x)",
    background: "{content.background}"
  },
  insetIndicatorList: {
    background: "#00000080"
  },
  thumbnailNavButton: {
    size: "var(--sc-cmp-galleria-thumbnail-nav-button-size)",
    gutter: "var(--sc-cmp-galleria-thumbnail-nav-button-gutter)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{content.border.radius}"
  },
  insetIndicatorButton: {
    background: "#ffffff66",
    hoverBackground: "#ffffff99",
    activeBackground: "#ffffffe5"
  },
  thumbnailNavButtonIcon: {
    size: "var(--sc-cmp-galleria-thumbnail-nav-button-icon-size)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputotp.ts
var inputotp_default = {
  root: {
    gap: "var(--sc-cmp-inputotp-gap)"
  },
  input: {
    lg: {
      width: "var(--sc-cmp-inputotp-input-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-inputotp-input-sm-width)"
    },
    width: "var(--sc-cmp-inputotp-input-width)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/megamenu.ts
var megamenu_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}",
      activeColor: "{navigation.item.icon.active.color}"
    },
    color: "{navigation.item.color}",
    padding: "{navigation.item.padding}",
    focusColor: "{navigation.item.focus.color}",
    activeColor: "{navigation.item.active.color}",
    borderRadius: "{navigation.item.border.radius}",
    focusBackground: "{navigation.item.focus.background}",
    activeBackground: "{navigation.item.active.background}"
  },
  root: {
    gap: "var(--sc-cmp-megamenu-gap)",
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}",
    verticalOrientation: {
      gap: "{navigation.list.gap}",
      padding: "{navigation.list.padding}"
    },
    horizontalOrientation: {
      gap: "var(--sc-cmp-megamenu-horizontal-orientation-gap)",
      padding: "var(--sc-cmp-megamenu-horizontal-orientation-padding-y) var(--sc-cmp-megamenu-horizontal-orientation-padding-x)"
    }
  },
  overlay: {
    gap: "var(--sc-cmp-megamenu-overlay-gap)",
    color: "{content.color}",
    shadow: "var(--sc-cmp-megamenu-overlay-shadow)",
    padding: "0",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  submenu: {
    gap: "{navigation.list.gap}",
    padding: "{navigation.list.padding}"
  },
  baseItem: {
    padding: "{navigation.item.padding}",
    borderRadius: "{content.border.radius}"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  submenuIcon: {
    size: "{navigation.submenu.icon.size}",
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}",
    activeColor: "{navigation.submenu.icon.active.color}"
  },
  mobileButton: {
    size: "var(--sc-cmp-megamenu-mobile-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-megamenu-mobile-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  },
  submenuLabel: {
    color: "{navigation.submenu.label.color}",
    padding: "{navigation.submenu.label.padding}",
    background: "{navigation.submenu.label.background}",
    fontWeight: "{navigation.submenu.label.font.weight}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/password.ts
var password_default = {
  icon: {
    color: "{form.field.icon.color}"
  },
  meter: {
    height: "var(--sc-cmp-password-meter-height)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  content: {
    gap: "var(--sc-cmp-password-content-gap)"
  },
  overlay: {
    color: "{overlay.popover.color}",
    shadow: "var(--sc-cmp-password-overlay-shadow)",
    padding: "{overlay.popover.padding}",
    background: "{overlay.popover.background}",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  colorScheme: {
    dark: {
      strength: {
        weakBackground: "var(--sc-cmp-password-strength-weak-background)",
        mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
        strongBackground: "var(--sc-cmp-password-strength-strong-background)"
      }
    },
    light: {
      strength: {
        weakBackground: "var(--sc-cmp-password-strength-weak-background)",
        mediumBackground: "var(--sc-cmp-password-strength-medium-background)",
        strongBackground: "var(--sc-cmp-password-strength-strong-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/picklist.ts
var picklist_default = {
  root: {
    gap: "var(--sc-cmp-picklist-gap)"
  },
  controls: {
    gap: "var(--sc-cmp-picklist-controls-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/skeleton.ts
var skeleton_default = {
  root: {
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/splitter.ts
var splitter_default = {
  root: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    transitionDuration: "{transition.duration}"
  },
  gutter: {
    background: "{content.border.color}"
  },
  handle: {
    size: "1.714286rem",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#00000000",
    borderRadius: "{content.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/terminal.ts
var terminal_default = {
  root: {
    color: "{form.field.color}",
    height: "var(--sc-cmp-terminal-height)",
    padding: "{form.field.padding.y} {form.field.padding.x}",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}"
  },
  prompt: {
    gap: "var(--sc-cmp-terminal-prompt-gap)"
  },
  commandResponse: {
    margin: "0.142857rem 0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/textarea.ts
var textarea_default = {
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-textarea-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/timeline.ts
var timeline_default = {
  event: {
    minHeight: "var(--sc-cmp-timeline-event-min-height)"
  },
  vertical: {
    eventContent: {
      padding: "var(--sc-cmp-timeline-vertical-event-content-padding-y) var(--sc-cmp-timeline-vertical-event-content-padding-x)"
    }
  },
  horizontal: {
    eventContent: {
      padding: "var(--sc-cmp-timeline-horizontal-event-content-padding-y) var(--sc-cmp-timeline-horizontal-event-content-padding-x)"
    }
  },
  eventMarker: {
    size: "var(--sc-cmp-timeline-event-marker-size)",
    content: {
      size: "var(--sc-cmp-timeline-event-marker-content-size)",
      background: "{primary.color}",
      insetShadow: "0 0.071429rem 0.071429rem 0 #0000001f, 0 0.071429rem 0 0 #0000000f",
      borderRadius: "0.1875rem"
    },
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.142857rem",
    borderRadius: "0.5625rem"
  },
  eventConnector: {
    size: "0.142857rem",
    color: "{content.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/accordion.ts
var accordion_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  panel: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  },
  header: {
    last: {
      bottomBorderRadius: "{content.border.radius}",
      activeBottomBorderRadius: "0"
    },
    color: "{text.muted.color}",
    first: {
      borderWidth: "0",
      topBorderRadius: "{content.border.radius}"
    },
    padding: "var(--sc-cmp-accordion-header-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    fontWeight: "600",
    hoverColor: "{text.color}",
    toggleIcon: {
      color: "{text.muted.color}",
      hoverColor: "{text.color}",
      activeColor: "{text.color}",
      activeHoverColor: "{text.color}"
    },
    activeColor: "{text.color}",
    borderColor: "{content.border.color}",
    borderWidth: "0",
    borderRadius: "0",
    hoverBackground: "{content.background}",
    activeBackground: "{content.background}",
    activeHoverColor: "{text.color}",
    activeHoverBackground: "{content.background}"
  },
  content: {
    color: "{text.color}",
    padding: "var(--sc-cmp-accordion-content-padding-top) var(--sc-cmp-accordion-content-padding-right) var(--sc-cmp-accordion-content-padding-bottom) var(--sc-cmp-accordion-content-padding-left)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/iconfield.ts
var iconfield_default = {
  icon: {
    color: "{form.field.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/iftalabel.ts
var iftalabel_default = {
  root: {
    top: "{form.field.padding.y}",
    color: "{form.field.float.label.color}",
    fontSize: "var(--sc-font-size-100)",
    positionX: "{form.field.padding.x}",
    focusColor: "{form.field.float.label.focus.color}",
    fontWeight: "400",
    invalidColor: "{form.field.float.label.invalid.color}",
    transitionDuration: "{form.field.transition.duration}"
  },
  input: {
    paddingTop: "var(--sc-cmp-iftalabel-input-padding-top)",
    paddingBottom: "{form.field.padding.y}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputtext.ts
var inputtext_default = {
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-inputtext-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/orderlist.ts
var orderlist_default = {
  root: {
    gap: "var(--sc-cmp-orderlist-gap)"
  },
  controls: {
    gap: "var(--sc-cmp-orderlist-controls-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/paginator.ts
var paginator_default = {
  root: {
    gap: "var(--sc-cmp-paginator-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-paginator-padding-y) var(--sc-cmp-paginator-padding-x)",
    background: "{content.background}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  navButton: {
    color: "{text.muted.color}",
    width: "var(--sc-cmp-paginator-nav-button-width)",
    height: "var(--sc-cmp-paginator-nav-button-height)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "#00000000",
    hoverColor: "{text.hover.muted.color}",
    borderRadius: "var(--sc-cmp-paginator-nav-button-border-radius)",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  jumpToPageInput: {
    maxWidth: "var(--sc-cmp-paginator-jump-to-page-input-max-width)"
  },
  currentPageReport: {
    color: "{text.muted.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/panelmenu.ts
var panelmenu_default = {
  item: {
    gap: "var(--sc-cmp-panelmenu-item-gap)",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}"
    },
    color: "{navigation.item.color}",
    padding: "{navigation.item.padding}",
    focusColor: "{navigation.item.focus.color}",
    borderRadius: "{content.border.radius}",
    focusBackground: "{navigation.item.focus.background}"
  },
  root: {
    gap: "var(--sc-cmp-panelmenu-gap)",
    transitionDuration: "{transition.duration}"
  },
  panel: {
    last: {
      borderWidth: "0.071429rem",
      bottomBorderRadius: "{content.border.radius}"
    },
    color: "{content.color}",
    first: {
      borderWidth: "0.071429rem",
      topBorderRadius: "{content.border.radius}"
    },
    padding: "var(--sc-scale-0-25)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem",
    borderRadius: "{content.border.radius}"
  },
  submenu: {
    indent: "var(--sc-cmp-panelmenu-submenu-indent)"
  },
  submenuIcon: {
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/speeddial.ts
var speeddial_default = {
  root: {
    gap: "var(--sc-cmp-speeddial-gap)",
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/treetable.ts
var treetable_default = {
  row: {
    color: "{content.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  footer: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-footer-padding-y) var(--sc-cmp-treetable-footer-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}",
    borderWidth: "0.071429rem"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-header-padding-y) var(--sc-cmp-treetable-header-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}",
    borderWidth: "0.071429rem"
  },
  bodyCell: {
    gap: "var(--sc-cmp-treetable-body-cell-gap)",
    padding: "var(--sc-cmp-treetable-body-cell-padding-y) var(--sc-cmp-treetable-body-cell-padding-x)",
    borderColor: "{treetable.border.color}"
  },
  sortIcon: {
    size: "var(--sc-cmp-treetable-sort-icon-size)",
    color: "{text.muted.color}",
    hoverColor: "{text.hover.muted.color}"
  },
  footerCell: {
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-footer-cell-padding-y) var(--sc-cmp-treetable-footer-cell-padding-x)",
    background: "{content.background}",
    borderColor: "{treetable.border.color}"
  },
  headerCell: {
    gap: "var(--sc-cmp-treetable-header-cell-gap)",
    color: "{content.color}",
    padding: "var(--sc-cmp-treetable-header-cell-padding-y) var(--sc-cmp-treetable-header-cell-padding-x)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "-0.071429rem",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    borderColor: "{treetable.border.color}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    selectedBackground: "{highlight.background}"
  },
  colorScheme: {
    dark: {
      root: {
        borderColor: "{surface.800}"
      },
      bodyCell: {
        selectedBorderColor: "var(--sc-cmp-treetable-body-cell-selected-border-color)"
      }
    },
    light: {
      root: {
        borderColor: "{content.border.color}"
      },
      bodyCell: {
        selectedBorderColor: "{primary.100}"
      }
    }
  },
  columnTitle: {
    fontWeight: "600"
  },
  loadingIcon: {
    size: "var(--sc-cmp-treetable-loading-icon-size)"
  },
  columnFooter: {
    fontWeight: "600"
  },
  paginatorTop: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  },
  columnResizer: {
    width: "var(--sc-cmp-treetable-column-resizer-width)"
  },
  paginatorBottom: {
    borderColor: "{content.border.color}",
    borderWidth: "0.071429rem"
  },
  resizeIndicator: {
    color: "{primary.color}",
    width: "0.071429rem"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-treetable-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.color}",
    borderRadius: "var(--sc-cmp-treetable-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}",
    selectedHoverColor: "{primary.color}",
    selectedHoverBackground: "{content.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/breadcrumb.ts
var breadcrumb_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      hoverColor: "{navigation.item.icon.focus.color}"
    },
    color: "{text.muted.color}",
    /* El tamaño va aquí, en el TOKEN del componente, y no heredado del
     * contenedor. Medido el 2026-08-25: sin esta línea el `<p-breadcrumb>`
     * no fija `font-size` en ninguna parte —ni el preset ni el SCSS del
     * wrapper— así que HEREDA el de donde lo sueltes. En la TopBar del
     * supervisor eso daba **16px** cuando el DS dice 14, y en la demo de
     * sc-docs habría dado otro número: un componente del DS que mide
     * distinto según dónde caiga no es un componente del DS.
     *
     * 14 = `--sc-font-size-200`, el cuerpo de texto del DS, y es lo que
     * marca el maestro de Figma para la miga. */
    label: {
      fontSize: "var(--sc-font-size-200)"
    },
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{text.color}",
    borderRadius: "{content.border.radius}"
  },
  root: {
    gap: "var(--sc-cmp-breadcrumb-gap)",
    padding: "var(--sc-cmp-breadcrumb-padding)",
    background: "{content.background}",
    transitionDuration: "{transition.duration}"
  },
  separator: {
    color: "{navigation.item.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/datepicker.ts
var datepicker_default = {
  date: {
    color: "{content.color}",
    width: "var(--sc-cmp-datepicker-date-width)",
    height: "var(--sc-cmp-datepicker-date-height)",
    padding: "var(--sc-cmp-datepicker-date-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverColor: "{content.hover.color}",
    borderRadius: "var(--sc-cmp-datepicker-date-border-radius)",
    selectedColor: "{primary.contrast.color}",
    hoverBackground: "{content.hover.background}",
    rangeSelectedColor: "{highlight.color}",
    selectedBackground: "{primary.color}",
    rangeSelectedBackground: "{highlight.background}"
  },
  root: {
    transitionDuration: "{form.field.transition.duration}"
  },
  year: {
    padding: "var(--sc-cmp-datepicker-year-padding)",
    borderRadius: "{content.border.radius}"
  },
  group: {
    gap: "{overlay.popover.padding}",
    borderColor: "{content.border.color}"
  },
  month: {
    padding: "var(--sc-cmp-datepicker-month-padding)",
    borderRadius: "{content.border.radius}"
  },
  panel: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-datepicker-panel-shadow)",
    padding: "{overlay.popover.padding}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  /*
   * `fontSize: "1em"` en título, mes y año = «lo que mida la cabecera». Hasta que Aura
   * fue la base del tema (2026-09-13) estos tres no tenían tamaño propio y lo heredaban
   * de `.p-datepicker-header`, que es donde `sc-datepicker` fija el de cada talla (sm 12,
   * lg 16). Aura les trae 14px fijos, y un valor propio le gana al heredado: medido en
   * Conversaciones (talla sm), mes y año a 14 con los días a 12. `1em` devuelve la
   * herencia sin añadir clases `.p-*` al componente (`audit:primeng-coupling`).
   */
  title: {
    gap: "var(--sc-cmp-datepicker-title-gap)",
    fontSize: "1em",
    fontWeight: "500"
  },
  header: {
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-header-padding-top) var(--sc-cmp-datepicker-header-padding-right) var(--sc-cmp-datepicker-header-padding-bottom) var(--sc-cmp-datepicker-header-padding-left)",
    background: "{content.background}",
    borderColor: "{content.border.color}"
  },
  dayView: {
    margin: "var(--sc-cmp-datepicker-day-view-margin-top) var(--sc-cmp-datepicker-day-view-margin-right) var(--sc-cmp-datepicker-day-view-margin-bottom) var(--sc-cmp-datepicker-day-view-margin-left)"
  },
  weekDay: {
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-week-day-padding)",
    fontWeight: "500"
  },
  dropdown: {
    lg: {
      width: "var(--sc-cmp-datepicker-dropdown-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-datepicker-dropdown-sm-width)"
    },
    width: "var(--sc-cmp-datepicker-dropdown-width)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    hoverBorderColor: "{form.field.border.color}",
    activeBorderColor: "{form.field.border.color}"
  },
  yearView: {
    margin: "var(--sc-cmp-datepicker-year-view-margin-top) var(--sc-cmp-datepicker-year-view-margin-right) var(--sc-cmp-datepicker-year-view-margin-bottom) var(--sc-cmp-datepicker-year-view-margin-left)"
  },
  buttonbar: {
    padding: "var(--sc-cmp-datepicker-buttonbar-padding-top) var(--sc-cmp-datepicker-buttonbar-padding-right) var(--sc-cmp-datepicker-buttonbar-padding-bottom) var(--sc-cmp-datepicker-buttonbar-padding-left)",
    borderColor: "{content.border.color}"
  },
  inputIcon: {
    color: "{form.field.icon.color}"
  },
  monthView: {
    margin: "var(--sc-cmp-datepicker-month-view-margin-top) var(--sc-cmp-datepicker-month-view-margin-right) var(--sc-cmp-datepicker-month-view-margin-bottom) var(--sc-cmp-datepicker-month-view-margin-left)"
  },
  selectYear: {
    fontSize: "1em",
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-select-year-padding-y) var(--sc-cmp-datepicker-select-year-padding-x)",
    hoverColor: "{content.hover.color}",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  },
  timePicker: {
    gap: "var(--sc-cmp-datepicker-time-picker-gap)",
    padding: "var(--sc-cmp-datepicker-time-picker-padding-top) var(--sc-cmp-datepicker-time-picker-padding-right) var(--sc-cmp-datepicker-time-picker-padding-bottom) var(--sc-cmp-datepicker-time-picker-padding-left)",
    buttonGap: "var(--sc-cmp-datepicker-time-picker-button-gap)",
    borderColor: "{content.border.color}"
  },
  colorScheme: {
    dark: {
      today: {
        color: "var(--sc-cmp-datepicker-today-color)",
        background: "{surface.700}"
      },
      dropdown: {
        color: "{surface.300}",
        background: "{surface.800}",
        hoverColor: "{surface.200}",
        activeColor: "{surface.100}",
        hoverBackground: "{surface.700}",
        activeBackground: "{surface.600}"
      }
    },
    light: {
      today: {
        color: "var(--sc-cmp-datepicker-today-color)",
        background: "var(--sc-cmp-datepicker-today-background)"
      },
      dropdown: {
        color: "var(--sc-cmp-datepicker-dropdown-color)",
        background: "var(--sc-cmp-datepicker-dropdown-background)",
        hoverColor: "var(--sc-cmp-datepicker-dropdown-hover-color)",
        activeColor: "var(--sc-cmp-datepicker-dropdown-active-color)",
        hoverBackground: "var(--sc-cmp-datepicker-dropdown-hover-background)",
        activeBackground: "var(--sc-cmp-datepicker-dropdown-active-background)"
      }
    }
  },
  selectMonth: {
    fontSize: "1em",
    color: "{content.color}",
    padding: "var(--sc-cmp-datepicker-select-month-padding-y) var(--sc-cmp-datepicker-select-month-padding-x)",
    hoverColor: "{content.hover.color}",
    borderRadius: "{content.border.radius}",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/fileupload.ts
var fileupload_default = {
  file: {
    gap: "var(--sc-cmp-fileupload-file-gap)",
    info: {
      gap: "var(--sc-cmp-fileupload-file-info-gap)"
    },
    padding: "var(--sc-cmp-fileupload-file-padding)",
    borderColor: "{content.border.color}"
  },
  root: {
    color: "{content.color}",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  basic: {
    gap: "var(--sc-cmp-fileupload-basic-gap)"
  },
  header: {
    gap: "var(--sc-cmp-fileupload-header-gap)",
    color: "{text.color}",
    padding: "var(--sc-cmp-fileupload-header-padding)",
    background: "#00000000",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0"
  },
  content: {
    gap: "var(--sc-cmp-fileupload-content-gap)",
    padding: "var(--sc-cmp-fileupload-content-padding-top) var(--sc-cmp-fileupload-content-padding-right) var(--sc-cmp-fileupload-content-padding-bottom) var(--sc-cmp-fileupload-content-padding-left)",
    highlightBorderColor: "{primary.color}"
  },
  fileList: {
    gap: "var(--sc-cmp-fileupload-file-list-gap)"
  },
  progressbar: {
    height: "var(--sc-cmp-fileupload-progressbar-height)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/floatlabel.ts
var floatlabel_default = {
  in: {
    input: {
      paddingTop: "var(--sc-cmp-floatlabel-in-input-padding-top)",
      paddingBottom: "{form.field.padding.y}"
    },
    active: {
      top: "{form.field.padding.y}"
    }
  },
  on: {
    active: {
      padding: "var(--sc-cmp-floatlabel-on-active-padding-y) var(--sc-cmp-floatlabel-on-active-padding-x)",
      background: "{form.field.background}"
    },
    borderRadius: "{border.radius.xs}"
  },
  over: {
    active: {
      top: "var(--sc-cmp-floatlabel-over-active-top)"
    }
  },
  root: {
    color: "{form.field.float.label.color}",
    active: {
      fontSize: "var(--sc-font-size-100)",
      fontWeight: "400"
    },
    positionX: "{form.field.padding.x}",
    positionY: "{form.field.padding.y}",
    focusColor: "{form.field.float.label.focus.color}",
    fontWeight: "500",
    activeColor: "{form.field.float.label.active.color}",
    invalidColor: "{form.field.float.label.invalid.color}",
    transitionDuration: "{form.field.transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputgroup.ts
var inputgroup_default = {
  addon: {
    color: "{form.field.icon.color}",
    padding: "var(--sc-cmp-inputgroup-addon-padding)",
    minWidth: "var(--sc-cmp-inputgroup-addon-min-width)",
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/metergroup.ts
var metergroup_default = {
  root: {
    gap: "var(--sc-cmp-metergroup-gap)",
    borderRadius: "{content.border.radius}"
  },
  label: {
    gap: "var(--sc-cmp-metergroup-label-gap)"
  },
  meters: {
    size: "var(--sc-cmp-metergroup-meters-size)",
    background: "{content.border.color}"
  },
  labelIcon: {
    size: "var(--sc-cmp-metergroup-label-icon-size)"
  },
  labelList: {
    verticalGap: "var(--sc-cmp-metergroup-label-list-vertical-gap)",
    horizontalGap: "var(--sc-cmp-metergroup-label-list-horizontal-gap)"
  },
  labelMarker: {
    size: "var(--sc-cmp-metergroup-label-marker-size)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/tieredmenu.ts
var tieredmenu_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}",
      activeColor: "{navigation.item.icon.active.color}"
    },
    color: "{navigation.item.color}",
    padding: "{navigation.item.padding}",
    focusColor: "{navigation.item.focus.color}",
    activeColor: "{navigation.item.active.color}",
    borderRadius: "{navigation.item.border.radius}",
    focusBackground: "{navigation.item.focus.background}",
    activeBackground: "{navigation.item.active.background}"
  },
  list: {
    gap: "{navigation.list.gap}",
    padding: "{navigation.list.padding}"
  },
  root: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-tieredmenu-shadow)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  submenu: {
    mobileIndent: "var(--sc-cmp-tieredmenu-submenu-mobile-indent)"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  submenuIcon: {
    size: "{navigation.submenu.icon.size}",
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}",
    activeColor: "{navigation.submenu.icon.active.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/treeselect.ts
var treeselect_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-treeselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  tree: {
    padding: "var(--sc-scale-0-25)"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-treeselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-treeselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/contextmenu.ts
var contextmenu_default = {
  item: {
    gap: "{navigation.item.gap}",
    icon: {
      color: "{navigation.item.icon.color}",
      focusColor: "{navigation.item.icon.focus.color}",
      activeColor: "{navigation.item.icon.active.color}"
    },
    color: "{navigation.item.color}",
    padding: "var(--sc-cmp-contextmenu-item-padding-y) var(--sc-cmp-contextmenu-item-padding-x)",
    focusColor: "{navigation.item.focus.color}",
    activeColor: "{navigation.item.active.color}",
    borderRadius: "{navigation.item.border.radius}",
    focusBackground: "{navigation.item.focus.background}",
    activeBackground: "{navigation.item.active.background}"
  },
  list: {
    gap: "{navigation.list.gap}",
    padding: "{navigation.list.padding}"
  },
  root: {
    color: "{content.color}",
    shadow: "var(--sc-cmp-contextmenu-shadow)",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}"
  },
  submenu: {
    mobileIndent: "var(--sc-cmp-contextmenu-submenu-mobile-indent)"
  },
  separator: {
    borderColor: "{content.border.color}"
  },
  submenuIcon: {
    size: "{navigation.submenu.icon.size}",
    color: "{navigation.submenu.icon.color}",
    focusColor: "{navigation.submenu.icon.focus.color}",
    activeColor: "{navigation.submenu.icon.active.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/inputnumber.ts
var inputnumber_default = {
  root: {
    transitionDuration: "{transition.duration}"
  },
  button: {
    width: "var(--sc-cmp-inputnumber-button-width)",
    borderRadius: "{form.field.border.radius}",
    verticalPadding: "{form.field.padding.y}"
  },
  colorScheme: {
    dark: {
      button: {
        color: "{surface.400}",
        background: "var(--sc-cmp-inputnumber-button-background)",
        hoverColor: "{surface.300}",
        activeColor: "{surface.200}",
        borderColor: "{form.field.border.color}",
        hoverBackground: "{surface.800}",
        activeBackground: "{surface.700}",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}"
      }
    },
    light: {
      button: {
        color: "var(--sc-cmp-inputnumber-button-color)",
        background: "var(--sc-cmp-inputnumber-button-background)",
        hoverColor: "var(--sc-cmp-inputnumber-button-hover-color)",
        activeColor: "var(--sc-cmp-inputnumber-button-active-color)",
        borderColor: "{form.field.border.color}",
        hoverBackground: "var(--sc-cmp-inputnumber-button-hover-background)",
        activeBackground: "var(--sc-cmp-inputnumber-button-active-background)",
        hoverBorderColor: "{form.field.border.color}",
        activeBorderColor: "{form.field.border.color}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/multiselect.ts
var multiselect_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  list: {
    gap: "{list.gap}",
    header: {
      padding: "{list.header.padding}"
    },
    padding: "{list.padding}"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-multiselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    gap: "var(--sc-cmp-multiselect-option-gap)",
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-multiselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-multiselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/progressbar.ts
var progressbar_default = {
  root: {
    height: "var(--sc-cmp-progressbar-height)",
    background: "{content.border.color}",
    borderRadius: "{content.border.radius}"
  },
  label: {
    color: "{primary.contrast.color}",
    fontSize: "var(--sc-font-size-100)",
    fontWeight: "600"
  },
  value: {
    background: "{primary.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/radiobutton.ts
var radiobutton_default = {
  icon: {
    lg: {
      size: "var(--sc-cmp-radiobutton-icon-lg-size)"
    },
    sm: {
      size: "var(--sc-cmp-radiobutton-icon-sm-size)"
    },
    size: "var(--sc-cmp-radiobutton-icon-size)",
    checkedColor: "{primary.contrast.color}",
    disabledColor: "{form.field.disabled.color}",
    checkedHoverColor: "{primary.contrast.color}"
  },
  root: {
    lg: {
      width: "var(--sc-cmp-radiobutton-lg-width)",
      height: "var(--sc-cmp-radiobutton-lg-height)"
    },
    sm: {
      width: "var(--sc-cmp-radiobutton-sm-width)",
      height: "var(--sc-cmp-radiobutton-sm-height)"
    },
    width: "var(--sc-cmp-radiobutton-width)",
    height: "var(--sc-cmp-radiobutton-height)",
    shadow: "var(--sc-cmp-radiobutton-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    checkedBackground: "{primary.color}",
    checkedBorderColor: "{primary.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    checkedHoverBackground: "{primary.hover.color}",
    checkedFocusBorderColor: "{primary.color}",
    checkedHoverBorderColor: "{primary.hover.color}",
    checkedDisabledBorderColor: "{form.field.border.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/scrollpanel.ts
var scrollpanel_default = {
  bar: {
    size: "0.642857rem",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderRadius: "{border.radius.sm}"
  },
  root: {
    transitionDuration: "{transition.duration}"
  },
  colorScheme: {
    dark: {
      bar: {
        background: "{surface.800}"
      }
    },
    light: {
      bar: {
        background: "var(--sc-cmp-scrollpanel-bar-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/splitbutton.ts
var splitbutton_default = {
  root: {
    borderRadius: "{form.field.border.radius}",
    raisedShadow: "0 0.071429rem 0.357143rem 0 #0000001f, 0 0.142857rem 0.142857rem 0 #00000024, 0 0.214286rem 0.071429rem -0.142857rem #00000033",
    roundedBorderRadius: "var(--sc-cmp-splitbutton-rounded-border-radius)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/autocomplete.ts
var autocomplete_default = {
  chip: {
    borderRadius: "{border.radius.sm}"
  },
  list: {
    gap: "{list.gap}",
    padding: "{list.padding}"
  },
  root: {
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-autocomplete-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-autocomplete-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    lg: {
      width: "var(--sc-cmp-autocomplete-dropdown-lg-width)"
    },
    sm: {
      width: "var(--sc-cmp-autocomplete-dropdown-sm-width)"
    },
    width: "var(--sc-cmp-autocomplete-dropdown-width)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    hoverBorderColor: "{form.field.border.color}",
    activeBorderColor: "{form.field.border.color}"
  },
  colorScheme: {
    dark: {
      chip: {
        focusColor: "var(--sc-cmp-autocomplete-chip-focus-color)",
        focusBackground: "{surface.700}"
      },
      dropdown: {
        color: "{surface.300}",
        background: "{surface.800}",
        hoverColor: "{surface.200}",
        activeColor: "{surface.100}",
        hoverBackground: "{surface.700}",
        activeBackground: "{surface.600}"
      }
    },
    light: {
      chip: {
        focusColor: "var(--sc-cmp-autocomplete-chip-focus-color)",
        focusBackground: "var(--sc-cmp-autocomplete-chip-focus-background)"
      },
      dropdown: {
        color: "var(--sc-cmp-autocomplete-dropdown-color)",
        background: "var(--sc-cmp-autocomplete-dropdown-background)",
        hoverColor: "var(--sc-cmp-autocomplete-dropdown-hover-color)",
        activeColor: "var(--sc-cmp-autocomplete-dropdown-active-color)",
        hoverBackground: "var(--sc-cmp-autocomplete-dropdown-hover-background)",
        activeBackground: "var(--sc-cmp-autocomplete-dropdown-active-background)"
      }
    }
  },
  optionGroup: {
    color: "{list.option.group.color}",
    padding: "{list.option.group.padding}",
    background: "{list.option.group.background}",
    fontWeight: "{list.option.group.font.weight}"
  },
  emptyMessage: {
    padding: "{list.option.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/confirmpopup.ts
var confirmpopup_default = {
  icon: {
    size: "var(--sc-cmp-confirmpopup-icon-size)",
    color: "{overlay.popover.color}"
  },
  root: {
    color: "{overlay.popover.color}",
    gutter: "0.714286rem",
    shadow: "var(--sc-cmp-confirmpopup-shadow)",
    background: "{overlay.popover.background}",
    arrowOffset: "var(--sc-cmp-confirmpopup-arrow-offset)",
    borderColor: "{overlay.popover.border.color}",
    borderRadius: "{overlay.popover.border.radius}"
  },
  footer: {
    gap: "var(--sc-cmp-confirmpopup-footer-gap)",
    padding: "0 {overlay.popover.padding} {overlay.popover.padding}"
  },
  content: {
    gap: "var(--sc-cmp-confirmpopup-content-gap)",
    padding: "{overlay.popover.padding}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/imagecompare.ts
var imagecompare_default = {
  handle: {
    size: "1.071429rem",
    focusRing: {
      color: "#ffffff4d",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    hoverSize: "2.142857rem",
    background: "#ffffff4d",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0.535714rem",
    hoverBackground: "#ffffff4d",
    hoverBorderColor: "#00000000",
    transitionDuration: "{transition.duration}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/overlaybadge.ts
var overlaybadge_default = {
  root: {
    outline: {
      color: "{content.background}",
      width: "0.142857rem"
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/selectbutton.ts
var selectbutton_default = {
  root: {
    borderRadius: "{form.field.border.radius}"
  },
  colorScheme: {
    dark: {
      root: {
        invalidBorderColor: "{form.field.invalid.border.color}"
      }
    },
    light: {
      root: {
        invalidBorderColor: "{form.field.invalid.border.color}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/togglebutton.ts
var togglebutton_default = {
  icon: {
    disabledColor: "{form.field.disabled.color}"
  },
  root: {
    lg: {
      padding: "var(--sc-cmp-togglebutton-lg-padding)",
      fontSize: "{form.field.lg.font.size}"
    },
    sm: {
      padding: "var(--sc-cmp-togglebutton-sm-padding)",
      fontSize: "{form.field.sm.font.size}"
    },
    gap: "var(--sc-cmp-togglebutton-gap)",
    padding: "var(--sc-cmp-togglebutton-padding)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    fontWeight: "500",
    borderRadius: "{content.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    disabledBorderColor: "{form.field.disabled.background}"
  },
  content: {
    lg: {
      padding: "var(--sc-cmp-togglebutton-content-lg-padding-y) var(--sc-cmp-togglebutton-content-lg-padding-x)"
    },
    sm: {
      padding: "var(--sc-cmp-togglebutton-content-sm-padding-y) var(--sc-cmp-togglebutton-content-sm-padding-x)"
    },
    padding: "var(--sc-cmp-togglebutton-content-padding-y) var(--sc-cmp-togglebutton-content-padding-x)",
    borderRadius: "{content.border.radius}",
    checkedShadow: "0 0.071429rem 0.142857rem 0 #0000000a, 0 0.071429rem 0.142857rem 0 #00000005"
  },
  colorScheme: {
    dark: {
      icon: {
        color: "{surface.400}",
        hoverColor: "{surface.300}",
        checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
      },
      root: {
        color: "{surface.400}",
        background: "{surface.950}",
        hoverColor: "{surface.300}",
        borderColor: "{surface.950}",
        checkedColor: "{surface.0}",
        hoverBackground: "{surface.950}",
        checkedBackground: "{surface.950}",
        checkedBorderColor: "{surface.950}"
      },
      content: {
        checkedBackground: "{surface.800}"
      }
    },
    light: {
      icon: {
        color: "var(--sc-cmp-togglebutton-icon-color)",
        hoverColor: "var(--sc-cmp-togglebutton-icon-hover-color)",
        checkedColor: "var(--sc-cmp-togglebutton-icon-checked-color)"
      },
      root: {
        color: "{surface.500}",
        background: "{surface.100}",
        hoverColor: "{surface.700}",
        borderColor: "{surface.100}",
        checkedColor: "{surface.900}",
        hoverBackground: "{surface.100}",
        checkedBackground: "{surface.100}",
        checkedBorderColor: "{surface.100}"
      },
      content: {
        checkedBackground: "var(--sc-cmp-togglebutton-content-checked-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/toggleswitch.ts
var toggleswitch_default = {
  root: {
    gap: "var(--sc-cmp-toggleswitch-gap)",
    width: "var(--sc-cmp-toggleswitch-width)",
    height: "var(--sc-cmp-toggleswitch-height)",
    shadow: "var(--sc-cmp-toggleswitch-shadow)",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    borderColor: "#00000000",
    borderWidth: "0.071429rem",
    borderRadius: "2.142857rem",
    slideDuration: "0.2s",
    hoverBorderColor: "#00000000",
    checkedBorderColor: "#00000000",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{transition.duration}",
    checkedHoverBorderColor: "#00000000"
  },
  handle: {
    size: "var(--sc-cmp-toggleswitch-handle-size)",
    borderRadius: "var(--sc-cmp-toggleswitch-handle-border-radius)"
  },
  colorScheme: {
    dark: {
      root: {
        background: "{surface.700}",
        hoverBackground: "{surface.600}",
        checkedBackground: "{primary.color}",
        disabledBackground: "{surface.600}",
        checkedHoverBackground: "{primary.hover.color}"
      },
      handle: {
        color: "{surface.900}",
        background: "{surface.400}",
        hoverColor: "{surface.800}",
        checkedColor: "{primary.color}",
        hoverBackground: "{surface.300}",
        checkedBackground: "{surface.900}",
        checkedHoverColor: "{primary.hover.color}",
        disabledBackground: "{surface.900}",
        checkedHoverBackground: "{surface.900}"
      }
    },
    light: {
      root: {
        background: "{surface.300}",
        hoverBackground: "{surface.400}",
        checkedBackground: "{primary.color}",
        disabledBackground: "{form.field.disabled.background}",
        checkedHoverBackground: "{primary.hover.color}"
      },
      handle: {
        color: "{text.muted.color}",
        background: "var(--sc-cmp-toggleswitch-handle-background)",
        hoverColor: "{text.color}",
        checkedColor: "{primary.color}",
        hoverBackground: "var(--sc-cmp-toggleswitch-handle-hover-background)",
        checkedBackground: "var(--sc-cmp-toggleswitch-handle-checked-background)",
        checkedHoverColor: "{primary.hover.color}",
        disabledBackground: "{form.field.disabled.color}",
        checkedHoverBackground: "var(--sc-cmp-toggleswitch-handle-checked-hover-background)"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/cascadeselect.ts
var cascadeselect_default = {
  list: {
    gap: "{list.gap}",
    padding: "{list.padding}",
    mobileIndent: "var(--sc-cmp-cascadeselect-list-mobile-indent)"
  },
  root: {
    lg: {
      fontSize: "{form.field.lg.font.size}",
      paddingX: "{form.field.lg.padding.x}",
      paddingY: "{form.field.lg.padding.y}"
    },
    sm: {
      fontSize: "{form.field.sm.font.size}",
      paddingX: "{form.field.sm.padding.x}",
      paddingY: "{form.field.sm.padding.y}"
    },
    color: "{form.field.color}",
    shadow: "var(--sc-cmp-cascadeselect-shadow)",
    paddingX: "{form.field.padding.x}",
    paddingY: "{form.field.padding.y}",
    focusRing: {
      color: "{form.field.focus.ring.color}",
      style: "{form.field.focus.ring.style}",
      width: "{form.field.focus.ring.width}",
      offset: "{form.field.focus.ring.offset}",
      shadow: "none"
    },
    background: "{form.field.background}",
    borderColor: "{form.field.border.color}",
    borderRadius: "{form.field.border.radius}",
    disabledColor: "{form.field.disabled.color}",
    filledBackground: "{form.field.filled.background}",
    focusBorderColor: "{form.field.focus.border.color}",
    hoverBorderColor: "{form.field.hover.border.color}",
    placeholderColor: "{form.field.placeholder.color}",
    disabledBackground: "{form.field.disabled.background}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    transitionDuration: "{form.field.transition.duration}",
    filledFocusBackground: "{form.field.filled.focus.background}",
    filledHoverBackground: "{form.field.filled.hover.background}",
    invalidPlaceholderColor: "{form.field.invalid.placeholder.color}"
  },
  option: {
    icon: {
      size: "var(--sc-cmp-cascadeselect-option-icon-size)",
      color: "{list.option.icon.color}",
      focusColor: "{list.option.icon.focus.color}"
    },
    color: "{list.option.color}",
    padding: "{list.option.padding}",
    focusColor: "{list.option.focus.color}",
    borderRadius: "{list.option.border.radius}",
    selectedColor: "{list.option.selected.color}",
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    selectedFocusBackground: "{list.option.selected.focus.background}"
  },
  overlay: {
    color: "{overlay.select.color}",
    shadow: "var(--sc-cmp-cascadeselect-overlay-shadow)",
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}"
  },
  dropdown: {
    color: "{form.field.icon.color}",
    width: "var(--sc-cmp-cascadeselect-dropdown-width)"
  },
  clearIcon: {
    color: "{form.field.icon.color}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/confirmdialog.ts
var confirmdialog_default = {
  icon: {
    size: "var(--sc-cmp-confirmdialog-icon-size)",
    color: "{overlay.modal.color}"
  },
  content: {
    gap: "var(--sc-cmp-confirmdialog-content-gap)"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/progressspinner.ts
var progressspinner_default = {
  colorScheme: {
    dark: {
      root: {
        colorOne: "{red.400}",
        colorTwo: "{blue.400}",
        colorFour: "{yellow.400}",
        colorThree: "{green.400}"
      }
    },
    light: {
      root: {
        colorOne: "{red.500}",
        colorTwo: "{blue.500}",
        colorFour: "{yellow.500}",
        colorThree: "{green.500}"
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/virtualscroller.ts
var virtualscroller_default = {
  loader: {
    icon: {
      size: "var(--sc-cmp-virtualscroller-loader-icon-size)"
    },
    mask: {
      color: "{text.muted.color}",
      background: "{content.background}"
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/organizationchart.ts
var organizationchart_default = {
  node: {
    color: "{content.color}",
    padding: "var(--sc-cmp-organizationchart-node-padding-y) var(--sc-cmp-organizationchart-node-padding-x)",
    background: "{content.background}",
    hoverColor: "{content.hover.color}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
    selectedColor: "{highlight.color}",
    hoverBackground: "{content.hover.background}",
    toggleablePadding: "var(--sc-cmp-organizationchart-node-toggleable-padding-top) var(--sc-cmp-organizationchart-node-toggleable-padding-right) var(--sc-cmp-organizationchart-node-toggleable-padding-bottom) var(--sc-cmp-organizationchart-node-toggleable-padding-left)",
    selectedBackground: "{highlight.background}"
  },
  root: {
    gutter: "var(--sc-cmp-organizationchart-gutter)",
    transitionDuration: "{transition.duration}"
  },
  connector: {
    color: "{content.border.color}",
    height: "1.714286rem",
    borderRadius: "{content.border.radius}"
  },
  nodeToggleButton: {
    size: "var(--sc-cmp-organizationchart-node-toggle-button-size)",
    color: "{text.muted.color}",
    focusRing: {
      color: "{focus.ring.color}",
      style: "{focus.ring.style}",
      width: "{focus.ring.width}",
      offset: "{focus.ring.offset}",
      shadow: "none"
    },
    background: "{content.background}",
    hoverColor: "{text.color}",
    borderColor: "{content.border.color}",
    borderRadius: "var(--sc-cmp-organizationchart-node-toggle-button-border-radius)",
    hoverBackground: "{content.hover.background}"
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/extend.ts
var extend_default = {
  app: {
    typography: {
      sm: {
        fontSize: "var(--sc-font-size-100)",
        lineHeight: "var(--sc-line-height-100)"
      },
      md: {
        fontSize: "var(--sc-font-size-200)",
        lineHeight: "var(--sc-line-height-200)"
      },
      lg: {
        fontSize: "var(--sc-font-size-300)",
        lineHeight: "var(--sc-line-height-300)"
      }
    },
    toggleswitch: {
      md: {
        width: "var(--sc-scale-2-5)",
        height: "var(--sc-scale-1-5)",
        gap: "var(--sc-scale-0-25)",
        handle: {
          size: "var(--sc-scale-1)",
          borderRadius: "var(--sc-scale-0-5)"
        }
      }
    }
  }
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/rem-scale.ts
var DESIGN_REM_BASE_PX = 14;
var BROWSER_REM_BASE_PX = 16;
var REM_SCALE = DESIGN_REM_BASE_PX / BROWSER_REM_BASE_PX;
var REM_VALUE_PATTERN = /(-?\d*\.?\d+)rem\b/g;
var formatRem = (value) => {
  const rounded = Number(value.toFixed(6));
  return rounded === 0 ? "0" : `${rounded}rem`;
};
var fromDesignRem = (value) => formatRem(value * REM_SCALE);
var fromDesignPx = (value) => formatRem(value / BROWSER_REM_BASE_PX);
var normalizeString = (value) => value.replace(REM_VALUE_PATTERN, (_, amount) => fromDesignRem(Number(amount)));
var normalizeDesignRem = (value) => {
  if (typeof value === "string") {
    return normalizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDesignRem(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeDesignRem(item)])
    );
  }
  return value;
};

// projects/ui-smartcontact/src/lib/theme/sc-preset/css.ts
var token = (dt, key, fallback) => `${dt(key, fallback) ?? fallback}`;
var mdTypographySelectors = [
  ".p-component.p-button",
  ".p-component.p-inputtext",
  ".p-component.p-textarea",
  ".p-datepicker-day-view",
  ".p-datepicker-time-picker span",
  ".p-editor .ql-container",
  ".p-editor .ql-snow .ql-editor h4",
  ".p-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before",
  ".p-select .p-select-label",
  ".p-multiselect .p-multiselect-label",
  ".p-treeselect .p-treeselect-label",
  ".p-cascadeselect .p-cascadeselect-label",
  ".p-autocomplete .p-autocomplete-input-multiple",
  ".p-autocomplete .p-autocomplete-input-chip input",
  ".p-terminal .p-terminal-prompt-value",
  ".p-component.p-togglebutton",
  ".p-select-option",
  ".p-multiselect-option",
  ".p-listbox-option",
  /* Etiquetas: ya leían la rampa antes de DD-91. */
  ".p-chip",
  ".p-toast-summary",
  ".p-breadcrumb-item-label",
  ".p-contextmenu-item-label"
];
var smTypographySelectors = [
  ".p-component.p-button-sm",
  ".p-component.p-inputtext-sm",
  ".p-component.p-textarea-sm",
  ".p-select.p-select-sm .p-select-label",
  ".p-multiselect.p-multiselect-sm .p-multiselect-label",
  ".p-treeselect.p-treeselect-sm .p-treeselect-label",
  ".p-cascadeselect.p-cascadeselect-sm .p-cascadeselect-label",
  ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-multiple",
  ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-chip input",
  ".p-component.p-togglebutton-sm",
  /* Etiquetas: ya leían la rampa antes de DD-91. */
  ".p-tag",
  ".p-toast-detail"
];
var lgTypographySelectors = [
  ".p-component.p-button-lg",
  ".p-component.p-inputtext-lg",
  ".p-component.p-textarea-lg",
  ".p-select.p-select-lg .p-select-label",
  ".p-multiselect.p-multiselect-lg .p-multiselect-label",
  ".p-treeselect.p-treeselect-lg .p-treeselect-label",
  ".p-cascadeselect.p-cascadeselect-lg .p-cascadeselect-label",
  ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-multiple",
  ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-chip input",
  ".p-component.p-togglebutton-lg"
];
var typographyRule = (selectors, dt, size, fontSizeFallback, lineHeightFallback) => `${selectors.join(",\n")} {
    font-size: ${token(dt, `app.typography.${size}.font.size`, fontSizeFallback)};
    line-height: ${token(dt, `app.typography.${size}.line.height`, lineHeightFallback)};
}`;
var baseTableCss = () => `
sc-datatable .p-datatable-thead > tr > th {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-semibold);
}

sc-datatable .p-datatable-tbody > tr > td {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-regular);
}
`;
var emptyCaptionCss = () => `
sc-datatable .p-datatable-header:empty {
    display: none;
}
`;
var LIST = "sc-datatable.sc-datatable--list";
var listBehaviorCss = () => `
${LIST} .p-datatable-table {
    table-layout: fixed;
}

${LIST} .p-datatable-tbody > tr > td {
    position: relative;
}

${LIST} .p-datatable-tbody > tr {
    transition: background var(--sc-transition-fast) var(--sc-easing-default);
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable {
    cursor: pointer;
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable:hover,
${LIST} .p-datatable-tbody > tr.p-selectable-row:hover {
    background: var(--sc-bg-default);
}

${LIST} .p-datatable-tbody > tr:not(.sc-row--clickable):not(.p-selectable-row):hover {
    background: transparent;
}

${LIST} .p-datatable-tbody > tr.p-datatable-row-selected {
    background: var(--sc-bg-secondary-hover);
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) {
    background: none;
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) > td {
    border-bottom: 0;
}
`;
var tagOneLineCss = () => `
.p-component.p-tag {
    max-width: 100%;
}

.p-tag .p-tag-label {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`;
var STICKY = "sc-datatable.sc-datatable--sticky-header > p-table";
var stickyHeaderCss = () => `
${STICKY} > .p-datatable-table-container {
    overflow: visible !important;
    isolation: isolate;
}

${STICKY} > .p-datatable-table-container > .p-datatable-table > .p-datatable-thead {
    inset-block-start: 0;
    z-index: var(--sc-z-sticky);
}
`;
var scrollableScrollbarCss = () => `
/* Ajustada a sus filas: cada caja encoge hasta el alto que le dejan, y el contenedor hace scroll. */
sc-datatable.sc-datatable--fit > p-table {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    min-height: 0;
}

sc-datatable.sc-datatable--fit > p-table > .p-datatable-table-container {
    flex: 0 1 auto;
    min-height: 0;
}

sc-datatable.sc-datatable--fill > p-table {
    flex: 1 1 auto;
    min-height: 0;
}

/* El hueco de la barra se reserva a LOS DOS lados: las rayas de las filas y de la cabecera quedan igual de
 * separadas del borde a izquierda y derecha (Rafa, 2026-09-14: \xABtiene que ser sim\xE9trico\xBB). Solo en la caja
 * que hace scroll: con lista virtual es el scroller, y reservarlo tambi\xE9n en el contenedor lo duplicaba. */
sc-datatable.sc-datatable--scroll:not(.sc-datatable--fill) > p-table > .p-datatable-table-container,
sc-datatable.sc-datatable--fill .p-virtualscroller {
    scrollbar-gutter: stable both-edges;
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar {
    width: var(--sc-spacing-0-75);
    height: var(--sc-spacing-0-75);
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar-track,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar-track {
    margin-block-start: var(--sc-datatable-thead-height, 0);
    background: transparent;
}

sc-datatable.sc-datatable--scroll > p-table > .p-datatable-table-container::-webkit-scrollbar-thumb,
sc-datatable.sc-datatable--scroll .p-virtualscroller::-webkit-scrollbar-thumb {
    background: var(--sc-border-strong);
    border-radius: var(--sc-radius-full);
}
`;
var buttonMotionCss = () => `
.p-component.p-button {
    transition:
        background-color 100ms ease,
        border-color 100ms ease,
        color 100ms ease,
        box-shadow 100ms ease;
}

.p-component.p-button:active {
    transform: scale(0.98);
    transition-duration: 0ms;
}

.p-component.p-button:disabled,
.p-component.p-button[aria-disabled="true"] {
    transform: none;
    cursor: not-allowed;
}

.p-component.p-button:disabled:active,
.p-component.p-button[aria-disabled="true"]:active {
    transform: none;
}

@media (prefers-reduced-motion: reduce) {
    .p-component.p-button {
        transition: none;
    }

    .p-component.p-button:active {
        transform: none;
    }
}
`;
var dangerMenuItemCss = () => `
.sc-menu-item--danger .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-icon {
    color: var(--sc-text-danger);
}

.sc-menu-item--danger .p-menu-item-content:hover {
    background: var(--sc-bg-danger-subtle);
}

.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-icon {
    color: var(--sc-text-danger);
}
`;
var presetCss = ({ dt } = {}) => `
${typographyRule(
  mdTypographySelectors,
  dt,
  "md",
  fromDesignPx(14),
  /* 20, no 21: DD-39 unificó el line-height md. El fallback solo entra si la variable
   * no resuelve, y hasta ahora contradecía al token — habría reintroducido justo el
   * 21 que costó semanas cazar. */
  fromDesignPx(20)
)}

${typographyRule(smTypographySelectors, dt, "sm", fromDesignPx(12), fromDesignPx(18))}

${typographyRule(lgTypographySelectors, dt, "lg", fromDesignPx(16), fromDesignPx(24))}

.p-button .p-button-icon {
    line-height: 1;
}

${baseTableCss()}
${emptyCaptionCss()}
${listBehaviorCss()}
${stickyHeaderCss()}
${scrollableScrollbarCss()}
${tagOneLineCss()}

${buttonMotionCss()}

${dangerMenuItemCss()}
`;
var css_default = presetCss;

// projects/ui-smartcontact/src/lib/theme/sc-preset/index.ts
var preset = t($r, normalizeDesignRem({
  ...base_default,
  components: {
    tag: tag_default,
    card: card_default,
    chip: chip_default,
    dock: dock_default,
    knob: knob_default,
    menu: menu_default,
    tabs: tabs_default,
    tree: tree_default,
    badge: badge_default,
    image: image_default,
    panel: panel_default,
    toast: toast_default,
    avatar: avatar_default,
    button: button_default,
    dialog: dialog_default,
    drawer: drawer_default,
    editor: editor_default,
    rating: rating_default,
    ripple: ripple_default,
    select: select_default,
    slider: slider_default,
    blockui: blockui_default,
    divider: divider_default,
    inplace: inplace_default,
    listbox: listbox_default,
    menubar: menubar_default,
    message: message_default,
    popover: popover_default,
    stepper: stepper_default,
    toolbar: toolbar_default,
    tooltip: tooltip_default,
    carousel: carousel_default,
    checkbox: checkbox_default,
    dataview: dataview_default,
    fieldset: fieldset_default,
    galleria: galleria_default,
    inputotp: inputotp_default,
    megamenu: megamenu_default,
    password: password_default,
    picklist: picklist_default,
    skeleton: skeleton_default,
    splitter: splitter_default,
    terminal: terminal_default,
    textarea: textarea_default,
    timeline: timeline_default,
    accordion: accordion_default,
    iconfield: iconfield_default,
    iftalabel: iftalabel_default,
    inputtext: inputtext_default,
    orderlist: orderlist_default,
    paginator: paginator_default,
    panelmenu: panelmenu_default,
    speeddial: speeddial_default,
    treetable: treetable_default,
    breadcrumb: breadcrumb_default,
    datepicker: datepicker_default,
    fileupload: fileupload_default,
    floatlabel: floatlabel_default,
    inputgroup: inputgroup_default,
    metergroup: metergroup_default,
    tieredmenu: tieredmenu_default,
    treeselect: treeselect_default,
    contextmenu: contextmenu_default,
    inputnumber: inputnumber_default,
    multiselect: multiselect_default,
    progressbar: progressbar_default,
    radiobutton: radiobutton_default,
    scrollpanel: scrollpanel_default,
    splitbutton: splitbutton_default,
    autocomplete: autocomplete_default,
    confirmpopup: confirmpopup_default,
    imagecompare: imagecompare_default,
    overlaybadge: overlaybadge_default,
    selectbutton: selectbutton_default,
    togglebutton: togglebutton_default,
    toggleswitch: toggleswitch_default,
    cascadeselect: cascadeselect_default,
    confirmdialog: confirmdialog_default,
    progressspinner: progressspinner_default,
    virtualscroller: virtualscroller_default,
    organizationchart: organizationchart_default
  },
  extend: extend_default,
  css: css_default
}));
var sc_preset_default = preset;

// <stdin>
var stdin_default = t(sc_preset_default, { extend: { "primitive": { "typography": { "font": { "weight": { "regular": "var(--sc-font-weight-regular)", "medium": "var(--sc-font-weight-medium)", "semibold": "var(--sc-font-weight-semibold)", "bold": "var(--sc-font-weight-bold)" }, "size": { "100": "var(--sc-font-size-100)", "200": "var(--sc-font-size-200)", "300": "var(--sc-font-size-300)", "400": "var(--sc-font-size-400)", "450": "var(--sc-font-size-450)", "500": "var(--sc-font-size-500)", "650": "var(--sc-font-size-650)", "800": "var(--sc-font-size-800)", "900": "var(--sc-font-size-900)" }, "family": { "inter": "Inter" }, "style": { "regular": "Regular", "medium": "Medium", "semibold": "Semi Bold", "bold": "Bold" } }, "line": { "height": { "100": "var(--sc-line-height-100)", "200": "var(--sc-line-height-200)", "300": "var(--sc-line-height-300)", "450": "var(--sc-line-height-450)", "500": "var(--sc-line-height-500)", "650": "var(--sc-line-height-650)", "800": "var(--sc-line-height-800)", "900": "var(--sc-line-height-900)" } } } }, "semantic": { "text": { "accent": "var(--sc-text-accent)" }, "presence": { "available": "{green.400}", "unavailable": "{red.400}", "administrative": "{red.600}", "talking": "{cyan.400}", "wrapup": "{cyan.600}" } }, "component": { "custommodal": { "background": "{overlay.modal.background}", "color": "{overlay.modal.color}", "border": { "color": "{overlay.modal.border.color}", "radius": "{overlay.modal.border.radius}" }, "header": { "padding": "{overlay.modal.padding}", "gap": "var(--sc-scale-0-5)" }, "subheader": { "padding": "{overlay.modal.padding}", "gap": "var(--sc-scale-0-5)", "color": "{form.field.float.label.color}" }, "title": { "font": { "size": "{primitive.typography.font.size.400}", "weight": "{primitive.typography.font.weight.semibold}" } }, "footer": { "gap": "var(--sc-scale-0-5)", "padding": { "top": "0", "right": "{overlay.modal.padding}", "bottom": "{overlay.modal.padding}", "left": "{overlay.modal.padding}" } }, "content": { "padding": { "top": "0", "right": "{overlay.modal.padding}", "bottom": "{overlay.modal.padding}", "left": "{overlay.modal.padding}" } }, "error": { "background": "#ef444429", "color": "{red.500}", "border": { "color": "#b91c1c5c" } }, "warn": { "background": "#eab30829", "color": "{yellow.300}", "border": { "color": "#a162075c" } } }, "dialog": { "icon": { "color": "var(--sc-dialog-head-icon-fg)" } } } } });
export {
  stdin_default as default
};
