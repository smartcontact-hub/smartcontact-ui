# FASE 3 — Registro de caos del original

**Esto se documenta, NO se arregla.** El modo de fidelidad es CAOS-FIEL: un 17 y un 18
que «deberían» ser lo mismo se quedan en 17 y 18. Este registro existe para que una
decisión futura de normalización tenga datos, no para justificar tocar nada hoy.

## `font-size`

67 valores distintos con longitud reconocible; **29 aparecen UNA sola vez**.

### Casi-duplicados (menos de 0.5px de diferencia a 1456): 43

| valor A                        | valor B                        | diferencia       |
| ------------------------------ | ------------------------------ | ---------------- |
| `0.469vw` (6.83px, ×1)         | `0.5vw` (7.28px, ×1)           | 0.451px          |
| `0.5vw` (7.28px, ×1)           | `0.521vw` (7.59px, ×3)         | 0.306px          |
| `0.521vw` (7.59px, ×3)         | `8px` (8.00px, ×1)             | 0.414px          |
| `8px` (8.00px, ×1)             | `0.7rem` (8.15px, ×1)          | 0.154px          |
| `0.7rem` (8.15px, ×1)          | `0.5729166667vw` (8.34px, ×1)  | 0.188px          |
| `0.5729166667vw` (8.34px, ×1)  | `0.573vw` (8.34px, ×3)         | 0.001px          |
| `0.573vw` (8.34px, ×3)         | `0.6vw` (8.74px, ×4)           | 0.393px          |
| `0.6vw` (8.74px, ×4)           | `9px` (9.00px, ×1)             | 0.264px          |
| `9px` (9.00px, ×1)             | `0.625vw` (9.10px, ×12)        | 0.100px          |
| `0.625vw` (9.10px, ×12)        | `0.8rem` (9.32px, ×4)          | 0.218px          |
| `0.675vw` (9.83px, ×5)         | `0.677vw` (9.86px, ×22)        | 0.029px          |
| `0.677vw` (9.86px, ×22)        | `0.7vw` (10.19px, ×3)          | 0.335px          |
| `0.7vw` (10.19px, ×3)          | `.875rem` (10.19px, ×7)        | 0.000px          |
| `.875rem` (10.19px, ×7)        | `0.703vw` (10.24px, ×1)        | 0.044px          |
| `0.703vw` (10.24px, ×1)        | `0.729vw` (10.61px, ×28)       | 0.379px          |
| `0.729vw` (10.61px, ×28)       | `0.7291666667vw` (10.62px, ×1) | 0.002px          |
| `0.7291666667vw` (10.62px, ×1) | `0.73vw` (10.63px, ×2)         | 0.012px          |
| `0.73vw` (10.63px, ×2)         | `0.92rem` (10.72px, ×1)        | 0.087px          |
| `0.92rem` (10.72px, ×1)        | `11px` (11.00px, ×2)           | 0.284px          |
| `11px` (11.00px, ×2)           | `0.95rem` (11.07px, ×2)        | 0.066px          |
| `0.95rem` (11.07px, ×2)        | `0.781vw` (11.37px, ×9)        | 0.306px          |
| `0.781vw` (11.37px, ×9)        | `1rem` (11.65px, ×8)           | 0.277px          |
| `0.8vw` (11.65px, ×4)          | `12px` (12.00px, ×3)           | 0.352px          |
| `12px` (12.00px, ×3)           | `0.833vw` (12.13px, ×43)       | 0.128px          |
| `0.833vw` (12.13px, ×43)       | `0.8333333333vw` (12.13px, ×4) | 0.005px          |
| …                              |                                | **18 pares más** |

## `line-height`

11 valores distintos con longitud reconocible; **7 aparecen UNA sola vez**.

### Casi-duplicados (menos de 0.5px de diferencia a 1456): 2

| valor A                 | valor B                        | diferencia |
| ----------------------- | ------------------------------ | ---------- |
| `0.833vw` (12.13px, ×2) | `0.8333333333vw` (12.13px, ×1) | 0.005px    |
| `1.042vw` (15.17px, ×4) | `1.055vw` (15.36px, ×1)        | 0.189px    |

## `letter-spacing`

17 valores distintos con longitud reconocible; **7 aparecen UNA sola vez**.

### Casi-duplicados (menos de 0.5px de diferencia a 1456): 13

