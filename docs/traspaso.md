# Traspaso — qué pasa si Rafa no está, y qué necesita quien tome el relevo

> Este es el ÚNICO documento que inventaría las dependencias de UNA sola
> persona: los accesos, cuentas y servicios externos que hoy dependen de Rafa,
> más el mapa para que otra persona pueda operar o contribuir sin él. El *cómo
> funciona* el sistema vive en otros docs (ver [`DOCS-INDEX.md`](DOCS-INDEX.md));
> esto es el *quién tiene la llave*.
>
> ⚠️ **SIN SECRETOS.** Aquí NO se escribe ningún token, contraseña ni valor de
> credencial. Solo QUÉ existe, PARA QUÉ, DÓNDE vive su config, y QUIÉN tiene
> acceso. Los valores viven en un gestor de contraseñas, jamás en el repo.
>
> Motivo de que exista (estudio de salud, 2026-08-31): el repo documenta muy
> bien *cómo* funciona todo, pero nada respondía "si Rafa no está, ¿qué se
> rompe y a qué hay que acceder?". Ese es el riesgo real de depender de una
> sola persona, y es invisible en el código.

---

## 1. Si Rafa desaparece mañana: qué sigue y qué se para

**Lo que sigue funcionando solo (sin que nadie toque nada):**

- Las **4 apps en producción siguen vivas**. Cloudflare reconstruye desde `main`
  en cada push, así que lo ya desplegado no se cae por sí mismo.
- El **CI (GitHub Actions) sigue corriendo**: usa el token que GitHub genera solo
  para cada run, no depende de una credencial personal de Rafa.

**Lo que se para en cuanto se necesita a una persona:**

- **Solo lo de nivel ADMIN.** Marta (rol **Maintain**, ver §2) ya puede mergear a
  `main` y gestionar el día a día del repo, así que el proyecto **ya no se
  congela**. Pero Maintain no llega a ajustes, secretos, colaboradores ni
  visibilidad: eso sigue solo en Rafa. **No habrá un segundo admin: decisión
  consciente de Rafa (2026-08-31).** Una emergencia de nivel admin (rotar accesos,
  cambiar ajustes) espera a Rafa, y ese riesgo se asume a sabiendas.
- **El loop de diseño SÍ está cubierto:** Marta tiene el fichero de Figma y el
  plugin Theme Designer, así que puede cambiar tokens desde diseño sin Rafa.
- **El resto de llaves no se comparte a propósito** (privacidad, decisión de Rafa
  2026-08-31): Cloudflare (los 4 deploys) y Jira quedan a nombre de Rafa.
- **El contexto de producto y negocio** (triaje de Jira, el porqué de las cosas)
  vive sobre todo en la cabeza de Rafa (ver §5). Acceso no es conocimiento.

**Traducción en una frase:** el peor riesgo, que el proyecto se congele porque
solo una persona puede mover el repo, **ya está mitigado** con el Maintain de
Marta; lo que queda es el nivel admin sin relevo y el conocimiento de producto
sin externalizar.

---

## 2. Inventario de accesos

Las columnas de personas (dueño, quién más, recuperación) las rellena Rafa: son
datos que no están en el repo y no se deben deducir. **No pongas valores de
credenciales aquí**, solo dónde viven.

