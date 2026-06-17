#!/bin/zsh
# Doble-click → preview LOCAL de la galería de componentes (sc-demo).
# Baja el último cambio de tokens de Figma, lo regenera y abre el navegador.
# Para parar: cierra esta ventana.
cd "$(dirname "$0")" || exit 1
echo "Arrancando el preview local de componentes…"
exec npm run preview:live
