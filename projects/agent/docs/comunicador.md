# El Comunicador — widget flotante

> **Estado**: carcasa, navbar, **dialpad en reposo** (con selector de grupo desplegable)
> y las **cabeceras de las cuatro secciones** montados en `components/comunicator/`.
> Falta el dialpad EN LLAMADA. Los listados de chat y agentes salen **vacíos en el
> entorno real**, así que se replica el vacío; el de Histórico está montado.

En la app real es un widget arrastrable anclado abajo a la derecha. En `sc-agent` cuelga
del **avatar** del [`agent-footer`](../src/app/components/agent-footer/agent-footer.component.ts).
El estado del agente vive en [`agent-state.service.ts`](../src/app/agent-state.service.ts),
compartido: el footer lo cambia y el Comunicador lo pinta.

⚠️ **Los SVG de la cabecera (chevron y engranaje) van por `mask`, no `background-image`**:
`engranaje.svg` viene con `fill="#1f2429"` y el real lo repinta a blanco por CSS. Con
`background-image` sale invisible sobre la plancha oscura.

## Anatomía

```
.comunicator-shortcut          17.188 × 34.792vw  →  250.3 × 506.6px · radio 21.2px
├── .header-comunicator        chevron (minimizar) + engranaje (Ajustes)
├── .body-comunicator          la sección activa, según pestaña
│   ├── call      → app-calls      (dialpad · tipificación · transferir · finalizar gestión)
│   ├── chat      → app-chats
│   ├── agents    → app-agents
│   ├── contacts  → app-agenda     (NO aparece con todos los permisos)
│   └── history   → app-historic
└── .footer-comunicator        LA NAVBAR
```

La pestaña `contacts` es **condicional**: en el entorno de desarrollo la navbar sale con
**4** iconos, no 5. Depende de la configuración del agente, así que no lo des por fijo.

## La navbar

`height: 11.23%` del widget · `background: #1f2429` · `border-radius: 1.458vw` ·
`justify-content: space-evenly`.

Cada icono es un **SVG de fondo con tres estados**: normal, `:hover:not(.actived)` y
`.actived`. Están en `public/icons/comunicator/`:

| Pestaña | Ficheros | Tamaño |
|---|---|---|
| call | `telefono{,-hover,-actived}.svg` | `1.25vw` |
| chat | `chat{,-hover,-actived}.svg` | `1.25vw` |
| agents | `agentes{,-hover,-actived}.svg` | `1.25vw` |
| contacts | `agenda{,-hover,-actived}.svg` | `1.25vw` |
| history | `historial{,-hover,-actived}.svg` | `1.615 × 1.24vw` (más ancho) |

Encima se superponen dos avisos: `.unread-messages` (mensajes de chat sin leer) y
`.lost-call`, un círculo `#f75454` de `1.302vw` con el número de perdidas.

### La navbar se pone ROJA según el estado del agente

Detalle que solo se ve en vivo y que **enlaza la navbar con el selector de estado del
avatar**:

```css
.makecall-allowedstatus .footer-comunicator { background-color: #762727; }
/* …y además anula los :hover, que vuelven al icono base */
```

La clase `makecall-allowedstatus` se aplica cuando el estado del agente **no** está en
`[1, 14, 15, 16, 17, 19]`, es decir cuando es `INACTIVO (0)` o `INACTIVE_AGENT (18)`.

```
0  INACTIVO                  ← navbar roja
1  ACTIVO
14 POSTCONVERSANDO
15 MANAGE_TICKET
16 ADMINISTRATIVO
17 IN_CONVERSATION
18 INACTIVE_AGENT            ← navbar roja
19 MANAGE_CONVERSATION_LOST
```

O sea: poner «No disponible» en el botón de estado **repinta la navbar**. Las pausas
administrativas (baño, comida, formación) son estado 16 y **no** la ponen roja.

## El dialpad

Plantilla de 24 KB, la segunda más grande del Comunicador. **No es una pantalla, son
varios estados** dentro de `.container-call`:

