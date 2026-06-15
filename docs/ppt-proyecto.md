# Smart Contact · Design System — Presentación para diseño

> 👋 Bienvenida. Esto es tu **punto de partida**: en una lectura entiendes qué es
> este sistema, cómo trabajar con él desde Figma, y por qué está montado así.
> No hace falta saber programar. Lenguaje normal, ejemplos concretos.
>
> Cuando quieras el manual a fondo (todos los casos, las 7 "plantas" de tokens,
> migraciones de PrimeNG…) está en **[`guia-tokens.md`](guia-tokens.md)**. Esta
> presentación es el resumen operativo; esa guía es la enciclopedia.

---

## 1. La idea en 30 segundos

Smart Contact tiene un **Design System**: la apariencia del producto (colores,
tamaños, radios, tipografía) no vive desperdigada por el código, vive en **un
solo sitio** y todo el producto la hereda.

Y ese sitio lo mandas **tú, desde Figma**.

```
        TÚ                         EL SISTEMA                 EL PRODUCTO
     (Figma)                    (hace el trabajo)            (lo que ve la gente)
   ───────────                  ───────────────             ──────────────────
   cambias un  ───── push ───→  lo aplica solo  ───────→   se actualiza
   color/tamaño                 + lo verifica               en vivo
```

Tu superpoder: **cambias algo en Figma, le das a un botón, y a los pocos minutos
lo ves aplicado en el producto** — sin pedirle nada a nadie, sin tocar código.

---

## 2. El mapa: las piezas y sus links

Hay tres mundos conectados. Te van a hacer falta estos links — **guárdalos**.

```
   ① FIGMA                  ② GITHUB (el repositorio)        ③ CLOUDFLARE (lo vivo)
   ────────                 ─────────────────────────        ──────────────────────
   El Kit + el plugin   →   guarda los cambios y los      →  publica las webs
   (donde diseñas)          aplica con robots                (donde lo ves)
```

**① Figma**
- El Kit de diseño: **"Smart-Contact Prime"** (donde editas los tokens).
- El plugin que conecta Figma con el código: **Theme Designer** (`primeui-figma-plugin-v4`).

**② GitHub** — `github.com/smartcontact-hub/smartcontact-ui` (es público)
- Rama **`main`** = **producción** (lo definitivo, lo que usa la gente).
- Rama **`design-tokens-sync`** = **tu zona de pruebas** (aquí aterrizan tus cambios primero).
- El **PR** ("Pull Request") = la propuesta de llevar un cambio de pruebas → producción.

**③ Cloudflare** — las webs donde miras el resultado:

| | Producción (`main`) | Preview (tus pruebas) |
|---|---|---|
| **Showcase** (los componentes sueltos) | `sc-demo.pages.dev` | `design-tokens-sync.sc-demo.pages.dev` |
| **App real** (el Supervisor) | `sc-supervisor.pages.dev` | `design-tokens-sync.sc-supervisor.pages.dev` |

👉 Cuando hagas un cambio, **lo miras en los links de Preview**. Cuando te gusta y
pasa a `main`, aparece en los de Producción.

---

## 3. Tu setup (se hace UNA vez)

Para que el plugin pueda guardar tus cambios en GitHub, necesita una "llave" tuya.

**a) Crea tu token de GitHub** (tu llave personal)
1. En GitHub: tu foto (arriba a la derecha) → **Settings** → abajo del todo **Developer settings**.
2. **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
3. Ponle un nombre (ej. "Theme Designer"), marca el permiso **`repo`**, y genera.
4. **Copia el token y guárdalo en sitio seguro.** ⚠️ Es como una contraseña:
   **nunca lo pegues en un chat** ni lo compartas. Si se filtra, se revoca y se hace otro.

**b) Configura el plugin** (panel *GitHub Settings* del Theme Designer):

| Campo | Valor |
|---|---|
| Owner / Organization | `smartcontact-hub` |
| Repository | `smartcontact-ui` |
| Branch | `design-tokens-sync` |
| Tokens File | `projects/design-tokens/scripts/kit-export-dtcg.json` |
| Token | *(tu token del paso a)* |

Y listo. Esto no se vuelve a tocar.

---

## 4. Tu día a día (el flujo, paso a paso)

