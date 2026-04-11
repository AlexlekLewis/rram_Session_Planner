#!/usr/bin/env bash
# Run the session-analysis unit tests.
#
# These tests live in src/lib/session-analysis.test.ts and use Node's built-in
# node:test framework so we don't add a test-runner dependency. The tests are
# run via sucrase-node (already a transitive dep via sucrase) which strips
# TypeScript types without a full compile step.
#
# Usage:
#   cd app && ./scripts/test-session-analysis.sh

set -euo pipefail

# Ensure node is reachable even on shells that don't put /usr/local/bin on PATH.
if ! command -v node >/dev/null 2>&1; then
  for candidate in /usr/local/bin /opt/homebrew/bin "$HOME/.nvm/versions/node"/*/bin; do
    if [ -x "$candidate/node" ]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done
fi

cd "$(dirname "$0")/.."
exec ./node_modules/.bin/sucrase-node src/lib/session-analysis.test.ts