```
.container-call
├── overlay de TRANSFERENCIA        (según currentCall.transferInfo.status)
├── .body-call
│   ├── .dialpad        ← REPOSO, cuando !callInProgress
│   │   ├── app-keypad                    teclado numérico
│   │   └── .service-group                dropup de nodos + buscador (si hay >4)
│   └── .current-call   ← EN LLAMADA, cuando callInProgress
│       ├── .info-container               grupo + reconocimiento del bot
│       ├── .call-info-container          nombre/número · aviso de pendientes · cronómetro
│       └── .actions-container
│           ├── .state-visual-container    espera · mute · grabación · acciones
│           └── .keypad                    teclado en llamada
├── .footer-call                    botón llamar / colgar
└── overlays                        tipificación externa · error de influencia
```

Y las secciones hermanas que viven en el mismo hueco (`CallsSections`): `phone`,
`categorization`, `lost-conversations-management`, `transfer`.

### El panel de Estados — medidas verificadas

| Pieza | Real | Réplica |
|---|---|---|
| Panel desplegado | 265 × 476.1, radio 23.65, `#333a41` | 265.7 × 477.2 |
| Panel colapsado | 265 × **386.8** | 387.6 |
| `.status-head` «Estados» | 45.5, texto 13.66 regular | 45.6 |
| `.state` (fila) | 37.9, padding `0 12.98`, `#2d333a` | 38.0 |
| Punto | 11.6 a 11.6 del borde; etiqueta a 35.8 | ✓ |
| «Administrativo» desplegado | 127.2, radio inferior 25.36 | 127.6 |
| Buscador | 91 × 18.2, `#1f2429`, radio 3.38 | 91.3 × 18.3 |

⚠️ **El alto del panel lo pone el contenido, no es fijo**: 386.8 con «Administrativo»
colapsado y 476.1 desplegado, siempre anclado abajo a la altura del Comunicador. Fijarlo
deja hueco muerto al colapsar.

Son **nueve** estados: Disponible · No disponible · Armario · Baño · casa · Comida ·
curso · WC · Administrativo. Solo el primero lleva el punto verde; el actual va en
negrita. «Administrativo» es el único que se despliega, con buscador y la lista
«Seleccione grupo» (gris `#63666a`).

### El panel de Estados NO se solapa con el widget

Medido en el real sin abrirlo (el panel ya vive en el DOM): `.agent-status` es
`position: fixed`, **265 × 476.1**, radio 23.65, fondo `#333a41`, con `.status-head` de
45.5 y `.statusList` de 430.6 (radio `0 0 25.36 25.36`).

Se coloca **a la izquierda del Comunicador**: su borde derecho queda **20.6px** antes del
borde izquierdo del widget, y **comparten el borde inferior**. Nunca lo tapa.

### Panel de Estados: posición condicional (divergencia anotada)

El original deja el panel SIEMPRE en el mismo hueco fijo (`right: 291.1`, `bottom: 45.5`),
esté el Comunicador abierto o no. La réplica lo hace **condicional**: ahí cuando el widget
está abierto, y sobre el botón de estado (`right: 22`) cuando está cerrado — que es donde
se espera encontrarlo si no hay widget del que apartarse.

### Mensajes — medidas verificadas

| Pieza | Real | Réplica |
|---|---|---|
| `.header-message` | 93.8 (título + buscador) | ✓ |
| Buscador | 204.9 × 26.5 a `69 / 22.7`, `#1f2429`, radio 8.45 | ✓ |
| `.message` (tarjeta) | 250.3 × **88.9**, `#2d333a` | ✓ |
| `.status` | barra de 7.6 (marca no leídos) | ✓ |
| `.avatar-content` | 28.1 × 28.1 a `15.2 / 19.7`, radio **10.14** | ✓ |
| Nombre / hora | 11.37 / **10.63** | ✓ |
| Grupo | 11.37 en **azul `#73abf4`** | ✓ |

### El chat por dentro — medidas verificadas

Al pulsar una fila de Mensajes se abre `app-chats-conversation` (457 de alto):

| Pieza | Real | Réplica |
|---|---|---|
| `.header-message-private` | 250.3 × **44**, `#333a41`, radio superior 28.73 | 44 ✓ |
| Flecha atrás / nombre / hora | `23.3` / `46` / `144.4` | ✓ |
| Dos acciones | 19 × 19 radio 4.87 — gris `#8d939d` y `#824549` | ✓ |
| `.body-container-message-private` | `#2d333a` | ✓ |
| `.footer-container-message-private` | 250.3 × **122.2**, `#333a41` | 122.2 ✓ |
| Iconos del pie | 19 × 19 radio 4.87 a `8.7` / `34.5` / `222.6` | ✓ |
| `textarea.sendMessage` | **187.3 × 44.9** a `11.3`, `#1f2429`, radio 10.14 | exacto |
| `.buttonEnviar` | **32 × 32** a `206.9`, radio 10.14 | exacto |

