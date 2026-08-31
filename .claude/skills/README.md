# Skills de interfaz · familia "interfaces"

Guía para no perderme. **Esto es una guía para humanos, no una skill**: los
ejemplos de prompt viven solo aquí, nunca dentro de un `SKILL.md`, para no
ensuciar la instrucción que lee el modelo.

Origen: [github.com/jakubkrehel/skills](https://github.com/jakubkrehel/skills)
(MIT, ver [interfaces.LICENSE](interfaces.LICENSE)). Son un consultor de diseño
a demanda que conoce nuestro ecosistema: leen `AGENTS.md`, `CLAUDE.md` y los
tokens `--sc-*`, y proponen en nuestro idioma. Son consejo, nunca un gate.

## Reglas de la casa (para que ayuden sin romper el DS)

- **Consultor, no piloto automático:** proponen, tú decides.
- Lo que aceptes entra **por el Kit** (exportar tema), nunca editando a mano los
  bloques generados `@sc-gen`.
- Pueden discutir cualquier cosa del Kit, cuanto más atrevido mejor. La barrera
  es solo el **cómo** se aplica un cambio, no el **qué** pueden proponer.
- Los bugs de lógica siguen en `/code-review`. Estas son de interfaz.

## Cómo se usan

Háblame normal y tiro de la que toque. Los nombres con `/` son por si quieres ir
directo, no hace falta memorizarlos.

### Salen solas (las traigo yo al construir o revisar interfaz)

| Skill | Para qué |
| --- | --- |
| `better-interface` | Revisión global de una pantalla: un veredicto ordenado por gravedad |
| `better-typography` | Orden de tipografía con NUESTRA escala del Kit |
| `better-colors` | Mide contraste de verdad y critica la paleta (arreglo por el Kit) |
| `better-accessibility` | Accesibilidad real: teclado, foco, lectores de pantalla |
| `better-layout` | Orden, agrupación, espacio, responsive |
| `better-writing` | Textos de interfaz: botones, errores, estados vacíos |
| `better-ui` | Pulido visual: radios, sombras, iconos, movimiento |

### Las llamas tú (herramientas)

| Skill | Para qué |
| --- | --- |
| `/break` | Un componente en TODOS sus estados (vacío, cargando, error, móvil, oscuro) |
| `/variant` | 3 versiones de algo para elegir |
| `/explain-interface` | Cómo está hecha una pantalla de otra web |
| `/interface-review` | Revisar un cambio antes de subirlo |

## Ejemplos de prompt

- **Construir y pulir:** "monta la tarjeta de contacto y pásale un ojo de
  tipografía y accesibilidad con nuestro Kit."
- **Consultor del Kit:** "critícame la paleta de esta pantalla con criterio de
  plataforma moderna; qué cambiarías y cómo lo llevamos al Kit."
- **Ver estados:** "enséñame el sc-select en vacío, cargando, error, móvil y
  oscuro." (dispara `/break`)
- **Revisar un cambio:** "revisa lo que acabo de tocar." (dispara
  `/interface-review`; los bugs siguen en `/code-review`)
- **Replicar una web:** "cómo está hecho el degradado del hero de tal web."
  (dispara `/explain-interface`)
- **Validar contra Figma:** "compara esta pantalla con el diseño de Figma y dime
  dónde no cuadran." (triángulo Figma MCP + devtools + juez neutral)

## Convivencia con lo que ya teníamos

- `reflect` y `auditoria-semanal` son nuestras, no se tocan.
- La familia `design-*` (impeccable, etc.) genera estética. Esta familia
  verifica y ordena con nuestro sistema. Verbos distintos, no compiten.