```
   1. Cambias un token        2. En el plugin:         3. Esperas ~5 min
      en el Kit de Figma          Genera tema             (el robot aplica
      (un color, un radio…)       → Push Tokens            y verifica solo)
                                                                │
   6. Si te gusta:            5. Lo miras en          4. ───────┘
      pasa a producción  ←       el link de Preview
      (merge del PR)             (¿se ve como querías?)
```

1. **Cambia el token** en el Kit de Figma (más abajo, *qué tocar y qué no*).
2. En el plugin: **Genera tema** (refresca desde Figma) → **Push Tokens**.
3. El robot (un "workflow" en GitHub) coge tu cambio, lo **aplica al código** y lo
   **verifica** solo. Tarda unos minutos.
4. Cloudflare reconstruye la web de Preview con tu cambio.
5. **Abre el link de Preview** y míralo. ¿Se ve como en Figma? 🎉
6. ¿Te convence? Se lleva a **producción** (un "merge" del PR a `main` — al principio
   lo hace el dev team contigo; tú decides el "sí").

✨ **Lo importante:** tus cambios **no** van directos a producción. Van primero a una
zona de pruebas que **solo tú ves**. A producción pasa **solo lo que te gusta**.

---

## 5. Los botones del plugin (la duda típica)

El plugin puede mandar **dos cosas distintas**. Esto despeja la confusión:

| Botón | Qué manda | ¿Lo usas? |
|---|---|---|
| **Push Tokens** | Tus **valores** (colores, tamaños…) = el archivo que nuestro sistema lee | ✅ **SÍ — este es EL que importa** |
| **Push Theme** | Un "tema" de PrimeNG que el plugin genera aparte | ❌ No hace falta — **nuestro sistema lo ignora** (generamos el nuestro) |
| **Genera tema** | Refresca el tema desde el estado actual de Figma | 👍 Dale antes de Push, para asegurar que coge lo último |

👉 Regla simple: **Genera tema → Push Tokens.** Si por costumbre le das también a
Push Theme, no pasa nada: el sistema lo descarta solo.

*(¿Por qué ignoramos el "tema" del plugin y generamos el nuestro? Lo explica la
sección 7 — es la clave de todo el invento.)*

---

## 6. Por qué es seguro (sin romper nada)

Lo que en la jerga se llama "migration-safe". En cristiano, cuatro redes de seguridad:

1. **Pruebas antes que producción.** Tu cambio aterriza en `design-tokens-sync` (preview),
   nunca directo en `main`. Si algo se ve raro, producción **ni se entera**.
2. **Solo pasa lo que te gusta.** A producción llega cuando tú das el "sí" (el merge del PR).
3. **Tus decisiones de marca están protegidas.** Hay cosas que a propósito hacemos
   distintas del kit estándar de PrimeNG (un gris más oscuro por accesibilidad, un
   dark mode más azulado…). El sistema **las respeta** — un cambio del Kit no te las pisa.
4. **Si algo no cuadra, el sistema CHILLA.** No se corrompe en silencio: si un valor de
   Figma no encaja, el robot pone el cambio en **rojo** y señala exactamente qué. Mejor
   un aviso ruidoso que un bug escondido.

---

## 7. Por qué hay "robots" (generadores) y controles (guardarraíles)

> La pregunta lógica: *"si el plugin ya traduce Figma a código, ¿para qué tanto
> aparato?"*. Aquí está el porqué, ordenado.

**El plugin sí traduce Figma → código… pero a SU idioma.** Te da los valores tal cual
los nombra PrimeNG (`--p-*`), sin hueco para tus decisiones de marca.

**Nosotros montamos una capa PROPIA, `--sc-*`** (tokens "Smart Contact"), por dos motivos:
- **Para divergir a propósito** (ese gris a11y, ese dark azulado) — y que esas decisiones
  **sobrevivan** a cada push, en vez de borrarse.
- **Para que el producto no se rompa** si PrimeNG, en una actualización, renombra algo.

Y entonces, ¿qué es cada pieza del "aparato"? Cada una tiene un trabajo:

| Pieza | Para qué sirve |
|---|---|
| **Generadores** (tamaño, color) | El **puente** que vierte tus valores de Figma en la capa `--sc-*` **solo**. Sin ellos, alguien copiaría los números a mano cada vez. |
| **Parity** (paridad) | **Chilla** si el código deja de cuadrar con Figma. Es el árbitro. |
| **Chivato de contraste (a11y)** | **Chilla** si un cambio deja un texto poco legible (accesibilidad). |
| **Lista DIVERGE** | **Blinda** tus divergencias de marca para que el robot no las pise. |
| **Rama Preview + PR** | Te deja **ver antes de publicar**. |

