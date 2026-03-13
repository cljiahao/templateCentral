#!/bin/sh

# Check for Yarn lock file
if [ -f "yarn.lock" ]; then
  exec yarn "$@"
# Check for pnpm lock file
elif [ -f "pnpm-lock.yaml" ]; then
  exec sh -c "corepack enable pnpm && pnpm \"$@\""
# Default to npm
else
  exec npm "$@"
fi
