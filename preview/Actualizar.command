#!/bin/zsh
# Doble-click → trae lo último del equipo a tu copia local (git pull). NO sube nada.
# Hazlo ANTES de previsualizar, para que tu preview local muestre lo más reciente.
cd "$(dirname "$0")/.." || exit 1
echo "Actualizando tu copia local con lo último del equipo…"
echo ""
if git pull --ff-only; then
  echo ""
  echo "✅ Listo, ya tienes lo último del equipo."
else
  echo ""
  echo "⚠️  No se pudo actualizar limpio (quizá un conflicto)."
  echo "    No toques nada — avisa al equipo y lo resolvemos en un minuto."
fi
echo ""
echo "(Puedes cerrar esta ventana.)"
