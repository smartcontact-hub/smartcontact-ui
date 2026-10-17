# Export del plugin de Figma (Theme Designer)

Export `7b06bcce` del plugin, tal cual sale de Figma: carpetas `ts/` y `js/`, un fichero por componente.

## Comprobaciones

- Tokens que pasan a 0: claro|--p-divider-vertical-padding.
- Raíz para la que está pensado: **14 px**. Si vuestra página tiene la raíz a 16, las medidas salen un 14 % más grandes que en Figma.
- Pesos de letra escritos con «px» (el navegador los ignora): 4.
- Respecto al export anterior: es el primero publicado así.

## Cuánto se parece a lo que pintan nuestras apps

1998 variables comparables, **652 con valor distinto** (33 %). De ellas, 382 son solo la raíz 14: con la página a 14 px coincidirían.
Si queréis que se vea idéntico a nuestras apps, usad `tema-smartcontact.zip`, que está en el mismo sitio.