| Servicio | Para qué | Config en el repo | Dueño | ¿Quién más tiene acceso? | Dónde vive la credencial | Recuperación (email/2FA) |
| --- | --- | --- | --- | --- | --- | --- |
| **GitHub org `smartcontact-hub`** | Repo, CI (Actions), paquetes | `.github/workflows/` | Rafa | Marta Recio (`martarecioa`): rol **Maintain** (2026-08-31). Otro colaborador directo: `arebury` _(confirmar: ¿cuenta personal de Rafa?)_ | Privadas: gestor personal de Rafa, no en el repo | _(rellenar)_ |
| **Cloudflare Pages** (cuenta `b8361bb4…`) | Deploy de las 4 apps (`sc-doc`, `sc-supervisor`, `sc-agent`, `sc-cuscare`), preview por rama | No en el repo: la config vive en el dashboard (build cmd + `Build output directory = dist/<app>/browser`) | Rafa _(confirmar)_ | _(rellenar)_ | _(gestor de contraseñas)_ | _(rellenar)_ |
| **Figma: fichero del DS** (`khNq9dJKNi13pNllrqm6dx`) | Source of truth del diseño; origen del export de tokens | `figma.config.json`, `code-connect/` | Rafa | Marta (diseño): con acceso (2026-08-31) | _(cuenta Figma)_ | _(rellenar)_ |
| **Plugin Theme Designer** (token que empuja a `design-tokens-sync`) | Loop Figma to código: empuja el export DTCG | Rama `design-tokens-sync` (NO borrar); `tokens-sync.yml` | Rafa | Marta: con acceso (2026-08-31) | _(token GitHub del plugin, en la máquina)_ | _(rellenar)_ |
| **Jira `jira.dvtech.io`** (proyecto SISMAC) | Tickets y contexto de producto (org externa: dvtech) | Referencias en `docs/` y commits | _(rellenar)_ | VAP, Lucas (backend) _(confirmar)_ | _(cuenta dvtech)_ | _(rellenar)_ |
| **GitHub Packages** (`npm.pkg.github.com`) | Publicar los 3 paquetes del DS. **DORMIDO** (DD-17: las apps consumen el DS local) | `.npmrc` (usa `GITHUB_TOKEN` del entorno) | Rafa _(confirmar)_ | _(rellenar)_ | _(token en variable de entorno)_ | n/a mientras esté dormido |

**Política de co-acceso (decisión de Rafa, 2026-08-31):** Marta tiene GitHub
(Maintain) + Figma + Theme Designer, que cubre el desarrollo y el loop de diseño.
El resto (Cloudflare, Jira, gestor de credenciales) **no se comparte a propósito,
por privacidad.** El hueco que eso deja para la continuidad es el **nivel admin**:
hoy no hay un segundo admin del repo ni de Cloudflare. Es una elección consciente,
anotada aquí para que no se lea como un olvido.

> Si algún día quieres una copia de seguridad viva del fichero de Figma o de la
> config de Cloudflare, anótalo aquí como tarea: hoy ambos existen en un solo
> sitio, bajo una sola cuenta.

**Visibilidad del repo: PÚBLICO, a propósito** (decidido por Rafa, 2026-08-31).
Es el producto de la propia empresa, sin datos de clientes externos ni interno
sensible; y en público el CI de GitHub Actions es gratis e ilimitado (en privado
se pagarían minutos). Lo único que sería peligroso en un repo público es un
**secreto committeado**, y un escaneo del 2026-08-31 salió limpio (0 claves
privadas, 0 PATs, 0 credenciales literales; `.auth/` en `.gitignore`). Al ser
público, no metas NUNCA un token/clave en un commit: viven en variables de
entorno o en el gestor de contraseñas.

---

## 3. Puesta en marcha de una máquina nueva (checklist para un sucesor)

1. **Node.** Instala nvm y, dentro del repo, `nvm use` (lo lee de `.nvmrc` to
   22.23.2). Alternativa: cualquier Node soportado por Angular (`^22.22.3`,
   `^24.15.0` o `>=26`). Ver `.nvmrc` + `engines` en `package.json`. La historia
   de por qué esto importa: [`AGENTS.md`](../AGENTS.md) y la trampa de las tres
   versiones de Node.
2. **Arranque del código.** `npm ci`, luego `npm run build` (construye el DS a
   `dist/`), `npm start` (docs en local). Verificación completa: `npm run verify`.
3. **Preview sin terminal** (lo que usa Rafa hoy): los `.command` de doble clic en
   [`preview/`](../preview/) (`Actualizar.command` trae lo último; `preview-*.command`
   arrancan cada app).
4. **Loop de diseño (solo si vas a tocar tokens desde Figma):** Figma Desktop, el
   plugin **Desktop Bridge** (WebSocket en `localhost:9223`) y el plugin **Theme
   Designer**. Las trampas de los tres servers MCP de Figma están en
   [`AGENTS.md`](../AGENTS.md) (sección de trampas conocidas).
