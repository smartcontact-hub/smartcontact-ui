# Guardarraíles · qué garantiza cada comprobación

> **La mitad larga del README.** El `README.md` nombra la cadena entera (y un gate lo
> exige: `docs:coherence` CHECK B). Aquí vive **el porqué de cada eslabón**, que es lo que
> impide borrar un guardián creyendo que no hacía nada.
>
> **Lector**: quien trabaja dentro del repo. Quien solo consume el design system no
> necesita nada de este documento; le basta el README.
>
> Nace el 2026-09-20: la tabla de guardarraíles pesaba **16,5 KB, el 51 % del README**, con
> celdas de hasta 1.522 caracteres. El contenido no sobraba, sobraba el sitio.

## Los comandos

```bash
npm run verify         # los 42 checks estáticos encadenados (~40s)
npm run e2e            # smoke en navegador (Playwright)
npm run e2e:contrast   # carril rápido para cambios de COLOR (~80s)
npm run preflight      # gates + builds AOT + baselines visuales (~5 min), antes de pushear
npm run e2e:supervisor # y e2e:cuscare: la suite de APP que toca lo que cambiaste, a mano
```

## Las tres redes de `npm run e2e`

Dentro de `npm run e2e` hay tres redes con fronteras distintas, y conviene saber cuál te va a
enrojecer: `components.spec.ts` mide caja y tipo con aserciones escritas a mano más una captura
por componente (la captura es `-linux`: solo se compara en el CI, en un Mac se salta); `component-structure.spec.ts` congela
el HTML renderizado de 9 componentes en un JSON revisable; y `component-styles.spec.ts` (DD-63)
congela 16 propiedades computadas de cada `[data-testid]` de las 38 páginas del catálogo. Las dos
últimas se regeneran con `SC_UPDATE_STRUCTURE=1` y `SC_UPDATE_STYLES=1`, y su diff se lee en el PR.

Las suites e2e **de aplicación** no van en `preflight` (DD-60): las corre el CI, que es
obligatorio en `main` y paralelo. En un portátil solo cabe un Playwright a la vez, así que con
varias sesiones el preflight completo (20-25 min) se hacía cola durante una hora; en GitHub cada
suite tiene su runner. Si tocaste un e2e de app, córrela a mano antes de pushear.

En un PR, el CI corre solo las suites que el cambio puede romper (DD-117, `scripts/ci-cambios.mjs`):
un cambio del Supervisor, la del Supervisor; uno de solo documentación, ninguna. El DS, la raíz y
todo lo que no sabe clasificar corren todas, y `main` las corre siempre todas. Cloudflare igual:
cada proyecto ignora lo que no publica (`excluye` en `scripts/cf-sites.mjs`), así que un PR del
Supervisor despliega y comenta una vez, no cinco.

Las **baselines visuales** (`e2e:visual`) tampoco van en `preflight` (DD-116). Estuvieron
(DD-62) mientras sus capturas eran del Mac y el CI no podía compararlas; hoy son `*-linux.png` y
las compara el job `e2e-smoke`, obligatorio en `main`. En un Mac la suite se salta las capturas,
así que en local solo repetía lo que el CI ya corre, a 2 minutos y con cola en el puerto 4280.

## Regla de la casa

Una comprobación que no está en una cadena automática no es una
comprobación, es documentación, y la documentación que hay que recordar se pierde. Todo
check nuevo entra en `verify` o en un `e2e:*`, nunca como comando suelto.

`e2e:contrast` es la excepción legítima: no añade comprobaciones, es un atajo a un
subconjunto de las que ya corren en CI.


## Antes de pushear, `preflight`

Encadena en un solo comando todo lo que `ci.yml` corre SIN navegador (gates + builds AOT de las
apps), para que "verde en local" signifique "el CI solo puede caer en un e2e". Existe porque
`verify` por sí solo **no construye las apps**: un binding roto en una plantilla pasa `verify` y
lo caza el build AOT. Los nueve pasos del CI son esos más las tres suites e2e (smoke,
supervisor y cuscare), que solo corren en GitHub. Las baselines visuales de sc-docs van dentro
de la smoke (`components.spec.ts`) y se comparan en Linux (DD-116).

