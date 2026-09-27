# Frente · Dirección visual — explorar sin cortar la magia — hand-off

> **Volátil.** Lo reescribe la sesión que trabaja ESTE frente, y **solo este fichero**. Lo durable vive en `docs/`:
> la decisión en DD-128 y el contexto de diseño en [`.impeccable.md`](../../.impeccable.md).
>
> **Por qué existe este frente.** Nace el 2026-09-27 de una pregunta: las exploraciones en Figma Make salen más
> vistosas que el producto, ¿los controles del repo dejan sitio para soñar? La respuesta (DD-128): los controles de
> coherencia entre Figma y código se quedan; lo que faltaba era una vía para lo vistoso, y este frente la construye.
> El sello va debajo del título de cada tramo; el de más arriba es el vigente.

## ▶︎ SIGUIENTE — sin preguntar

1. **Leer el código de la exploración de Make en cuanto llegue.** Sacar, con valores: tipografía, color, radios,
   sombras y efectos, y movimiento (duración, curva, qué se anima y cuándo). Repartirlo en tres montones:
   **se adopta** (y por dónde entra: variable del Kit, la convención de movimiento de `docs/customs-catalog.md`, o
   Aura ya lo trae), **se descarta** (las anti-referencias de `.impeccable.md`) y **de gusto** (se lista, no se
   decide). Cada «se adopta», con las tres preguntas del principio 7 de `.impeccable.md` contestadas.
2. **El movimiento es lo más probable que llegue, y ya tiene regla**: las duraciones van por convención, sin escala
   de tokens («NO crear tokens» en `docs/customs-catalog.md`); las curvas sí son tokens (`--sc-easing-default`,
   `--sc-easing-emphasized`). Si lo de Make pide reabrirlo, se propone con evidencia. Precedente útil en `main`:
   DD-126, la cifra que cuenta y el anillo que se llena, quietos para quien pide menos movimiento.
3. **Un piloto, no un barrido**: lo primero que se adopte se construye en mínimo en una pantalla y se mira
   (LEARNINGS #18) antes de proponerlo al Kit.

## ⏸️ ESPERANDO A RAFA — NO preguntar

- **El código de la exploración de Make** (`trackingpayment.figma.site`). La red de la sesión cloud bloquea ese
  dominio: o llega el código, o se permite el dominio en la red del entorno.
- **Qué pantalla va primero**: la que se quiere acercar antes a Linear.
- **Preguntas abiertas**: qué atrae de Make (el aspecto, la velocidad, o diseñar en vez de revisar); para quién tiene
  que ser vistoso (quien lo usa el turno entero o quien lo compra en una demo); y si «calmado, intencional,
  editorial» se eligió o se heredó del Kit.

## ✅ 2026-09-27 · El contexto de diseño, al día: Aura como base, el oficio de las herramientas modernas y una puerta para lo vistoso

**Sello:** rama `claude/figma-design-system-balance-r3tj7m`, sobre `origin/main` HEAD `ddf711a`.

**Qué pasó.**
- **El diagnóstico, medido** (DD-128, «Contexto»): un efecto con variable ya entra (el toast); `.impeccable.md` no
  nombraba a Aura y prohibía tocar por estética; el único diseño expresivo que llegó perdió su estética entera; y el
  Lab solo pregunta por estructura y comportamiento.
- **`.impeccable.md`**: la base es Aura (DD-78, DD-111); nueva sección «Contexto de diseño» (usuarios,
  personalidad, dirección estética con referencias y anti-referencias, principios 5 a 8); y el alcance pasa de
  «NUNCA tocar por estética» a «se propone, no se mete a mano».
- **DD-128** registra la dirección y lo descartado. Va como 128 y no 127 a propósito: el PR abierto #263 trae otro
  DD-126 y tendrá que renumerarlo; el 127 le queda libre.
- **Sin verificar**: la página de Make, que la red de la sesión no deja abrir (el proxy responde 403).
