# Licencias de PrimeTek: qué usamos, cómo y qué no se redistribuye

Qué dice la licencia PrimeUI de lo que usamos, y la regla que sale de ahí. Decisión: DD-207.

## La regla

**Nada de PrimeTek va dentro de un paquete nuestro.** PrimeNG y `@primeuix/*` se usan como dependencias que instala
quien los usa, con su propia licencia. La licencia Community deja usarlos; prohíbe distribuir el software «as-is,
bundled, or with superficial modifications» para que otros lo usen como librería o herramienta de desarrollo, y eso
pide la licencia OEM. No hay excepción para presets ni temas derivados.

## Qué hay instalado

Versiones leídas del `package.json` de cada paquete en `node_modules`. Todos llevan el mismo `LICENSE.md` («PrimeUI
License»), salvo `primeicons`.

| Paquete | Versión | Licencia | Cómo lo usamos | ¿Se redistribuye? |
|---|---|---|---|---|
| `primeng` | 22.1.0 | PrimeUI | Dependencia del DS y de las apps | No |
| `@primeuix/themes` | 3.0.0 | PrimeUI | Dependencia del DS; `peerDependency` del paquete `smartcontact-tema` | No: `external` en el bundle del tema |
| `@primeuix/styled`, `utils`, `styles`, `motion` | 1.0.0, 0.8.1, 3.0.0, 1.0.0 | PrimeUI | Vienen con PrimeNG. `styled` lo leen también `tema-zip.mjs` y `tema-plugin-zip.mjs` para calcular, sin empaquetarlo | No |
| `@primeui/license-manager` | 1.0.0 | PrimeUI | Viene con PrimeNG; valida la clave sin red | No |
| `@primeicons/angular` | 8.0.0 | PrimeUI | Iconos internos de PrimeNG 22, vienen con él | No |
| `primeicons` | 7.0.0 | MIT | Solo está en el `package.json` raíz: ningún `src` lo importa | No |

## Lo que lo vigila

`node scripts/tema-zip.mjs <salida>` falla con código 1 si el bundle del tema leyó algo de `node_modules/@primeuix`,
`@primeui` o `primeng` (`codigoDePrimeTek`, con su test en `scripts/__tests__/tema-zip.test.mjs`). Medido quitando el
`external`: sale con 1 y nombra los ficheros.

Los paquetes de las librerías del DS (`ng-packagr`) no empaquetan sus dependencias: `@primeuix/themes` es dependencia
declarada del DS, no código incluido.

## La clave de licencia

Las cinco apps que arrancan PrimeNG llevan una clave Community/dev en su `app.config.ts`. Las condiciones de la
licencia Community:

- Menos de 1 millón de dólares de ingresos anuales, menos de 5 desarrolladores en total, menos de 10 empleados y menos
  de 3 millones de capital externo; máximo 4 puestos.
- La clave vale 12 meses y se renueva sin coste confirmando que se sigue cumpliendo; hay 30 días de gracia.
- **No se puede publicar la clave para que otros la usen.** Que vaya dentro del bundle de la app está permitido; que
  esté en el código fuente de un repo público es lo que hay que resolver.

La clave actual vence el 5 de agosto de 2027. Renovarla antes, y confirmar con la empresa que se cumplen los topes.

## Si el modelo de distribución cambia

Si algún paquete nuestro tuviera que llevar código de PrimeTek dentro, o si el equipo que usa el tema fuera una
organización distinta de la nuestra que desarrolla con él, se para la publicación y se decide entre pedir la licencia
OEM a PrimeTek o mantenerlo fuera. No se publica antes.
