#!/usr/bin/env bash
# Packt den Build (dist/index.html) als Download-ZIP.
# Aufruf: bash scripts/package-zip.sh [Zieldatei]   (Standard: release/logistikum.zip)
set -euo pipefail

target="${1:-release/logistikum.zip}"
root="$(cd "$(dirname "$0")/.." && pwd)"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

if [[ ! -f "$root/dist/index.html" ]]; then
  echo "dist/index.html fehlt – zuerst 'npm run build' ausführen." >&2
  exit 1
fi

mkdir -p "$staging/logistikum"
cp "$root/dist/index.html" "$staging/logistikum/index.html"
cp "$root/scripts/LIES-MICH.txt" "$staging/logistikum/LIES-MICH.txt"

mkdir -p "$(dirname "$target")"
target_abs="$(cd "$(dirname "$target")" && pwd)/$(basename "$target")"
rm -f "$target_abs"
(cd "$staging" && zip -q -r "$target_abs" logistikum)
echo "ZIP erstellt: $target"