5. **Paquetes (solo si se reactivan):** `.npmrc` necesita un `GITHUB_TOKEN` con
   permiso de lectura de packages en el entorno. Hoy no hace falta (dormido).

---

## 4. Ruta de arranque para quien contribuya

La buena noticia: **el conocimiento de cómo funciona ya está escrito.** Un
sucesor no parte de cero; parte de esta ruta de lectura, en orden:

1. [`README.md`](../README.md) — qué es el proyecto y cómo se construye.
2. [`docs/DOCS-INDEX.md`](DOCS-INDEX.md) — el mapa: qué documento manda sobre qué.
3. [`AGENTS.md`](../AGENTS.md) — cómo se trabaja aquí + las trampas conocidas.
4. [`LEARNINGS.md`](../LEARNINGS.md) — reglas de proceso ganadas con errores reales.
5. [`docs/DECISIONS.md`](DECISIONS.md) — las 46 decisiones grandes, con su porqué.
6. El **hand-off del frente** que vaya a tocar ([`docs/handoff/`](handoff/)).

Para **diseño**: [`docs/colaboracion.md`](colaboracion.md) pone a la diseñadora a
operar el loop de tokens. Para **consumir el DS desde otra app**:
[`docs/consumer-onboarding.md`](consumer-onboarding.md).

---

## 5. Conocimiento que hoy solo tiene Rafa (rellenar poco a poco)

Es lo que más pesa en el bus factor: **acceso no es saber conducir.** No es un doc
para hacer de golpe; es un ESQUELETO para vaciar en ratos de 10 min. Cada bloque
lleva una pregunta guía; escribe debajo cuando puedas y quita su `_(pendiente)_`
al cerrarlo.

> **Atajo para 5.1–5.4:** el mapa de producto de agosto (retirado del repo, pero
> vivo en su [página publicada](https://claude.ai/code/artifact/1e3ae223-a494-48b4-b473-5bd689a00523))
> ya tiene mucho de esto. Destila lo **durable**, no lo de aquel mes concreto.

### 5.1 · Qué es cada app en el mundo real _(pendiente)_
> `supervisor`, `agent`, `cuscare`, `sc-docs`: qué problema resuelve cada una para
> el usuario final, cuál es "la de verdad" y cuáles son réplicas, y de qué
> herramienta (y de quién) es el original que replican.

### 5.2 · El dominio y la empresa _(pendiente)_
> Qué es "smart-contact" / dvtech y tu rol dentro. Y un glosario de una línea por
> término que un forastero no entendería: **SISMAC**, **Ley SAC**, **AED**,
> "transcripción vs grabación", el pivote de reglas…

### 5.3 · Cómo entran y salen los requisitos _(pendiente)_
> El circuito real: quién decide qué se hace (PM), por dónde entra el trabajo
> (Jira / email / recap), quién valida, cómo se prioriza, y en qué cadencia
> esperan cosas de ti.

### 5.4 · Quién es quién _(pendiente)_
> Nombre, rol y para qué acudir a cada uno: producto, backend, diseño, feria.
> (Sueltos hoy, sin rol confirmado: VAP, Lucas, Alex, Eduardo, Mila, Bea, Edu.)

### 5.5 · Decisiones y criterios no escritos _(pendiente)_
> Lo decidido "sobre la marcha" que no llegó a un DD, y los criterios que aplicas
> sin pensar (qué se toca y qué no, qué se prioriza). Si alguno merece rango de
> decisión, muévelo a `DECISIONS.md` como DD.

### 5.6 · El roadmap real _(pendiente)_
> Qué viene de verdad después, más allá de lo que digan los docs. Qué está en
> barbecho y por qué.

> ⚠️ Nombres y roles son lo más volátil de este doc: confírmalos antes de que
> alguien actúe sobre ellos. (Regla del repo: un hand-off es una pista, no un hecho.)

---

## Mantenimiento

Actualiza este documento cuando **cambie un acceso** (nueva cuenta, alguien entra
o sale, se rota un token) o cuando **externalices** algo de la §5. No es un doc
que se cierre: mengua a medida que el proyecto deja de depender de una persona.
