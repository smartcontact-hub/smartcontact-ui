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

# El clon de la nube llega superficial y sin etiquetas: `audit:commit-attribution` pide la historia entera y
# `explorations:check` las etiquetas `archive/*` (medido el 2026-10-06, dos `verify` en rojo por esto). Sin red no
# es un fallo del arranque: se avisa y se sigue.
if [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "true" ]; then
  git fetch -q --unshallow --tags origin 2>/dev/null || echo "sc: no pude completar el clon (git fetch --unshallow --tags origin)."
else
  git fetch -q --tags origin 2>/dev/null || true
fi

# Playwright busca una build de Chromium que el contenedor no trae (medido el 2026-10-06: «Executable doesn't exist»).
# Las configs lanzan el de `SC_CHROMIUM` si está (`scripts/playwright-navegador.mjs`); fuera de la nube nadie la define.
chromium="${SC_CHROMIUM_CONTENEDOR:-/opt/pw-browsers/chromium}"
if [ -x "$chromium" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export SC_CHROMIUM=\"$chromium\"" >> "$CLAUDE_ENV_FILE"
fi

[ -f .nvmrc ] || exit 0

export NVM_DIR="${NVM_DIR:-/opt/nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "sc: sin nvm en $NVM_DIR; Node sigue en $(node -v 2>/dev/null || echo 'ninguno')."
  exit 0
fi
# `--no-use`: sin él, `nvm.sh` hace `nvm use` del `.nvmrc` al cargarse, la versión aún no está instalada, devuelve 3
# y `set -e` cortaba el hook en silencio antes de instalarla (medido el 2026-10-06: exit 3 en 0,09 s, cada sesión).
. "$NVM_DIR/nvm.sh" --no-use

version="$(tr -d '[:space:]' < .nvmrc)"
# Idempotente: si ya está instalada, solo la activa. Su salida, solo si falla.
if ! salida="$(nvm install "$version" 2>&1)"; then
  echo "$salida" >&2
  exit 1
fi
nvm alias default "$version" > /dev/null
# Y activa aquí: `npm ci` y el mensaje de abajo tienen que correr con ella, no con la del contenedor.
nvm use "$version" > /dev/null
bin="$(dirname "$(nvm which "$version")")"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

# `npm ci` y no `npm install`: respeta el lockfile y no lo reescribe (`guard:lockfile`).
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund --loglevel=error > /dev/null
fi

echo "sc: Node $(node -v) (el del .nvmrc) en esta sesión, con las dependencias instaladas."