**En una frase:** todo ese aparato es el **precio de tener marca propia Y que Figma
mande, a la vez.** El plugin solo te da lo segundo; nosotros queremos las dos cosas.
(Si usáramos el idioma de PrimeNG a pelo: cero aparato… pero cero marca propia, y el
producto pegado a PrimeNG.)

---

## 8. Qué tocar y qué evitar (los tropiezos típicos)

**✅ Toca tranquila (en el Kit, zona "Custom"):** colores de marca, tamaños, radios,
espaciado, tipografía. Es justo para lo que existe.

**⚠️ Dos tropiezos que conviene conocer:**

1. **Cambia el color en su sitio "semántico", no en un componente suelto.**
   Si quieres el botón primario rojo, cambia el color **`primary`** (la marca) — y se
   recolorea todo lo primario a la vez. Si en cambio entras a "el fondo del botón" y lo
   tocas ahí suelto, **ese cambio no fluye** (es un atajo que el sistema no lee).
2. **Nunca borres la rama `design-tokens-sync`.** El plugin la necesita para empujar.
   Si desaparece, tus push se quedan en el vacío sin avisar. (Está protegida, pero por si acaso.)

**🚫 No toques** (es del dev team): el "puente" interno (`theme/sc-preset/`), el archivo
de dark mode, ni los bloques marcados "generado" en el código. Si una métrica está mal,
se arregla **en Figma**, no en el código.

*(El detalle largo de "qué planta toca cada cosa" está en [`guia-tokens.md`](guia-tokens.md).)*

---

## 9. Honestidad: el puente funciona, y está vivo

Esto es importante que lo tengas claro desde el principio:

- **El puente funciona.** Hoy ya puedes cambiar tamaños y verlos en el preview sin que
  nadie aplique nada a mano.
- **Es joven y evoluciona.** Estamos terminando de conectar el **color** para que fluya
  igual que el tamaño. Y, como en todo sistema nuevo, **encontramos algún borde y lo
  pulimos** sobre la marcha.
- **Eso es NORMAL, no es que esté roto.** Cada vez que aparece un detalle, lo cerramos y
  el puente queda más sólido. Si algún día cambias algo y no lo ves en el preview, **no
  es culpa tuya** — avísanos y lo miramos (suele ser que ese tipo de token aún no está
  conectado, o un detalle que toca pulir).

La filosofía: que para ti sea **un espejo** — lo que pones en Figma, aparece. Y que
puedas **defender cada decisión**, porque cada una está documentada.

---

## 10. GitHub en 4 palabras (para no perderte)

No necesitas usarlo a fondo, pero te sonarán estos términos:

- **Repositorio (repo):** la carpeta-archivo del proyecto en la nube.
- **Rama (branch):** una "copia paralela". `main` = lo bueno/producción.
  `design-tokens-sync` = donde caen tus pruebas.
- **PR (Pull Request):** la "propuesta" de pasar un cambio de una rama a `main`.
  Es donde se revisa y se aprueba antes de publicar.
- **Dónde miras:** tú, sobre todo, en los **links de Cloudflare** (Preview y Producción).
  En GitHub solo entras si quieres ver el PR.

**Qué NO tocas en GitHub:** nada a mano. Tú operas desde **el plugin** (que empuja por ti)
y miras en **los links**.

---

## 11. Resumen de una hoja (para tener a mano)

```
   CADA VEZ QUE QUIERAS CAMBIAR ALGO:
   ───────────────────────────────────
   1. Edítalo en el Kit de Figma (zona Custom)
   2. Plugin: Genera tema → Push Tokens
   3. Espera ~5 min
   4. Míralo en:  design-tokens-sync.sc-demo.pages.dev
              y   design-tokens-sync.sc-supervisor.pages.dev
   5. ¿Te gusta? → a producción (merge del PR) → sc-demo / sc-supervisor .pages.dev

   RECUERDA:
   · El color cámbialo en "primary/surface…", no en un componente suelto.
   · Nunca borres la rama design-tokens-sync.
   · Si no ves tu cambio: avisa, no es culpa tuya — el puente está vivo.
   · Manual completo → guia-tokens.md
```

**Bienvenida al sistema. A partir de aquí, diseñas tú y el producto te sigue.** ✨
