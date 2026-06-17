#!/bin/zsh
# Doble-click → preview LOCAL de la app Supervisor.
# Baja el último cambio de tokens de Figma, lo regenera y abre el navegador.
# Para parar: cierra esta ventana.
cd "$(dirname "$0")" || exit 1
echo "Arrancando el preview local del Supervisor…"
exec npm run preview:live -- supervisor
