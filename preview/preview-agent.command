#!/bin/zsh
# Doble-click → preview LOCAL de la app Agent.
# Baja el último cambio de tokens de Figma, lo regenera y abre el navegador.
# Para parar: cierra esta ventana.
cd "$(dirname "$0")/.." || exit 1
echo "Arrancando el preview local del Agent…"
exec npm run preview:live -- agent