**Colores de burbuja** (del CSS del real): enviada **`#2179ED`**, recibida **`#1C1C1C`**,
avisos del sistema **`#AAAAAA`** centrados y sin burbuja. El radio es `5.92` con la
esquina inferior del lado propio a cero, y la hora va dentro de la burbuja abajo a la
derecha (de ahí el `padding-bottom` de 18.59).

### Configuración (lo que abre el engranaje) — verificado

| Pieza | Real | Réplica |
|---|---|---|
| `app-settings` | top 20.5, 250.3 × 433, `#2d333a`, radio 28.73 | 20.4 · exacto |
| `.header-settings` | 99.6, `#333a41`, radio superior 28.73 | 99.6 |
| Título «Configuración» | 13.66 Semibold, sangrado 12.98 | ✓ |
| Pestañas | Perfil / Preferencias, 30.3 | ✓ |
| `.body-settings` | 268.4 | ✓ |
| `.closeSession` | 209.5 × 26.5 a top 405.9, `#f75454`, radio 8.45 | exacto |

**Perfil**: avatar de **60.9** a `137.5 / 20.4`, datos a `81.3` en 12.13 (nombre, PIN,
Extensión, Tipo ext.), y el bloque «Grupos asignados» — cabecera de 26.5 en `#a3a8b0` con
buscador de **94.7 × 26.5**, y el listado debajo a `260.4`.

**Preferencias**: dos bloques de aviso, cada uno con título de 29.8 en 12.13, campana de
15.2 y control de volumen (pista `#5f6776` de 5.3, pulsador blanco de 12.6); la casilla
«Con conversación en curso» sangrada a 29.1; y el bloque «Login y Logout» con sus dos
casillas alineadas a la izquierda.

**El engranaje es un INTERRUPTOR, y ocupa la esquina.** No es un icono suelto: la zona
clicable mide 62.6 de ancho por la franja de 19 que asoma sobre el panel, con radio
`0 27.58 0 0`. Activo se pinta de **blanco con el icono negro**; al pulsarlo otra vez
vuelve a la sección donde estabas.

⚠️ Por eso el glifo va en un `::after` enmascarado y no en el propio botón: si la máscara
está en el botón, el fondo y el color del icono no se pueden separar.

### El engranaje de la cabecera

El SVG se sirve a `11.878 × 12.218` con `fill="#1f2429"`, pero la app **lo renderiza
forzado a 9.1 × 9.1** (`0.625vw`, cuadrado) y lo repinta de blanco. Replicar el tamaño
del fichero en vez del renderizado lo deja un 30 % más grande.

### Histórico — medidas verificadas

| Pieza | Real | Réplica |
|---|---|---|
| `.title` | top 31.1, alto 20.5, texto 13.66 Semibold | 31.0 ✓ |
| `.card-container` | top 69 | 69.4 ✓ |
| `.card-recents` | 246.8 × 63.4, fondo `#2d333a` | 246.8 × 63.4 ✓ |
| `.status` (barra) | 7.6 de ancho, `#f75454` si perdida | ✓ |
| `.event-type` (icono) | 20.5 × 11.4 a `13.3 / 16.7` | 0.0 |
| `.origin` | `9.1 / 49.3` | 0.0 |
| `.date` | `9.1 / 178.6` | 0.0 |
| `.service-group` | `36 / 49.3` | 0.0 |
| `.extra-info-container` | 88.5 sobre `#1f2429`, padding `12.67 17.75` | ✓ |

**El chevron NACE OCULTO.** `visibility: hidden`, y solo pasa a `visible` cuando el ratón
entra en la tarjeta —que además se resalta a `#1f2429`—. La píldora es negra pura
(`#000`), mide `9.375vw` (136.5 × 9.9), va pegada al borde inferior y centrada, con radio
`7.6 7.6 0.76 0`. Al ir abajo del todo no pisa el texto del grupo.

