#!/usr/bin/env bash
# Hook SessionStart — en una sesión cloud, el Node que pide el repo (`.nvmrc`) y sus dependencias.
#
# Por qué (2026-09-27): el contenedor cloud trae Node 22.22.2 y el CLI de Angular pide al menos 22.22.3
# (`engines`), así que `npm run build` sale con «The Angular CLI requires a minimum Node.js version» y
# no se puede compilar ni probar nada. Además el clon llega sin `node_modules`. Solo en la nube
# (`CLAUDE_CODE_REMOTE`): en local manda el gestor de versiones de cada uno.
#
# El PATH va a `$CLAUDE_ENV_FILE` porque el entorno de los Bash de la sesión se fija al arrancar: sin
# eso, el Node instalado aquí no le llega a la sesión que lo pidió. Sin `set -u`: `nvm.sh` no lo aguanta.
set -eo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}"
[ -f .nvmrc ] || exit 0

export NVM_DIR="${NVM_DIR:-/opt/nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "sc: sin nvm en $NVM_DIR; Node sigue en $(node -v 2>/dev/null || echo 'ninguno')."
  exit 0
fi
. "$NVM_DIR/nvm.sh"

version="$(tr -d '[:space:]' < .nvmrc)"
# Idempotente: si ya está instalada, solo la activa. Su salida, solo si falla.
if ! salida="$(nvm install "$version" 2>&1)"; then
  echo "$salida" >&2
  exit 1
fi
nvm alias default "$version" > /dev/null
bin="$(dirname "$(nvm which "$version")")"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

# `npm ci` y no `npm install`: respeta el lockfile y no lo reescribe (`guard:lockfile`).
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund --loglevel=error > /dev/null
fi

echo "sc: Node $(node -v) (el del .nvmrc) en esta sesión, con las dependencias instaladas."
