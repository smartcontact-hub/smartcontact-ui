# Search Loading Icon

Icono animado de "lupa buscando" (círculo + dos arcos girando de forma
sincronizada) con el texto **"Cargando resultados..."** y un efecto shimmer,
recreado en vectorial a partir de una grabación de pantalla.

## Contenido

```
build.py              Script que genera todos los formatos
fonts/                Inter (Regular / Medium / SemiBold), usada en el texto
dist/
  search_loading_icon.json     Lottie (lottie-web, After Effects, bodymovin...)
  search_loading_icon.lottie   dotLottie (zip con manifest.json + animación)
  search_loading_icon.gif      GIF transparente en alta resolución
preview.html           Previsualización standalone con lottie-web (JSON embebido)
```

> **Nota sobre el GIF:** incluye el texto e Inter "horneados" como píxeles,
> ya que es pensado para pegarse directamente en el lienzo de Figma sin
> necesidad de ningún plugin (Figma reproduce GIFs animados de forma nativa).
> El `.json` / `.lottie` contienen solo el icono (círculo + arcos) como
> capas vectoriales editables — el texto se recomienda añadirlo como capa
> de texto nativa en el motor final (After Effects, lottie-web con HTML, etc.)
> para que dependa de la fuente instalada en destino en vez de quedar rasterizado.

## Requisitos

```bash
pip install lottie cairosvg fonttools brotli pillow
```

(`fonttools` + `brotli` sólo hicieron falta para convertir Inter de
`.woff2` a `.ttf`; los `.ttf` ya están incluidos en `fonts/`, así que no
hace falta repetir esa conversión.)

## Uso

```bash
python build.py
```

Regenera los tres artefactos dentro de `dist/`.

## Ajustar la animación

Todos los parámetros relevantes están al principio de `build.py`:

- `FPS`, `DUR` — duración del loop (por defecto 2s a 30fps, loop perfecto)
- `DARK`, `BLUE_LIGHT`, `BLUE_MID` — paleta de colores
- `GLASS_R`, `GLASS_SW`, `HANDLE_LEN` — geometría de la lupa
- `R_OUTER`, `R_INNER`, `START_*`, `END_*` — radio y longitud (en %) de cada arco
- `LABEL`, `FONT_SIZE`, `FONT_FAMILY` — texto y tipografía

## Por qué SVG nativo (`stroke-dasharray`) y no bezier aproximado

Los arcos se dibujan como círculos SVG reales recortados con
`stroke-dasharray` / `stroke-dashoffset`, en vez de aproximar el trazo
recortado con curvas Bézier. La aproximación Bézier introducía una
deformación visible justo en el punto donde el trazo cruzaba la costura
del círculo — con `stroke-dasharray` el arco es geométricamente exacto en
cualquier ángulo.