La tarjeta **se despliega**: el chevron abre un panel con Destino, Atención/Espera —la
espera en chip `#5f6776` radio 6.76— y Tipificación, con el nivel en azul `#3e7fff` y las
etiquetas en `#afb1b4`. El resalte que deja pulsar aparece al pasar por encima.

### Cabeceras por sección

El alto de la cabecera lo pone CADA sección, no el widget:

| Sección | Cabecera | Contenido |
|---|---|---|
| Teléfono | — | el dialpad arranca pegado al borde |
| Mensajes | 93.8 | título + buscador de 26.5 |
| Agentes | 140.2 | título + pestañas «Agentes / Grupos» |
| Histórico | 33.6 | solo título |

El título va siempre a 10.63px del borde del panel, y el hueco entre bloques de la
cabecera es 17.47 (título→buscador) y 18.2 (buscador→pestañas).

**Buscador de cabecera** (`.buscador`): 204.89 × 26.54 sobre `#1f2429`, radio **7.59**
—no es una píldora—, con la lupa de 12.12 a 11.88 del borde y el texto a 32.78.

### Barra de pestañas «Agentes / Grupos» y «Perfil / Preferencias»

⚠️ **El texto de las pestañas NO va centrado.** La primera mitad alinea a la IZQUIERDA y
la segunda a la DERECHA, y la píldora blanca se pega al extremo que le toca. Centrarlas
es lo que hace que la barra «se vea rara» aunque la píldora salte la distancia correcta.

Ambas comparten tipografía —«Open Sans Semibold» a 9.86, inactiva `#5f6776` y activa
`#ffffff`, sin cambio de grosor— y la misma píldora de **37.92 × 3.78, radio 3.03**,
montada sobre una línea de 1.11 en `#5f6776` al **25 %** (no una línea blanca).

Todo relativo al borde izquierdo del widget (escala 1456):

| | Agentes | Configuración |
|---|---|---|
| caja del toggle | left 22.70, ancho 204.89 | left 0, ancho 250.28 |
| mitades | 99.54 cada una, alto 14.78 | 122.24 cada una, alto 30.33 |
| sangría del texto | `ms-1` / `me-1` = 2.91 | 2.91 + 17.47 de padding |
| línea | left 28.51, ancho 193.26 | left 23.28, ancho 203.72 |
| píldora, 1.ª pestaña | left 26.23 | left 18.96 |
| píldora, 2.ª pestaña | left 189.05 | left 193.41 |
| píldora sobre la barra | +10.83 (`0.93rem`) | +9.96 (`0.95rem`) |

Recuerda que ahí `1rem = 0.8vw`, no 16px (ver [escala.md](escala.md)).

### Tipificar desde el listado de Mensajes

`.subcontainerIconMessagePrivate` vive dentro de `.message-info-group`, pegado a la
derecha, y **nace oculto** (`display: none`): aparece al pasar por encima de la TARJETA y
vira a azul al pasar por encima de ÉL.

| | valor |
|---|---|
| botón | 15.93 cuadrado, radio 4.37, fondo `#ffffff` |
| glifo | 6.83 cuadrado, `#262c32` |
| hover del botón | fondo `#0056fe`, glifo `#ffffff` |
| contenedor | `min-height` 16.69, padding `0 13.66 0 7.59`, `position: relative` |
| texto del nodo | tope 151.7 con elipsis, para no chocar con el botón |

Tipificar **no abre la conversación**: es la otra acción de la tarjeta, y hay que parar la
propagación del clic.

**Qué dice la barra lateral** (7.59 de ancho, `min-height` 69.5):

| color | significado |
|---|---|
| `#f75454` | la conversación fue abandonada |
| `#166f8d` | postconversando: acabada y a la espera de tipificar |
| sin color | acabada con normalidad |

(el original tiene además `#8d939d` para caducada y `#7f70f7` para escucha)

### Cabecera de la conversación abierta

Los dos botones de la derecha son ese mismo componente en su versión grande: **18.96
cuadrado, radio 4.37**, separados 6.83, con el bloque a 12.74 del borde derecho. El glifo
mide 8.34 × 9.10.

| estado | transferir | cerrar |
|---|---|---|
| viva | `#ffffff` + glifo `#262c32` | `#f75454` + aspa blanca |
| hover | `#0056fe` + glifo blanco | igual |
| apagado | `#8d939d` | `#824549` + aspa `#8d939d` |

