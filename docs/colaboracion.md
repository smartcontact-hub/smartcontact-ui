# Colaboración + arranque de diseño — Smart Contact DS

> Tu guía para diseñar en el sistema y mantenerte alineada con el equipo. El manual a fondo
> (todos los casos, las 7 capas de tokens, PrimeNG…) está en [`guia-tokens.md`](guia-tokens.md).

---

## ⭐ El flujo, en una hoja (ten esto a mano)

```
   CADA VEZ QUE QUIERAS CAMBIAR ALGO
   ─────────────────────────────────
   1. Edítalo en el Kit de Figma (zona Custom)
   2. Plugin Theme Designer:  Genera tema → Push Tokens
   3. Espera ~5 min  (un robot lo aplica y lo verifica solo)
   4. Míralo en Preview:  design-tokens-sync.sc-demo.pages.dev
                      y   design-tokens-sync.sc-supervisor.pages.dev
   5. ¿Te gusta? → pasa a producción (merge del PR) → sc-demo / sc-supervisor .pages.dev

   ANTES DE EMPEZAR LA SESIÓN:  doble-click en Actualizar.command  (te trae lo último del equipo)
```

**Tres reglas que no fallan:**
1. **Abre con `Actualizar.command`** — así tu copia y la del equipo van a una.
2. **El color cámbialo en su sitio de marca** (`primary`, `surface`…), no en un componente suelto.
3. **Nunca borres la rama `design-tokens-sync`** — el plugin la necesita para empujar.

---

## La idea

La apariencia del producto (colores, tamaños, radios, tipografía) no vive desperdigada por el
código: vive en **un solo sitio**, y todo el producto la hereda. Y ese sitio lo mandas **tú,
desde Figma**.

```
        TÚ                      EL SISTEMA              EL PRODUCTO
     (Figma)                 (hace el trabajo)         (lo que ve la gente)
   cambias un  ── push ──→   lo aplica y lo   ──────→  se actualiza
   color/tamaño              verifica solo             en vivo
```

Cambias algo en Figma, le das a un botón, y a los pocos minutos lo ves aplicado. Sin tocar código.

---

## El mapa: 3 mundos + tus links (guárdalos)

| Mundo | Qué es | Tus links |
|---|---|---|
| **① Figma** | El Kit **"Smart-Contact Prime"** (donde editas) + el plugin **Theme Designer** | (en Figma) |
| **② GitHub** | El repositorio (guarda y aplica los cambios) · `smartcontact-hub/smartcontact-ui` | rama `main` = producción · rama `design-tokens-sync` = tus pruebas |
| **③ Cloudflare** | Las webs donde miras el resultado | ver tabla ↓ |

| | Producción (`main`) | Preview (tus pruebas) |
|---|---|---|
| **Showcase** (componentes) | `sc-demo.pages.dev` | `design-tokens-sync.sc-demo.pages.dev` |
| **App real** (Supervisor) | `sc-supervisor.pages.dev` | `design-tokens-sync.sc-supervisor.pages.dev` |

Tus cambios se miran en **Preview**. Cuando te gustan y pasan a `main`, salen en **Producción**.

---

## Tu setup (se hace UNA vez)

El plugin necesita una "llave" tuya (un token de GitHub) para guardar tus cambios.

**a) Crea tu token** — GitHub → tu foto → **Settings** → **Developer settings** → **Personal access
tokens (classic)** → **Generate new token** → nombre "Theme Designer", permiso **`repo`**, generar.
Cópialo y guárdalo en sitio seguro. Es como una contraseña: **nunca lo pegues en un chat.**

**b) Configura el plugin** (panel *GitHub Settings* del Theme Designer):

| Campo | Valor |
|---|---|
| Owner / Organization | `smartcontact-hub` |
| Repository | `smartcontact-ui` |
| Branch | `design-tokens-sync` |
| Tokens File | `projects/design-tokens/scripts/kit-export-dtcg.json` |
| Token | *(tu token del paso a)* |

