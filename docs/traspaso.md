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

- **Nadie puede mergear a `main` ni administrar el repo** sin acceso de admin a la
  org `smartcontact-hub`. Sin eso, el proyecto se congela en su último commit:
  sigue vivo, pero no puede avanzar.
- **El loop de diseño (Figma to tokens to código) muere.** Necesita el fichero de
  Figma, el plugin Theme Designer con su token, y arrancar desde la máquina de
  Rafa. Sin eso, los tokens no se pueden cambiar desde diseño.
- **Nadie triará los tickets de Jira (SISMAC)** ni tendrá el contexto de producto
  y negocio, que hoy vive sobre todo en la cabeza de Rafa (ver §5).

**Traducción en una frase:** los sitios no se caen solos, pero el proyecto deja
de poder **evolucionar** el día que hace falta alguien con las llaves, y esas
llaves hoy las tiene una sola persona.

---

## 2. Inventario de accesos

Las columnas de personas (dueño, quién más, recuperación) las rellena Rafa: son
datos que no están en el repo y no se deben deducir. **No pongas valores de
credenciales aquí**, solo dónde viven.

| Servicio | Para qué | Config en el repo | Dueño | ¿Quién más tiene acceso? | Dónde vive la credencial | Recuperación (email/2FA) |
| --- | --- | --- | --- | --- | --- | --- |
| **GitHub org `smartcontact-hub`** | Repo, CI (Actions), paquetes | `.github/workflows/` | Rafa | Marta Recio (`martarecioa`): rol **Maintain** (2026-08-31). Otro colaborador directo: `arebury` _(confirmar: ¿cuenta personal de Rafa?)_ | Privadas: gestor personal de Rafa, no en el repo | _(rellenar)_ |
| **Cloudflare Pages** (cuenta `b8361bb4…`) | Deploy de las 4 apps (`sc-doc`, `sc-supervisor`, `sc-agent`, `sc-cuscare`), preview por rama | No en el repo: la config vive en el dashboard (build cmd + `Build output directory = dist/<app>/browser`) | Rafa _(confirmar)_ | _(rellenar)_ | _(gestor de contraseñas)_ | _(rellenar)_ |
| **Figma: fichero del DS** (`khNq9dJKNi13pNllrqm6dx`) | Source of truth del diseño; origen del export de tokens | `figma.config.json`, `code-connect/` | Rafa _(confirmar)_ | Marta (diseño) _(confirmar nivel)_ | _(cuenta Figma)_ | _(rellenar)_ |
| **Plugin Theme Designer** (token que empuja a `design-tokens-sync`) | Loop Figma to código: empuja el export DTCG | Rama `design-tokens-sync` (NO borrar); `tokens-sync.yml` | Rafa _(confirmar)_ | _(rellenar)_ | _(token GitHub del plugin, en la máquina)_ | _(rellenar)_ |
| **Jira `jira.dvtech.io`** (proyecto SISMAC) | Tickets y contexto de producto (org externa: dvtech) | Referencias en `docs/` y commits | _(rellenar)_ | VAP, Lucas (backend) _(confirmar)_ | _(cuenta dvtech)_ | _(rellenar)_ |
| **GitHub Packages** (`npm.pkg.github.com`) | Publicar los 3 paquetes del DS. **DORMIDO** (DD-17: las apps consumen el DS local) | `.npmrc` (usa `GITHUB_TOKEN` del entorno) | Rafa _(confirmar)_ | _(rellenar)_ | _(token en variable de entorno)_ | n/a mientras esté dormido |

> Si algún día quieres una copia de seguridad viva del fichero de Figma o de la
> config de Cloudflare, anótalo aquí como tarea: hoy ambos existen en un solo
> sitio, bajo una sola cuenta.

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

## 5. Lo que hoy solo vive en la cabeza de Rafa (a externalizar poco a poco)

Esto no está en ningún doc y es lo que más pesa en el bus factor. No hace falta
resolverlo de golpe; conviene ir vaciándolo aquí o en el doc que corresponda:

- **Contexto de producto y negocio**: qué problema resuelve cada app en el mundo
  real, prioridades, qué es demo y qué es de verdad.
- **La relación con dvtech / Jira (SISMAC)**: quién es quién, qué se espera, cómo
  entran los requisitos. Contactos de backend hoy sueltos: VAP, Lucas _(confirmar
  rol y forma de contacto)_.
- **Decisiones no escritas**: cosas que se decidieron "sobre la marcha" y no
  llegaron a un DD.
- **El roadmap real vs. el documentado**: qué viene después de verdad.

> ⚠️ Nombres y roles son lo más volátil de este doc: confírmalos antes de que
> alguien actúe sobre ellos. (Regla del repo: un hand-off es una pista, no un
> hecho.)

---

## Mantenimiento

Actualiza este documento cuando **cambie un acceso** (nueva cuenta, alguien entra
o sale, se rota un token) o cuando **externalices** algo de la §5. No es un doc
que se cierre: mengua a medida que el proyecto deja de depender de una persona.