Se apagan en cuanto la conversación deja de estar viva.

### El globo de «Tipo ext.» no admite máscara

`globe.svg` es **bicolor** (disco `#bfc5d3` con los meridianos en `#1f2429`). Pintado con
`-webkit-mask` se aplana a un disco blanco sólido. Va como `background-image`, con sus
propios colores, a 16.38 cuadrado.

### Medidas verificadas del dialpad en reposo

Tomadas **en vivo** sobre el widget real y relativas a su borde superior (escala 1456).
La réplica cuadra con ellas dentro de 0,1 px:

| Pieza | top | left | tamaño |
|---|---|---|---|
| `.container-call` | 20.4 | 0 | 250.3 × 430.8 |
| `.display` | 70.5 | 27.3 | 197.2 × 34.1 |
| `.keys-container` | 138.8 | 43.2 | 163.1 × 163.8 (teclas de 41 × 41, radio 16.7) |
| `.buttonGroup` (nodo) | 337.5 | 63.7 | 123.6 × 27.3 |
| `.footer-call` | 369.1 | 0 | 250.3 × 82.2 |
| `.btn-call` | — | — | 162.3 × 40.2, radio 12.1 |
| `.footer-comunicator` | 449.8 | 0 | 250.3 × 56.9 |

⚠️ **La pestaña de teléfono NO tiene cabecera de sección.** El dialpad arranca pegado al
borde del panel; la cabecera con título es del chat y de las demás secciones. Montarla a
nivel de widget desplaza todo 33,6 px.

**Selector de grupo** (`.buttonGroup` + `.containerButtonSelect`): el botón mide
`8.49 × 1.875vw` y al abrir **se invierte** —fondo blanco, texto `#333a41`, flecha negra—.
El desplegable sube desde él: mismo ancho (123.6), fondo `#1f2429`, radio 13.5, tope de
199.4 con scroll; cada fila 44px con nombre y número, `opacity: 0.75`, separador negro.

⚠️ El SCSS del real declara `font-size` **dos veces** en esas filas (`0.729vw` y luego
`1.406vw`): gana la segunda y **el texto se sale de la caja**. Es un fallo suyo, no un
diseño — la réplica usa la primera.

Colores: llamar `#69c663` (hover `#2bae22`), colgar `#f75454` (hover `#f43434`),
deshabilitado con borde e icono `#85898d`. El número del display va en **Roboto**, no en
Open Sans. Y cuando el estado no permite llamar, teclado y selector bajan al 30 % y quedan
inertes, y el botón se sustituye por el aviso rojo `.security` (`#762727`).

## El flujo de conversaciones pendientes (SISMAC-3780)

Montado de punta a punta en `agent-state.service.ts` (`ManageStep`) siguiendo el Figma
`283:1707 → 283:3186 → 283:4712`:

```
Pendientes ─ «Gestionar» ─→ dialing    número origen al dialpad, widget abierto en
   │                                    Teléfono, fila a «En gestión» + agente,
   │                                    badge de la pestaña -1
   ├─ botón verde ─────────→ incall     el botón pasa a colgar (#f75454)
   ├─ colgar ──────────────→ typifying  sección Tipificación (comentario + Guardar)
   ├─ Guardar ─────────────→ finishing  sección «Finalizar gestión», con SOLO las
   │                                    conversaciones que este agente tiene en gestión
   └─ Finalizar ───────────→ idle       pasan a «Gestionada», vuelve a Mensajes
```

El badge de «Pendientes» **se deriva**, no se escribe: cuenta las `pending` descontando
las que están en gestión o ya finalizadas.

### «Finalizar gestión» (`lost-conversations-management`)

Es la pieza de SISMAC-3780 dentro del Comunicador. **En el entorno de desarrollo está
maquetada al 75 %** de su tamaño: su Figma está dibujado sobre 1440 px y se convirtió a
`vw` dividiendo entre 1920. Si la replicas, **usa los valores del diseño, no los del
entorno** — o replicarás el fallo.

Los valores buenos: título `0.938vw`, radio de panel `1.771vw`, padding de cabecera
`1.559vw`, botón `8.49 × 1.875vw` con borde blanco.
