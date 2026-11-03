#!/usr/bin/env bash
# Atajo al CLI de HyperFrames del plugin instalado (ver plugin-installation.md).
export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"
exec node "$HOME/.claude/plugins/marketplaces/hyperframes/skills/hyperframes/scripts/plugin-cli.mjs" "$@"
