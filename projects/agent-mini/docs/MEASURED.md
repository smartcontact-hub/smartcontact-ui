# Agent Mini — medidas de origen (fuente de verdad)

Capturado de la pestaña logueada de Rafa (`comunicatormini.smart-contact.com/aed/`),
viewport de medida **855×784, dpr 2**. Es la base para la copia fiel y para el
afinado en Figma. **No borrar**: esto costó una pasada entera del agente de Chrome.

## Clave: la app es 100% `vw`/`vh` (no px fijos)

Escala con el viewport. Dos unidades base:

- eje X: `0.284vw` = 1 px de diseño  (2.556=9 · 6.816=24 · 15.336=54 · 60.776=214…)
- eje Y: `0.0975275vh` = 1 px de diseño  (2.34066=24 · 5.26648=54 · 8.005=82…)

Diseño de referencia (1:1) ≈ **352 × 1025** (portrait). El popup real (~412×474)
mete ese diseño alto en poca altura → **squash vertical** (teclas ~25px). No es un
bug: es lo que hace el original. La copia fiel resuelve los `vw/vh` contra un marco
412×474 vía `--ux`(1vw=4.12px) / `--uy`(1vh=4.74px), para ser estable a cualquier
tamaño de ventana en vez de depender del viewport.

## Variables de tema (inline en `<html>`)

```
--background:#1f2429   --login-form-background:#1f2429
--background-button:#0556fa   --background-button-shadow:0px 3px 9px #11131a
--brand-color:#ffffff
--background-body-comunicator:#333A41
--background-header-comunicator:#1f2429   --background-footer-comunicator:#1f2429
--icon-color-header:#ffffff   --icon-color-footer:#5f6776   --icon-color-active-footer:#ffffff
--logo: url(data:image/png;base64,…)  (411×81, ~11.3KB — solo en la vista login)
```

## Árbol (viewport 855×784)

```
.body-comunicator      855×670  height:85.5vh, position:absolute, bg #333A41
 .container-phone      855×670  height:100%
  .telephone / app-calls-dialpad / .container-call
   .body-call > .dialpad   855×417
    .keypad              631×357 @112,60
     .keypad-container
      .display           653×42  @101,60
       .flags-container  65×0    (colapsado)
       .input-number     523×21  @166,71
       .deleted          65×17   @689,73   (backspace, dcha)
      .keys-container    631×237 @112,180
       #key_1..#key_#    131×41  cada una (3col × 4filas)  grid X≈228 Y≈59
    .service-group       396×28  @241,460  position:fixed  (pastilla servicio)
   .footer-call          855×41  @0,569    position:absolute
    button.btn-call      520×41  @168,569
 .footer-comunicator     855×63  @0,670    position:absolute; bottom:0
  .icon-footer ×5        58×63   (call|chat|agents|contacts|history)
   .icon                 58×18
```

## CSS de origen (copiar ESTO, no los px)

```css
.body-comunicator{width:100%;height:85.5vh;background:#333A41;position:absolute;}
.container-phone{height:100%;}
.dialpad .keypad{margin-top:7.70467vh;margin-left:13.064vw;margin-right:13.064vw;}
.dialpad .keypad.makecall-allowedstatus{opacity:.3;cursor:default;pointer-events:none;}
.keypad-container{display:flex;align-items:center;flex-direction:column;}
.keypad-container .display .input-number{display:flex;justify-content:center;align-items:center;color:#fff;width:80%;height:2.63324vh;}
.keypad-container .display .input-number span,
.keypad-container .display .input-number input{font-family:Roboto;font-size:2.63324vh;letter-spacing:0;color:#fff;background:none;border:none;outline:none;width:65.888vw;text-align:center;}
.keypad-container .display .deleted{display:flex;justify-content:flex-end;align-items:center;width:20%;cursor:pointer;}
.keypad-container .display .deleted svg{width:6.248vw;height:1.36538vh;}
.keypad-container .display .deleted svg path{fill:#fff;}
.keypad-container .display .flags-container .flags-selector svg{width:6.816vw;height:2.34066vh;}
.keypad-container .keys-container{display:flex;flex-flow:wrap;justify-content:space-between;align-items:center;user-select:none;height:30.2335vh;margin-top:9.9478vh;}
.keypad-container .keys-container .keys{display:flex;justify-content:center;align-items:center;width:15.336vw;height:5.26648vh;border-radius:6.532vw;cursor:pointer;margin:0.33647vh 2.556vw;}
.keys:hover{background-color:#1f2429;}
.keys:active,.keys.pressed{background-color:#fff;}
.keys:active .number,.keys.pressed .number{color:#000;}
.keys .number{font-size:2.34066vh;color:#fff;letter-spacing:0;}
.dialpad .service-group{display:flex;flex-direction:row;align-items:center;justify-content:center;position:fixed;top:58.698vh;right:25.56vw;}
/* pastilla: border-radius 29.1384px; border 1px solid #fff; padding 4.30096px 8.60192px 4.30096px 24.282px */
.service-group .tooltip-group{box-shadow:3px 3px 1px rgba(0,0,0,.18);border-radius:4.544vw;background:#1f2429;padding:0.975275vh 2.84vw;max-width:76.964vw;min-width:18.46vw;top:-7.31456vh;}
.container-call .footer-call{display:flex;flex-direction:row;justify-content:center;width:100%;position:absolute;}
.footer-call .btn-call{width:60.776vw;height:5.16896vh;border-radius:4.544vw;background:transparent;border:none;outline:none;}
.btn-call svg{width:6.816vw;height:2.34066vh;}
.btn-call:disabled{border:1px solid #85898D;}
.btn-call:disabled svg path{fill:#85898D;}
.btn-call.makecall{background:#69C663;}       .btn-call.makecall:hover{background:#2BAE22;}
.btn-call.hangup{background:#F75454;}          .btn-call.hangup:hover{background:#F43434;}
.btn-call.hangup svg{width:9.656vw;height:3.31593vh;}
.btn-call.hangup:disabled{border:1px solid #85898D;background:transparent;}
.footer-comunicator{width:100%;height:8.005vh;background:#1f2429;position:absolute;bottom:0;display:flex;justify-content:space-evenly;align-items:center;flex-direction:row;}
.footer-comunicator .icon-footer{height:100%;display:flex;justify-content:center;align-items:center;}
.footer-comunicator .icon-footer .icon{cursor:pointer;width:6.816vw;height:2.34066vh;background-size:100% 100%;background-position:center;background-repeat:no-repeat;}
.icon.history{background-image:url("/assets/icons/historial.svg");position:relative;}
.icon.history .lost-call{background-color:#F75454;border-radius:50%;width:7.1vw;height:2.43819vh;position:absolute;bottom:0.78022vh;right:3.976vw;font-size:1.75549vh;}
```

## Pendiente (para clavar en Figma)

- **Fuente**: display en **Roboto** (medido). Falta el font-family del `body`/teclas (heredan).
- **Iconos footer**: SVGs reales en `/assets/icons/` (`historial.svg`, …). Ahora placeholders.
- **Copy pastilla servicio** e **icono/estado header** (avatar, "Disponible"): aprox, no medidos.
- **Estados** del botón: `makecall` (verde), `hangup` (rojo), `:disabled` (borde #85898D). CSS arriba.
