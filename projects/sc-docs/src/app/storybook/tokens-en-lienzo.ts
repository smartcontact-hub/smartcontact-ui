/**
 * El oscuro LOCAL del lienzo (`.sc-dark` en `.sb-canvas__pane`, no en `<html>`) necesita que las variables encadenadas se
 * resuelvan DENTRO del lienzo.
 *
 * Por qué: una variable se resuelve donde se declara y los hijos heredan el valor ya resuelto. PrimeNG declara sus tokens
 * de componente en `:root` (el fondo del Select apunta al fondo de campo de formulario), así que se resuelven en la raíz,
 * que está en claro. El `.sc-dark` del lienzo cambia el fondo de campo, pero el del Select ya llegó resuelto a blanco:
 * 19 de 58 miniaturas oscuras salían con los campos blancos (medido el 2026-10-30, `sc-select`: fondo 255 con el oscuro
 * local, 9 con el global).
 *
 * Arreglo: una hoja que vuelve a declarar en `.sb-canvas__pane` cada variable de la raíz cuyo valor lleva `var(`, con su
 * texto tal cual, para que se resuelva otra vez dentro del lienzo, con lo que allí valga. Se saltan las que ya declara
 * una regla `.sc-dark`: esas las pone el tema oscuro y no hay que pisarlas. PrimeNG mete el estilo de cada componente la
 * primera vez que se pinta, por eso la hoja se rehace cuando cambia el `<head>`. Es cosa de la doc: las apps ponen el
 * oscuro en `<html>`, donde la cadena se resuelve bien.
 */

const ID = 'sc-docs-tokens-en-lienzo';
const RAIZ = new Set([':root', ':host', 'html']);

let instalado = false;
let pendiente = false;

/** ¿La regla es de la raíz? (`:root`, `:root, :host`, `html`). */
function esDeRaiz(selector: string): boolean {
  const partes = selector.split(',').map((p) => p.trim());
  return partes.length > 0 && partes.every((p) => RAIZ.has(p));
}

function recorrer(reglas: CSSRuleList, visitar: (r: CSSStyleRule) => void): void {
  for (const r of Array.from(reglas)) {
    if (r instanceof CSSStyleRule) visitar(r);
    // @layer, @media, @supports: se entra; lo demás no tiene reglas de estilo.
    else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) recorrer((r as CSSGroupingRule).cssRules, visitar);
  }
}

function construir(): string {
  const deRaiz = new Map<string, string>();
  const delOscuro = new Set<string>();
  for (const hoja of Array.from(document.styleSheets)) {
    if (hoja.ownerNode instanceof HTMLStyleElement && hoja.ownerNode.id === ID) continue;
    let reglas: CSSRuleList;
    try {
      reglas = hoja.cssRules;
    } catch {
      continue;
    }
    recorrer(reglas, (r) => {
      const sel = r.selectorText ?? '';
      const oscuro = sel.includes('sc-dark');
      const raiz = !oscuro && esDeRaiz(sel);
      if (!oscuro && !raiz) return;
      for (let i = 0; i < r.style.length; i++) {
        const prop = r.style.item(i);
        if (!prop.startsWith('--')) continue;
        if (oscuro) delOscuro.add(prop);
        else {
          const valor = r.style.getPropertyValue(prop).trim();
          if (valor.includes('var(')) deRaiz.set(prop, valor);
        }
      }
    });
  }
  const decl: string[] = [];
  for (const [prop, valor] of deRaiz) if (!delOscuro.has(prop)) decl.push(`${prop}:${valor};`);
  return `.sb-canvas__pane{${decl.join('')}}`;
}

function rehacer(): void {
  pendiente = false;
  let hoja = document.getElementById(ID) as HTMLStyleElement | null;
  const css = construir();
  if (hoja?.textContent === css) return;
  if (!hoja) {
    hoja = document.createElement('style');
    hoja.id = ID;
    document.head.appendChild(hoja);
  }
  hoja.textContent = css;
}

function programar(): void {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(rehacer);
}

/** Instala la hoja y la mantiene al día. Idempotente: lo llama cada lienzo, actúa el primero. */
export function anclarTokensEnLienzo(): void {
  if (instalado) return;
  instalado = true;
  programar();
  // Escribir la propia hoja también es un cambio del `<head>`: provoca una vuelta más, que sale sin tocar nada porque el
  // texto ya es el mismo.
  new MutationObserver(programar).observe(document.head, { childList: true, subtree: true, characterData: true });
}