| valor A                       | valor B                       | diferencia |
| ----------------------------- | ----------------------------- | ---------- |
| `-0.02vw` (-0.29px, ×1)       | `0px` (0.00px, ×23)           | 0.291px    |
| `0vw` (0.00px, ×36)           | `0.2px` (0.20px, ×1)          | 0.200px    |
| `0.2px` (0.20px, ×1)          | `0.01979vw` (0.29px, ×2)      | 0.088px    |
| `0.01979vw` (0.29px, ×2)      | `0.33px` (0.33px, ×2)         | 0.042px    |
| `0.33px` (0.33px, ×2)         | `0.0234375vw` (0.34px, ×3)    | 0.011px    |
| `0.0234375vw` (0.34px, ×3)    | `0.0260416667vw` (0.38px, ×1) | 0.038px    |
| `0.0260416667vw` (0.38px, ×1) | `0.5px` (0.50px, ×4)          | 0.121px    |
| `0.08vw` (1.16px, ×1)         | `0.10417vw` (1.52px, ×1)      | 0.352px    |
| `0.10417vw` (1.52px, ×1)      | `0.12vw` (1.75px, ×1)         | 0.230px    |
| `0.12vw` (1.75px, ×1)         | `2px` (2.00px, ×3)            | 0.253px    |
| `2px` (2.00px, ×3)            | `0.1458333333vw` (2.12px, ×3) | 0.123px    |
| `0.1458333333vw` (2.12px, ×3) | `0.156vw` (2.27px, ×1)        | 0.148px    |
| `3px` (3.00px, ×2)            | `0.208vw` (3.03px, ×3)        | 0.028px    |

## `border-radius`

55 valores distintos con longitud reconocible; **24 aparecen UNA sola vez**.

### Casi-duplicados (menos de 0.5px de diferencia a 1456): 31

| valor A                       | valor B                       | diferencia      |
| ----------------------------- | ----------------------------- | --------------- |
| `0.25rem` (2.91px, ×1)        | `3px` (3.00px, ×1)            | 0.088px         |
| `3px` (3.00px, ×1)            | `0.208vw` (3.03px, ×8)        | 0.028px         |
| `0.208vw` (3.03px, ×8)        | `0.2084vw` (3.03px, ×2)       | 0.006px         |
| `0.2084vw` (3.03px, ×2)       | `0.225vw` (3.28px, ×1)        | 0.242px         |
| `0.26vw` (3.79px, ×14)        | `0.2604166667vw` (3.79px, ×2) | 0.006px         |
| `0.2604166667vw` (3.79px, ×2) | `4px` (4.00px, ×2)            | 0.208px         |
| `4px` (4.00px, ×2)            | `0.3vw` (4.37px, ×3)          | 0.368px         |
| `0.3vw` (4.37px, ×3)          | `.375rem` (4.37px, ×1)        | 0.000px         |
| `.375rem` (4.37px, ×1)        | `0.3125vw` (4.55px, ×1)       | 0.182px         |
| `0.3125vw` (4.55px, ×1)       | `0.313vw` (4.56px, ×9)        | 0.007px         |
| `0.313vw` (4.56px, ×9)        | `5px` (5.00px, ×2)            | 0.443px         |
| `5px` (5.00px, ×2)            | `0.36vw` (5.24px, ×6)         | 0.242px         |
| `0.36vw` (5.24px, ×6)         | `0.364vw` (5.30px, ×1)        | 0.058px         |
| `0.364vw` (5.30px, ×1)        | `0.365vw` (5.31px, ×5)        | 0.015px         |
| `6px` (6.00px, ×1)            | `0.416vw` (6.06px, ×6)        | 0.057px         |
| `0.416vw` (6.06px, ×6)        | `0.417vw` (6.07px, ×6)        | 0.015px         |
| `0.5208333333vw` (7.58px, ×2) | `0.521vw` (7.59px, ×22)       | 0.002px         |
| `0.521vw` (7.59px, ×22)       | `8px` (8.00px, ×6)            | 0.414px         |
| `0.6vw` (8.74px, ×2)          | `0.625vw` (9.10px, ×64)       | 0.364px         |
| `0.625vw` (9.10px, ×64)       | `0.65vw` (9.46px, ×1)         | 0.364px         |
| `0.65vw` (9.46px, ×1)         | `0.677vw` (9.86px, ×1)        | 0.393px         |
| `0.677vw` (9.86px, ×1)        | `0.85rem` (9.90px, ×1)        | 0.044px         |
| `0.85rem` (9.90px, ×1)        | `10px` (10.00px, ×8)          | 0.099px         |
| `0.78125vw` (11.38px, ×1)     | `1rem` (11.65px, ×4)          | 0.273px         |
| `1rem` (11.65px, ×4)          | `12px` (12.00px, ×5)          | 0.352px         |
| …                             |                               | **6 pares más** |