Los builds de sc-docs y de las cuatro apps van **a la vez** (`scripts/en-paralelo.mjs`), cada uno
con su salida entera al acabar; si falla uno, falla la cadena. El DS no se reconstruye ahí: lo deja
en `dist/` el `npm run build` de `verify`, y por eso preflight corre `build:docs:app` donde el CI
corre `build:docs` (sustitución vigilada en `ci-preflight-parity`).

Que no se pudra cuando alguien añada un paso al CI lo garantiza un test
(`scripts/ci-preflight-parity.mjs`, dentro de `test:unit`): se pone rojo si `preflight` y
`ci.yml` se desincronizan, salvo la lista CERRADA `CI_ONLY` (los e2e), que también vigila en la
otra dirección: un paso de esa lista que el CI deje de correr la pone en rojo.

Y para que no dependa de acordarse, **un hook lo corre solo**: `.githooks/pre-push` lanza
`preflight:scope` antes de cada `git push` y aborta si algo falla; si el árbol ya lleva la marca
`.preflight-ok` de un carril en verde (la escribe `scripts/preflight-mark.mjs` al final de
`preflight` y `preflight:scope -- --run`), sube sin repetir la cadena. Se activa
una vez con `npm run hooks:install`. **Lo que se ve en milisegundos se mira antes de arrancar**
(`scripts/preflight-puerta-barata.mjs`): la forma de la memoria del agente vive en el paso 33 de 38
—dentro de `docs:coherence`— y no depende del build, así que la puerta la comprueba en el segundo
2. Es estado COMPARTIDO entre sesiones: el 2026-09-11 y el 2026-09-12 una ficha que engordó otro
chat tumbó dos cadenas de 8 minutos. Y no se lanza la cadena sobre una rama que no lleva
`origin/main`: `scripts/preflight-rebase.mjs` hace `git fetch` y `merge-base --is-ancestor` antes
de correr nada y para con la orden de rebasar (el 2026-09-11 se tiraron dos cadenas de 8 min porque
`main` avanzó entre el preflight y el push). Que main avance **durante** la cadena es otro caso y
tiene otra regla, medida el mismo día con tres sesiones fundiendo a la vez: solo invalida la marca
si el merge daría **conflicto** (`git merge-tree`); si funde limpio, avisa y sigue, porque negarse
cada vez que otra sesión funde algo obliga a repetir 8 minutos en bucle y el CI del PR prueba el
merge igualmente. Dos cosas no pasan por la cadena, porque no suben código y
se comprueban una a una: los punteros `proto/*` que ya están en `main` (DD-56) y los BORRADOS de
rama, que es lo que toca en cuanto un PR se funde (`scripts/__tests__/pre-push-hook.test.mjs`). Y el hook de Claude (`.claude/settings.json` →
`scripts/hooks/bash-guard.mjs`) deniega el `git push` antes de llegar aquí si la marca no cuadra
con el árbol, junto con los otros comandos que LEARNINGS #7, #11 y #12 prohíben. La salida de emergencia es `SKIP_PREFLIGHT=1 git push`, y avisa por
pantalla de que te la has saltado. Existe porque esta regla era la más incumplida del repo:
se lee al empezar la tarea y el disparador salta horas después.

> **Y después de pushear, lee el CI.** `gh run list --branch main --workflow ci --limit 1`.
> Un preflight verde no es un CI verde: el paso `npm ci` resuelve dependencias contra el
> registro y en la plataforma del runner, así que puede caerse con tu árbol local intacto.
> `npm run guard:lockfile` cubre la parte comprobable; el resto solo lo sabe el CI.

## Los guardarraíles

