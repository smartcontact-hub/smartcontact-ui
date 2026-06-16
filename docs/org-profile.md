# Perfil de organización — borrador

> **Esto no es un doc de este repo.** Es el **contenido** del perfil público de la
> organización `smartcontact-hub` en GitHub. Para que aparezca, hay que crear un
> repo **público** llamado **`.github`** dentro de la org y guardar este texto en
> **`profile/README.md`**. Lo que sigue (debajo de la línea) es ese texto.
>
> Pasos (los das tú en GitHub, 2 min): `smartcontact-hub` → New repository →
> nombre `.github` → Public → crearlo → añadir archivo `profile/README.md` →
> pegar lo de abajo → commit. (Esto NO lo puede crear el agente.)

---

# Smart Contact

Construimos las herramientas de **Smart Contact** sobre un **Design System** propio:
una sola fuente de diseño (Figma) que se refleja en código, con la marca blindada y
verificada por máquina. Diseño y desarrollo hablan el mismo idioma.

### El Design System

[**smartcontact-ui**](https://github.com/smartcontact-hub/smartcontact-ui) — el
monorepo: tokens, iconos y componentes Angular sobre PrimeNG. Tres paquetes que van
siempre a la par:

- **styles** — los tokens `--sc-*` (color, escala, tipografía).
- **icons** — `<sc-icon>` + Material Symbols.
- **components** — los componentes `sc-*` + el preset de marca.

### Verlo funcionando

- **Showcase** — https://sc-demo.pages.dev (fundaciones + catálogo de componentes).

> Los paquetes son privados (se instalan con permiso). El código del DS es abierto
> dentro de la organización.
