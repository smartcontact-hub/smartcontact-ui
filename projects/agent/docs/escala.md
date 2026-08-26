# Escala — `px = vw × 14.56`

> **La regla**: la app real mide **todo** en `vw`; `sc-agent` mide todo en `px`. Para pasar
> un valor del real a la réplica, **multiplica por 14.56**. Al revés, divide.

## Por qué 14.56

`sc-agent` es la app real **renderizada a 1456 px de ancho de ventana**, congelada en px.
La shell del dashboard mide literalmente `width: 1456px`.

Un `vw` es el 1 % del ancho de ventana → a 1456 px, `1vw = 14.56px`.

Verificado con **dos medidas independientes**, no con una:

| Valor en el real | Cálculo | En `sc-agent` |
|---|---|---|
| Texto base (`* { font-size: 0.8vw }`) | 0.8 × 14.56 = 11.65 | `11.7px` ✅ |
| Barra inferior (`.shortcut-bar`, `height: 2.604vw`) | 2.604 × 14.56 = 37.92 | `38px` ✅ |

## La trampa: el `rem` del real TAMBIÉN es fluido

En la app real hay una regla global:

```css
* {
  font-family: 'Open Sans';
  font-size: 0.8vw;
  letter-spacing: 0.01979vw;
}
```

Como el selector `*` alcanza también a `<html>`, **el `rem` de esa app vale `0.8vw`**, no
16 px. Consecuencias que cuestan tiempo si no lo sabes:

- Los componentes del Design System (que miden en `rem`) **sí escalan** con la ventana en
  esa app. No hay desajuste de unidades entre el DS y el Comunicador.
- Una regla de componente como `.management-option { font-size: 0.6vw }` **no llega a sus
  hijos de texto**: el `*` los alcanza directamente con 0.8vw y gana por orden de cascada
  sobre la herencia. Es decir, hay texto que sale al tamaño correcto *por accidente*
  mientras su contenedor está mal medido.

Si mides un valor computado en la app real y no cuadra con su CSS, sospecha del `*` antes
que de tu medición.

## Referencias rápidas ya convertidas

| Pieza | Real | `sc-agent` |
|---|---|---|
| Widget del Comunicador | `17.188 × 34.792vw` | `250.3 × 506.6px` |
| Radio del widget | `1.458vw` | `21.2px` |
| Cabecera de panel (alto) | `2.306vw` | `33.6px` |
| Título de cabecera | `0.938vw` Open Sans Semibold | `13.66px` |
| Texto base | `0.8vw` | `11.7px` |
| Icono de fila de tabla | `1.575 × 0.787vw` | `22.93 × 11.46px` |
| Alto de fila de tabla | `2.72vw` | `39.6px` |