El detalle de por qué existe cada uno vive en la cabecera de su propio script. Aquí solo
qué garantiza.

| Guardarraíl            | Comando                                                                                                    | Qué garantiza                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generadores            | `tokens:gen` · `tokens:gen-component` · `tokens:gen-color` · `tokens:gen-cmp-color` · `tokens:gen-effects` | Los bloques `@sc-gen` reproducen el export del Kit                                                                                                                                                 |
| Paridad                | `tokens:parity`                                                                                            | Escala, radios, sizing y colores de marca 1:1 con el export, y completitud: una hoja nueva del Kit sin clasificar pone rojo                                                                        |
| Guard                  | `tokens:guard`                                                                                             | `--p-*` solo en el preset · componentes con alias `--sc-spacing-*` · sin escala 8-point · campos PrimeNG solo vía wrapper · font-size solo por token                                               |
| Export limpio          | `tokens:export-clean`                                                                                      | En local, `kit-export-dtcg.json` coincide con HEAD (caza el export sucio que deja un `preview:live` zombie)                                                                                        |
| Repunte de color       | `tokens:cmp-rewire`                                                                                        | Cada `colorScheme` repuntado a `var(--sc-cmp-*)` es un no-op demostrable, sin hex sueltos                                                                                                          |
| Repunte de sombras     | `tokens:effects-rewire`                                                                                    | Ningún preset deja un `shadow:` con hex para un slot que generamos                                                                                                                                 |
| Tipografía             | `tokens:type-parity`                                                                                       | Cada `font-size` y `line-height` del Kit tiene su token 1:1 por valor                                                                                                                              |
| Escala del preset      | `audit:theme-scale`                                                                                        | Cero `px` en el preset, sin `css:` por componente, sin hack de `html{font-size}`                                                                                                                   |
| Bordes vs lienzo       | `audit:border-surfaces`                                                                                    | Ningún `--sc-border-*` queda a menos de 1.02:1 de su superficie **en su tema**                                                                                                                     |
| Audit de componentes   | `audit:components`                                                                                         | La pokédex (`docs/inventory.md`) está al día con el código                                                                                                                                         |
| Era de la API          | `audit:api-era`                                                                                            | Nada nuevo estrena `@Input()/@Output()` (DD-38). Trinquete de 16 componentes que solo puede menguar                                                                                                |
| i18n                   | `i18n:check`                                                                                               | Que la app sea multiidioma de verdad: claves 1:1 entre locales, toda clave que pide el código existe, variables `{{x}}` intactas, una sola traducción por frase, cero copy a pelo en atributos y ningún formato de fecha clavado a un idioma                                                                                                           |
| Novedades de la web     | `novedades:check`                                                                                          | La página `/novedades` de `sc-docs` cuadra con `CHANGELOG.md`. La pinta un artefacto generado (`npm run novedades:gen`), no un texto a mano: sin esto, la web podría anunciar una versión distinta de la que el repo publica, que es la misma clase de fallo de escribir dos veces el mismo anuncio |
| Uso real                | `usage:check`                                                                                              | La galería de uso (`public/usage/`) cuadra con la captura versionada; se regenera con `usage:capture`                                                                                              |
| Conexión de variables   | `variables:check`                                                                                          | El mapa Figma → tema → navegador (CSV + JSON de sc-docs) cuadra con el crudo medido; se regenera con `variables:map`                                                                               |
| Tests unitarios        | `test:unit`                                                                                                | Suites de los generadores y scripts                                                                                                                                                                |
| Docs                   | `docs:guard` · `docs:coherence`                                                                            | Todo `.md` mapeado en `DOCS-INDEX` y sus links resuelven; la doc cuadra con el repo                                                                                                                |
| Tests del DS           | `test:components`                                                                                          | `TestBed` sobre vitest, para los casos límite que la e2e no alcanza                                                                                                                                |
| Acoplamiento a PrimeNG | `audit:primeng-coupling`                                                                                   | Las 36 clases `.p-*` que usamos siguen existiendo, y el número no crece                                                                                                                            |
| Tablas del DS          | `audit:datatables`                                                                                         | Invariantes de toda página con `<sc-datatable>`                                                                                                                                                    |
| Ranuras de la tabla     | `audit:datatable-slots`                                                                                    | Las 38 ranuras de plantilla que `sc-datatable` reenvía a `p-table` (DD-72) se acuerdan por su NOMBRE, y ese acuerdo se rompe en silencio: si una subida de PrimeNG renombra una, el `contentChild` apunta al vacío sin que falle el build ni ningún test de comportamiento, porque el modelo de column-defs sigue pintando. Lee el código de PrimeNG en `node_modules` —como `audit:primeng-coupling`— y muerde en tres direcciones: la que declaramos y ya no existe, la que PrimeNG trae y no reenviamos (o «las 38» envejece sin que nadie lo note), y la que se declara en el `.ts` y la plantilla no llega a emitir |
| Higiene de pantalla    | `audit:screen-hygiene`                                                                                     | Sin emojis nuevos en la interfaz (los iconos salen de `<sc-icon>`) y sin `<img>`/`<iframe>` nuevos sin `width`+`height` o `aspect-ratio` (evita saltos de layout). Dos trinquetes que solo menguan |
| Datos de contacto      | `audit:seed-pii`                                                                                           | Ningún teléfono ni correo en los datos de demostración sin estar declarado inventado, con su motivo escrito. Nació el 2026-09-07, cuando se encontraron 7 teléfonos de la extracción publicados en `agent/seed.ts`: la regla estaba escrita en dos cabeceras de fichero y aun así se saltó, porque un teléfono inventado y uno real se ven igual |
| Nombres en el código    | `audit:personal-names`                                                                                    | Ningún fichero de código nombra al autor del repo: ni la autoría de una decisión («(Nombre, fecha)»), ni citas de conversación, ni quién detectó un fallo. El repo es público y un comentario explica el criterio, no quién lo pidió; la fuente de una decisión es su DD, su ticket o su nodo de Figma (AGENTS.md §«Voz del código»). El nombre como DATO de demo va declarado con su motivo, y una entrada que ya no casa, falla. Nació el 2026-09-24, con 197 menciones en código. `bash-guard` aplica el mismo patrón a los mensajes de commit y a las portadas de PR |
| Anatomía de página     | `audit:page-anatomy`                                                                                       | Cada página del Supervisor declara su arquetipo de `.page__inner` (o está exenta con su motivo), ninguna re-declara el molde compartido (`--with-panel` · `.page__form` · `.ipanel`) ni pisa su propio ancho, y los anchos sueltos ≥600px son un trinquete que solo mengua |
| Vocabulario de pantalla | `audit:screen-vocabulary`                                                                                  | Lo de DENTRO de la pantalla, que `audit:page-anatomy` no mira: cada nombre del vocabulario compartido (`.grid`, `.field`, `.field__label`, `.sub-section`…) se declara en UNA sola hoja, y el informe enseña la diferencia propiedad a propiedad contra la hoja de REFERENCIA (`config/aed`), de la que lee el canon en vivo en vez de copiarlo. Además: quien usa `surface="card"` sangra su contenido con `.sub-section` —la cabecera de esa caja se sangra 12.25 a sí misma, así que sin la misma sangría el título queda a la derecha de todo lo demás, y eso pasa con la caja midiendo EXACTA—; y una sección de campos usa `sc-section-card` y no una caja a mano: trinquete que solo mengua y en el que **una entrada sin motivo escrito es roja** (DD-36 aplicado aquí). Una regla encapsulada de componente le gana siempre a la global, así que re-declarar un nombre le da a esa pantalla una medida propia en silencio — que es como `.grid` acabó midiendo 24.5/12.25 en tres pantallas y 15.75/15.75 en otras tres (DD-65) |
| Base de la SPA         | `audit:base-href`                                                                                          | Las 5 apps declaran `<base href="/">`. Con la base vacía los assets se piden RELATIVOS a la URL, así que toda ruta de dos segmentos (`/componentes/button`) recibe el index.html del SPA fallback y deja la PÁGINA EN BLANCO al entrar por enlace directo o al recargar. En las cuatro apps que enrutan por path eso rompe hoy mismo; `sc-docs` arrastraba la base vacía desde el primer commit y se salvaba solo porque usa `withHashLocation()` — o sea, una trampa armada para el día que se quiten los `#` |
| Estilos de texto       | `audit:text-styles`                                                                                        | Las 12 clases `.sc-text-*` resuelven, cadena de tokens incluida, al font-size / line-height / peso / familia de su text style del Figma del DS, y las apps que consumen el DS cargan el CSS que las define. Y desde el 2026-09-11 también que **el CSS de las pantallas no declare tipografía fuera de esos 12 roles**: los pesos son solo 400 y 600 (un `medium` 500 no es «casi», no existe) y los tamaños solo los seis peldaños. Salió de medir 76 reglas del Supervisor con peso 500 que ningún gate cruzaba. Y una regla que declara tamaño **sin su interlineado** también salta: 14 heredando 1.5 son 21 y el rol lleva 20. Lo deliberado va en `TIPOGRAFIA_DELIBERADA` con su motivo; no cuentan como estilo de texto ni un `font-size` sobre un GLIFO ni los muebles de interlineado APRETADO (chip, pastilla, badge, contador), que heredan un `line-height: 1` a propósito y crecerían 6px. ⚠️ Mira lo que se DECLARA, no lo que gana la cascada: lo rendido lo mide `e2e/supervisor/text-styles-applied.spec.ts`. `tokens:type-parity` solo vigila el último eslabón (peldaño ↔ export); esto vigila el tramo de en medio y la llegada. Y un **trinquete** (`TIPOGRAFIA_SUELTA_MAX`, DD-69): las reglas de pantalla que aún declaran `font-size` por token solo pueden bajar, porque la forma canónica es la clase en la plantilla (el nombre del text style viaja hasta el DOM y se lee en Inspect) |
| Título contenido       | `audit:titulo-contenido`                                                                                   | En una pantalla con índice lateral, el `<h1>` lo pinta un `<sc-section-card [headingLevel]="1">` y no una etiqueta suelta: contenido en su sección, el título ACOTA su caja y arranca en la misma línea que el rail. Y al revés, nadie más se pone el nivel de página. Los formularios quedan fuera: su `<h1>` está oculto a propósito porque la identidad la pinta la ficha del rail |
| Versiones congeladas   | `proto:check`                                                                                              | Cada fila de `docs/PROTOTIPOS.md` tiene su etiqueta, y cada etiqueta `proto/*` su fila. Es la tabla que se enlaza desde Jira y Confluence en lugar de la URL viva: sin esto, una versión congelada puede quedarse sin registro (o al revés) y el enlace del ticket vuelve a envejecer solo |
| Exploraciones del Lab  | `explorations:check`                                                                                       | Cada etiqueta `archive/comparar-*` y `archive/lab-*` sale en `explorations.data.ts`, la tarjeta del Lab que la hace encontrable, y cada tarjeta apunta a una etiqueta que existe de verdad. Una rama de comparación no se funde, así que una versión guardada que nadie puede encontrar es como no haberla guardado. Corría en `verify` **sin estar en la tabla del README** desde que nació, que es exactamente lo que el CHECK B de `docs:coherence` existe para impedir: el hueco no era el README, era el filtro del check, que no miraba este namespace. Las dos mitades arregladas el 2026-09-20 |
| Paridad de los dos README | `docs:readme-parity`                                                                                     | `README.md` y `README.en.md` no derivan. Compara lo que se puede comparar sin leer prosa: mismos `##` en el mismo orden, mismos comandos `npm run …`, mismas cifras de paquetes/apps/componentes, misma versión y mismos enlaces externos. Existe porque el repo ya tiene la deriva documentada (el CHECK E nació con el README diciendo 49 componentes y otro doc ~55, con el manifiesto en 51) y porque un segundo README es, por definición, la copia que `DOCS-INDEX` prohíbe: se permite **solo** mientras una máquina la cruce |
| Snippets de la doc     | `audit:doc-snippets`                                                                                       | El código que enseña `sc-docs` **es el que la demo de encima ejecuta**. No exige que sean iguales —medido, 40 de 71 pares divergen a propósito, y un gate con 40 falsos positivos enseña a ignorarlo—, sino cuatro relaciones que sí son defecto: que todo tag y todo binding EXISTAN en la API; que lo que el snippet enseña la demo viva lo pinte; que lo que la demo viva pinta el snippet lo enseñe (así se vio que `#icons` de button renderizaba `variant` y `fullWidth` sin contarlos); y que la proyección use el `#slot` que el componente declara por `contentChild` y no el `pTemplate` viejo de PrimeNG, que al wrapper NO le llega. Más un trinquete: cuántos inputs públicos no salen en ningún ejemplo ni knob de su página (66, solo baja). Lo deliberado va en `DIVERGENCIAS` con su motivo, y una entrada que ya pasa en verde también pone rojo |
| Backticks              | `guard:backticks`                                                                                          | Ningún backtick suelto dentro de un `template:` o `styles:`, que rompe el build con un error que no los menciona                                                                                   |
| Lockfile               | `guard:lockfile`                                                                                           | El lock cuadra con `package.json` **en la plataforma del runner**, no solo en la tuya                                                                                                              |
| Tipos y lint           | `typecheck` · `lint`                                                                                       | `tsc` sobre las 2 libs, las 4 apps y el arnés de la raíz                                                                                                                                           |
| e2e smoke              | `e2e`                                                                                                      | La demo levanta y el botón y el form field renderizan la métrica del Kit medida en navegador                                                                                                       |