> ⚠️ **El token CADUCA** (GitHub le pone fecha al crearlo). Si un día el push dice **"Bad credentials"**,
> es eso: caducó. Crea otro igual y pégalo aquí de nuevo. Al crearlo, ponle la **caducidad más larga**
> que te deje, para que tarde en volver a pasar.

---

## Mantente alineada con el equipo (git, sin miedo)

Tienes el repo clonado en tu Mac (es lo que mueve los docks). Para tener lo último del equipo:

1. **Antes de empezar: doble-click en `Actualizar.command`** (trae lo último; es un `git pull`).
2. **Tú normalmente NO subes nada por git.** Tus cambios viajan por **Figma → Push Tokens** (el plugin).
   El código lo sube el equipo de desarrollo.

   | Cambio | Cómo viaja | Quién |
   |---|---|---|
   | Tokens (color, tamaño…) | Figma → Push Tokens | **Tú** |
   | Código (componentes, lógica) | git (push / PR) | **Dev team** |

3. **Si al actualizar sale un "conflicto" o algo raro: no pelees** — avisa y se resuelve en un minuto
   (no se rompe nada; solo significa que dos copias tocaron lo mismo).

---

## Preview LOCAL al instante (los docks)

Además de los links de Cloudflare (~5 min), tienes un preview en tu Mac que se recarga **al instante**.
Son doble-clicks en la carpeta `preview/`:

| Doble-click | Qué abre |
|---|---|
| `preview-componentes.command` | La galería de componentes (sc-demo) |
| `preview-supervisor.command` | La app real (Supervisor) |
| `Actualizar.command` | Trae lo último del equipo (no abre web) |

1. Doble-click. **La 1ª vez compila (~2 min)**, luego abre el navegador solo.
2. Cambias un token en Figma → **Push Tokens** → en **~12 s** el navegador se recarga con tu cambio.
3. Para parar: cierra la ventana negra.
- La 1ª vez macOS pide **clic derecho → Abrir** (solo esa vez). Truco: arrastra el `.command` al Dock.

| | Local (docks) | Link de Cloudflare |
|---|---|---|
| Velocidad | Al instante (~12 s) | ~5 min |
| Quién lo ve | Solo tú (tu Mac) | Compartible (mandas el link) |
| Para qué | Experimentar a tope | Enseñar / validar con el equipo |

---

## Los botones del plugin (la duda típica)

| Botón | Qué manda | ¿Lo usas? |
|---|---|---|
| **Push Tokens** | Tus valores (colores, tamaños…) — el archivo que lee nuestro sistema | ✅ **SÍ, este es EL que importa** |
| **Push Theme** | Un tema de PrimeNG que el plugin genera aparte | ❌ No hace falta (lo ignoramos) |
| **Genera tema** | Refresca desde el estado actual de Figma | 👍 Dale antes de Push, para coger lo último |

Regla: **Genera tema → Push Tokens.** Si por costumbre le das también a Push Theme, no pasa nada.

---

## Qué tocar y qué evitar

**✅ Toca tranquila** (Kit, zona "Custom"): colores de marca, tamaños, radios, espaciado, tipografía.

**⚠️ Dos tropiezos:**
1. **Cambia el color en su sitio de marca**, no en un componente suelto. Si quieres el botón primario
   rojo, cambia el color `primary` (recolorea todo lo primario). Tocar "el fondo del botón" suelto
   **no fluye** (es un atajo que el sistema no lee).
2. **Nunca borres `design-tokens-sync`** — sin esa rama, tus push se quedan en el vacío sin avisar.

**🚫 No toques** (es del dev team): el puente interno (`theme/sc-preset/`), el dark mode, ni los
bloques marcados "generado". Si una métrica está mal, se arregla **en Figma**, no en el código.

---

## Si un cambio no aparece

No es culpa tuya — el puente está vivo y vamos conectando piezas. Suele ser que ese tipo de token
aún no está conectado, o un detalle por pulir. **Avisa y lo miramos.** Lo que pones en Figma debe
aparecer; ese es el trato.