El mismo gate corre en CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)). Cuando un
e2e falla, el CI **sube la traza y la captura** de Playwright como artifact (7 días): un rojo
deja algo que mirar en vez de una línea de texto.

## Los otros workflows

| Workflow                                                        | Cuándo                    | Qué hace                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`publish-packages.yml`](../.github/workflows/publish-packages.yml) | Al publicarse una release | Publica los 3 paquetes en GitHub Packages desde el commit del tag. Sin tokens personales                                                                                                                     |
| [`deploy-record.yml`](../.github/workflows/deploy-record.yml)       | Al empujar a `main`       | Registra en *Deployments* qué sirve cada uno de los 5 sitios, **después de comprobarlo**: cada build se sella con su commit (`stamp-build.mjs` → `build.json`) y el registro espera a verlo (35 min). Sin sello, rojo. Si otro commit entra en `main` mientras espera, no registra nada: Cloudflare descarta el build encolado del anterior ([DD-64](./DECISIONS.md)) |
| [`tokens-sync.yml`](../.github/workflows/tokens-sync.yml)           | Al empujar tokens         | Verifica el PR del puente de Figma                                                                                                                                                                          |

> ⚠️ Los cinco `build:*` terminan en `node scripts/stamp-build.mjs <app>`, y son los comandos
> que corre Cloudflare. **Quitar ese eslabón deja el sitio sin sello**, y `deploy-record` lo
> marcará en rojo hasta que vuelva. Ver [DD-59](./DECISIONS.md). Lo que Cloudflare tiene
> configurado (comando, output dir, rama, `NODE_VERSION`) solo se ve desde su panel, así que
> `npm run audit:cf-config` lo lee por API y lo compara con lo que el repo espera; el mismo
> workflow lo corre en un job aparte del registro, si existe el secret `CLOUDFLARE_API_TOKEN`
> (basta con permiso *Cloudflare Pages: Read*: la cuenta va escrita en el script).

